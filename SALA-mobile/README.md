# SALA Mobile App

Aplicativo móvel para o Sistema de Agendamento de Laboratórios e Ambientes (S.A.L.A.)

## 📱 Sobre o Aplicativo

O SALA Mobile é um aplicativo React Native desenvolvido com Expo que permite aos usuários:

- **Visualizar salas disponíveis** com informações detalhadas
- **Fazer reservas** de salas e laboratórios
- **Gerenciar reservas** (visualizar, cancelar)
- **Ver equipamentos** disponíveis em cada sala
- **Filtrar e buscar** salas por status e nome

## 🚀 Tecnologias Utilizadas

- **React Native** - Framework para desenvolvimento mobile
- **Expo** - Plataforma de desenvolvimento e deploy
- **TypeScript** - Tipagem estática
- **React Navigation** - Navegação entre telas
- **Axios** - Cliente HTTP para consumir APIs
- **date-fns** - Manipulação de datas
- **React Native Elements** - Componentes UI

## 🏗️ Arquitetura

```
src/
├── components/          # Componentes reutilizáveis
│   ├── StatusBadge.tsx
│   ├── RoomCard.tsx
│   ├── ReservationCard.tsx
│   ├── LoadingSpinner.tsx
│   └── EmptyState.tsx
├── navigation/          # Configuração de navegação
│   └── TabNavigator.tsx
├── screens/            # Telas do aplicativo
│   ├── RoomListScreen.tsx
│   ├── RoomDetailsScreen.tsx
│   ├── CreateReservationScreen.tsx
│   ├── MyReservationsScreen.tsx
│   └── ProfileScreen.tsx
├── services/           # Serviços e APIs
│   └── api.ts
├── types/             # Definições de tipos TypeScript
│   └── index.ts
└── utils/             # Utilitários e helpers
    ├── index.ts
    └── config.ts
```

## 🎨 Funcionalidades

### 📋 Lista de Salas

- Visualização de todas as salas disponíveis
- Filtros por status (Livre, Em Uso, Reservado)
- Busca por nome ou descrição
- Pull-to-refresh para atualizar dados

### 🏢 Detalhes da Sala

- Informações completas da sala
- Lista de equipamentos disponíveis
- Reservas ativas da sala
- Botão para criar nova reserva

### ➕ Criar Reserva

- Seleção de data e horário
- Validação de disponibilidade
- Campo opcional para finalidade
- Verificação de conflitos

### 📅 Minhas Reservas

- Lista de todas as reservas do usuário
- Filtros por status (Ativas, Canceladas, Concluídas)
- Opção de cancelar reservas ativas
- Estatísticas de uso

### 👤 Perfil do Usuário

- Informações pessoais
- Estatísticas de reservas
- Configurações da conta
- Informações do aplicativo

## 🔧 Configuração

### Configuração da API

Edite o arquivo `src/utils/config.ts` para configurar a URL da API:

```typescript
export const API_CONFIG = {
  BASE_URL: "http://seu-servidor.com/api", // URL do backend
  TIMEOUT: 10000,
};
```

### Configuração do Mock User

Para desenvolvimento, existe um usuário mock configurado:

```typescript
export const MOCK_USER = {
  id: "user-mock-id",
  name: "João Silva",
  email: "joao.silva@email.com",
  role: "USER" as const,
};
```

## 📦 Instalação e Execução

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Expo CLI

### Instalação

```bash
# Instalar dependências
npm install

# Iniciar o servidor de desenvolvimento
npm start

# Para executar em dispositivo específico
npm run android  # Android
npm run ios      # iOS
npm run web      # Web
```

### Limpar cache

```bash
npm run clear
```

## 🎯 Status das Funcionalidades

### ✅ Implementado

- [x] Navegação entre telas
- [x] Lista de salas com filtros
- [x] Detalhes das salas
- [x] Criação de reservas
- [x] Lista de reservas do usuário
- [x] Perfil do usuário
- [x] Componentes UI reutilizáveis
- [x] Integração com API

### 🚧 Em Desenvolvimento

- [ ] Autenticação de usuários
- [ ] Push notifications
- [ ] Modo offline
- [ ] Edição de perfil
- [ ] Configurações avançadas

## 🔗 APIs Consumidas

O aplicativo consome as seguintes APIs do backend:

- `GET /api/rooms` - Lista de salas
- `GET /api/rooms/:id` - Detalhes da sala
- `GET /api/rooms/:id/items` - Itens da sala
- `GET /api/reservations` - Lista de reservas
- `POST /api/reservations` - Criar reserva
- `DELETE /api/reservations/:id` - Cancelar reserva

## 🎨 Design System

### Cores Principais

- **Primary**: `#3B82F6` (Blue)
- **Success**: `#10B981` (Green)
- **Warning**: `#F59E0B` (Orange)
- **Error**: `#EF4444` (Red)
- **Gray Scale**: `#F9FAFB` to `#111827`

### Tipografia

- **Title**: 24px, Bold
- **Heading**: 18px, SemiBold
- **Body**: 16px, Regular
- **Caption**: 14px, Medium
- **Small**: 12px, Regular

## 📱 Compatibilidade

- **iOS**: 12.0+
- **Android**: API 21+ (Android 5.0)
- **Web**: Navegadores modernos

## 🤝 Contribuição

Para contribuir com o projeto:

1. Faça um fork do repositório
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.
