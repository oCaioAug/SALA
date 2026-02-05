# Fix: Dependência Circular - routing

## Problema

```
⨯ ReferenceError: Cannot access 'routing' before initialization
    at Module.routing (C:\dev\SALA\web\.next\dev\server\chunks\[root-of-the-server]__acbe6234._.js:147:9)
    at module evaluation (src\i18n\request.ts:5:24)
    at module evaluation (src\navigation.ts:1:1)
    at module evaluation (src\proxy.ts:2:1)
```

## Causa

Dependência circular entre módulos:

```
navigation.ts → imports from config.ts → exports routing
     ↑                                           ↓
     |                                           ↓
proxy.ts ← imports routing ← i18n/request.ts ←─┘
```

## Solução

### Antes (`src/i18n/request.ts`)

```typescript
import { routing } from "../navigation";

export const locales = routing.locales;
export const defaultLocale = routing.defaultLocale;
export type Locale = (typeof locales)[number];
```

### Depois (`src/i18n/request.ts`)

```typescript
import { locales, defaultLocale, type Locale } from "../config";

// Re-exportar para compatibilidade
export { locales, defaultLocale };
export type { Locale };
```

## Resultado

✅ Servidor rodando sem erros
✅ Dependência circular removida
✅ Imports diretos do arquivo de configuração
✅ Performance melhorada (menos resoluções de módulo)

## Estrutura Correta

```
config.ts (source of truth)
    ↓
navigation.ts (usa config)
    ↓
proxy.ts (usa navigation)

i18n/request.ts (usa config diretamente) ✓
```

## Data

Fevereiro 2026

## Status

✅ Resolvido
