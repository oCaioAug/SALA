# S.A.L.A - Sistema de Gerenciamento de Salas

Sistema completo para gerenciamento de salas em universidades, permitindo controle de reservas, inventário de equipamentos e status das salas.

## 🚀 Funcionalidades

### ✅ Implementadas
- **Tela de Login** - Autenticação de usuários
- **Dashboard Principal** - Visão geral de todas as salas
- **Gerenciamento de Salas** - Criar, visualizar e gerenciar salas
- **Gerenciamento de Itens** - Controle de equipamentos por sala
- **Status das Salas** - Livre, Em Uso, Reservado
- **Sistema de Busca** - Buscar por salas ou itens
- **Interface Responsiva** - Design moderno e intuitivo

### 🔧 Tecnologias Utilizadas
- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Docker** - Containerização
- **React Hooks** - Gerenciamento de estado

## 🐳 Como Executar com Docker

### Pré-requisitos
- Docker instalado
- Docker Compose instalado

### Comandos

```bash
# Construir e executar o projeto
docker-compose up --build

# Executar em background
docker-compose up -d --build

# Parar o projeto
docker-compose down

# Ver logs
docker-compose logs -f
```

### Acesso
- **Aplicação**: http://localhost:3000
- **Login**: Qualquer email/senha (modo demo)

## 📱 Telas do Sistema

### 1. Tela de Login
- Formulário de autenticação
- Design moderno com tema escuro
- Validação de campos

### 2. Dashboard Principal
- Visão geral de todas as salas
- Status em tempo real (Livre/Em Uso/Reservado)
- Busca por salas ou itens
- Botão para criar novas salas

### 3. Gerenciamento de Itens
- Lista detalhada de equipamentos por sala
- Especificações técnicas dos itens
- Ações de editar e excluir
- Adicionar novos tipos de itens

## 🎨 Design System

### Cores
- **Fundo Principal**: Gray-900
- **Cards**: Gray-800
- **Texto Principal**: White
- **Texto Secundário**: Gray-300
- **Acentos**: Blue-600, Yellow-500, Red-500, Green-500

### Componentes
- **Button** - Botões com variantes
- **Input** - Campos de entrada
- **Card** - Containers de conteúdo
- **Modal** - Janelas modais
- **StatusBadge** - Indicadores de status

## 📁 Estrutura do Projeto

```
src/
├── app/                    # Páginas Next.js
│   ├── auth/login/        # Tela de login
│   ├── dashboard/         # Dashboard principal
│   └── salas/[id]/itens/  # Gerenciamento de itens
├── components/            # Componentes reutilizáveis
│   ├── ui/               # Componentes base
│   ├── layout/           # Layouts
│   └── forms/            # Formulários
├── lib/                  # Utilitários e tipos
│   ├── types/           # Definições TypeScript
│   ├── hooks/           # Hooks customizados
│   └── utils/           # Funções utilitárias
```

## 🔄 Funcionalidades Futuras

- [ ] Sistema de autenticação real
- [ ] Banco de dados persistente
- [ ] Sistema de notificações
- [ ] Relatórios e estatísticas
- [ ] API REST completa
- [ ] Sistema de permissões
- [ ] Calendário de reservas
- [ ] Integração com sistemas externos

## 🛠️ Desenvolvimento

### Estrutura de Componentes
Todos os componentes seguem o padrão:
- Props tipadas com TypeScript
- Reutilizáveis e modulares
- Estilização com Tailwind CSS
- Documentação inline

### Gerenciamento de Estado
- Hooks customizados para lógica de negócio
- Estado local para componentes simples
- Context API para estado global (futuro)

## 📝 Licença

Este projeto foi desenvolvido para fins educacionais e de demonstração.

---

**Desenvolvido com ❤️ usando Next.js, TypeScript e Tailwind CSS**