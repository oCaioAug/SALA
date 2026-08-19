# Requisitos do Sistema SALA Web

## 1. Requisitos Funcionais

### 1.1 Autenticação e Autorização

#### RF01 - Autenticação via Google OAuth e Credenciais Convencionais

- **Descrição**: O sistema deve permitir que usuários façam login usando suas contas Google ou email/senha convencionais.
- **Prioridade**: Alta
- **Casos de Uso Relacionados**: CDU1 (Autenticar)
- **Critérios de Aceitação**:
  - Usuário pode fazer login com conta Google ou email/senha
  - Sistema cria automaticamente conta se não existir no Google OAuth
  - Sessão é mantida entre requisições
  - Logout encerra a sessão corretamente

#### RF02 - Controle de Acesso Baseado em Roles

- **Descrição**: O sistema deve diferenciar permissões baseadas em papéis de organização (OWNER, ADMIN, MEMBER) e de setor (MANAGER).
- **Prioridade**: Alta
- **Casos de Uso Relacionados**: CDU1, CDU5, CDU6, CDU8, CDU10
- **Critérios de Aceitação**:
  - Acesso à plataforma e permissões de recursos são validados com base nas roles de organização e setor.
  - Ações de gestão global (ex: gerenciar usuários, criar salas, gerir organizações) são restritas aos papéis OWNER e ADMIN.
  - Ações de gestão departamental (ex: aprovar reservas e atualizar incidentes de salas do setor) podem ser delegadas ao MANAGER.
  - O papel MEMBER possui acesso padrão, podendo gerenciar apenas seus próprios recursos (perfil, suas reservas, reportar incidentes).

#### [DESCONTINUADO] Geração de Token para Mobile

- **Descrição**: O sistema deve gerar tokens de autenticação para aplicativo mobile. (Recurso descontinuado)
- **Prioridade**: Baixa
- **Casos de Uso Relacionados**: Nenhum
- **Critérios de Aceitação**:
  - [DESCONTINUADO]

### 1.2 Gestão de Perfil

- **Descrição**: Usuário deve poder visualizar suas informações de perfil.
- **Prioridade**: Média
- **Casos de Uso Relacionados**: CDU2 (Gerenciar Perfil)
- **Critérios de Aceitação**:
  - Exibir nome, email e foto do perfil
  - Exibir role do usuário
  - Exibir data de criação da conta

#### RF04 - Edição de Perfil

- **Descrição**: Usuário deve poder editar suas informações de perfil.
- **Prioridade**: Média
- **Casos de Uso Relacionados**: CDU2 (Gerenciar Perfil)
- **Critérios de Aceitação**:
  - Permitir alteração do nome
  - Permitir upload de foto de perfil
  - Validação de dados de entrada
  - Persistência das alterações

### 1.3 Gestão de Reservas

#### RF05 - Criação de Reserva

- **Descrição**: Usuário deve poder criar solicitação de reserva de sala.
- **Prioridade**: Alta
- **Casos de Uso Relacionados**: CDU3 (Criar Reserva)
- **Critérios de Aceitação**:
  - Seleção de sala disponível
  - Definição de data e horário de início e fim
  - Opção de adicionar propósito/descrição
  - Validação de conflitos de horário
  - Definição do status inicial conforme role e configuração da sala (se `requiresApproval` for falso, a reserva é APPROVED automaticamente, senão PENDING para MEMBER e APPROVED para ADMIN/OWNER ou MANAGER do setor)

#### RF06 - Reservas Recorrentes

- **Descrição**: Sistema deve suportar criação de reservas recorrentes (diárias, semanais, mensais).
- **Prioridade**: Média
- **Casos de Uso Relacionados**: CDU3 (Criar Reserva)
- **Critérios de Aceitação**:
  - Seleção de padrão de recorrência (DAILY, WEEKLY, MONTHLY)
  - Para WEEKLY: seleção de dias da semana
  - Definição de data de término da recorrência
  - Geração automática de instâncias futuras
  - Todas as instâncias vinculadas ao template pai

#### RF07 - Visualização de Reservas

- **Descrição**: Usuário deve poder visualizar suas reservas e administrador todas as reservas.
- **Prioridade**: Alta
- **Casos de Uso Relacionados**: CDU4 (Visualizar / Cancelar Reservas)
- **Critérios de Aceitação**:
  - Listagem de reservas com filtros (status, data, sala)
  - Visualização de detalhes da reserva
  - Diferenciação visual por status
  - Informações de sala e usuário associados

#### RF08 - Aprovação/Rejeição de Reservas

- **Descrição**: Administradores da organização e gestores de setor devem poder aprovar ou rejeitar solicitações de reserva no respectivo escopo.
- **Prioridade**: Alta
- **Casos de Uso Relacionados**: CDU5 (Aprovar / Rejeitar Reserva)
- **Critérios de Aceitação**:
  - OWNER/ADMIN da organização podem aprovar/rejeitar qualquer sala
  - Gestores de setor (SectorMember MANAGER) podem aprovar/rejeitar apenas salas do(s) setor(es) que gerenciam
  - Salas sem setor responsável: apenas OWNER/ADMIN aprovam
  - Fila `/solicitacoes` e notificações de criação respeitam o escopo do aprovador
  - Decisão registra `decidedById`, `decidedAt` e `decisionReason` opcional
  - Notificação automática ao solicitante sobre a decisão
  - Para reservas recorrentes: aprovar/rejeitar todas as instâncias do template (todas no mesmo escopo)

#### RF09 - Gestão de Setores

- **Descrição**: Administrador da organização ou Gestor (MANAGER) deve poder gerenciar setores, vincular salas e adicionar novos membros ao setor.
- **Prioridade**: Alta
- **Casos de Uso Relacionados**: CDU12 (Gerenciar Setores)
- **Critérios de Aceitação**:
  - Cada sala pertence a no máximo um setor (`Room.sectorId`)
  - O gestor do setor (`MANAGER`) pode adicionar outros usuários ao setor, atribuindo níveis de acesso como `MANAGER` ou `MEMBER` (membro comum do setor)
  - Soft-delete de setor desvincula salas
  - Apenas o Administrador global pode criar ou excluir setores. O Gestor administra o conteúdo do seu próprio setor (membros, informações de salas, aprovação de reservas)

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

#### RF13 - Gestão de Salas

- **Descrição**: Administradores da organização gerenciam o ciclo completo de salas; gestores de setor podem editar informações das salas do respectivo escopo.
- **Prioridade**: Alta
- **Casos de Uso Relacionados**: CDU6 (Gerenciar Salas e Itens)
- **Critérios de Aceitação**:
  - OWNER/ADMIN podem criar nova sala com nome, descrição e capacidade
  - OWNER/ADMIN e gestores de setor podem editar informações da sala (nome, descrição, capacidade, localização, tomadas, clima, status) no respectivo escopo
  - Alterar status da sala (LIVRE, EM_USO, RESERVADO) no mesmo escopo de edição
  - Excluir sala permanece exclusivo de OWNER/ADMIN
  - Vincular/desvincular setor (`sectorId`) permanece exclusivo de OWNER/ADMIN
  - Salas sem setor: apenas OWNER/ADMIN editam

#### RF14 - Gestão de Itens

- **Descrição**: Administradores da organização e gestores de setor devem poder gerenciar itens/equipamentos das salas no respectivo escopo.
- **Prioridade**: Média
- **Casos de Uso Relacionados**: CDU6 (Gerenciar Salas e Itens)
- **Critérios de Aceitação**:
  - OWNER/ADMIN podem gerenciar itens de qualquer sala da organização
  - Gestores de setor (SectorMember MANAGER) podem adicionar, editar e remover itens apenas das salas do(s) setor(es) que gerenciam
  - Salas sem setor: apenas OWNER/ADMIN gerenciam itens
  - Upload de imagens dos itens no mesmo escopo
  - Visualização de imagens dos itens
  - Criar e excluir sala permanece exclusivo de OWNER/ADMIN; editar infos da sala no escopo do gestor (ver RF13)

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

#### RF16 - Gestão de Incidentes (Admin e Gestor)

- **Descrição**: Administrador (OWNER/ADMIN) ou Gestor (MANAGER) deve poder gerenciar o ciclo de vida dos incidentes.
- **Prioridade**: Alta
- **Casos de Uso Relacionados**: CDU8 (Gerenciar Incidentes)
- **Critérios de Aceitação**:
  - Visualizar lista de incidentes com filtros (gestores visualizam apenas do escopo de seu setor)
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
  - Notificação enviada ao(s) Administrador(es) e Gestor(es) do setor quando uma reserva é criada por um MEMBER (CDU3)
  - Notificação enviada ao solicitante quando reserva é aprovada ou rejeitada (CDU5)
  - Notificação enviada ao solicitante quando reserva é cancelada (CDU4)
  - Notificação enviada ao(s) Administrador(es) e Gestor(es) do setor quando um incidente é reportado (CDU7)
  - Notificação enviada ao responsavel designado quando incidente é atribuído (CDU8)
  - Notificação enviada ao reportante quando status do incidente é alterado (CDU8)

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
  - Alterar papéis na organização (MEMBER, ADMIN)
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


### 1.9 Gestão SaaS e Organizações

#### RF27 - Cadastro de Usuário (Sign-Up)

- **Descrição**: O sistema deve permitir o cadastro livre de novos usuários via e-mail e senha.
- **Prioridade**: Alta
- **Casos de Uso Relacionados**: CDU13 (Criar Conta)
- **Critérios de Aceitação**:
  - Usuário informa nome, e-mail e senha
  - O e-mail deve ser único na plataforma
  - Após cadastro, o usuário pode realizar login com as credenciais criadas

#### RF28 - Criação e Gestão de Organização

- **Descrição**: Um usuário autenticado pode criar e gerenciar uma organização, atuando como seu proprietário (OWNER).
- **Prioridade**: Alta
- **Casos de Uso Relacionados**: CDU14 (Gerenciar Organização e Membros)
- **Critérios de Aceitação**:
  - Usuário cria a organização informando nome e slug (identificador único)
  - O criador da organização recebe automaticamente a role `OWNER`
  - A organização pode possuir informações complementares como CNPJ, e-mail e configurações
  - O sistema vincula automaticamente a organização ao plano padrão (ex: Trial ou Free)

#### RF29 - Convite e Gestão de Participantes

- **Descrição**: Administradores da organização (`OWNER` ou `ADMIN`) podem convidar novos usuários para participarem da organização.
- **Prioridade**: Alta
- **Casos de Uso Relacionados**: CDU14 (Gerenciar Organização e Membros)
- **Critérios de Aceitação**:
  - Convite é gerado por e-mail contendo a role de destino (`MEMBER`, `ADMIN`)
  - O usuário convidado aceita o convite e se torna um `OrganizationMember`
  - O gestor pode remover membros ou alterar suas roles dentro da organização

#### RF30 - Planos e Assinaturas (SaaS)

- **Descrição**: O sistema deve controlar os limites de uso de uma organização com base no plano assinado.
- **Prioridade**: Alta
- **Casos de Uso Relacionados**: CDU15 (Gerenciar Assinatura)
- **Critérios de Aceitação**:
  - Cada plano possui limites pré-definidos (ex: `maxRooms`, `maxUsers`)
  - A assinatura (`Subscription`) controla a vigência do plano para a organização
  - O sistema bloqueia a criação de novas salas ou membros se o limite do plano for atingido


### 1.10 Gestão da Plataforma (Super Admin)

#### RF31 - Gestão Global de Planos

- **Descrição**: O Super Admin deve poder gerenciar os planos de assinatura (SaaS) oferecidos pela plataforma.
- **Prioridade**: Alta
- **Casos de Uso Relacionados**: CDU16 (Gerenciar Planos - Plataforma)
- **Critérios de Aceitação**:
  - Criar, editar e visualizar planos (`Plan`)
  - Definir limites do plano (ex: `maxRooms`, `maxUsers`)
  - Ativar ou desativar planos (soft-delete)
  - Impedir exclusão de planos que possuam assinaturas ativas

#### RF32 - Gestão Global de Organizações

- **Descrição**: O Super Admin deve ter visão e controle sobre todas as organizações cadastradas no sistema.
- **Prioridade**: Alta
- **Casos de Uso Relacionados**: CDU17 (Gerenciar Organizações - Plataforma)
- **Critérios de Aceitação**:
  - Listar todas as organizações da plataforma com filtros e paginação
  - Visualizar detalhes, estatísticas diárias e o plano atual de cada organização
  - Suspender ou reativar organizações (alterar `OrganizationStatus`)
  - Acessar métricas e quantidades de membros/reservas/incidentes por organização

#### RF33 - Auditoria e Logs da Plataforma

- **Descrição**: O Super Admin deve visualizar as trilhas de auditoria das ações críticas realizadas na plataforma.
- **Prioridade**: Média
- **Casos de Uso Relacionados**: CDU18 (Monitoramento e Auditoria)
- **Critérios de Aceitação**:
  - Visualizar listagem de registros em `AuditLog`
  - Filtrar logs por organização, ator, tipo de entidade ou data
  - Visualizar metadados completos de cada ação registrada (ex: criação de organização, mudança de plano, banimento)

#### RF34 - Configurações de Integrações Globais

- **Descrição**: O Super Admin deve poder configurar integrações globais e serviços de terceiros que a plataforma consome.
- **Prioridade**: Média
- **Casos de Uso Relacionados**: CDU19 (Configurar Integrações Globais)
- **Critérios de Aceitação**:
  - Gerenciar credenciais de APIs externas (`ApiCredential`), como chaves do ROBOFLOW
  - As credenciais devem ser armazenadas de forma criptografada (`encryptedKey` e `iv`)
  - Permitir a rotação de chaves sem afetar o fluxo do usuário final

#### RF35 - Delegação e Bootstrapping de Super Admin

- **Descrição**: O sistema deve prover mecanismos seguros para inicializar e delegar a role `SUPER_ADMIN`.
- **Prioridade**: Alta
- **Casos de Uso Relacionados**: Nenhum (Configuração) / CDU10 (Gerenciar Usuários)
- **Critérios de Aceitação**:
  - **Bootstrapping (Whitelist):** Ao realizar o login via Google OAuth, o sistema verifica se o e-mail consta em uma lista restrita via Variável de Ambiente (ex: `SUPER_ADMIN_EMAILS`). Se sim, o usuário ganha `platformRole = SUPER_ADMIN` automaticamente.
  - **Delegação:** Um `SUPER_ADMIN` já autenticado pode promover ou rebaixar a `platformRole` de outros usuários diretamente pelo Painel de Super Admin.

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
| [DESCONTINUADO] Token Mobile       | CDU1                                   | Média      |
| RF03 - Visualizar Perfil           | CDU2                                   | Média      |
| RF04 - Editar Perfil               | CDU2                                   | Média      |
| RF05 - Criar Reserva               | CDU3                                   | Alta       |
| RF06 - Reservas Recorrentes        | CDU3                                   | Média      |
| RF07 - Visualizar Reservas         | CDU4                                   | Alta       |
| RF08 - Aprovar/Rejeitar            | CDU5                                   | Alta       |
| RF09 - Gestão de Setores           | CDU12                                  | Alta       |
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


| RF27 - Cadastro de Usuário (Sign-Up) | CDU13                                  | Alta       |
| RF28 - Criação e Gestão de Org     | CDU14                                  | Alta       |
| RF29 - Convite e Participantes     | CDU14                                  | Alta       |
| RF30 - Planos e Assinaturas (SaaS) | CDU15                                  | Alta       |


| RF31 - Gestão Global de Planos     | CDU16                                  | Alta       |
| RF32 - Gestão de Organizações      | CDU17                                  | Alta       |
| RF33 - Auditoria e Logs            | CDU18                                  | Média      |
| RF34 - Configurações Globais       | CDU19                                  | Média      |
| RF35 - Bootstrapping Super Admin   | CDU10                                  | Alta       |

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
