# SALA - Sistema de Gerenciamento de Salas

## 📋 Visão Geral do Projeto

O **SALA** (Sistema de Gerenciamento de Salas) é uma plataforma web moderna desenvolvida para gerenciar salas, laboratórios e espaços em instituições de ensino. O sistema permite que equipes de coordenação acompanhem o uso das salas, gerenciem itens e equipamentos, e controlem reservas de forma eficiente e transparente.

### 🎯 Objetivos

- **Modernizar** o gerenciamento de salas e laboratórios
- **Eliminar** conflitos de horários e reservas duplicadas
- **Otimizar** o uso dos espaços disponíveis
- **Facilitar** o controle de equipamentos e itens
- **Melhorar** a experiência dos usuários com interface intuitiva

## 🚀 Tecnologias Utilizadas

### Frontend & Backend (Aplicação Web)

- **Framework:** Next.js 14.2.15
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS
- **Componentes:** Componentes customizados
- **Ícones:** Lucide React
- **Estado Global:** React Context + Hooks

### Banco de Dados & ORM

- **Banco de Dados:** PostgreSQL 15
- **ORM:** Prisma 6.16.1
- **Containerização:** Docker & Docker Compose

### Infraestrutura

- **Containerização:** Docker
- **Orquestração:** Docker Compose
- **Ambiente:** Node.js 18 Alpine

## 🏗️ Arquitetura do Sistema

```
SALA/
├── web/                          # Aplicação Next.js
│   ├── src/
│   │   ├── app/                  # App Router (Next.js 13+)
│   │   │   ├── api/             # API Routes
│   │   │   ├── dashboard/        # Dashboard principal
│   │   │   ├── itens/           # Gerenciamento de itens
│   │   │   ├── configuracoes/   # Configurações do sistema
│   │   │   └── salas/           # Páginas de salas individuais
│   │   ├── components/          # Componentes reutilizáveis
│   │   │   ├── ui/              # Componentes de interface
│   │   │   ├── forms/           # Formulários
│   │   │   └── layout/          # Componentes de layout
│   │   ├── lib/                 # Utilitários e configurações
│   │   │   ├── hooks/           # Hooks customizados
│   │   │   ├── types/           # Definições TypeScript
│   │   │   └── utils/           # Funções utilitárias
│   │   └── prisma/              # Schema e migrações
│   ├── scripts/                 # Scripts de seed e utilitários
│   ├── docker-compose.yml       # Configuração Docker
│   └── Dockerfile              # Imagem Docker
└── SALA-mobile/                 # Aplicação mobile (futura)
```

## ✨ Funcionalidades Implementadas

### 🏠 Dashboard Principal

- **Visão Geral:** Estatísticas em tempo real das salas
- **Filtros Avançados:** Busca por nome, status e tipo
- **Modos de Visualização:** Grid e lista
- **Gestão de Salas:** Criação, edição e exclusão
- **Notificações:** Sistema de toast para feedback

### 🏢 Gerenciamento de Salas

- **CRUD Completo:** Criar, visualizar, editar e excluir salas
- **Status Dinâmico:** Disponível, Ocupada, Reservada, Manutenção
- **Capacidade:** Controle de lotação máxima
- **Itens Associados:** Gerenciamento de equipamentos por sala
- **Descrições Detalhadas:** Informações completas sobre cada espaço

### 📦 Gerenciamento de Itens

- **Inventário Completo:** Controle de todos os equipamentos
- **Especificações Técnicas:** Detalhes de cada item
- **Quantidade:** Controle de estoque por item
- **Associação com Salas:** Itens vinculados às salas específicas
- **Busca Inteligente:** Filtros por nome e descrição

### ⚙️ Configurações do Sistema

- **Perfil do Usuário:** Gestão de informações pessoais
- **Notificações:** Configuração de alertas
- **Segurança:** Controle de acesso e permissões
- **Banco de Dados:** Backup e manutenção
- **Aparência:** Personalização da interface

### 🔄 Sistema de Reservas (Em Desenvolvimento)

- **Calendário Integrado:** Visualização de reservas
- **Aprovação de Solicitações:** Workflow de aprovação
- **Conflitos de Horário:** Detecção automática
- **Notificações:** Alertas de reservas e mudanças

## 🗄️ Modelo de Dados

### Entidades Principais

#### 👤 Usuário (User)

```typescript
{
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

#### 🏢 Sala (Room)

```typescript
{
  id: string
  name: string
  description: string
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE'
  capacity: number
  createdAt: DateTime
  updatedAt: DateTime
  items: Item[]
  reservations: Reservation[]
}
```

#### 📦 Item (Item)

```typescript
{
  id: string;
  name: string;
  description: string;
  quantity: number;
  specifications: string;
  roomId: string;
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

#### 📅 Reserva (Reservation)

```typescript
{
  id: string;
  startTime: DateTime;
  endTime: DateTime;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  userId: string;
  roomId: string;
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

## 🚀 Como Executar o Projeto

### Pré-requisitos

- Docker e Docker Compose instalados
- Node.js 18+ (para desenvolvimento local)
- Git

### 1. Clone o Repositório

```bash
git clone <url-do-repositorio>
cd SALA
```

### 2. Configuração do Ambiente

```bash
cd web
cp env.example .env.local
```

### 3. Executar com Docker (Recomendado)

```bash
# Na pasta web/
docker-compose up --build
```

O sistema estará disponível em:

- **Aplicação Web:** http://localhost:3000
- **Banco de Dados:** localhost:5432

### 4. Executar Localmente (Desenvolvimento)

```bash
# Instalar dependências
npm install

# Gerar Prisma Client
npm run db:generate

# Aplicar migrações
npm run db:push

# Popular banco com dados de exemplo
npm run db:seed

# Executar aplicação
npm run dev
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Gera build de produção
npm run start        # Inicia servidor de produção
npm run lint         # Executa linter

# Banco de Dados
npm run db:generate  # Gera Prisma Client
npm run db:push      # Aplica schema ao banco
npm run db:migrate   # Executa migrações
npm run db:seed      # Popula banco com dados de exemplo
npm run db:studio    # Abre Prisma Studio
```

## 📊 Dados de Exemplo

O sistema inclui dados de demonstração:

### 👥 Usuários

- **Admin:** admin@sala.com (Administrador)
- **Usuário:** user@sala.com (Usuário comum)

### 🏢 Salas

- Laboratório de Informática A
- Laboratório de Informática B
- Sala de Reuniões
- Auditório Principal

### 📦 Itens

- Computadores desktop
- Notebooks
- Projetores
- Quadros interativos
- Mesas e cadeiras

## 🎨 Interface e UX

### Design System

- **Tema:** Dark mode por padrão
- **Cores:** Paleta de cinzas com acentos em amarelo
- **Tipografia:** Inter (texto) + JetBrains Mono (código)
- **Componentes:** Design system consistente e reutilizável

### Experiência do Usuário

- **Navegação Intuitiva:** Menu lateral com navegação clara
- **Feedback Visual:** Notificações toast para ações
- **Estados de Loading:** Indicadores visuais durante carregamento
- **Estados Vazios:** Mensagens amigáveis quando não há dados
- **Responsividade:** Interface adaptável para diferentes telas

## 🔒 Segurança

### Autenticação

- Sistema de login com validação
- Controle de sessão
- Proteção de rotas

### Autorização

- Roles de usuário (ADMIN/USER)
- Controle de acesso baseado em permissões
- Validação de dados no backend

## 📈 Performance

### Otimizações Implementadas

- **Lazy Loading:** Carregamento sob demanda
- **Memoização:** Componentes otimizados com React.memo
- **Debounce:** Busca otimizada com delay
- **Paginação:** Carregamento de dados em lotes

### Monitoramento

- Logs estruturados
- Métricas de performance
- Tratamento de erros

## 🧪 Testes

### Estratégia de Testes

- **Testes Unitários:** Componentes e funções
- **Testes de Integração:** APIs e fluxos
- **Testes E2E:** Cenários completos

### Executar Testes

```bash
npm run test        # Testes unitários
npm run test:e2e    # Testes end-to-end
npm run test:coverage # Cobertura de testes
```

## 🚀 Deploy

### Produção

- **Plataforma:** Vercel (recomendado)
- **Banco:** PostgreSQL gerenciado
- **CDN:** Otimização de assets
- **Monitoramento:** Logs e métricas

### Configuração de Produção

```bash
# Variáveis de ambiente
DATABASE_URL=postgresql://user:password@host:port/database
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.com
```

## 🤝 Contribuição

### Como Contribuir

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

### Padrões de Código

- **TypeScript:** Tipagem estrita
- **ESLint:** Linting automático
- **Prettier:** Formatação de código
- **Conventional Commits:** Padrão de commits

## 📝 Roadmap

### Próximas Funcionalidades

- [ ] Sistema de reservas completo
- [ ] Calendário integrado
- [ ] Relatórios avançados
- [ ] Notificações push
- [ ] API mobile
- [ ] Integração com calendários externos

### Melhorias Planejadas

- [ ] PWA (Progressive Web App)
- [ ] Modo offline
- [ ] Sincronização em tempo real
- [ ] Analytics avançados
- [ ] Backup automático

## 📞 Suporte

### Documentação

- **API Docs:** `/api/docs` (em desenvolvimento)
- **Component Library:** Storybook (planejado)
- **Guia de Contribuição:** CONTRIBUTING.md

### Contato

- **Issues:** Use o sistema de issues do GitHub
- **Discussões:** GitHub Discussions
- **Email:** suporte@sala.com

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

**SALA** - Sistema de Gerenciamento de Salas  
_Desenvolvido com ❤️ para modernizar a gestão de espaços educacionais_
