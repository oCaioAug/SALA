"use client";

import { useLocale } from "next-intl";

import { AppPreferencesControls } from "@/components/preferences/AppPreferencesControls";
import { Link } from "@/navigation";

export function PrivacyPolicyView() {
  const locale = useLocale();
  const isEn = locale === "en";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-6 py-4">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {isEn ? "← Back to home" : "← Voltar ao início"}
          </Link>
          <AppPreferencesControls variant="marketing" />
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
        {/* Document Header */}
        <div className="mb-12 border-b border-border pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            {isEn ? "Legal & Compliance" : "Jurídico & Conformidade"}
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {isEn ? "Privacy Policy" : "Política de Privacidade"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isEn
              ? "Last updated: September 18, 2026 · Version 2.0"
              : "Última atualização: 18 de setembro de 2026 · Versão 2.0"}
          </p>
          <p className="mt-4 text-base text-muted-foreground">
            {isEn
              ? "SALA (Room Management System), accessible at sala.ocaioaug.com.br, is committed to safeguarding your privacy and ensuring full transparency regarding the collection, use, storage, and protection of user data, specifically including data received from Google APIs."
              : "O SALA (Sistema de Agendamento e Gestão de Ambientes), acessível através de sala.ocaioaug.com.br, tem o compromisso de proteger a sua privacidade e garantir total transparência sobre a coleta, uso, armazenamento e proteção de seus dados, com ênfase específica nas informações recebidas por meio dos serviços e APIs do Google."}
          </p>
        </div>

        {/* Mandatory Google Limited Use Callout Box */}
        <section className="mb-12 rounded-xl border-2 border-primary/30 bg-primary/5 p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              G
            </div>
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-foreground sm:text-xl">
                {isEn
                  ? "Google API Services User Data Policy Compliance (Limited Use)"
                  : "Conformidade com a Política de Dados do Usuário dos Serviços de API do Google"}
              </h2>
              <p className="text-sm leading-relaxed text-foreground/90 sm:text-base">
                {isEn ? (
                  <>
                    SALA&apos;s use and transfer to any other app of information
                    received from Google APIs will adhere to the{" "}
                    <a
                      href="https://developers.google.com/terms/api-services-user-data-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-primary underline underline-offset-4 hover:opacity-80"
                    >
                      Google API Services User Data Policy
                    </a>
                    , including the Limited Use requirements.
                  </>
                ) : (
                  <>
                    O uso e a transferência para qualquer outro aplicativo de
                    informações recebidas das APIs do Google pelo SALA cumprirão
                    a{" "}
                    <a
                      href="https://developers.google.com/terms/api-services-user-data-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-primary underline underline-offset-4 hover:opacity-80"
                    >
                      Política de Dados do Usuário dos Serviços de API do Google
                    </a>
                    , incluindo os requisitos de Uso Limitado (Limited Use).
                  </>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                Official statement in English: &ldquo;SALA&apos;s use and transfer
                to any other app of information received from Google APIs will
                adhere to the Google API Services User Data Policy, including
                the Limited Use requirements.&rdquo;
              </p>
            </div>
          </div>
        </section>

        {/* Detailed Sections */}
        <div className="space-y-12 leading-relaxed text-muted-foreground">
          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">
              {isEn
                ? "1. Overview & Controller Information"
                : "1. Visão Geral e Identificação do Responsável"}
            </h2>
            <p>
              {isEn
                ? "This Privacy Policy describes the policies and practices of SALA regarding the collection, processing, storage, and transfer of personal data when you access or use our web application, features, and integrations."
                : "Esta Política de Privacidade descreve as diretrizes e práticas do SALA no que tange à coleta, tratamento, armazenamento e transferência de dados pessoais ao utilizar nossa plataforma, recursos e integrações associadas."}
            </p>
            <p>
              {isEn ? (
                <>
                  The data controller responsible for the application is the SALA
                  administrative team. If you have any inquiries, concerns, or
                  data protection requests, contact our Data Protection Officer
                  (DPO) at{" "}
                  <a
                    href="mailto:contact@vivacityhub.com"
                    className="font-medium text-foreground underline hover:text-primary"
                  >
                    contact@vivacityhub.com
                  </a>
                  .
                </>
              ) : (
                <>
                  O responsável pelo tratamento de dados da plataforma é a equipe
                  administrativa do SALA. Para quaisquer esclarecimentos,
                  dúvidas ou requisições relacionadas aos seus dados pessoais,
                  entre em contato com nosso Encarregado pelo Tratamento de Dados
                  Pessoais (DPO) através do e-mail:{" "}
                  <a
                    href="mailto:contact@vivacityhub.com"
                    className="font-medium text-foreground underline hover:text-primary"
                  >
                    contact@vivacityhub.com
                  </a>
                  .
                </>
              )}
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">
              {isEn
                ? "2. Information and Data We Collect"
                : "2. Informações e Dados Coletados"}
            </h2>
            <p>
              {isEn
                ? "We collect only the minimum personal data strictly necessary to fulfill the features of room scheduling and resource management:"
                : "Coletamos apenas os dados estritamente necessários para viabilizar as funcionalidades de agendamento de salas e gestão de recursos:"}
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>{isEn ? "User Profile Data: " : "Dados de Perfil: "}</strong>
                {isEn
                  ? "Full name, institutional email address, organization/sector association, and profile avatar."
                  : "Nome completo, endereço de e-mail institucional, vínculo com organização/setor e foto de perfil."}
              </li>
              <li>
                <strong>
                  {isEn
                    ? "Room Booking & Usage Records: "
                    : "Registros de Agendamento e Uso: "}
                </strong>
                {isEn
                  ? "Dates, start and end times, room identifiers, booking purpose/title, equipment requested, approval status, and incident logs."
                  : "Datas, horários de início e término, identificação de salas, finalidade/título do agendamento, recursos solicitados, status de aprovação e histórico de incidentes."}
              </li>
              <li>
                <strong>
                  {isEn ? "Technical & Session Logs: " : "Dados Técnicos e Sessão: "}
                </strong>
                {isEn
                  ? "IP address, browser type, device information, and session cookies necessary for secure user authentication."
                  : "Endereço IP, tipo de navegador, informações do dispositivo e cookies essenciais de sessão criptografados para garantir a segurança da autenticação."}
              </li>
            </ul>
          </section>

          {/* Section 3 - Google OAuth & Scopes */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">
              {isEn
                ? "3. Google API Data Access, Purpose & Integration"
                : "3. Integração com APIs do Google, Escopos e Finalidade de Uso"}
            </h2>
            <p>
              {isEn
                ? "SALA integrates with Google APIs via Google OAuth 2.0 to offer a seamless sign-in experience and automated calendar synchronization. Below are the specific Google scopes requested and their exact purpose:"
                : "O SALA integra-se aos serviços do Google através do protocolo Google OAuth 2.0 para autenticação e sincronização automática de compromissos. Abaixo estão descritos os escopos solicitados e sua finalidade exata:"}
            </p>

            <div className="space-y-4 pt-2">
              <div className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-muted px-2 py-1 font-mono text-xs text-foreground">
                    openid, email, profile
                  </span>
                  <span className="text-xs font-semibold text-primary">
                    {isEn ? "Basic Profile Scopes" : "Escopos de Perfil Básico"}
                  </span>
                </div>
                <h3 className="mt-2 text-base font-semibold text-foreground">
                  {isEn
                    ? "Google Identity & Authentication"
                    : "Identificação e Autenticação Google"}
                </h3>
                <p className="mt-1 text-sm">
                  {isEn
                    ? "Used exclusively to authenticate your identity, create or link your local user account, and display your name and email in the interface and approval workflows."
                    : "Utilizado exclusivamente para autenticar sua identidade com segurança, associar seu usuário à sua organização no SALA e exibir seu nome e e-mail nas solicitações e fluxos de aprovação de salas."}
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-muted px-2 py-1 font-mono text-xs text-foreground">
                    https://www.googleapis.com/auth/calendar
                  </span>
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    {isEn ? "Sensitive Scope" : "Escopo Sensível"}
                  </span>
                </div>
                <h3 className="mt-2 text-base font-semibold text-foreground">
                  {isEn
                    ? "Google Calendar Integration (Google Agenda)"
                    : "Integração com o Google Calendar (Google Agenda)"}
                </h3>
                <div className="mt-2 space-y-2 text-sm">
                  <p>
                    {isEn ? (
                      <>
                        <strong>Purpose:</strong> When you book a room or have a
                        reservation approved in SALA, our application creates a
                        corresponding calendar event on your primary Google
                        Calendar with the event title, scheduled time, and room
                        details. If a reservation is rescheduled or cancelled,
                        SALA automatically updates or removes that corresponding
                        event.
                      </>
                    ) : (
                      <>
                        <strong>Finalidade:</strong> Quando você realiza um
                        agendamento de sala ou quando sua reserva é aprovada no
                        SALA, nosso sistema cria automaticamente o evento
                        correspondente no seu Google Calendar principal,
                        incluindo sala, data, horário e detalhes da reserva. Caso
                        o agendamento seja remarcado ou cancelado, o SALA atualiza
                        ou remove o evento respectivo da sua agenda.
                      </>
                    )}
                  </p>
                  <p>
                    {isEn ? (
                      <>
                        <strong>Access Limitation:</strong> SALA only manages
                        calendar events that were created by or associated with
                        SALA room bookings. SALA{" "}
                        <strong className="text-foreground">
                          does not read, inspect, store, or modify any other
                          personal events
                        </strong>{" "}
                        or private calendar appointments in your Google Calendar.
                      </>
                    ) : (
                      <>
                        <strong>Limitação Estrita de Acesso:</strong> O SALA atua
                        única e exclusivamente nos eventos de calendário gerados
                        a partir de reservas do próprio sistema. O SALA{" "}
                        <strong className="text-foreground">
                          não lê, não analisa, não monitora e não altera nenhum
                          outro compromisso pessoal ou evento pré-existente
                        </strong>{" "}
                        na sua agenda Google.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 - Storage & Security */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">
              {isEn
                ? "4. Data Storage, Security & Token Management"
                : "4. Armazenamento Seguro, Proteção e Gestão de Tokens"}
            </h2>
            <p>
              {isEn
                ? "We implement robust administrative, technical, and physical security measures to protect user data against unauthorized access, alteration, or destruction:"
                : "Adotamos práticas rigorosas de segurança administrativa, técnica e física para resguardar seus dados contra acesso não autorizado, alteração ou perda:"}
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>
                  {isEn ? "OAuth Tokens Security: " : "Segurança dos Tokens OAuth: "}
                </strong>
                {isEn
                  ? "Google OAuth access and refresh tokens are stored securely in an isolated, encrypted database with restricted server-side access, strictly used for background calendar synchronization."
                  : "Os tokens de acesso e de atualização (access e refresh tokens) concedidos via Google OAuth são armazenados com segurança em banco de dados isolado e protegido, utilizados estritamente pelo servidor para a sincronização autorizada."}
              </li>
              <li>
                <strong>
                  {isEn ? "Encryption in Transit: " : "Criptografia em Trânsito: "}
                </strong>
                {isEn
                  ? "All data exchanged between your client browser, our servers, and Google APIs is encrypted using industry-standard TLS 1.3/HTTPS protocols."
                  : "Todo o tráfego de dados entre seu navegador, nossos servidores e os serviços do Google é criptografado utilizando protocolos padrão da indústria (TLS 1.3 / HTTPS)."}
              </li>
              <li>
                <strong>
                  {isEn
                    ? "Strict Access Controls: "
                    : "Controle de Acesso Baseado em Privilégios: "}
                </strong>
                {isEn
                  ? "Access to production infrastructure is strictly restricted to authorized administrative personnel and protected by multi-factor authentication."
                  : "O acesso à infraestrutura de banco de dados e servidores é restrito apenas a pessoal técnico autorizado e protegido por autenticação de múltiplos fatores."}
              </li>
            </ul>
          </section>

          {/* Section 5 - No Sharing, No Selling, No AI */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">
              {isEn
                ? "5. Data Sharing, Selling & Artificial Intelligence (AI) Policy"
                : "5. Não Compartilhamento, Não Venda de Dados e Inteligência Artificial"}
            </h2>
            <p>
              {isEn
                ? "We maintain a zero-monetization policy regarding user data:"
                : "Mantemos uma política estrita de não comercialização dos dados dos usuários:"}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="font-semibold text-foreground">
                  {isEn ? "🚫 No Selling of Data" : "🚫 Sem Venda de Dados"}
                </h3>
                <p className="mt-1 text-sm">
                  {isEn
                    ? "SALA never sells, rents, leases, trades, or commercializes any personal data or Google user data to data brokers or third parties."
                    : "O SALA nunca vende, aluga, comercializa ou transfere dados pessoais ou dados do Google para corretores de dados ou terceiros sob nenhuma hipótese."}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="font-semibold text-foreground">
                  {isEn ? "🚫 No Advertising" : "🚫 Sem Publicidade"}
                </h3>
                <p className="mt-1 text-sm">
                  {isEn
                    ? "Google user data is never used to serve personalized advertisements, retargeting campaigns, or behavioral marketing."
                    : "Os dados obtidos do Google nunca são utilizados para exibição de anúncios personalizados, campanhas de retargeting ou publicidade comportamental."}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 sm:col-span-2">
                <h3 className="font-semibold text-foreground">
                  {isEn
                    ? "🚫 No AI / Machine Learning Training"
                    : "🚫 Sem Treinamento de Modelos de IA / Machine Learning"}
                </h3>
                <p className="mt-1 text-sm">
                  {isEn
                    ? "Information received from Google APIs is never used to train generalized artificial intelligence models, machine learning algorithms, or large language models (LLMs)."
                    : "Nenhuma informação obtida através das APIs do Google é utilizada para treinar modelos de inteligência artificial, redes neurais ou modelos generativos de linguagem (LLMs)."}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {isEn
                ? "Data is processed only by essential infrastructure providers (cloud hosting and managed database services) operating under strict data processing agreements ensuring compliance with GDPR and LGPD."
                : "Os dados são processados exclusivamente por provedores essenciais de infraestrutura em nuvem (hospedagem e banco de dados gerenciado), sob contratos estritos de tratamento que garantem conformidade com a LGPD e GDPR."}
            </p>
          </section>

          {/* Section 6 - User Control, Revocation & Deletion */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">
              {isEn
                ? "6. User Rights, Access Revocation & Data Deletion"
                : "6. Direitos do Titular, Revogação de Acesso e Exclusão de Dados"}
            </h2>
            <p>
              {isEn
                ? "You remain in complete control of your data and permissions at all times:"
                : "Você possui total controle sobre seus dados e suas permissões a qualquer momento:"}
            </p>

            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-muted/40 p-5">
                <h3 className="font-semibold text-foreground">
                  {isEn
                    ? "How to Revoke Google Access Directly"
                    : "Como Revogar o Acesso do Google Diretamente"}
                </h3>
                <p className="mt-1 text-sm">
                  {isEn ? (
                    <>
                      You can revoke SALA&apos;s access to your Google Account at
                      any time by visiting Google&apos;s Security Settings page:{" "}
                      <a
                        href="https://myaccount.google.com/permissions"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary underline underline-offset-4 hover:opacity-80"
                      >
                        https://myaccount.google.com/permissions
                      </a>
                      . Once revoked, SALA will immediately lose all ability to
                      create or synchronize events with your Google Calendar.
                    </>
                  ) : (
                    <>
                      Você pode revogar a permissão concedida ao SALA na sua Conta
                      Google a qualquer instante acessando a página oficial de
                      permissões do Google:{" "}
                      <a
                        href="https://myaccount.google.com/permissions"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary underline underline-offset-4 hover:opacity-80"
                      >
                        https://myaccount.google.com/permissions
                      </a>
                      . Após a revogação, o SALA perderá imediatamente o acesso
                      para criar ou sincronizar eventos na sua agenda.
                    </>
                  )}
                </p>
              </div>

              <div className="rounded-lg border border-border bg-muted/40 p-5">
                <h3 className="font-semibold text-foreground">
                  {isEn
                    ? "Account & Data Deletion Requests"
                    : "Como Solicitar a Exclusão Definitiva de Dados"}
                </h3>
                <p className="mt-1 text-sm">
                  {isEn ? (
                    <>
                      Under LGPD and GDPR, you have the right to request access,
                      correction, export, or total deletion of all your personal
                      data and stored tokens. To request the complete deletion of
                      your user account and associated records, send an email to{" "}
                      <a
                        href="mailto:contact@vivacityhub.com"
                        className="font-semibold text-primary underline underline-offset-4"
                      >
                        contact@vivacityhub.com
                      </a>
                      . Requests are processed within 15 business days.
                    </>
                  ) : (
                    <>
                      Em conformidade com a LGPD e o GDPR, você tem o direito de
                      solicitar a confirmação, o acesso, a retificação ou a
                      exclusão definitiva de todos os seus dados e tokens do nosso
                      banco de dados. Para solicitar a exclusão de sua conta,
                      basta enviar um e-mail para{" "}
                      <a
                        href="mailto:contact@vivacityhub.com"
                        className="font-semibold text-primary underline underline-offset-4"
                      >
                        contact@vivacityhub.com
                      </a>
                      . As solicitações são processadas em até 15 dias úteis.
                    </>
                  )}
                </p>
              </div>
            </div>
          </section>

          {/* Section 7 - Cookies & Session */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">
              {isEn
                ? "7. Cookies & Session Technologies"
                : "7. Cookies e Tecnologias de Sessão"}
            </h2>
            <p>
              {isEn
                ? "SALA uses strictly essential cookies required for session persistence, user authentication, and CSRF protection. We do not employ third-party advertising cookies, behavioral tracking pixels, or cross-site fingerprinting."
                : "O SALA utiliza exclusivamente cookies estritamente necessários para a manutenção de sessões ativas, autenticação segura e proteção contra ataques CSRF. Não utilizamos cookies de publicidade comportamental ou rastreadores de terceiros."}
            </p>
          </section>

          {/* Section 8 - Policy Updates */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">
              {isEn
                ? "8. Updates to this Privacy Policy"
                : "8. Alterações nesta Política de Privacidade"}
            </h2>
            <p>
              {isEn
                ? "We may update this Privacy Policy from time to time to reflect modifications in our features, legal obligations, or Google API policy updates. The 'Last Updated' date at the top of this document will always reflect the latest revision. Continued use of the service following updates signifies acceptance."
                : "Podemos revisar esta Política de Privacidade periodicamente para refletir evoluções em nossas funcionalidades, requisitos legais ou atualizações nas diretrizes do Google. A data de 'Última atualização' no início deste documento indicará sempre a versão vigente."}
            </p>
          </section>

          {/* Section 9 - Contact */}
          <section className="space-y-4 rounded-xl border border-border bg-card p-6 sm:p-8">
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">
              {isEn
                ? "9. Contact and Data Protection Inquiries"
                : "9. Canal de Contato e Encarregado de Dados (DPO)"}
            </h2>
            <p>
              {isEn
                ? "For any inquiries, requests for data deletion, or questions regarding our privacy practices and compliance, contact us directly:"
                : "Para esclarecer qualquer dúvida sobre o tratamento de dados pessoais, exercer seus direitos ou reportar questões de privacidade, utilize nosso canal oficial de comunicação:"}
            </p>
            <div className="space-y-1 text-sm">
              <p>
                <strong className="text-foreground">App: </strong>
                SALA (Sistema de Agendamento e Gestão de Ambientes)
              </p>
              <p>
                <strong className="text-foreground">URL: </strong>
                <a
                  href="https://sala.ocaioaug.com.br"
                  className="text-primary hover:underline"
                >
                  https://sala.ocaioaug.com.br
                </a>
              </p>
              <p>
                <strong className="text-foreground">Email: </strong>
                <a
                  href="mailto:contact@vivacityhub.com"
                  className="font-medium text-primary hover:underline"
                >
                  contact@vivacityhub.com
                </a>
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8 text-center text-sm text-muted-foreground">
        <div className="mx-auto max-w-4xl flex flex-col items-center justify-between gap-4 sm:flex-row">
          <span>SALA · Agendamento e Gestão de Ambientes</span>
          <div className="flex gap-4">
            <Link
              href="/terms-of-service"
              className="hover:text-foreground transition-colors"
            >
              {isEn ? "Terms of Service" : "Termos de Serviço"}
            </Link>
            <Link
              href="/privacy-policy"
              className="text-foreground font-medium"
            >
              {isEn ? "Privacy Policy" : "Política de Privacidade"}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
