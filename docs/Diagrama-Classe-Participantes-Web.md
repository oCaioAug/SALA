# Diagrama de Classes Participantes (VOPC) - SALA Web

Este documento apresenta a especificação do **Diagrama de Classes Participantes** (também conhecido como **VOPC - View of Participating Classes**) da aplicação **SALA Web**, estruturado de acordo com o padrão de design arquitetural **BCE (Boundary-Control-Entity)**. A modelagem segue os critérios de alta exigência acadêmica e profissional da Engenharia de Software.

---

## 1. Fundamentação Teórica: O Padrão BCE (Boundary-Control-Entity)

O padrão **BCE** (originalmente proposto por Ivar Jacobson no método OOSE e posteriormente incorporado ao RUP - Rational Unified Process) visa isolar as preocupações de sistema e separar as classes em três grandes grupos baseados em sua responsabilidade de design:

```
    ┌────────────────┐         ┌───────────────┐         ┌──────────────┐
    │  <<Boundary>>  │ .......>│  <<Control>>  │ .......>│  <<Entity>>  │
    │   (Fronteira)  │         │   (Controle)  │         │  (Entidade)  │
    └────────────────┘         └───────────────┘         └──────────────┘
```

- **Boundary (Fronteira - 边界)**: Representa a interface do sistema com o mundo externo (atores, dispositivos de hardware ou outras APIs). Suas responsabilidades residem exclusivamente na entrada de dados, renderização visual, formatação de saídas e escuta de eventos. Em Next.js, as fronteiras são as páginas React (`pages`/`components`) e as rotas HTTP (`app/api/*`).
- **Control (Controle - 控制)**: Encapsula as regras de negócio de caso de uso dinâmicas e a coordenação de tarefas. O controle atua como o "cérebro" intermediário que processa as validações de regras de negócio, calcula algoritmos e orquestra o estado antes de persisti-lo. Em nossa aplicação, são representados pelos serviços, helpers e bibliotecas utilitárias em `src/lib`.
- **Entity (Entidade - 实体)**: Representa as classes de dados puras e persistentes que sobrevivem à execução de um caso de uso. Não devem conter lógica de controle ou de coordenação externa, apenas modelar o estado conceitual de negócio. Em nosso projeto, as entidades são geradas a partir do mapeamento ORM do `schema.prisma`.

---

## 2. Visões de Classes Participantes por Cenário (VOPCs)

Para garantir máxima legibilidade e clareza nos diagramas, a modelagem foi segregada por cenários de negócio correspondentes aos casos de uso implementados na aplicação.

---

### Cenário 1: Cadastro e Autenticação (Sign Up / Login)

Este diagrama representa a colaboração das classes participantes na criação de novas organizações multi-tenant e na autenticação de usuários via NextAuth (e-mail/senha local e Google OAuth).

```mermaid
classDiagram
    %% -- Estilos BCE por Estereótipo --
    classDef boundary fill:#fffbeb,stroke:#d97706,stroke-width:2px;
    classDef control fill:#f3e8ff,stroke:#7c3aed,stroke-width:2px;
    classDef entity fill:#e0f2fe,stroke:#0284c7,stroke-width:2px;

    %% ── Fronteiras (Boundary) ──
    class LoginPage {
        <<Boundary>>
        +ReactElement render()
        +handleLogin(credentials) void
    }
    class RegisterPage {
        <<Boundary>>
        +ReactElement render()
        +handleRegister(payload) void
    }
    class RegisterStepDetails {
        <<Boundary>>
        +ReactElement render()
        +validateStep(stepIndex) boolean
    }
    class AuthRegisterRoute {
        <<Boundary>>
        +POST(request: NextRequest) Promise~NextResponse~
    }
    class NextAuthRoute {
        <<Boundary>>
        +GET(request: NextRequest) Promise~NextResponse~
        +POST(request: NextRequest) Promise~NextResponse~
    }

    %% ── Controles (Control) ──
    class NextAuthOptionsConfig {
        <<Control>>
        +authOptionsNextAuthOptions NextAuthOptions
        +jwt(params) Promise~JWT~
        +session(params) Promise~Session~
        +signIn(params) Promise~boolean~
    }
    class CredentialsProvider {
        <<Control>>
        +authorize(credentials) Promise~UserSessionData|null~
    }
    class RegisterUserHelper {
        <<Control>>
        +registerUserWithOrganization(input: RegisterInput) Promise~RegisteredUser~
    }
    class PasswordCryptoHelper {
        <<Control>>
        +hashPassword(password: string) Promise~string~
        +verifyPassword(password: string, hash: string) Promise~boolean~
    }

    %% ── Entidades (Entity) ──
    class UserEntity {
        <<Entity>>
        +String id
        +String email
        +String passwordHash
        +String cpf
        +Role role
        +PlatformRole platformRole
    }
    class OrganizationEntity {
        <<Entity>>
        +String id
        +String name
        +String cnpj
        +OrganizationStatus status
        +String ownerId
        +String planId
    }
    class OrganizationMemberEntity {
        <<Entity>>
        +String id
        +String organizationId
        +String userId
        +OrganizationRole role
    }

    %% -- Aplicação de Classes de Estilo --
    class LoginPage,RegisterPage,RegisterStepDetails,AuthRegisterRoute,NextAuthRoute boundary;
    class NextAuthOptionsConfig,CredentialsProvider,RegisterUserHelper,PasswordCryptoHelper control;
    class UserEntity,OrganizationEntity,OrganizationMemberEntity entity;

    %% ── Relacionamentos de Colaboração ──
    LoginPage ..> NextAuthRoute : "submete credenciais via signIn()"
    RegisterPage --> RegisterStepDetails : "comporta etapas do formulário"
    RegisterPage ..> AuthRegisterRoute : "consome POST /api/auth/register"
    
    AuthRegisterRoute --> RegisterUserHelper : "delega execução"
    NextAuthRoute --> NextAuthOptionsConfig : "orquestra callbacks"
    NextAuthOptionsConfig --> CredentialsProvider : "utiliza provedor"
    CredentialsProvider --> PasswordCryptoHelper : "verifica Bcrypt hash"
    RegisterUserHelper --> PasswordCryptoHelper : "gera Bcrypt hash"

    RegisterUserHelper ..> UserEntity : "persiste dados cadastrais"
    RegisterUserHelper ..> OrganizationEntity : "cria tenant correspondente"
    RegisterUserHelper ..> OrganizationMemberEntity : "vincula usuário como OWNER"
    CredentialsProvider ..> UserEntity : "busca e lê registro"
```

---

### Cenário 2: Gestão de Reservas e Validação de Conflitos

Este diagrama detalha a colaboração dos componentes na criação de reservas simples e séries recorrentes, incluindo a análise algorítmica de sobreposição de horários, verificação de limites do plano contratado e sincronização assíncrona com o Google Calendar.

```mermaid
classDiagram
    %% -- Estilos BCE por Estereótipo --
    classDef boundary fill:#fffbeb,stroke:#d97706,stroke-width:2px;
    classDef control fill:#f3e8ff,stroke:#7c3aed,stroke-width:2px;
    classDef entity fill:#e0f2fe,stroke:#0284c7,stroke-width:2px;

    %% ── Fronteiras (Boundary) ──
    class SchedulePage {
        <<Boundary>>
        +ReactElement render()
        +handleSubmitReservation() void
    }
    class RoomDetailsModal {
        <<Boundary>>
        +ReactElement render()
        +handleCheckAvailability() void
    }
    class ReservationsRoute {
        <<Boundary>>
        +GET(request: NextRequest) Promise~NextResponse~
        +POST(request: NextRequest) Promise~NextResponse~
    }

    %% ── Controles (Control) ──
    class TenantSecurityContext {
        <<Control>>
        +requireTenantContext() Promise~TenantContext~
        +isNextResponse(ctx) boolean
    }
    class PlanLimitsService {
        <<Control>>
        +assertCanCreateReservation(orgId: string) Promise~void~
    }
    class RecurringReservationsLib {
        <<Control>>
        +generateRecurringDates(start, end, pattern, days, endRecurr) Date[]
        +checkRecurringConflicts(roomId, dates) Promise~Conflict[]~
        +generateRecurringReservations(data) Promise~string[]~
    }
    class GoogleCalendarLib {
        <<Control>>
        +syncReservationToGoogleCalendar(reservationId: string) Promise~string|null~
    }
    class NotificationServiceLib {
        <<Control>>
        +reservationCreated(reservation) Promise~void~
        +reservationApproved(reservation) Promise~void~
    }
    class PushNotificationService {
        <<Control>>
        +sendToUser(userId, payload) Promise~boolean~
    }

    %% ── Entidades (Entity) ──
    class RoomEntity {
        <<Entity>>
        +String id
        +String name
        +RoomStatus status
    }
    class ReservationEntity {
        <<Entity>>
        +String id
        +DateTime startTime
        +DateTime endTime
        +ReservationStatus status
        +String parentReservationId
        +String googleCalendarEventId
    }
    class NotificationEntity {
        <<Entity>>
        +String id
        +NotificationType type
        +Boolean isRead
    }
    class PushTokenEntity {
        <<Entity>>
        +String id
        +String token
        +Boolean isActive
    }

    %% -- Aplicação de Classes de Estilo --
    class SchedulePage,RoomDetailsModal,ReservationsRoute boundary;
    class TenantSecurityContext,PlanLimitsService,RecurringReservationsLib,GoogleCalendarLib,NotificationServiceLib,PushNotificationService control;
    class RoomEntity,ReservationEntity,NotificationEntity,PushTokenEntity entity;

    %% ── Relacionamentos de Colaboração ──
    SchedulePage ..> ReservationsRoute : "requisita leitura/escrita"
    RoomDetailsModal ..> ReservationsRoute : "solicita disponibilidade"
    
    ReservationsRoute --> TenantSecurityContext : "valida token/membership"
    ReservationsRoute --> PlanLimitsService : "valida cotas"
    ReservationsRoute --> RecurringReservationsLib : "solicita geração e conflitos"
    ReservationsRoute --> GoogleCalendarLib : "solicita sincronização externa"
    ReservationsRoute --> NotificationServiceLib : "dispara centro de mensagens"

    RecurringReservationsLib ..> ReservationEntity : "realiza escritas/leituras"
    RecurringReservationsLib ..> RoomEntity : "atualiza/lê status de sala"

    GoogleCalendarLib ..> ReservationEntity : "atualiza referência externa"
    NotificationServiceLib ..> NotificationEntity : "persiste mensagens internas"
    NotificationServiceLib --> PushNotificationService : "delega disparo push"
    PushNotificationService ..> PushTokenEntity : "busca tokens de destino"
```

---

### Cenário 3: Incidentes e Auditoria com Visão Computacional

Este diagrama ilustra como o sistema processa relatos de incidentes, mantém histórico de auditoria mutacional dos estados de problemas e interage com o motor de visão computacional (via fábrica dinâmica e inversão de dependência - DIP) para validar estados de salas de forma automatizada.

```mermaid
classDiagram
    %% -- Estilos BCE por Estereótipo --
    classDef boundary fill:#fffbeb,stroke:#d97706,stroke-width:2px;
    classDef control fill:#f3e8ff,stroke:#7c3aed,stroke-width:2px;
    classDef entity fill:#e0f2fe,stroke:#0284c7,stroke-width:2px;

    %% ── Fronteiras (Boundary) ──
    class IncidentReportForm {
        <<Boundary>>
        +ReactElement render()
        +handleUploadPhoto() void
        +handleSubmitIncident() void
    }
    class IncidentsRoute {
        <<Boundary>>
        +GET(request: NextRequest) Promise~NextResponse~
        +POST(request: NextRequest) Promise~NextResponse~
        +PATCH(request: NextRequest) Promise~NextResponse~
    }

    %% ── Controles (Control) ──
    class IncidentService {
        <<Control>>
        +createIncident(data) Promise~Incident~
        +updateIncidentStatus(id, newStatus, notes) Promise~Incident~
        +calculateIncidentStats(orgId) Promise~IncidentStats~
    }
    class VisionServiceFactory {
        <<Control>>
        +getService() Promise~VisionService~
    }
    class VisionService {
        <<Control>>
        <<abstract>>
        +analyzeImage(base64Image: string) Promise~VisionAnalysisResult~*
    }
    class RoboflowService {
        <<Control>>
        +analyzeImage(base64Image: string) Promise~VisionAnalysisResult~
    }
    class MockVisionService {
        <<Control>>
        +analyzeImage(base64Image: string) Promise~VisionAnalysisResult~
    }

    %% ── Entidades (Entity) ──
    class IncidentEntity {
        <<Entity>>
        +String id
        +String title
        +IncidentPriority priority
        +IncidentStatus status
        +IncidentCategory category
        +String roomId
        +String itemId
    }
    class IncidentStatusHistoryEntity {
        <<Entity>>
        +String id
        +IncidentStatus fromStatus
        +IncidentStatus toStatus
        +String notes
        +String changedById
    }
    class ApiCredentialEntity {
        <<Entity>>
        +String id
        +String provider
        +String encryptedKey
        +String iv
        +String tag
        +String modelId
    }

    %% -- Aplicação de Classes de Estilo --
    class IncidentReportForm,IncidentsRoute boundary;
    class IncidentService,VisionServiceFactory,VisionService,RoboflowService,MockVisionService control;
    class IncidentEntity,IncidentStatusHistoryEntity,ApiCredentialEntity entity;

    %% ── Relacionamentos de Colaboração ──
    IncidentReportForm ..> IncidentsRoute : "submete relato"
    IncidentsRoute --> IncidentService : "encaminha ações"
    IncidentsRoute --> VisionServiceFactory : "solicita verificação inteligente"
    
    VisionServiceFactory ..> VisionService : "resolve instância com base na API"
    VisionService <|-- RoboflowService : "realiza contrato"
    VisionService <|-- MockVisionService : "realiza contrato"
    
    IncidentService ..> IncidentEntity : "cria e modifica"
    IncidentService ..> IncidentStatusHistoryEntity : "audita transição de status"
    VisionServiceFactory ..> ApiCredentialEntity : "lê credenciais descriptografáveis"
```

---

## 3. Diretrizes de Engenharia e Boas Práticas (SOLID)

A modelagem estrutural das Classes Participantes no projeto **SALA** reflete conceitos avançados de Arquitetura de Software:

1. **Princípio de Responsabilidade Única (SRP)**:
   - A camada **Boundary** (`Route Handlers`) é estritamente desacoplada da lógica de negócios. Ela não executa consultas cruas do Prisma nem calcula datas recorrentes. Sua única responsabilidade é a validação inicial sintática do payload (NextRequest) e o retorno da resposta HTTP (NextResponse).
2. **Princípio de Inversão de Dependência (DIP)**:
   - A rota de incidentes não depende das implementações concretas do provedor de IA (`RoboflowService` ou `MockVisionService`). Em vez disso, depende da classe abstrata `VisionService` (Contrato). A resolução dinâmica das classes concretas é delegada à fábrica `VisionServiceFactory`, garantindo alta testabilidade unitária e isolamento de dependências.
3. **Persistência Transacional Desacoplada**:
   - Os helpers de persistência (Controle) efetuam operações transacionais no banco por meio do cliente ORM. Desta forma, a estrutura física do banco de dados (Entidades) é isolada dos fluxos de interface, garantindo que alterações no schema PostgreSQL não impactem de forma destrutiva as views frontend.
