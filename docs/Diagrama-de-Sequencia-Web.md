# Diagramas de Sequência (Sequence Diagrams) - SALA Web

Este documento reúne os diagramas de sequência que ilustram as trocas de mensagens e interações temporais entre os componentes da aplicação para os fluxos críticos de:
1. **Criação de Reserva e Sincronização**
2. **Cadastro de Nova Conta e Organização (Sign Up)**
3. **Login Local (E-mail/Senha) e Google OAuth**

---

## 1. Fluxo de Criação de Reserva e Sincronização

Ilustra a criação de uma reserva, a análise de colisão de horários e a posterior sincronização de calendário e disparo de push notifications.

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuário
    participant FE as Frontend (React/Next.js)
    participant API as Route Handler (api/reservations)
    participant AUTH as Auth Middleware (NextAuth)
    participant DOM as Módulo de Reservas (lib/recurring)
    participant DB as Banco de Dados (Prisma/Postgres)
    participant GC as Google Calendar API (Serviço Externo)
    participant NOTIF as NotificationService (lib/notifications)
    participant PUSH as PushNotificationService (Expo API)

    U->>FE: Preenche formulário e clica em "Reservar"
    FE->>API: POST /api/reservations (payload)
    activate API

    API->>AUTH: Obter sessão ativa (getToken / getServerSession)
    activate AUTH
    AUTH-->>API: Sessão do usuário (userId, role)
    deactivate AUTH

    Note over API: Validação de Payload com Zod

    API->>DB: Consultar conflitos de horários (Reservations overlapping)
    activate DB
    DB-->>API: Lista de reservas conflitantes (se houver)
    deactivate DB

    alt Conflito Encontrado
        API-->>FE: HTTP 409 Conflict (Mensagem de Conflito)
        FE-->>U: Exibe mensagem de erro na tela
    else Sem Conflito

        alt É Reserva Recorrente
            API->>DOM: generateRecurringReservations(dados)
            activate DOM
            DOM->>DB: create (Primeira reserva - template pai)
            activate DB
            DB-->>DOM: Registro Pai (id)
            deactivate DB
            loop Para cada instância da série
                DOM->>DB: create (Reserva filha vinculada ao pai)
                activate DB
                DB-->>DOM: Registro Filha (id)
                deactivate DB
            end
            DOM-->>API: Lista de IDs das reservas criadas
            deactivate DOM
        else É Reserva Simples
            API->>DB: create (Reserva única)
            activate DB
            DB-->>API: Registro criado
            deactivate DB
        end

        Note over API: Se solicitante for ADMIN, status = APPROVED. Se USER, status = PENDING.

        alt Reserva Aprovada (APPROVED) e Usuário possui vínculo Google
            API->>DB: Consultar tokens da conta Google (Account.refresh_token)
            activate DB
            DB-->>API: Credenciais do Google (OAuth tokens)
            deactivate DB

            API->>GC: POST /calendars/primary/events (Detalhes do agendamento)
            activate GC
            GC-->>API: ID do evento criado (googleCalendarEventId)
            deactivate GC

            API->>DB: update (Salva googleCalendarEventId na reserva)
            activate DB
            DB-->>API: Confirmação
            deactivate DB
        end

        %% -- Geração de Notificações --
        API->>NOTIF: notificationService.reservationCreated(reserva)
        activate NOTIF
        NOTIF->>DB: create (Cria registro na tabela Notification)
        activate DB
        DB-->>NOTIF: Confirmação
        deactivate DB

        NOTIF->>DB: Buscar push tokens ativos do destinatário
        activate DB
        DB-->>NOTIF: Lista de PushTokens
        deactivate DB

        alt Existe PushToken ativo
            NOTIF->>PUSH: sendToUser(userId, pushPayload)
            activate PUSH
            PUSH->>GC: POST /expo/push/send (OAuth / Expo API)
            activate GC
            GC-->>PUSH: Confirmação de envio
            deactivate GC
            PUSH-->>NOTIF: Sucesso
            deactivate PUSH
        end
        NOTIF-->>API: Concluído
        deactivate NOTIF

        API-->>FE: HTTP 201 Created (Dados da Reserva)
        deactivate API
        FE-->>U: Exibe toast de sucesso e atualiza calendário na tela
    end
```

---

## 2. Fluxo de Cadastro de Conta (Sign Up)

Ilustra as chamadas internas para a criação transacional e segura de uma nova conta de usuário proprietário (`OWNER`) e sua respectiva empresa (`Organization`).

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuário
    participant FE as Cadastro (React Page)
    participant API as Route Handler (api/auth/register)
    participant REG as registerUserWithOrganization (lib/auth)
    participant HASH as hashPassword (lib/crypto)
    participant DB as Banco de Dados (Postgres)

    U->>FE: Insere dados pessoais e de sua empresa e clica em "Cadastrar"
    FE->>API: POST /api/auth/register (payload)
    activate API

    Note over API: Validação de dados (Zod RegisterInput)

    API->>REG: registerUserWithOrganization(input)
    activate REG

    REG->>DB: Consultar e-mail, CPF e CNPJ existentes
    activate DB
    DB-->>REG: Registros encontrados (se houver)
    deactivate DB

    alt Conflito de Duplicidade Encontrado
        REG-->>API: throw RegisterConflictError (ex: "CPF já cadastrado")
        API-->>FE: HTTP 409 Conflict (JSON com campo e mensagem de conflito)
        FE-->>U: Exibe aviso visual no campo em conflito
    else Dados Únicos
        REG->>HASH: hashPassword(senha)
        activate HASH
        HASH-->>REG: hash gerada (passwordHash via Bcrypt)
        deactivate HASH

        REG->>DB: Iniciar transação ($transaction)
        activate DB
        
        DB->>DB: create User (senha criptografada, CPF, e-mail)
        DB->>DB: create Organization (CNPJ, nome da empresa, plano TRIAL)
        DB->>DB: create OrganizationMember (vincula usuário à empresa como OWNER)
        
        DB-->>REG: Sucesso na gravação dos registros
        deactivate DB

        REG-->>API: Objeto Usuário criado (id, email, nome)
        deactivate REG
        API-->>FE: HTTP 201 Created
        deactivate API

        FE->>FE: Redireciona para a tela de login (/auth/login?registered=true)
        FE-->>U: Exibe mensagem de boas-vindas e instrui login
    end
```

---

## 3. Fluxo de Autenticação (Login)

Ilustra o fluxo de mensagens para login com e-mail/senha local e login via conta do Google OAuth.

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuário
    participant FE as Login (React Page)
    participant NA as NextAuth (Client/Backend)
    participant CRED as Credentials Provider (lib/auth)
    participant GOOG as Google OAuth Server (Externo)
    participant DB as Banco de Dados (Postgres)

    U->>FE: Escolhe método de autenticação

    alt Login via E-mail e Senha
        U->>FE: Insere e-mail e senha e clica em "Entrar"
        FE->>NA: signIn("credentials", { email, password })
        activate NA
        NA->>CRED: authorize(credentials)
        activate CRED

        Note over CRED: Validação Zod credentialsLoginSchema

        CRED->>DB: Buscar usuário por e-mail (User.findUnique)
        activate DB
        DB-->>CRED: Registro do usuário (passwordHash, etc.)
        deactivate DB

        alt Usuário não encontrado ou não tem senha cadastrada
            CRED-->>NA: return null
            NA-->>FE: URL de erro (?error=CredentialsSignin)
            FE-->>U: Exibe "Credenciais Inválidas"
        else Usuário Válido
            CRED->>CRED: verifyPassword(senha, passwordHash)
            alt Senha Incorreta
                CRED-->>NA: return null
                NA-->>FE: URL de erro
                FE-->>U: Exibe "Credenciais Inválidas"
            else Senha Correta
                CRED-->>NA: return UserSessionData (id, email, nome)
                deactivate CRED
                
                %% NextAuth Callbacks
                NA->>DB: Buscar dados de enriquecimento (Roles locais na organização)
                activate DB
                DB-->>NA: Organização, Role local (ex: OWNER)
                deactivate DB
                Note over NA: Executa callbacks jwt() e session()
                NA-->>FE: Cookie de sessão gerado (HTTP-Only)
                deactivate NA
                FE->>FE: Redireciona para Dashboard (/dashboard)
                FE-->>U: Exibe dashboard atualizado
            end
        end

    else Login via Google OAuth
        U->>FE: Clica em "Entrar com Google"
        FE->>NA: signIn("google")
        activate NA
        NA->>GOOG: Redireciona para login da Google (OAuth2 consent)
        activate GOOG
        GOOG-->>NA: Retorna Código de Autorização e Perfil (e-mail, nome, foto)
        deactivate GOOG

        NA->>DB: Buscar usuário por e-mail do Google (User.findUnique)
        activate DB
        DB-->>NA: Usuário cadastrado (ou null)
        deactivate DB

        alt Usuário Inexistente (Primeiro Acesso)
            NA->>DB: Criar conta de usuário (Just-in-Time Provisioning, role USER)
            activate DB
            DB-->>NA: Usuário cadastrado
            deactivate DB
        else Usuário já Cadastrado
            Note over NA: Vincula conta Google se não vinculada
        end

        NA->>DB: Buscar dados de enriquecimento (Roles locais na organização)
        activate DB
        DB-->>NA: Organização e roles vinculadas
        deactivate DB

        Note over NA: Executa callbacks jwt() e session()
        NA-->>FE: Cookie de sessão gerado (HTTP-Only)
        deactivate NA
        FE->>FE: Redireciona para Dashboard (/dashboard)
        FE-->>U: Exibe dashboard atualizado
    end
```
