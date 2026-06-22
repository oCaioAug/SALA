# Diagramas de Atividade (Activity Diagrams) - SALA Web

Este documento reúne os diagramas de atividade que ilustram os fluxos de processos de negócio da aplicação:
1. **Fluxo de Criação de Reserva (Simples ou Recorrente)**
2. **Fluxo de Cadastro de Usuário e Organização (Sign Up)**
3. **Fluxo de Autenticação (Login via Credenciais ou Google)**

---

## 1. Fluxo de Criação de Reserva

Ilustra o comportamento lógico do sistema ao validar conflitos de horário e gravar reservas simples ou recorrentes.

```mermaid
flowchart TD
    %% -- Nós Iniciais e Finais --
    Inicio([Início])
    Fim([Fim])
    FimConflito([Fim - Reserva Bloqueada])

    %% -- Passos do Usuário --
    Inicio --> SolicitarReserva[Usuário solicita reserva de sala]
    SolicitarReserva --> PreencherForm[Preenche sala, horários e recorrência]
    PreencherForm --> EnviarRequisicao[Envia formulário de reserva]

    %% -- Processamento do Backend (Validação) --
    EnviarRequisicao --> ValidarPayload{Payload válido?}
    ValidarPayload -- Não --> RetornarErroValidacao[Retorna erro de preenchimento]
    RetornarErroValidacao --> FimConflito

    ValidarPayload -- Sim --> VerificarRecorrencia{É reserva recorrente?}

    %% -- Fluxo Reserva Simples --
    VerificarRecorrencia -- Não --> BuscarConflitoSimples[Verifica sobreposição de horários no banco]
    BuscarConflitoSimples --> HaConflitoSimples{Existe conflito?}
    
    HaConflitoSimples -- Sim --> RetornarErroConflito[Retorna erro de conflito de horário]
    RetornarErroConflito --> FimConflito

    HaConflitoSimples -- Não --> DeterminarStatus{Solicitante é Administrador?}

    %% -- Fluxo Reserva Recorrente --
    VerificarRecorrencia -- Sim --> GerarInstancias[Gera instâncias futuras por padrão diário/semanal/mensal]
    GerarInstancias --> VerificarConflitosLote[Verifica conflitos para cada instância gerada]
    VerificarConflitosLote --> FiltrarInstanciasConflitantes[Remove instâncias conflitantes do lote]
    FiltrarInstanciasConflitantes --> RestouInstancia{Restou alguma instância?}

    RestouInstancia -- Não --> RetornarErroConflitoLote[Retorna erro: Todas as datas têm conflito]
    RetornarErroConflitoLote --> FimConflito

    RestouInstancia -- Sim --> DeterminarStatus

    %% -- Aprovação e Persistência --
    DeterminarStatus -- Sim --> GravarAprovada[Grava reserva no banco com status APPROVED]
    DeterminarStatus -- Não --> GravarPendente[Grava reserva no banco com status PENDING]

    %% -- Fluxos Pós-Gravação --
    GravarPendente --> EnviarNotifAdmin[Gera notificação do sistema aos administradores]
    EnviarNotifAdmin --> VerificarPushAdmin{Admins possuem Push Tokens?}
    VerificarPushAdmin -- Sim --> DispararPushAdmin[Envia push notification para app mobile dos admins]
    VerificarPushAdmin -- Não --> SeguirFluxo1[Seguir]
    DispararPushAdmin --> SeguirFluxo1

    GravarAprovada --> VerificarGoogleCalendar{Usuário vinculou Google Calendar?}
    VerificarGoogleCalendar -- Sim --> CriarEventoGoogle[Agenda evento na API do Google Calendar]
    VerificarGoogleCalendar -- Não --> SeguirFluxo2[Seguir]
    CriarEventoGoogle --> SeguirFluxo2

    %% -- Conclusão --
    SeguirFluxo1 --> InformarSucesso[Notifica usuário de sucesso na solicitação]
    SeguirFluxo2 --> InformarSucesso
    InformarSucesso --> Fim
```

---

## 2. Fluxo de Cadastro (Sign Up)

Ilustra o registro simultâneo do usuário e de sua organização sob uma transação atômica.

```mermaid
flowchart TD
    Start([Início]) --> InputFields[Preenche dados pessoais e da organização]
    InputFields --> ValidateForm{Formatos válidos? Zod, CPF, CNPJ}
    
    ValidateForm -- Não --> ShowValidationError[Exibe erro de validação nos campos]
    ShowValidationError --> EndFailed([Fim - Cadastro Rejeitado])
    
    ValidateForm -- Sim --> QueryDBDuplicates[Verifica se E-mail, CPF ou CNPJ já existem]
    QueryDBDuplicates --> CheckDuplicates{Há duplicidade?}
    
    CheckDuplicates -- Sim --> ShowConflictError[Exibe erro: E-mail, CPF ou CNPJ já cadastrados]
    ShowConflictError --> EndFailed
    
    CheckDuplicates -- Não --> HashPassword[Criptografa senha com Bcrypt]
    HashPassword --> StartTransaction[Inicia transação no banco de dados]
    
    StartTransaction --> CreateUserRecord[Cria registro de User com passwordHash]
    CreateUserRecord --> CreateOrgRecord[Cria registro de Organization]
    CreateOrgRecord --> CreateMemberLink[Cria OrganizationMember com role OWNER]
    
    CreateMemberLink --> CommitTransaction{Sucesso na transação?}
    
    CommitTransaction -- Não --> Rollback[Desfaz escritas - Rollback]
    Rollback --> ShowGenericError[Exibe erro de gravação]
    ShowGenericError --> EndFailed
    
    CommitTransaction -- Sim --> InitStats[Gera estatísticas diárias iniciais]
    InitStats --> RedirectLogin[Redireciona para página de login]
    RedirectLogin --> EndSuccess([Fim - Cadastro Concluído])
```

---

## 3. Fluxo de Autenticação (Login)

Ilustra o acesso do usuário utilizando Google OAuth ou e-mail/senha local.

```mermaid
flowchart TD
    StartAuth([Início]) --> ChooseProvider{Qual método de login?}
    
    %% -- Fluxo E-mail / Senha --
    ChooseProvider -- E-mail e Senha --> InputCredentials[Informa e-mail e senha]
    InputCredentials --> ValidateCredentialsInput{Campos preenchidos?}
    ValidateCredentialsInput -- Não --> ShowLoginError[Exibe erro de preenchimento]
    ShowLoginError --> EndFailedAuth([Fim - Login Falhou])
    
    ValidateCredentialsInput -- Sim --> FindUserDB[Busca usuário por e-mail no banco]
    FindUserDB --> UserExists{Usuário encontrado e possui passwordHash?}
    
    UserExists -- Não --> ShowInvalidCredentials[Exibe mensagem de credenciais inválidas]
    ShowInvalidCredentials --> EndFailedAuth
    
    UserExists -- Sim --> VerifyBcrypt[Compara hash de senha via Bcrypt]
    VerifyBcrypt --> PasswordValid{Senha correta?}
    
    PasswordValid -- Não --> ShowInvalidCredentials
    PasswordValid -- Sim --> EnrichCredentialsSession[Enriquece sessão com roles da organização]
    EnrichCredentialsSession --> GenerateSessionToken[Gera cookie de sessão/JWT]
    GenerateSessionToken --> RedirectDashboard[Redireciona para o Dashboard]
    RedirectDashboard --> EndSuccessAuth([Fim - Autenticado])

    %% -- Fluxo Google OAuth --
    ChooseProvider -- Google Provider --> TriggerGoogleAuth[Clica em Entrar com Google]
    TriggerGoogleAuth --> RedirectGoogleLogin[Redireciona para tela de login do Google]
    RedirectGoogleLogin --> AuthenticateGoogle{Autenticado pelo Google?}
    
    AuthenticateGoogle -- Não --> EndFailedAuth
    
    AuthenticateGoogle -- Sim --> FindGoogleUser[Busca usuário pelo e-mail do Google no banco]
    FindGoogleUser --> GoogleUserExists{Usuário cadastrado?}
    
    GoogleUserExists -- Não --> ProvisionJIT[Cria conta de usuário - JIT Provisioning com role USER]
    ProvisionJIT --> EnrichOAuthSession[Enriquece sessão com roles da organização]
    
    GoogleUserExists -- Sim --> LinkAccount[Atualiza ou vincula conta do Google à existente]
    LinkAccount --> EnrichOAuthSession
    
    EnrichOAuthSession --> SyncCalendar[Dispara sincronização assíncrona do Google Calendar]
    SyncCalendar --> GenerateSessionToken
```
