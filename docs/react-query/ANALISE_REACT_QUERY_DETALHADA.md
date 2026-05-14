# 🔍 Análise Detalhada - React Query & Sincronização de Cache

## 🚨 PROBLEMAS CRÍTICOS ENCONTRADOS

---

## 1️⃣ **PROBLEMA CRÍTICO: QueryClient Duplicado** ⚠️
**Arquivo**: `frontend/src/services/vinculo.ts`  
**Linhas**: 3-4

### 🔴 O Problema
```typescript
// ERRADO: QueryClient criada FORA do React Context
const queryClient = new QueryClient();
```

### ❌ Por que acontece
- Você criou um **novo QueryClient global** em `vinculo.ts`
- O React Query Provider em seu app cria **outro QueryClient diferente**
- Quando `vincularJogo()` e `desvincularJogo()` chamam `queryClient.setQueryData()`, atualizam um cache **isolado e separado**
- O QueryClient do seu componente **nunca vê essas atualizações**
- **Resultado**: O update otimista em Biblioteca.tsx NÃO funciona, pois vinculo.ts atualiza um cache fantasma!

### ✅ Como Corrigir
**Remover completamente** as chamadas ao QueryClient em vinculo.ts:
```typescript
// ❌ REMOVER ISTO:
queryClient.setQueryData<VinculoPayLoad[]>(["biblioteca"], (antigos = []) => {
  return [data, ...antigos];
})
```

O update otimista é **responsabilidade exclusiva** do componente que usa `useMutation`, não da função que faz a requisição!

### 🎯 Melhor Prática
- **Função de API**: Apenas faz a requisição HTTP, sem tocar em cache
- **Componente**: Controla update otimista, rollback e invalidação
- **Princípio**: Separação de responsabilidades

---

## 2️⃣ **PROBLEMA: Event Listeners Duplicados** ⚠️
**Arquivo**: `frontend/src/pages/Biblioteca/Biblioteca.tsx`  
**Linhas**: 
- Listener 1: linhas ~250-275
- Listener 2: linhas ~308-332

### 🔴 O Problema
```typescript
// ❌ PRIMEIRO useEffect
useEffect(() => {
  const handleEvent = (e: Event) => {
    const customEvent = e as CustomEvent<number>;
    if (customEvent.detail) {
      abrirModalComJogo(customEvent.detail);
    }
  };

  window.addEventListener("abrirJogo", handleEvent);

  if (location.state?.abrirJogoId) {
    abrirModalComJogo(location.state.abrirJogoId);
    navigate(location.pathname, {
      replace: true,
      state: {},
    });
  }
  return () => {
    window.removeEventListener("abrirJogo", handleEvent);
  };
}, [jogos, location.state, location.pathname, navigate]);

// ❌ SEGUNDO useEffect - PRATICAMENTE IDÊNTICO!
useEffect(() => {
  const handleEvent = (e: Event) => {
    const customEvent = e as CustomEvent<number>;
    if (!customEvent.detail) return;
    const jogoEncontrado = jogos.find(
      (j) => j.id === Number(customEvent.detail),
    );
    if (jogoEncontrado) {
      setJogoSelecionadoId(jogoEncontrado.id);
      setShowPopup(true);
      setErroBusca(null);
    } else {
      setErroBusca("Você não vinculou esse jogo");
      setTimeout(() => {
        setErroBusca(null);
      }, 3000);
    }
  };

  window.addEventListener("abrirJogo", handleEvent);
  return () => {
    window.removeEventListener("abrirJogo", handleEvent);
  };
}, [jogos]);
```

### ❌ Por que acontece
- Você registra o **MESMO evento** duas vezes
- Cada listener tem sua própria função `handleEvent`
- React **não consegue remover listeners duplicados** porque cada um é uma função diferente
- Quando `window.dispatchEvent(new CustomEvent("abrirJogo", ...))` é chamado:
  - **Listener 1 é executado** → abre modal
  - **Listener 2 é executado** → abre modal NOVAMENTE
  - Ambos executam lógicas levemente diferentes → comportamento imprevisível

### ✅ Como Corrigir
Consolidar em **UM ÚNICO useEffect**:
```typescript
useEffect(() => {
  const handleEvent = (e: Event) => {
    const customEvent = e as CustomEvent<number>;
    if (!customEvent.detail) return;

    const jogoEncontrado = jogos.find(
      (j) => j.id === Number(customEvent.detail),
    );

    if (jogoEncontrado) {
      setJogoSelecionadoId(jogoEncontrado.id);
      setShowPopup(true);
      setErroBusca(null);
    } else {
      setErroBusca("Você não vinculou esse jogo");
      setTimeout(() => {
        setErroBusca(null);
      }, 3000);
    }
  };

  window.addEventListener("abrirJogo", handleEvent);

  // Abrir modal se veio via location.state
  if (location.state?.abrirJogoId) {
    const jogoEncontrado = jogos.find(
      (jogo) => jogo.id === location.state.abrirJogoId
    );
    if (jogoEncontrado) {
      setJogoSelecionadoId(jogoEncontrado.id);
      setShowPopup(true);
    }
    
    navigate(location.pathname, {
      replace: true,
      state: {},
    });
  }

  return () => {
    window.removeEventListener("abrirJogo", handleEvent);
  };
}, [jogos, location.state?.abrirJogoId, location.pathname, navigate]);
```

### 🎯 Melhor Prática
- **Um listener = uma responsabilidade**
- Usar `useCallback` para memorizar handlers
- Usar `useEffect` cleanup para remover listeners

---

## 3️⃣ **PROBLEMA: Invalidação Desnecessária após Update Otimista** ⚠️
**Arquivo**: `frontend/src/pages/Biblioteca/Biblioteca.tsx`  
**Linhas**: ~153-157 (onSettled)

### 🔴 O Problema
```typescript
onSettled: () => {
  queryClient.invalidateQueries({
    queryKey: ["biblioteca"],
  });
}
```

### ❌ Por que acontece
1. Você faz **update otimista** em `onMutate`
2. A mutação é enviada ao servidor
3. Quando completa (sucesso ou erro), `onSettled` é chamado
4. `invalidateQueries` marca o cache como **"stale"** e re-busca os dados
5. Problema: Se há **latência de rede**, os dados do servidor podem estar desincronizados
6. Você pode estar **sobrescrevendo o estado local** com dados antigos do servidor

### ✅ Como Corrigir - Opção 1 (Recomendado): Sincronização Manual
```typescript
onSettled: (data) => {
  // Se receber dados do servidor, atualiza apenas esse jogo
  if (data) {
    queryClient.setQueryData<Jogo[]>(
      ["biblioteca"],
      (prev = []) =>
        prev.map((jogo) =>
          jogo.id === data.id ? data : jogo
        )
    );
  } else {
    // Se falhar, invalidar para recarregar
    queryClient.invalidateQueries({
      queryKey: ["biblioteca"],
    });
  }
}
```

### ✅ Como Corrigir - Opção 2: Confiar no Update Otimista
```typescript
// Remover onSettled completamente se confiar no otimista
// O React Query manterá o estado da tela atualizado

// OU usar refetchType: "none" na query:
useQuery<Jogo[]>({
  queryKey: ["biblioteca"],
  queryFn: async () => {
    const response = await api.get("pedidos/minha_biblioteca");
    return response.data;
  },
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 5,
  refetchOnWindowFocus: false, // Evita re-fetch quando volta pra aba
});
```

### ✅ Como Corrigir - Opção 3: Refetch Atrasado
```typescript
onSettled: () => {
  // Re-busca após 500ms para sincronizar com servidor
  setTimeout(() => {
    queryClient.invalidateQueries({
      queryKey: ["biblioteca"],
      refetchType: "active",
    });
  }, 500);
}
```

### 🎯 Melhor Prática
- **Update otimista**: Atualiza UI imediatamente
- **Sucesso**: Merge com resposta do servidor se diferente
- **Erro**: Rollback para estado anterior (já implementado em onError ✅)

---

## 4️⃣ **PROBLEMA: Race Condition em Múltiplas Mutações** ⚠️
**Arquivo**: `frontend/src/pages/Biblioteca/Biblioteca.tsx`  
**Linhas**: ~113-145 (onMutate)

### 🔴 O Problema
```typescript
onMutate: async ({ jogoId, plataforma, sub, jaExiste }) => {
  await queryClient.cancelQueries({
    queryKey: ["biblioteca"],
  });

  const cacheAnterior = queryClient.getQueryData<Jogo[]>(["biblioteca"]);

  queryClient.setQueryData<Jogo[]>(
    ["biblioteca"],
    (prev = []) =>
      prev.map((jogo) => {
        if (jogo.id !== jogoId) {
          return jogo;
        }
        return {
          ...jogo,
          detalhes_plataformas:
            atualizarPlataformas(
              jogo.detalhes_plataformas || [],
              plataforma,
              sub,
              jaExiste,
            ),
        };
      }),
  );
  return { cacheAnterior };
}
```

### ❌ Por que pode falhar
Se o usuário clicar em dois botões rapidamente:
1. Clica "Steam" → mutation A inicia → `onMutate` salva `cacheAnterior` (estado 1)
2. Antes de A completar, clica "Epic" → mutation B inicia → `onMutate` salva `cacheAnterior` (estado 1.5)
3. Mutation A falha → `onError` restaura para `cacheAnterior` (estado 1)
4. Mutation B sucede, mas o cache foi restaurado ao estado 1 (perdeu a mudança de A)

### ✅ Como Corrigir
```typescript
onMutate: async ({ jogoId, plataforma, sub, jaExiste }) => {
  // Cancelar queries não é mais necessário com método abaixo
  // mas é boa prática para evitar race condition do servidor
  await queryClient.cancelQueries({
    queryKey: ["biblioteca"],
  });

  // Pegar snapshot INDIVIDUAL do jogo, não do array todo
  const cacheAnterior = queryClient.getQueryData<Jogo[]>(["biblioteca"])
    ?.find((j) => j.id === jogoId);

  if (!cacheAnterior) {
    return { cacheAnterior: null, jogoId };
  }

  // Atualizar cache apenas para o jogo específico
  queryClient.setQueryData<Jogo[]>(
    ["biblioteca"],
    (prev = []) =>
      prev.map((jogo) => {
        if (jogo.id !== jogoId) {
          return jogo;
        }
        return {
          ...jogo,
          detalhes_plataformas: atualizarPlataformas(
            jogo.detalhes_plataformas || [],
            plataforma,
            sub,
            jaExiste,
          ),
        };
      }),
  );

  return { cacheAnterior, jogoId };
},

onError: (err, { jogoId }, context) => {
  // Restaurar apenas o jogo que falhou
  if (context?.cacheAnterior && context?.jogoId) {
    queryClient.setQueryData<Jogo[]>(
      ["biblioteca"],
      (prev = []) =>
        prev.map((jogo) =>
          jogo.id === context.jogoId
            ? context.cacheAnterior
            : jogo
        ),
    );
  }
  alert(tratarErroApi(err));
}
```

### 🎯 Melhor Prática
- Usar `invalidateQueries` com `refetchType: "active"` para sincronizar
- Armazenar metadata sobre qual jogo falhou
- Rollback apenas o jogo que falhou, não todo o cache

---

## 5️⃣ **PROBLEMA: Tipagem Incorreta em vinculo.ts** ⚠️
**Arquivo**: `frontend/src/services/vinculo.ts`  
**Linhas**: 24-26, 51-53

### 🔴 O Problema
```typescript
// ERRADO: VinculoPayLoad é o tipo de ENTRADA, não de saída
queryClient.setQueryData<VinculoPayLoad[]>(["biblioteca"], (antigos = []) => {
  return [data, ...antigos];
})
```

### ❌ Por que acontece
- `VinculoPayLoad` é a interface da **requisição** (o que você envia)
- O cache de biblioteca deveria armazenar `Jogo[]`, não `VinculoPayLoad[]`
- TypeScript pode não reclamar porque `any` é flexível, mas o tipo está errado

### ✅ Como Corrigir
```typescript
// Importar o tipo correto
import type { Jogo } from "../pages/Biblioteca/Biblioteca"; // ou criar arquivo de tipos

// Usar o tipo correto
queryClient.setQueryData<Jogo[]>(["biblioteca"], (antigos = []) => {
  // ...
})
```

---

## 6️⃣ **PROBLEMA: estaAutenticado() Recriada a Cada Render** ⚠️
**Arquivo**: `frontend/src/pages/Biblioteca/Biblioteca.tsx`  
**Linhas**: 39-41

### 🔴 O Problema
```typescript
const estaAutenticado = () => {
  return !!localStorage.getItem("token"); 
};
```

### ❌ Por que é ineficiente
- Essa função é **recriada a cada renderização** do componente
- Se usada em `useEffect`, `useMemo`, ou `useCallback`, cria dependência desnecessária
- Cada re-render = nova função = lint warnings sobre dependências

### ✅ Como Corrigir - Opção 1
```typescript
const estaAutenticado = useCallback(() => {
  return !!localStorage.getItem("token");
}, []);
```

### ✅ Como Corrigir - Opção 2 (Melhor)
```typescript
const estaAutenticado = useMemo(() => {
  return !!localStorage.getItem("token");
}, []);

// Usar como variável, não função
if (!estaAutenticado) {
  navigate("/login", { state: { ... } });
}
```

### ✅ Como Corrigir - Opção 3 (Melhor ainda)
Extrair para fora do componente:
```typescript
// utils/auth.ts
export const estaAutenticado = () => {
  return !!localStorage.getItem("token");
};

// Em Biblioteca.tsx
import { estaAutenticado } from "../../utils/auth";

if (!estaAutenticado()) {
  navigate("/login", { state: { ... } });
}
```

### 🎯 Melhor Prática
- Funções puras → fora do componente
- Estado → dentro do componente com hooks
- Callbacks → com `useCallback` se usado em efeitos

---

## 7️⃣ **PROBLEMA: Dependências Incorretas em useEffect** ⚠️
**Arquivo**: `frontend/src/pages/Biblioteca/Biblioteca.tsx`  
**Linhas**: ~250-275

### 🔴 O Problema
```typescript
useEffect(() => {
  // ... código que usa location.state
  
  if (location.state?.abrirJogoId) {
    abrirModalComJogo(location.state.abrirJogoId);
    navigate(location.pathname, {
      replace: true,
      state: {},
    });
  }
  // ...
}, [jogos, location.state, location.pathname, navigate]);
```

### ❌ Por que problemático
- `location.state` é um **objeto mutável**
- A cada navegação, **novo objeto** é criado, mesmo com mesmos dados
- Isso dispara re-runs desnecessários
- Pode causar loops de re-rendering

### ✅ Como Corrigir
```typescript
useEffect(() => {
  // Usar apenas o valor específico que você precisa
  const jogoId = location.state?.abrirJogoId;
  
  if (jogoId) {
    abrirModalComJogo(jogoId);
    navigate(location.pathname, {
      replace: true,
      state: {},
    });
  }
}, [jogos, location.state?.abrirJogoId, location.pathname, navigate]);
// Agora depende apenas do valor específico, não do objeto todo
```

---

## 8️⃣ **PROBLEMA: Document.title em useEffect Separado** ⚠️
**Arquivo**: `frontend/src/pages/Biblioteca/Biblioteca.tsx`  
**Linhas**: ~345-347

### 🔴 O Problema
```typescript
useEffect(() => {
  document.title = "Biblioteca";
}, []);
```

### ❌ Por que é desordenado
- Esse efeito colateral está separado dos outros
- Dificulta manutenção quando há múltiplos efeitos
- Melhor consolidar

### ✅ Como Corrigir
```typescript
// Consolidar com overflow management
useEffect(() => {
  document.title = "Biblioteca";
  
  return () => {
    document.body.style.overflow = "auto";
  };
}, []);

// Separado: Efeito para controlar overflow quando modal abre
useEffect(() => {
  if (showPopup) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "auto";
  }
}, [showPopup]);
```

---

## 9️⃣ **PROBLEMA: Tipagem Fraca em setQueryData** ⚠️
**Arquivo**: `frontend/src/pages/Biblioteca/Biblioteca.tsx`  
**Linhas**: ~128-135

### 🔴 O Problema
```typescript
const cacheAnterior =
  queryClient.getQueryData<Jogo[]>(["biblioteca"]);

queryClient.setQueryData<Jogo[]>(
  ["biblioteca"],
  (prev = []) => // <-- prev pode ser undefined!
    prev.map((jogo) => {
      // ...
    }),
);
```

### ❌ Por que é arriscado
- Se `prev` for `undefined`, `prev.map()` lança erro
- TypeScript não avisa porque você definiu `(prev = [])`
- Mas o type de `prev` não é `Jogo[]`, é `Jogo[] | undefined`

### ✅ Como Corrigir
```typescript
queryClient.setQueryData<Jogo[]>(
  ["biblioteca"],
  (prev) => {
    // Type guard explícito
    if (!prev || !Array.isArray(prev)) {
      return [];
    }
    
    return prev.map((jogo) => {
      if (jogo.id !== jogoId) {
        return jogo;
      }
      return {
        ...jogo,
        detalhes_plataformas: atualizarPlataformas(
          jogo.detalhes_plataformas || [],
          plataforma,
          sub,
          jaExiste,
        ),
      };
    });
  },
);
```

---

## 🔟 **PROBLEMA: Busca com SearchBar Não Memorizada Corretamente** ⚠️
**Arquivo**: `frontend/src/pages/Biblioteca/Biblioteca.tsx`  
**Linhas**: ~232-237

### 🔴 O Problema
```typescript
const jogosFiltrados = useMemo(() => {
  return jogos.filter((jogo) =>
    jogo.nome.toLowerCase().includes(searchQuery.toLowerCase()),
  );
}, [jogos, searchQuery]);
```

### ❌ Por que pode ser lento
- Se `jogos` array é grande (1000+), cada letra digitada faz **novo filter completo**
- `toLowerCase()` é chamado para cada jogo, para cada letra
- Sem debounce, isso causa re-renders contínuos

### ✅ Como Corrigir
```typescript
// Se quiser otimizar ainda mais:
const jogosFiltrados = useMemo(() => {
  if (!searchQuery.trim()) {
    return jogos;
  }
  
  const queryLower = searchQuery.toLowerCase();
  return jogos.filter((jogo) =>
    jogo.nome.toLowerCase().includes(queryLower),
  );
}, [jogos, searchQuery]);

// OU usar debounce em SearchBar
// Passar searchQuery com delay
```

---

## 1️⃣1️⃣ **BOAS PRÁTICAS IMPLEMENTADAS ✅**

### ✅ O que está correto

1. **useQuery com staleTime e gcTime** → Bom!
2. **cancelQueries em onMutate** → Protege contra race conditions
3. **onError com rollback** → Maneja falhas corretamente
4. **useMemo para jogoSelecionado** → Evita re-renderizações
5. **Portal para modal** → Bom uso de React patterns
6. **Animações com Framer Motion** → Performance consciente

---

## 📋 RESUMO DAS CORREÇÕES NECESSÁRIAS

| Problema | Severidade | Impacto | Linhas |
|----------|-----------|--------|--------|
| QueryClient duplicado | 🔴 CRÍTICA | Cache não sincroniza | vinculo.ts:3-4 |
| Listeners duplicados | 🔴 CRÍTICA | Eventos processados 2x | 250-275, 308-332 |
| invalidateQueries desnecessária | 🟡 ALTA | UI pode piscar/desatualizar | 153-157 |
| Race condition em mutações | 🟡 ALTA | Perder updates simultâneos | 113-145 |
| Tipagem incorreta | 🟠 MÉDIA | Bugs em tempo de execução | vinculo.ts:24-26 |
| estaAutenticado recriada | 🟠 MÉDIA | Re-renders desnecessários | 39-41 |
| Dependências incorretas | 🟠 MÉDIA | Re-renders extras | 250-275 |
| Tipagem fraca em setQueryData | 🟠 MÉDIA | Crashes potenciais | 128-135 |

---

## 🎯 PRÓXIMAS AÇÕES

1. **Remover QueryClient de vinculo.ts** (Crítico)
2. **Consolidar listeners em um único useEffect** (Crítico)
3. **Revisar estratégia de invalidação** (Importante)
4. **Adicionar type guards** (Segurança)
5. **Usar useCallback onde apropriado** (Performance)

