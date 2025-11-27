# Configuração do Upload de Imagens para Vercel

## Problema

A Vercel não permite escrever arquivos no sistema de arquivos das funções serverless. Para resolver isso, implementamos uma solução híbrida que usa:

- **Desenvolvimento Local**: Sistema de arquivos (`public/uploads/`) para itens
- **Produção (Vercel)**: Cloudinary para hospedagem de imagens
- **Avatares**: Sempre usa Cloudinary quando as credenciais estiverem disponíveis (desenvolvimento e produção)

## Setup do Cloudinary

### 1. Criar Conta Gratuita

1. Acesse [cloudinary.com](https://cloudinary.com)
2. Crie uma conta gratuita
3. Acesse o Dashboard

### 2. Obter Credenciais

No Dashboard do Cloudinary, você encontrará:

- **Cloud Name**: `your-cloud-name`
- **API Key**: `123456789012345`
- **API Secret**: `abcdefghijklmnopqrstuvwxyz123456`

### 3. Configurar Variáveis de Ambiente

#### No arquivo `.env` (local):

```bash
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="123456789012345"
CLOUDINARY_API_SECRET="abcdefghijklmnopqrstuvwxyz123456"
```

#### Na Vercel (produção):

1. Acesse o dashboard da Vercel
2. Vá para Settings > Environment Variables
3. Adicione as três variáveis:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

## Como Funciona

### Detecção Automática do Ambiente

```typescript
function isVercel(): boolean {
  return process.env.VERCEL === "1" || process.env.VERCEL_ENV !== undefined;
}
```

### Upload de Itens

- **Local (Desenvolvimento)**: Sistema de arquivos (`public/uploads/items/images/`)
- **Produção (Vercel)**: Cloudinary (`sala/items/`)

### Upload de Avatares

- **Sempre usa Cloudinary** quando as credenciais estiverem disponíveis (desenvolvimento e produção)
- **Fallback**: Sistema de arquivos local se Cloudinary não estiver configurado

```typescript
// Organização no Cloudinary:
// - Itens: sala/items/filename.jpg
// - Avatares: sala/avatars/filename.jpg
// - Thumbnails: sala/items/thumb_filename.jpg ou sala/avatars/thumb_filename.jpg
```

## Estrutura de Pastas no Cloudinary

```
sala/
├── items/
│   ├── computador_1699123456.jpg
│   ├── thumb_computador_1699123456.jpg
│   └── ...
└── avatars/
    ├── user_123_avatar.jpg
    ├── thumb_user_123_avatar.jpg
    └── ...
```

## Benefícios

✅ **Desenvolvimento**: Upload rápido local  
✅ **Produção**: CDN global otimizado  
✅ **Automático**: Detecção de ambiente  
✅ **Otimização**: Redimensionamento automático  
✅ **Confiabilidade**: Backup e redundância

## Plano Gratuito do Cloudinary

- **Armazenamento**: 25GB
- **Bandwidth**: 25GB/mês
- **Transformações**: 25.000/mês
- **Usuários**: Suficiente para projetos pequenos/médios

## URLs Resultantes

### Local

```
http://localhost:3000/api/uploads/items/images/original_computador_1699123456.jpg
```

### Cloudinary

```
https://res.cloudinary.com/your-cloud/image/upload/v1699123456/sala/items/computador_1699123456.jpg
```

## Logs de Debug

O sistema inclui logs para facilitar o debug:

```
🌐 Uploading to Vercel using Cloudinary (itens)
💻 Uploading locally using filesystem (itens)
☁️ Uploading avatar to Cloudinary (sempre que credenciais disponíveis)
💻 Uploading avatar locally using filesystem (Cloudinary não configurado)
```

## Nota Importante

**Para upload de avatares funcionar corretamente**, especialmente no mobile, é necessário configurar as credenciais do Cloudinary no arquivo `.env` local, mesmo em desenvolvimento. Isso garante que os avatares sejam sempre salvos no Cloudinary e possam ser acessados de qualquer lugar.
