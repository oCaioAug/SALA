# Requisitos do Sistema SALA Web

## 1. Requisitos Funcionais

### 1.1 Autenticação e Autorização

#### RF01 - Autenticação via Google OAuth

- **Descrição**: O sistema deve permitir que usuários façam login usando suas contas Google.
- **Prioridade**: Alta
- **Casos de Uso Relacionados**: CDU1 (Autenticar)
- **Critérios de Aceitação**:
  - Usuário pode fazer login com conta Google
  - Sistema cria automaticamente conta se não existir
  - Sessão é mantida entre requisições
  - Logout encerra a sessão corretamente

#### RF02 - Controle de Acesso Baseado em Roles

- **Descrição**: O sistema deve diferenciar permissões entre usuários ADMIN e USER.
- **Prioridade**: Alta
- **Casos de Uso Relacionados**: CDU1, CDU5, CDU6, CDU8, CDU10
- **Critérios de Aceitação**:
  - Apenas ADMIN pode aprovar/rejeitar reservas
  - Apenas ADMIN pode gerenciar salas e itens
  - Apenas ADMIN pode gerenciar usuários
  - Apenas ADMIN pode atribuir e resolver incidentes

#### RF03 - Geração de Token para Mobile

- **Descrição**: O sistema deve gerar tokens de autenticação para aplicativo mobile.
- **Prioridade**: Média
- **Casos de Uso Relacionados**: CDU1
- **Critérios de Aceitação**:
  - API deve gerar token JWT para autenticação mobile
  - Token deve expirar após período determinado
  - Token deve ser validado em requisições subsequentes

### 1.2 Gestão de Perfil

- **Descrição**: Usuário deve poder visualizar suas informações de perfil.
- **Prioridade**: Média
- **Casos de Uso Relacionados**: CDU2 (Gerenciar Perfil)
- **Critérios de Aceitação**:
  - Exibir nome, email e foto do perfil
  - Exibir role do usuário
  - Exibir data de criação da conta

#### RF05 - Edição de Perfil

- **Descrição**: Usuário deve poder editar suas informações de perfil.
- **Prioridade**: Média
- **Casos de Uso Relacionados**: CDU2 (Gerenciar Perfil)
- **Critérios de Aceitação**:
  - Permitir alteração do nome
  - Permitir upload de foto de perfil
  - Validação de dados de entrada
  - Persistência das alterações

### 1.3 Gestão de Reservas

#### RF06 - Criação de Reserva

- **Descrição**: Usuário deve poder criar solicitação de reserva de sala.
- **Prioridade**: Alta
- **Casos de Uso Relacionados**: CDU3 (Criar Reserva)
- **Critérios de Aceitação**:
  - Seleção de sala disponível
  - Definição de data e horário de início e fim
  - Opção de adicionar propósito/descrição
  - Validação de conflitos de horário
  - Definição do status inicial conforme role (APPROVED para ADMIN, PENDING para USER)

#### RF07 - Reservas Recorrentes

- **Descrição**: Sistema deve suportar criação de reservas recorrentes (diárias, semanais, mensais).
- **Prioridade**: Média
- **Casos de Uso Relacionados**: CDU3 (Criar Reserva)
- **Critérios de Aceitação**:
  - Seleção de padrão de recorrência (DAILY, WEEKLY, MONTHLY)
  - Para WEEKLY: seleção de dias da semana
  - Definição de data de término da recorrência
  - Geração automática de instâncias futuras
  - Todas as instâncias vinculadas ao template pai

#### RF08 - Visualização de Reservas

- **Descrição**: Usuário deve poder visualizar suas reservas e administrador todas as reservas.
- **Prioridade**: Alta
- **Casos de Uso Relacionados**: CDU4 (Visualizar / Cancelar Reservas)
- **Critérios de Aceitação**:
  - Listagem de reservas com filtros (status, data, sala)
  - Visualização de detalhes da reserva
  - Diferenciação visual por status
  - Informações de sala e usuário associados

#### RF09 - Aprovação/Rejeição de Reservas

- **Descrição**: Administrador deve poder aprovar ou rejeitar solicitações de reserva.
- **Prioridade**: Alta
- **Casos de Uso Relacionados**: CDU5 (Aprovar / Rejeitar Reserva)
- **Critérios de Aceitação**:
  - Apenas ADMIN pode aprovar/rejeitar
  - Notificação automática ao usuário sobre decisão
  - Atualização de status da reserva
  - Para reservas recorrentes: aprovar/rejeitar todas as instâncias

#### RF10 - Verificação de Conflitos

- **Descrição**: Sistema deve verificar automaticamente conflitos de horário ao criar reservas.
- **Prioridade**: Alta
- **Casos de Uso Relacionados**: CDU3 (Criar Reserva)
- **Critérios de Aceitação**:
  - Verificar sobreposição de horários
  - Impedir criação de reservas conflitantes
  - Retornar mensagem de erro clara em caso de conflito
  - Considerar reservas ativas, aprovadas e pendentes na verificação

#### RF11 - Cancelamento de Reservas

- **Descrição**: Usuário deve poder cancelar suas próprias reservas.
- **Prioridade**: Média
- **Casos de Uso Relacionados**: CDU4 (Visualizar / Cancelar Reservas)
- **Critérios de Aceitação**:
  - Usuário pode cancelar apenas suas reservas
  - Status alterado para CANCELLED
  - Notificação ao administrador (opcional)
  - Para reservas recorrentes: opção de cancelar todas ou apenas uma instância

### 1.4 Gestão de Salas

#### RF12 - Visualização de Salas

- **Descrição**: Usuários devem poder visualizar lista de salas disponíveis.
- **Prioridade**: Alta
- **Casos de Uso Relacionados**: CDU6 (Gerenciar Salas e Itens)
- **Critérios de Aceitação**:
  - Listagem de todas as salas
  - Informações: nome, descrição, capacidade, status
  - Filtros por status e capacidade
  - Visualização de itens disponíveis em cada sala

#### RF13 - Gestão de Salas (Admin)

- **Descrição**: Administrador deve poder criar, editar e gerenciar salas.
- **Prioridade**: Alta
- **Casos de Uso Relacionados**: CDU6 (Gerenciar Salas e Itens)
- **Critérios de Aceitação**:
  - Criar nova sala com nome, descrição e capacidade
  - Editar informações da sala
  - Alterar status da sala (LIVRE, EM_USO, RESERVADO)
  - Excluir sala (com validação de reservas existentes)

#### RF14 - Gestão de Itens

- **Descrição**: Administrador deve poder gerenciar itens/equipamentos das salas.
- **Prioridade**: Média
- **Casos de Uso Relacionados**: CDU6 (Gerenciar Salas e Itens)
- **Critérios de Aceitação**:
  - Adicionar itens a uma sala
  - Editar informações do item (nome, descrição, quantidade)
  - Remover itens
  - Upload de imagens dos itens
  - Visualização de imagens dos itens

### 1.5 Gestão de Incidentes

#### RF15 - Reportar Incidente

- **Descrição**: Usuário deve poder reportar incidentes relacionados a salas ou itens.
- **Prioridade**: Alta
- **Casos de Uso Relacionados**: CDU7 (Reportar Incidente)
- **Critérios de Aceitação**:
  - Seleção de sala ou item relacionado
  - Definição de título e descrição
  - Seleção de categoria e prioridade
  - Status inicial: REPORTED
  - Notificação automática aos administradores

#### RF16 - Gestão de Incidentes (Admin)

- **Descrição**: Administrador deve poder gerenciar o ciclo de vida dos incidentes.
- **Prioridade**: Alta
- **Casos de Uso Relacionados**: CDU8 (Gerenciar Incidentes)
- **Critérios de Aceitação**:
  - Visualizar lista de incidentes com filtros
  - Atribuir incidente a um usuário
  - Atualizar status (IN_ANALYSIS, IN_PROGRESS, RESOLVED)
  - Adicionar notas de resolução
  - Definir tempo estimado de resolução
  - Registrar tempo real de resolução

#### RF17 - Histórico de Incidentes

- **Descrição**: Sistema deve manter histórico de mudanças de status dos incidentes.
- **Prioridade**: Baixa
- **Casos de Uso Relacionados**: CDU8 (Gerenciar Incidentes)
- **Critérios de Aceitação**:
  - Registrar todas as mudanças de status
  - Armazenar usuário que fez a mudança
  - Armazenar data/hora da mudança
  - Permitir visualização do histórico

### 1.6 Sistema de Notificações

#### RF18 - Visualização de Notificações

- **Descrição**: Usuário deve poder visualizar suas notificações.
- **Prioridade**: Alta
- **Casos de Uso Relacionados**: CDU9 (Visualizar Notificacoes)
- **Critérios de Aceitação**:
  - Listagem de notificações recebidas
  - Diferenciação entre lidas e não lidas
  - Filtros por tipo e status
  - Contador de notificações não lidas

#### RF19 - Marcar Notificações como Lidas

- **Descrição**: Usuário deve poder marcar notificações como lidas.
- **Prioridade**: Média
- **Casos de Uso Relacionados**: CDU9 (Visualizar Notificacoes)
- **Critérios de Aceitação**:
  - Marcar notificação individual como lida
  - Marcar todas as notificações como lidas
  - Atualização em tempo real do contador

#### RF20 - Notificações Automáticas

- **Descrição**: O sistema deve enviar notificações automáticas aos usuários como consequência de eventos de negócio disparados durante a execução dos casos de uso de reservas e incidentes.
- **Prioridade**: Alta
- **Casos de Uso Relacionados**: CDU3, CDU4, CDU5, CDU7, CDU8 (comportamento interno disparado por estes CDUs, visível pelo ator em CDU9)
- **Critérios de Aceitação**:
  - Notificação enviada ao(s) Administrador(es) quando uma reserva é criada por Usuario (CDU3)
  - Notificação enviada ao solicitante quando reserva é aprovada ou rejeitada (CDU5)
  - Notificação enviada ao solicitante quando reserva é cancelada (CDU4)
  - Notificação enviada ao(s) Administrador(es) quando um incidente é reportado (CDU7)
  - Notificação enviada ao responsavel designado quando incidente é atribuído (CDU8)
  - Notificação enviada ao reportante quando status do incidente é alterado (CDU8)
  - Quando o usuario possui PushToken ativo, a notificação também é entregue via push ao aplicativo mobile

#### RF26 - Integração com Google Calendar

- **Descrição**: O sistema deve sincronizar automaticamente os eventos de reserva no Google Calendar pessoal do usuário como consequência das operacões de criação, aprovação, rejeição e cancelamento de reservas.
- **Prioridade**: Média
- **Casos de Uso Relacionados**: CDU3, CDU4, CDU5 (comportamento interno disparado por estes CDUs)
- **Critérios de Aceitação**:
  - Evento criado no Google Calendar quando uma reserva e criada com status `PENDING`, `APPROVED` ou `ACTIVE` (CDU3)
  - Evento atualizado no Google Calendar quando uma reserva e aprovada (CDU5)
  - Evento removido do Google Calendar quando uma reserva e rejeitada (CDU5) ou cancelada (CDU4)
  - ID do evento externo persistido em `Reservation.googleCalendarEventId`
  - Access token OAuth2 renovado automaticamente via refresh token antes do vencimento
  - Falhas na API do Google Calendar nao bloqueiam operacoes de reserva (comportamento best-effort)

### 1.7 Gestão de Usuários (Admin)

#### RF21 - Visualização de Usuários

- **Descrição**: Administrador deve poder visualizar lista de todos os usuários.
- **Prioridade**: Média
- **Casos de Uso Relacionados**: CDU10 (Gerenciar Usuarios)
- **Critérios de Aceitação**:
  - Listagem de todos os usuários cadastrados
  - Filtros por role e busca por nome/email
  - Informações: nome, email, role, data de cadastro

#### RF22 - Alteração de Role

- **Descrição**: Administrador deve poder alterar o role dos usuários.
- **Prioridade**: Média
- **Casos de Uso Relacionados**: CDU10 (Gerenciar Usuarios)
- **Critérios de Aceitação**:
  - Alterar entre ADMIN e USER
  - Validação de permissões
  - Atualização imediata das permissões
  - Log da alteração

### 1.8 Dashboard

#### RF23 - Visualização de Dashboard

- **Descrição**: Sistema deve exibir dashboard com informações resumidas.
- **Prioridade**: Média
- **Casos de Uso Relacionados**: CDU11 (Visualizar Dashboard)
- **Critérios de Aceitação**:
  - Estatísticas de reservas (pendentes, aprovadas, rejeitadas)
  - Estatísticas de incidentes por status
  - Próximas reservas
  - Incidentes pendentes (para admin)
  - Gráficos e visualizações (opcional)

#### RF24 - Estatísticas por Usuário

- **Descrição**: Sistema deve disponibilizar estatísticas de reservas por usuário.
- **Prioridade**: Média
- **Casos de Uso Relacionados**: CDU11 (Visualizar Dashboard)
- **Critérios de Aceitação**:
  - Disponibilizar contagem de reservas por status para um usuário específico
  - Permitir filtragem por período
  - Endpoint dedicado para estatísticas de usuário
  - Integração com componentes de dashboard e relatórios

#### RF25 - Relatórios de Incidentes

- **Descrição**: Sistema deve fornecer visão consolidada de incidentes por categoria, prioridade e status.
- **Prioridade**: Média
- **Casos de Uso Relacionados**: CDU8 (Gerenciar Incidentes), CDU11 (Visualizar Dashboard)
- **Critérios de Aceitação**:
  - Apresentar contagem de incidentes agrupados por status e prioridade
  - Permitir filtros por período, sala e item
  - Expor dados via endpoint de estatísticas de incidentes
  - Integrar os dados ao dashboard administrativo

## 2. Requisitos Não-Funcionais

### 2.1 Performance

#### RNF01 - Tempo de Resposta

- **Descrição**: O sistema deve responder a requisições em tempo adequado.
- **Prioridade**: Alta
- **Especificação**:
  - Páginas devem carregar em menos de 2 segundos
  - APIs devem responder em menos de 500ms
  - Queries de banco de dados otimizadas com índices

#### RNF02 - Escalabilidade

- **Descrição**: O sistema deve suportar crescimento de usuários e dados.
- **Prioridade**: Média
- **Especificação**:
  - Suporte a múltiplos usuários simultâneos
  - Banco de dados PostgreSQL para escalabilidade
  - Arquitetura stateless para horizontal scaling

### 2.2 Segurança

#### RNF03 - Autenticação Segura

- **Descrição**: O sistema deve implementar autenticação segura.
- **Prioridade**: Alta
- **Especificação**:
  - OAuth 2.0 com Google
  - Tokens JWT para API mobile
  - Sessões seguras com NextAuth.js
  - Proteção contra CSRF e XSS

#### RNF04 - Autorização

- **Descrição**: O sistema deve controlar acesso baseado em roles.
- **Prioridade**: Alta
- **Especificação**:
  - Middleware de autorização em todas as rotas protegidas
  - Validação de permissões no backend
  - Proteção de rotas administrativas

#### RNF05 - Proteção de Dados

- **Descrição**: O sistema deve proteger dados sensíveis.
- **Prioridade**: Alta
- **Especificação**:
  - Validação de entrada de dados
  - Sanitização de dados de usuário
  - Headers de segurança HTTP
  - Proteção contra SQL Injection (Prisma ORM)

### 2.3 Usabilidade

#### RNF06 - Interface Responsiva

- **Descrição**: O sistema deve ser acessível em diferentes dispositivos.
- **Prioridade**: Alta
- **Especificação**:
  - Design responsivo (mobile, tablet, desktop)
  - Tailwind CSS para estilização
  - Componentes reutilizáveis

#### RNF07 - Internacionalização

- **Descrição**: O sistema deve suportar múltiplos idiomas.
- **Prioridade**: Média
- **Especificação**:
  - Suporte a português, inglês, espanhol, francês e japonês
  - Next-intl para gerenciamento de traduções
  - Detecção automática de idioma do navegador

#### RNF08 - Feedback Visual

- **Descrição**: O sistema deve fornecer feedback claro ao usuário.
- **Prioridade**: Média
- **Especificação**:
  - Mensagens de sucesso e erro
  - Indicadores de carregamento
  - Validação em tempo real de formulários
  - Notificações toast

### 2.4 Confiabilidade

#### RNF09 - Disponibilidade

- **Descrição**: O sistema deve estar disponível a maior parte do tempo.
- **Prioridade**: Alta
- **Especificação**:
  - Uptime de 99% ou superior
  - Tratamento de erros robusto
  - Fallbacks para falhas de API
  - Health checks

#### RNF10 - Tolerância a Falhas

- **Descrição**: O sistema deve continuar funcionando mesmo com falhas parciais.
- **Prioridade**: Média
- **Especificação**:
  - Tratamento de erros em todas as rotas
  - Logs de erros para debugging
  - Retry automático para operações críticas
  - Cache local para dados não críticos

### 2.5 Manutenibilidade

#### RNF11 - Código Organizado

- **Descrição**: O código deve ser bem organizado e documentado.
- **Prioridade**: Média
- **Especificação**:
  - TypeScript para type safety
  - Estrutura de pastas clara
  - Componentes reutilizáveis
  - Separação de concerns (services, repositories, components)

#### RNF12 - Testabilidade

- **Descrição**: O código deve ser testável.
- **Prioridade**: Baixa
- **Especificação**:
  - Funções puras quando possível
  - Separação de lógica de negócio
  - Mocks para dependências externas

### 2.6 Compatibilidade

#### RNF13 - Compatibilidade com Navegadores

- **Descrição**: O sistema deve funcionar nos principais navegadores.
- **Prioridade**: Alta
- **Especificação**:
  - Chrome, Firefox, Safari, Edge (últimas 2 versões)
  - Fallbacks para funcionalidades não suportadas
  - Polyfills quando necessário

#### RNF14 - Integração Mobile

- **Descrição**: O sistema deve integrar com aplicativo mobile.
- **Prioridade**: Alta
- **Especificação**:
  - API RESTful para comunicação
  - Autenticação via token JWT
  - Suporte a push notifications
  - Endpoints específicos para mobile

### 2.7 Portabilidade

#### RNF15 - Deploy em Múltiplos Ambientes

- **Descrição**: O sistema deve ser facilmente deployado em diferentes ambientes.
- **Prioridade**: Média
- **Especificação**:
  - Docker para containerização
  - Variáveis de ambiente para configuração
  - Suporte a Vercel, AWS, ou outros provedores
  - Scripts de build automatizados

### 2.8 Eficiência

#### RNF16 - Otimização de Imagens

- **Descrição**: O sistema deve otimizar upload e exibição de imagens.
- **Prioridade**: Média
- **Especificação**:
  - Integração com Cloudinary
  - Geração de thumbnails
  - Lazy loading de imagens
  - Compressão automática

#### RNF17 - Cache

- **Descrição**: O sistema deve utilizar cache para melhorar performance.
- **Prioridade**: Baixa
- **Especificação**:
  - Cache de dados frequentemente acessados
  - Cache de queries do Prisma
  - Cache de imagens e assets estáticos

## 3. Matriz de Rastreabilidade: Requisitos x Casos de Uso

| Requisito                          | Casos de Uso Relacionados              | Prioridade |
| ---------------------------------- | -------------------------------------- | ---------- |
| RF01 - Autenticação Google OAuth   | CDU1                                   | Alta       |
| RF02 - Controle de Acesso          | CDU1, CDU5, CDU6, CDU8, CDU10         | Alta       |
| RF03 - Token Mobile                | CDU1                                   | Média      |
| RF04 - Visualizar Perfil           | CDU2                                   | Média      |
| RF05 - Editar Perfil               | CDU2                                   | Média      |
| RF06 - Criar Reserva               | CDU3                                   | Alta       |
| RF07 - Reservas Recorrentes        | CDU3                                   | Média      |
| RF08 - Visualizar Reservas         | CDU4                                   | Alta       |
| RF09 - Aprovar/Rejeitar            | CDU5                                   | Alta       |
| RF10 - Verificar Conflitos         | CDU3                                   | Alta       |
| RF11 - Cancelar Reserva            | CDU4                                   | Média      |
| RF12 - Visualizar Salas            | CDU6                                   | Alta       |
| RF13 - Gestão de Salas             | CDU6                                   | Alta       |
| RF14 - Gestão de Itens             | CDU6                                   | Média      |
| RF15 - Reportar Incidente          | CDU7                                   | Alta       |
| RF16 - Gestão de Incidentes        | CDU8                                   | Alta       |
| RF17 - Histórico de Incidentes     | CDU8                                   | Baixa      |
| RF18 - Visualizar Notificações     | CDU9                                   | Alta       |
| RF19 - Marcar como Lida            | CDU9                                   | Média      |
| RF20 - Notificações Automáticas    | CDU3, CDU4, CDU5, CDU7, CDU8 → CDU9  | Alta       |
| RF21 - Visualizar Usuários         | CDU10                                  | Média      |
| RF22 - Alterar Role                | CDU10                                  | Média      |
| RF23 - Dashboard                   | CDU11                                  | Média      |
| RF24 - Estatísticas por Usuário    | CDU11                                  | Média      |
| RF25 - Relatórios de Incidentes    | CDU8, CDU11                            | Média      |
| RF26 - Integração Google Calendar  | CDU3, CDU4, CDU5                       | Média      |

## 4. Tecnologias e Ferramentas

### 4.1 Frontend

- **Next.js 14**: Framework React com SSR/SSG
- **React 18**: Biblioteca de UI
- **TypeScript**: Type safety
- **Tailwind CSS**: Estilização
- **Next-intl**: Internacionalização
- **Radix UI**: Componentes acessíveis

### 4.2 Backend

- **Next.js API Routes**: API RESTful
- **Prisma ORM**: Gerenciamento de banco de dados
- **PostgreSQL**: Banco de dados relacional
- **NextAuth.js**: Autenticação

### 4.3 Infraestrutura

- **Docker**: Containerização
- **Vercel**: Deploy e hosting
- **Cloudinary**: Gerenciamento de imagens
- **Neon**: Banco de dados PostgreSQL gerenciado

### 4.4 Ferramentas de Desenvolvimento

- **ESLint**: Linting de código
- **Prettier**: Formatação de código
- **TypeScript**: Type checking
- **Prisma Studio**: Interface visual do banco

## 5. Restrições

### 5.1 Técnicas

- Deve usar Next.js como framework principal
- Deve usar PostgreSQL como banco de dados
- Deve suportar autenticação via Google OAuth
- Deve ser compatível com aplicativo mobile React Native

### 5.2 Negócio

- Sistema deve estar disponível 24/7
- Deve suportar múltiplos idiomas
- Deve ser acessível via web e mobile

### 5.3 Regulatórias

- Conformidade com LGPD (Lei Geral de Proteção de Dados)
- Proteção de dados pessoais dos usuários
- Logs de auditoria para ações administrativas
