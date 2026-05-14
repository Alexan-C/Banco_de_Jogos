# 🎓 Melhores Práticas Profissionais - React Query

## 1️⃣ Arquitetura de Cache e Sincronização

### ❌ Errado
```typescript
// Manipular cache em múltiplos lugares
// services/api.ts
queryClient.setQueryData(["data"], ...);

// components/Component.tsx
queryClient.invalidateQueries(["data"]);
```

### ✅ Correto
```typescript
// services/api.ts - Apenas requisições
export async function fetchData() {
  return await api.get("/data");
}

// hooks/useDataMutation.ts - Lógica de cache
export function useDataMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: fetchData,
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ["data"] });
      const previousData = queryClient.getQueryData(["data"]);
      
      queryClient.setQueryData(["data"], newData);
      return { previousData };
    },
    onError: (err, newData, context) => {
      queryClient.setQueryData(["data"], context?.previousData);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["data"], data);
    }
  });
}

// components/Component.tsx - Usar hook
const mutation = useDataMutation();
```

### 🎯 Princípios
- **Separação de responsabilidades**: API layer faz requisições, Cache layer gerencia estado
- **Fonte única de verdade**: QueryClient é a fonte, não múltiplos estados locais
- **Composition**: Hooks customizados encapsulam lógica de cache

---

## 2️⃣ Estratégias de Update Otimista

### Nível 1: Update Simples
```typescript
onMutate: async (newItem) => {
  await queryClient.cancelQueries({ queryKey: ["items"] });
  const previousItems = queryClient.getQueryData<Item[]>(["items"]);
  
  queryClient.setQueryData<Item[]>(["items"], (old = []) => [
    ...old,
    newItem,
  ]);
  
  return { previousItems };
};
```

### Nível 2: Update com Validação
```typescript
onMutate: async (updatedItem) => {
  await queryClient.cancelQueries({ queryKey: ["items"] });
  
  const previousItems = queryClient.getQueryData<Item[]>(["items"]);
  
  if (!previousItems) {
    return { previousItems: null };
  }
  
  queryClient.setQueryData<Item[]>(["items"], (old = []) =>
    old.map((item) =>
      item.id === updatedItem.id ? updatedItem : item
    )
  );
  
  return { previousItems };
};

onError: (error, variables, context) => {
  if (context?.previousItems) {
    queryClient.setQueryData(["items"], context.previousItems);
  }
};
```

### Nível 3: Update com Sincronização
```typescript
onMutate: async (updatedItem) => {
  await queryClient.cancelQueries({ queryKey: ["items"] });
  
  const previousItems = queryClient.getQueryData<Item[]>(["items"]);
  const previousItem = previousItems?.find(i => i.id === updatedItem.id);
  
  queryClient.setQueryData<Item[]>(["items"], (old = []) =>
    old.map((item) =>
      item.id === updatedItem.id ? { ...item, ...updatedItem } : item
    )
  );
  
  return { previousItems, previousItem, updatedItem };
};

onError: (error, variables, context) => {
  if (context?.previousItem) {
    queryClient.setQueryData<Item[]>(["items"], (old = []) =>
      old.map((item) =>
        item.id === context.previousItem.id ? context.previousItem : item
      )
    );
  }
};

onSuccess: (serverData, variables, context) => {
  // Se servidor retorna dados diferentes, sincronizar
  if (JSON.stringify(serverData) !== JSON.stringify(context?.updatedItem)) {
    queryClient.setQueryData<Item[]>(["items"], (old = []) =>
      old.map((item) =>
        item.id === serverData.id ? serverData : item
      )
    );
  }
};
```

---

## 3️⃣ Invalidação Inteligente

### ❌ Errado: Invalida tudo
```typescript
onSuccess: () => {
  queryClient.invalidateQueries(); // Re-busca TODAS as queries!
};
```

### ✅ Correto: Invalida o necessário
```typescript
// Opção 1: Específico
onSuccess: () => {
  queryClient.invalidateQueries({
    queryKey: ["items"],
    exact: true, // Apenas "items", não "items.details"
  });
};

// Opção 2: Por tipo
onSuccess: () => {
  queryClient.invalidateQueries({
    queryKey: ["items"],
    // Invalida "items", "items.1", "items.search"
  });
};

// Opção 3: Nenhuma (confiar no update otimista)
onSuccess: (data) => {
  queryClient.setQueryData(["items"], data);
  // Sem invalidate = sem re-fetch
};
```

### 🎯 Regra de Ouro
```
    Sync Requirement          Strategy
    ─────────────────────────────────────
    Dados mudam rapidamente   → Refetch (invalidate)
    Dados mudam raramente     → Update otimista apenas
    Crítico estar 100% sync   → Update + refetch
    UX importante             → Update + refetch assíncrono
```

---

## 4️⃣ Query Keys - Convenções Profissionais

### ❌ Errado
```typescript
// Nomes genéricos
useQuery({ queryKey: ["data"], ... });
useQuery({ queryKey: ["items"], ... });

// Sem contexto
useQuery({ queryKey: ["user", userId], ... });
```

### ✅ Correto
```typescript
// Namespacing hierárquico
const QueryKeys = {
  all: ['items'] as const,
  lists: () => [...QueryKeys.all, 'list'] as const,
  list: (filters: FilterType) => [...QueryKeys.lists(), { filters }] as const,
  details: () => [...QueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...QueryKeys.details(), id] as const,
} as const;

// Uso
useQuery({
  queryKey: QueryKeys.list({ search: "zelda" }),
  queryFn: () => api.get("/items", { search: "zelda" }),
});

useQuery({
  queryKey: QueryKeys.detail(123),
  queryFn: () => api.get("/items/123"),
});

// Invalidar logicamente
queryClient.invalidateQueries({
  queryKey: QueryKeys.lists(), // Invalida TODOS os lists
});

queryClient.invalidateQueries({
  queryKey: QueryKeys.detail(123), // Apenas esse detalhe
});
```

### Factory Pattern Completo
```typescript
// queryKeys.ts
export const QueryKeys = {
  items: {
    all: ['items'] as const,
    lists: () => [...QueryKeys.items.all, 'list'] as const,
    list: (filters?: ItemFilters) => [
      ...QueryKeys.items.lists(),
      { filters }
    ] as const,
    details: () => [...QueryKeys.items.all, 'detail'] as const,
    detail: (id: number) => [...QueryKeys.items.details(), id] as const,
  },
  users: {
    all: ['users'] as const,
    detail: (id: number) => [...QueryKeys.users.all, id] as const,
  },
} as const;

// Usar em qualquer lugar
queryClient.invalidateQueries({
  queryKey: QueryKeys.items.lists(),
});
```

---

## 5️⃣ Tratamento de Erros Profissional

### ❌ Errado
```typescript
onError: (error) => {
  alert("Erro!");
};
```

### ✅ Correto
```typescript
onError: (error, variables, context) => {
  const message = getErrorMessage(error);
  
  // Log estruturado
  console.error({
    error,
    mutation: "vincularJogo",
    variables,
    timestamp: new Date().toISOString(),
  });
  
  // Mostrar ao usuário
  toast.error(message);
  
  // Analytics
  trackError("vincular_jogo_erro", {
    errorType: error instanceof AxiosError ? error.code : "unknown",
    statusCode: error?.response?.status,
  });
  
  // Rollback UI
  if (context?.previousData) {
    queryClient.setQueryData(["items"], context.previousData);
  }
};

// Helper
function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      return "Sessão expirada";
    }
    if (error.response?.status === 403) {
      return "Sem permissão";
    }
    return error.response?.data?.detail || "Erro no servidor";
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return "Erro desconhecido";
}
```

---

## 6️⃣ Performance: Deduplicação e Stale Time

### Problema: Requisições duplicadas
```typescript
// Ambos disparão requisições simultâneas
useQuery({ queryKey: ["item"], ... }); // Componente A
useQuery({ queryKey: ["item"], ... }); // Componente B
// React Query deduplica automaticamente! ✅
```

### Otimizar Stale Time
```typescript
// ❌ Sempre fresco (e sempre refetch)
staleTime: 0, // Re-busca a cada vez

// ✅ Balanceado
staleTime: 1000 * 60 * 5, // 5 min

// ✅ Agressivo (dados pouco mudam)
staleTime: 1000 * 60 * 60, // 1 hora

// ✅ Específico por tipo
const userQueryConfig = {
  staleTime: 1000 * 60 * 60, // Usuário muda raramente
  gcTime: 1000 * 60 * 60 * 24, // Manter na memória 24h
};

const notificationsQueryConfig = {
  staleTime: 1000 * 5, // Notificações mudam frequentemente
  gcTime: 1000 * 60 * 5, // Limpar após 5 min
};

useQuery({
  queryKey: ["user", userId],
  queryFn: () => api.get(`/users/${userId}`),
  ...userQueryConfig,
});
```

---

## 7️⃣ Evitar Race Conditions

### Problema: Múltiplas mutações simultâneas
```typescript
// Usuário clica 2 botões muito rápido
handleVinculo("PS5"); // Mutation A
handleVinculo("Xbox"); // Mutation B

// Sem proteção, pode haver conflito no onMutate
```

### Solução
```typescript
const handleVinculo = async (platform: string) => {
  // Desabilitar botão durante mutation
  setIsLoading(true);
  
  try {
    await vinculoMutation.mutateAsync({
      jogoId: jogoSelecionadoId,
      plataforma: platform,
    });
  } finally {
    setIsLoading(false);
  }
};

// ou usar mutex
const mutationLock = { pending: false };

const handleVinculo = (platform: string) => {
  if (mutationLock.pending) return; // Ignorar cliques múltiplos
  
  mutationLock.pending = true;
  
  vinculoMutation.mutate(
    { jogoId: jogoSelecionadoId, plataforma: platform },
    {
      onSettled: () => {
        mutationLock.pending = false;
      },
    }
  );
};
```

---

## 8️⃣ Debugging React Query

### DevTools
```typescript
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// Em App.tsx
export function App() {
  return (
    <>
      {/* Seu app */}
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );
}
```

### Logging
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        console.log(`Query retry #${failureCount}`, error);
        return failureCount < 3;
      },
    },
  },
});

// Logger customizado
queryClient.getQueryCache().subscribe((event) => {
  console.log("Query Event:", event);
});
```

---

## 9️⃣ Pattern: Hooks Customizados

### useListQuery
```typescript
interface UseListQueryOptions {
  search?: string;
  page?: number;
  pageSize?: number;
}

export function useListQuery(options: UseListQueryOptions) {
  return useQuery({
    queryKey: QueryKeys.items.list(options),
    queryFn: () => api.get("/items", { params: options }),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
}

// Uso
const { data: items, isLoading } = useListQuery({
  search: "zelda",
  page: 1,
});
```

### useItemMutation
```typescript
export function useItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (item: Item) => api.post("/items", item),
    onMutate: async (newItem) => {
      // Update otimista...
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QueryKeys.items.detail(data.id), data);
      queryClient.invalidateQueries({
        queryKey: QueryKeys.items.lists(),
      });
      toast.success("Item criado!");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
```

---

## 🔟 Checklist: Code Review React Query

- [ ] QueryKeys padronizadas e hierárquicas
- [ ] Update otimista implementado quando apropriado
- [ ] Rollback em caso de erro
- [ ] Invalidação inteligente (não invalida tudo)
- [ ] Stale time e gcTime configurados apropriadamente
- [ ] Race conditions protegidas
- [ ] Erros tratados e logados
- [ ] Type-safe queries e mutations
- [ ] Sem QueryClient duplicados
- [ ] Sem listeners duplicados
- [ ] Dependências corretas em useEffect
- [ ] Performance monitorada (re-renders mínimos)

---

## 📚 Referências

- [React Query Docs](https://tanstack.com/query/latest)
- [Query Keys - Recommended](https://tanstack.com/query/latest/docs/react/guides/important-defaults#hashStable)
- [Practical React Query](https://tkdodo.eu/blog/practical-react-query)
- [React Query Offline Guide](https://tkdodo.eu/blog/offline-react-query)

