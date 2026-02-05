# Checklist de Otimização - Projeto SALA

## ✅ Concluído

- [x] Migração para Next.js 16
- [x] Configuração do Turbopack
- [x] Remoção de configurações depreciadas
- [x] Headers de segurança
- [x] Otimização de imagens com remotePatterns

## 🔄 Em Progresso / Recomendado

### 1. Server Components vs Client Components

#### Arquivos para Revisar:

```
src/components/layout/Header.tsx        → Pode ser Server Component?
src/components/layout/Sidebar.tsx       → Pode ser Server Component?
src/app/dashboard/page.tsx              → Já é Server Component ✅
src/app/notificacoes/page.tsx           → Precisa ser Client (usa hooks)
```

**Ação**: Separar lógica de estado da apresentação

#### Exemplo de Refatoração:

```typescript
// ❌ Antes: Tudo no Client
'use client'
export default function Header() {
  const { data: session } = useSession()
  return <div>{session?.user?.name}</div>
}

// ✅ Depois: Separado
// HeaderServer.tsx (Server Component)
export default async function HeaderServer() {
  const session = await getServerSession()
  return <HeaderClient session={session} />
}

// HeaderClient.tsx (Client Component)
'use client'
export default function HeaderClient({ session }) {
  return <div>{session?.user?.name}</div>
}
```

### 2. Otimização de Queries do Prisma

#### Arquivos com Queries:

```
src/app/api/rooms/route.ts
src/app/api/reservations/route.ts
src/app/api/notifications/route.ts
src/app/api/users/route.ts
```

**Problemas Identificados**:

1. Falta de paginação em algumas rotas
2. Queries N+1 potenciais
3. Falta de índices no banco

**Solução**:

```typescript
// ❌ Antes: Query N+1
const rooms = await prisma.room.findMany();
for (const room of rooms) {
  const items = await prisma.item.findMany({ where: { roomId: room.id } });
}

// ✅ Depois: Include otimizado
const rooms = await prisma.room.findMany({
  include: {
    items: true,
    reservations: {
      where: { status: "ACTIVE" },
      take: 5,
    },
  },
  take: 20, // Paginação
  skip: page * 20,
});
```

### 3. Adicionar Índices no Prisma

**Editar**: `prisma/schema.prisma`

```prisma
model Reservation {
  // ... campos existentes

  @@index([userId])
  @@index([roomId])
  @@index([status])
  @@index([startTime, endTime])
}

model Notification {
  // ... campos existentes

  @@index([userId, isRead])
  @@index([createdAt])
}

model Room {
  // ... campos existentes

  @@index([status])
}
```

**Após adicionar, rodar**:

```bash
npx prisma migrate dev --name add_indexes
```

### 4. Implementar Cache de API

```typescript
// src/app/api/rooms/route.ts
import { unstable_cache } from "next/cache";

export const revalidate = 60; // Revalidar a cada minuto

const getCachedRooms = unstable_cache(
  async () => {
    return await prisma.room.findMany({
      include: { items: true },
    });
  },
  ["rooms-list"],
  {
    revalidate: 60,
    tags: ["rooms"],
  }
);

export async function GET() {
  const rooms = await getCachedRooms();
  return Response.json(rooms);
}
```

### 5. Otimizar Notificações em Tempo Real

**Atual**: Polling a cada X segundos
**Melhor**: Server-Sent Events ou WebSocket

```typescript
// src/app/api/notifications/stream/route.ts
export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Enviar notificações em tempo real
      const interval = setInterval(async () => {
        const count = await prisma.notification.count({
          where: { userId, isRead: false },
        });
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ count })}\n\n`)
        );
      }, 5000);

      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

### 6. Lazy Loading de Componentes Pesados

```typescript
// src/app/dashboard/page.tsx
import dynamic from 'next/dynamic'

// Lazy load do gráfico pesado
const ChartComponent = dynamic(
  () => import('@/components/dashboard/Chart'),
  {
    loading: () => <div>Carregando gráfico...</div>,
    ssr: false // Não renderizar no servidor
  }
)
```

### 7. Otimizar Bundle Size

**Verificar tamanho atual**:

```bash
npm run build
```

**Analisar bundle**:

```bash
npm install --save-dev @next/bundle-analyzer
```

```javascript
// next.config.mjs
import withBundleAnalyzer from "@next/bundle-analyzer";

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default bundleAnalyzer(withNextIntl(nextConfig));
```

**Rodar análise**:

```bash
ANALYZE=true npm run build
```

### 8. Implementar Error Boundaries

```typescript
// src/components/ErrorBoundary.tsx
'use client'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="error-container">
      <h2>Algo deu errado!</h2>
      <button onClick={reset}>Tentar novamente</button>
    </div>
  )
}
```

### 9. Prefetch de Páginas

```typescript
// src/components/layout/Sidebar.tsx
import Link from 'next/link'

// Next.js 16 faz prefetch automaticamente
// Mas você pode controlar:
<Link href="/dashboard" prefetch={true}>
  Dashboard
</Link>
```

### 10. Otimizar Prisma Connection Pool

**Editar**: `src/lib/prisma.ts`

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    // Configurar pool de conexões
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});
```

## 📊 Métricas para Monitorar

### Core Web Vitals

- [ ] LCP (Largest Contentful Paint) < 2.5s
- [ ] FID (First Input Delay) < 100ms
- [ ] CLS (Cumulative Layout Shift) < 0.1

### Lighthouse Score

- [ ] Performance > 90
- [ ] Accessibility > 90
- [ ] Best Practices > 90
- [ ] SEO > 90

### Custom Metrics

- [ ] Tempo de carregamento da lista de salas < 500ms
- [ ] Tempo de resposta do login < 1s
- [ ] Atualização de notificações < 200ms

## 🔧 Ferramentas de Desenvolvimento

### Recomendadas

```bash
# React DevTools
# Next.js DevTools (built-in no Next.js 16)
# Prisma Studio
npm run db:studio

# Bundle Analyzer
ANALYZE=true npm run build
```

## 📝 Notas Importantes

1. **Server Components são o padrão** - Use 'use client' apenas quando necessário
2. **Cache agressivamente** - Use `revalidate` e `cache`
3. **Índices no banco** - Crucial para performance
4. **Monitoramento** - Implemente analytics desde o início
5. **Error Handling** - Use Error Boundaries
6. **Loading States** - Use Suspense e loading.tsx

## 🎯 Prioridades

### Alta Prioridade (Fazer Agora)

1. Adicionar índices no Prisma
2. Implementar paginação nas APIs
3. Separar Server/Client Components

### Média Prioridade (Próximas Semanas)

4. Implementar cache de API
5. Otimizar notificações em tempo real
6. Lazy loading de componentes

### Baixa Prioridade (Melhorias Futuras)

7. Bundle analyzer
8. Partial Prerendering
9. Advanced caching strategies

---

**Última atualização**: Fevereiro 2026
**Status**: Em progresso
**Responsável**: Time de Desenvolvimento
