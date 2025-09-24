# 🔐 Configuração OAuth2 Google - SALA

## 📱 Web Application (Next.js)

### 1. Configuração no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um projeto ou selecione um existente
3. Ative as APIs necessárias:
   - Google+ API
   - Google Identity API
4. Configure a tela de consentimento OAuth:
   - Vá em "APIs & Services" → "OAuth consent screen"
   - Escolha "External"
   - Preencha as informações obrigatórias

### 2. Criar Credenciais OAuth 2.0

1. Vá em "APIs & Services" → "Credentials"
2. Clique em "Create Credentials" → "OAuth 2.0 Client IDs"
3. Tipo de aplicação: **Web application**
4. Nome: "SALA Web App"
5. **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google`

### 3. Configurar Variáveis de Ambiente

No arquivo `web/.env`:

```env
# NextAuth.js
NEXTAUTH_SECRET="sala-super-secret-jwt-key-2025-development-only"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="seu-client-id-aqui"
GOOGLE_CLIENT_SECRET="seu-client-secret-aqui"
```

### 4. Executar Aplicação Web

```bash
cd web
npm run dev
```

Acesse: http://localhost:3000/auth/login

---

## 📱 Mobile Application (React Native/Expo)

### 1. Configuração no Google Cloud Console

1. No mesmo projeto do Google Cloud Console
2. Crie **novas credenciais** OAuth 2.0:
   - Tipo: **Android** (para Android)
   - Tipo: **iOS** (para iOS)
3. Para Android:
   - Package name: `com.yourcompany.sala`
   - SHA-1 certificate fingerprint (para desenvolvimento): usar o debug keystore
4. Para iOS:
   - Bundle ID: `com.yourcompany.sala`

### 2. Configurar app.json

No arquivo `SALA-mobile/app.json`:

```json
{
  "expo": {
    "extra": {
      "googleClientId": "seu-mobile-client-id.apps.googleusercontent.com"
    },
    "scheme": "sala",
    "android": {
      "package": "com.yourcompany.sala"
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.sala"
    }
  }
}
```

### 3. Executar Aplicação Mobile

```bash
cd SALA-mobile
npm start
```

### 4. Obter SHA-1 para Android (Desenvolvimento)

```bash
# Windows
keytool -list -v -keystore %USERPROFILE%\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android

# macOS/Linux
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

---

## 🔒 Funcionalidades Implementadas

### Web

- ✅ Login com Google OAuth2
- ✅ Redirecionamento automático após login
- ✅ Proteção de rotas
- ✅ Logout funcional

### Mobile

- ✅ Login com Google OAuth2
- ✅ Persistência de sessão
- ✅ Logout funcional
- ✅ Integração com perfil do usuário

## 🚀 Como Testar

### Sem Credenciais (Modo Demo)

- As aplicações mostrarão instruções para configurar OAuth
- Logs detalhados no console para ajudar na configuração

### Com Credenciais Configuradas

1. Configure as credenciais nos arquivos apropriados
2. Reinicie as aplicações
3. Teste o fluxo de login completo

---

## 📁 Estrutura dos Arquivos

### Web

```
web/
├── src/
│   ├── lib/
│   │   ├── auth.ts                 # Configuração NextAuth
│   │   └── providers/
│   │       └── NextAuthProvider.tsx # Provider de autenticação
│   ├── app/
│   │   ├── api/auth/[...nextauth]/route.ts # API NextAuth
│   │   └── auth/login/page.tsx     # Página de login
│   └── types/next-auth.d.ts        # Tipos TypeScript
└── .env                           # Variáveis de ambiente
```

### Mobile

```
SALA-mobile/
├── services/
│   └── AuthService.ts             # Serviço de autenticação
├── src/
│   ├── context/
│   │   └── AuthContext.tsx        # Context de autenticação
│   └── screens/
│       └── ProfileScreen.tsx      # Tela de perfil com logout
├── screens/
│   └── LoginScreen.tsx            # Tela de login
└── app.json                       # Configurações Expo
```

## 🐛 Solução de Problemas

### Web

- **Erro "Invalid redirect URI"**: Verifique se a URL no Google Console está exata
- **Erro de autenticação**: Verifique as credenciais no `.env`

### Mobile

- **Erro "Invalid client"**: Verifique se o Client ID está correto no `app.json`
- **Problemas com redirect**: Verifique se o scheme está configurado corretamente

## 📞 Suporte

Para dúvidas sobre a implementação OAuth2, consulte:

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Expo AuthSession Documentation](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
