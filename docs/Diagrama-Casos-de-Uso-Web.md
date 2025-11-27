# Diagrama de Casos de Uso - Sistema SALA Web

```mermaid
graph TB
    %% Atores (topo)
    User[👤 Usuário]
    Admin[👨‍💼 Administrador]

    %% Casos de Uso - Autenticação (esquerda)
    UC1[Autenticar]
    UC2[Gerenciar Perfil]

    %% Casos de Uso - Reservas (centro-esquerda)
    UC3[Criar Reserva]
    UC4[Visualizar Reservas]
    UC5[Aprovar/Rejeitar Reserva]

    %% Casos de Uso - Salas (centro)
    UC6[Gerenciar Salas]

    %% Casos de Uso - Incidentes (centro-direita)
    UC7[Reportar Incidente]
    UC8[Gerenciar Incidentes]

    %% Casos de Uso - Notificações e Outros (direita)
    UC9[Visualizar Notificações]
    UC10[Gerenciar Usuários]
    UC11[Visualizar Dashboard]

    %% Layout: Atores no topo
    User ~~~ Admin

    %% Relacionamentos - Usuário
    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC6
    User --> UC7
    User --> UC9
    User --> UC11

    %% Relacionamentos - Administrador
    Admin --> UC1
    Admin --> UC2
    Admin --> UC4
    Admin --> UC5
    Admin --> UC6
    Admin --> UC8
    Admin --> UC9
    Admin --> UC10
    Admin --> UC11

    %% Agrupamento visual (usando links invisíveis)
    UC1 -.-> UC2
    UC3 -.-> UC4
    UC4 -.-> UC5
    UC7 -.-> UC8

    %% Estilos
    classDef userClass fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef adminClass fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef ucClass fill:#e8f5e9,stroke:#1b5e20,stroke-width:1px

    class User userClass
    class Admin adminClass
    class UC1,UC2,UC3,UC4,UC5,UC6,UC7,UC8,UC9,UC10,UC11 ucClass
```

## Descrição dos Casos de Uso

### 🔐 Autenticação

- **UC1 - Autenticar**: Login/Logout com Google OAuth

### 👤 Perfil

- **UC2 - Gerenciar Perfil**: Visualizar e editar informações do perfil

### 📅 Reservas

- **UC3 - Criar Reserva**: Criar solicitação de reserva (simples ou recorrente)
- **UC4 - Visualizar Reservas**: Listar e visualizar reservas
- **UC5 - Aprovar/Rejeitar Reserva**: Administrador aprova ou rejeita solicitações

### 🏢 Salas

- **UC6 - Gerenciar Salas**: Visualizar salas e gerenciar itens (Admin)

### ⚠️ Incidentes

- **UC7 - Reportar Incidente**: Usuário reporta um problema
- **UC8 - Gerenciar Incidentes**: Administrador atribui, atualiza e resolve incidentes

### 🔔 Notificações

- **UC9 - Visualizar Notificações**: Ver e gerenciar notificações recebidas

### 👥 Usuários (Admin)

- **UC10 - Gerenciar Usuários**: Administrador visualiza e altera roles dos usuários

### 📊 Dashboard

- **UC11 - Visualizar Dashboard**: Ver resumo e estatísticas do sistema
