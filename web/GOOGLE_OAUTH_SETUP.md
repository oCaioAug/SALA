# Instruções para corrigir o erro de callback do Google OAuth

## O que fazer no Google Cloud Console

1. **Acesse o Google Cloud Console:**

   - Vá para: https://console.cloud.google.com/
   - Selecione seu projeto

2. **Navegue para APIs & Services > Credentials:**

   - Clique no seu OAuth 2.0 Client ID

3. **Verifique os Authorized redirect URIs:**

   - Deve incluir EXATAMENTE: `http://localhost:3000/api/auth/callback/google`
   - Certifique-se de que não há espaços ou caracteres extras

4. **Authorized JavaScript origins:**
   - Adicione: `http://localhost:3000`

## Verificações no código

✅ NEXTAUTH_URL configurado corretamente
✅ NEXTAUTH_SECRET configurado
✅ Google Client ID e Secret configurados
✅ Callback de signIn melhorado com logs
✅ Página de erro customizada criada

## Para testar

1. Acesse: http://localhost:3000/api/auth/debug
2. Verifique se todas as configurações estão marcadas como "✓ Configurado"
3. Tente fazer login novamente
4. Se houver erro, acesse: http://localhost:3000/auth/error para ver detalhes

## URLs importantes para configurar no Google:

**Desenvolvimento:**

- Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
- Authorized JavaScript origin: `http://localhost:3000`

**Produção (quando deploy):**

- Authorized redirect URI: `https://sala.ocaioaug.com.br/api/auth/callback/google`
- Authorized JavaScript origin: `https://sala.ocaioaug.com.br`
