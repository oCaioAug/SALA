# 🔧 Guia de Troubleshooting - OAuth Google Mobile

## ✅ Configurações Aplicadas:

### 1. **App.json atualizado**

- ✅ Google Client ID configurado: `199539496823-nbechbht00i7cv6gc99df5f6p0coq6vp.apps.googleusercontent.com`
- ✅ Scheme configurado: `sala`
- ✅ Plugin `expo-auth-session` adicionado

### 2. **AuthService criado/atualizado**

- ✅ Configuração correta do CLIENT_ID
- ✅ Redirect URI usando scheme `sala`
- ✅ Fluxo OAuth 2.0 com PKCE
- ✅ Logs detalhados para debug

## 🧪 Como testar:

### 1. **Instalar dependências**

```bash
cd SALA-mobile
npm install
```

### 2. **Verificar configuração**

Execute o app e veja o console para logs como:

```
🔧 AuthService Config:
CLIENT_ID: 199539496823-nbechbht00i7cv6gc99df5f6p0coq6vp.apps.googleusercontent.com
REDIRECT_URI: sala://
```

### 3. **Testar login**

1. Pressione o botão "Entrar com Google"
2. Verifique os logs no console:
   - `🚀 Iniciando fluxo OAuth Google...`
   - `📝 Request criado:`
   - `📱 Resultado da autenticação:`

## 🚨 Possíveis problemas:

### Problema 1: Client ID não reconhecido

**Sintoma**: Erro "Invalid client ID"
**Solução**:

1. Verifique se o Client ID no Google Console está correto
2. Certifique-se que é para "Android/iOS application", não "Web application"

### Problema 2: Redirect URI inválido

**Sintoma**: Erro "redirect_uri_mismatch"
**Solução**:

1. No Google Console, adicione a URI: `sala://`
2. Para desenvolvimento, também adicione: `exp://192.168.x.x:19000`

### Problema 3: App não abre após autenticação

**Sintoma**: Fica na tela do Google e não volta pro app
**Solução**:

1. Verifique se o scheme `sala` está configurado
2. Teste em dispositivo físico em vez do emulador

## 🔍 Debug detalhado:

### 1. **Logs importantes**:

- `🔧 AuthService Config:` - Mostra configuração
- `🚀 Iniciando fluxo OAuth Google...` - Início do processo
- `📱 Resultado da autenticação:` - Resultado do fluxo
- `✅ Autenticação bem-sucedida!` - Sucesso
- `👤 Usuário autenticado:` - Dados do usuário

### 2. **Verificar no Google Console**:

1. Acesse: https://console.cloud.google.com
2. Vá em "Credentials" > "OAuth 2.0 Client IDs"
3. Clique no seu Client ID
4. Verifique:
   - Application type: Android/iOS
   - Package name/Bundle ID: deve bater com o app
   - Authorized redirect URIs: inclua `sala://`

## 📱 Teste no dispositivo físico:

O OAuth funciona melhor em dispositivo físico. Para testar:

```bash
cd SALA-mobile
npm start
# Escaneie o QR code com Expo Go
```

## 🆘 Se ainda não funcionar:

1. **Verifique os logs** no console do Metro/Expo
2. **Teste com tela de debug**: Abra `DebugScreen.tsx` criada
3. **Verifique credenciais**: Confirme Client ID no Google Console
4. **Teste redirect**: Verifique se `sala://` está nas URIs autorizadas

## 🎯 Configuração Google Console:

### Redirect URIs para adicionar:

- `sala://` (produção)
- `exp://localhost:19000` (desenvolvimento local)
- `exp://192.168.x.x:19000` (desenvolvimento rede)

### Scopes necessários:

- `openid`
- `profile`
- `email`
