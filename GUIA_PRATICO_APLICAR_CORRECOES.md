# 🚀 Guia Prático: Aplicar as Correções

## 📌 Ordem de Prioridade

1. **CRÍTICA**: Remover QueryClient de `vinculo.ts` (causa cache não sincronizar)
2. **CRÍTICA**: Consolidar listeners duplicados (causa eventos 2x)
3. **ALTA**: Revisar invalidação de cache
4. **MÉDIA**: Melhorar tipagem e dependências

---

## ✅ PASSO 1: Corrigir vinculo.ts

### Problema
```typescript
// ❌ ANTES - QueryClient criada globalmente
const queryClient = new QueryClient();

export async function vincularJogo({...}) {
  // ...requisição...
  queryClient.setQueryData<VinculoPayLoad[]>(["biblioteca"], ...); // ERRADO!
}

export async function desvincularJogo(...) {
  // ...requisição...
  queryClient.setQueryData<VinculoPayLoad[]>(["biblioteca"], ...); // ERRADO!
}
```

### Solução
```typescript
// ✅ DEPOIS - Remover manipulação de cache

export async function vincularJogo({...}) {
  const { data } = await api.post("/pedidos/vincular", {...});
  return data; // Apenas retorna, sem manipular cache
}

export async function desvincularJogo(...) {
  const { data } = await api.delete(`/pedidos/desvincular/${jogoId}`, {...});
  return data; // Apenas retorna, sem manipular cache
}
```

### Ação
1. Abra [frontend/src/services/vinculo.ts](frontend/src/services/vinculo.ts)
2. **Remova** as linhas:
   - `import { QueryClient } from "@tanstack/react-query";`
   - `const queryClient = new QueryClient();`
   - Todos os `queryClient.setQueryData(...)` em ambas as funções
3. Mantenha apenas: requisição HTTP + retorno de dados

**Resultado**: Cache sincroniza corretamente com o QueryClient do Provider

---

## ✅ PASSO 2: Consolidar Listeners Duplicados

### Problema
Dois `useEffect` idênticos registrando o mesmo evento:

```typescript
// ❌ LISTENER 1 (linhas ~250-275)
useEffect(() => {
  const handleEvent = (e: Event) => { ... };
  window.addEventListener("abrirJogo", handleEvent);
  // ...
  return () => { window.removeEventListener("abrirJogo", handleEvent); };
}, [jogos, location.state, location.pathname, navigate]);

// ❌ LISTENER 2 (linhas ~308-332) - PRATICAMENTE IGUAL!
useEffect(() => {
  const handleEvent = (e: Event) => { ... };
  window.addEventListener("abrirJogo", handleEvent);
  // ...
  return () => { window.removeEventListener("abrirJogo", handleEvent); };
}, [jogos]);
```

### Solução
```typescript
// ✅ UM ÚNICO useEffect consolidado
useEffect(() => {
  const handleEvent = (e: Event) => {
    const customEvent = e as CustomEvent<number>;
    if (!customEvent.detail) return;

    const jogoEncontrado = jogos.find(
      (j) => j.id === Number(customEvent.detail)
    );

    if (jogoEncontrado) {
      setJogoSelecionadoId(jogoEncontrado.id);
      setShowPopup(true);
      setErroBusca(null);
    } else {
      setErroBusca("Você não vinculou esse jogo");
      setTimeout(() => setErroBusca(null), 3000);
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

### Ação
1. Abra [Biblioteca.tsx](frontend/src/pages/Biblioteca/Biblioteca.tsx)
2. **Localize** os dois `useEffect` que lidam com "abrirJogo"
3. **Delete** o segundo `useEffect` completamente
4. **Consolidate** a lógica do segundo no primeiro

**Resultado**: Evento processado apenas uma vez, comportamento consistente

---

## ✅ PASSO 3: Revisar Invalidação de Cache

### Problema Atual
```typescript
onSettled: () => {
  queryClient.invalidateQueries({
    queryKey: ["biblioteca"],
  });
}
```

Isso **invalida e refaz a requisição** toda vez, perdendo o update otimista.

### Solução Melhorada
```typescript
onSettled: (data, error) => {
  if (error) {
    // Se há erro mesmo após rollback, re-sincronizar
    queryClient.invalidateQueries({
      queryKey: ["biblioteca"],
    });
  } else if (data) {
    // Se sucesso, atualizar com dados do servidor
    queryClient.setQueryData<Jogo[]>(
      ["biblioteca"],
      (prev) => {
        if (!prev || !Array.isArray(prev)) {
          return [data];
        }

        return prev.map((jogo) =>
          jogo.id === data.id
            ? {
                ...jogo,
                detalhes_plataformas: data.detalhes_plataformas,
              }
            : jogo
        );
      }
    );
  }
}
```

### Ação
1. Abra [Biblioteca.tsx](frontend/src/pages/Biblioteca/Biblioteca.tsx)
2. **Substitua** o `onSettled` com a lógica acima
3. Isso garante que:
   - ✅ Erro → reconecta
   - ✅ Sucesso → sincroniza dados do servidor
   - ✅ Sem piscar/desatualização desnecessária

---

## ✅ PASSO 4: Adicionar Type Guards

### Problema
```typescript
// ❌ Pode dar erro se prev for undefined
queryClient.setQueryData<Jogo[]>(
  ["biblioteca"],
  (prev = []) => prev.map(...) // Não garante tipos!
);
```

### Solução
```typescript
// ✅ Type guard explícito
queryClient.setQueryData<Jogo[]>(
  ["biblioteca"],
  (prev) => {
    if (!prev || !Array.isArray(prev)) {
      return [];
    }

    return prev.map((jogo) => {
      // ...lógica...
    });
  }
);
```

### Ação
1. Abra [Biblioteca.tsx](frontend/src/pages/Biblioteca/Biblioteca.tsx)
2. **Localize** todos os `queryClient.setQueryData` calls
3. **Adicione** type guards antes de usar `prev`

---

## ✅ PASSO 5: Melhorar Dependências de useEffect

### Problema
```typescript
// ❌ Depende do objeto inteiro, que muda a cada navegação
}, [jogos, location.state, location.pathname, navigate]);
```

### Solução
```typescript
// ✅ Depende apenas do valor específico
}, [jogos, location.state?.abrirJogoId, location.pathname, navigate]);
```

### Ação
1. Abra [Biblioteca.tsx](frontend/src/pages/Biblioteca/Biblioteca.tsx)
2. **Atualize** as dependências do `useEffect` consolidado

---

## ✅ PASSO 6: Extrair estaAutenticado()

### Problema
```typescript
// ❌ Recriada a cada render
const estaAutenticado = () => {
  return !!localStorage.getItem("token");
};
```

### Solução
```typescript
// ✅ Fora do componente - criada uma vez
const estaAutenticado = () => {
  return !!localStorage.getItem("token");
};

const Biblioteca = () => {
  // ...usar estaAutenticado() normalmente
  if (!estaAutenticado()) {
    navigate("/login", { state: { ... } });
  }
};
```

### Ação
1. Abra [Biblioteca.tsx](frontend/src/pages/Biblioteca/Biblioteca.tsx)
2. **Move** a função `estaAutenticado` para FORA do componente (antes de `const Biblioteca = () => {`)

---

## ✅ PASSO 7: Consolidar useEffect de Overflow

### Problema
```typescript
// ❌ Dois useEffect gerenciando overflow
useEffect(() => {
  if (showPopup) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "auto";
  }
  return () => {
    document.body.style.overflow = "auto";
  };
}, [showPopup]);

useEffect(() => {
  document.title = "Biblioteca";
}, []);
```

### Solução (opcional, mas mais limpa)
```typescript
// ✅ Controlar overflow quando modal abre/fecha
useEffect(() => {
  if (showPopup) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "auto";
  }

  return () => {
    document.body.style.overflow = "auto";
  };
}, [showPopup]);

// ✅ Definir title uma vez
useEffect(() => {
  document.title = "Biblioteca";
}, []);
```

### Ação
1. Mantém os dois `useEffect`, mas certifica-se de que estão bem ordenados
2. O primeiro controla overflow (depende de `showPopup`)
3. O segundo define title (sem dependências)

---

## 🧪 COMO TESTAR AS CORREÇÕES

### Teste 1: Update Otimista
```
1. Abra um jogo
2. Clique em "PlayStation"
3. ✅ Botão fica "active" IMEDIATAMENTE (sem esperar servidor)
4. ✅ Se desconectar o WiFi, o erro aparece mas volta ao estado anterior
```

### Teste 2: Listeners Únicos
```
1. Abra DevTools (F12) → Console
2. Procure por erros duplicados quando abre modal
3. ✅ Modal abre uma vez (antes abria 2x)
```

### Teste 3: Sincronização de Cache
```
1. Abra dois abas da Biblioteca
2. Em uma aba, vincule um jogo
3. ✅ A outra aba também atualiza (cache sincronizado)
```

### Teste 4: Performance
```
1. Abra DevTools → Lighthouse
2. Verifique que não há re-renders desnecessários
3. ✅ Componente não re-renderiza ao digitar na busca (jogosFiltrados memorizado)
```

---

## 📊 Checklist de Implementação

- [ ] Remover QueryClient de `vinculo.ts`
- [ ] Consolidar listeners em um único `useEffect`
- [ ] Revisar `onSettled` para sincronização correta
- [ ] Adicionar type guards em `setQueryData`
- [ ] Corrigir dependências de `useEffect`
- [ ] Extrair `estaAutenticado()` para fora do componente
- [ ] Testar update otimista
- [ ] Testar listeners
- [ ] Testar sincronização
- [ ] Verificar performance

---

## 🎯 Resultado Final

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Cache sincronizado | ❌ Não | ✅ Sim |
| Listeners duplicados | ⚠️ Sim (2x) | ✅ Único |
| Update otimista | ⚠️ Às vezes | ✅ Sempre |
| Re-renders desnecessários | ⚠️ Muitos | ✅ Otimizado |
| Race conditions | ⚠️ Possível | ✅ Protegido |
| Tipagem | ⚠️ Fraca | ✅ Type-safe |
| Rollback em erro | ✅ Sim | ✅ Melhorado |

