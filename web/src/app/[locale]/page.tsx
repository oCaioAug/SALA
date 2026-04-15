// src/app/[locale]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "S.A.L.A. — Sistema de Agendamento e Locação de Ambientes",
  description:
    "S.A.L.A. é um sistema institucional para gerenciamento de reservas de salas e espaços, controle de incidentes e comunicação entre usuários e administradores.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-white text-lg tracking-tight">
              S.A.L.A.
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/terms-of-service"
              className="text-sm text-gray-400 hover:text-gray-200 transition-colors hidden sm:block"
            >
              Termos de Serviço
            </Link>
            <Link
              href="/privacy-policy"
              className="text-sm text-gray-400 hover:text-gray-200 transition-colors hidden sm:block"
            >
              Privacidade
            </Link>
            <Link
              href="/auth/login"
              className="text-sm bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              Entrar
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        {/* Background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
        >
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-blue-600/8 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm px-4 py-1.5 rounded-full mb-8">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            Sistema Institucional
          </div>

          {/* Title */}
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            <span className="text-white">S.A.L.A.</span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              Gerenciamento inteligente
            </span>
            <br />
            <span className="text-white">de espaços</span>
          </h1>

          {/* Subtitle */}
          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            <strong className="text-gray-200">
              Sistema de Agendamento e Locação de Ambientes.
            </strong>{" "}
            Uma plataforma institucional para reserva de salas, controle de
            equipamentos e gestão de incidentes — tudo em um só lugar.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/login"
              id="cta-login"
              className="w-full sm:w-auto bg-violet-600 hover:bg-violet-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 text-base shadow-lg shadow-violet-600/20 hover:shadow-violet-500/30 hover:-translate-y-0.5"
            >
              Acessar o sistema →
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto text-gray-300 hover:text-white border border-gray-700 hover:border-gray-500 font-medium px-8 py-3.5 rounded-xl transition-all duration-200 text-base"
            >
              Conhecer recursos
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Tudo que sua instituição precisa
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              O S.A.L.A. facilita o gerenciamento de espaços físicos para
              escolas, universidades e organizações institucionais.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 hover:border-violet-500/30 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-violet-500/15 flex items-center justify-center mb-4 group-hover:bg-violet-500/25 transition-colors">
                <span className="text-2xl" role="img" aria-label="Calendário">
                  📅
                </span>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">
                Reserva de Salas
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Agende salas e espaços de forma simples, com visualização em
                calendário e suporte a reservas recorrentes (diárias, semanais
                ou mensais).
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center mb-4 group-hover:bg-blue-500/25 transition-colors">
                <span
                  className="text-2xl"
                  role="img"
                  aria-label="Aprovação"
                >
                  ✅
                </span>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">
                Fluxo de Aprovação
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Solicitações de reserva passam por aprovação de administradores,
                garantindo controle adequado e rastreabilidade de todos os
                agendamentos.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 hover:border-emerald-500/30 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center mb-4 group-hover:bg-emerald-500/25 transition-colors">
                <span
                  className="text-2xl"
                  role="img"
                  aria-label="Incidentes"
                >
                  🔧
                </span>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">
                Gestão de Incidentes
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Reporte e acompanhe problemas em salas e equipamentos com
                categorização por prioridade, assignação de responsáveis e
                histórico de resolução.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 hover:border-amber-500/30 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center mb-4 group-hover:bg-amber-500/25 transition-colors">
                <span
                  className="text-2xl"
                  role="img"
                  aria-label="Notificações"
                >
                  🔔
                </span>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">
                Notificações em Tempo Real
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Receba notificações sobre aprovações, rejeições e lembretes de
                reservas. Integração com notificações push para o app mobile.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 hover:border-pink-500/30 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-pink-500/15 flex items-center justify-center mb-4 group-hover:bg-pink-500/25 transition-colors">
                <span
                  className="text-2xl"
                  role="img"
                  aria-label="Google Calendar"
                >
                  🗓️
                </span>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">
                Integração Google Calendar
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Sincronize automaticamente suas reservas aprovadas com o Google
                Calendar pessoal, mantendo sua agenda sempre atualizada.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 hover:border-cyan-500/30 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/15 flex items-center justify-center mb-4 group-hover:bg-cyan-500/25 transition-colors">
                <span
                  className="text-2xl"
                  role="img"
                  aria-label="Autenticação"
                >
                  🔐
                </span>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">
                Login com Google
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Acesso seguro via OAuth 2.0 com conta Google institucional.
                Contas são provisionadas automaticamente no primeiro acesso.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-gray-900/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Como funciona
            </h2>
            <p className="text-gray-400">
              Em poucos passos, sua instituição tem controle total dos espaços.
            </p>
          </div>

          <div className="space-y-8">
            {[
              {
                step: "01",
                title: "Entre com sua conta Google",
                description:
                  "Faça login com sua conta Google institucional. Nenhum cadastro manual necessário — o sistema cria sua conta automaticamente.",
                color: "violet",
              },
              {
                step: "02",
                title: "Visualize e reserve uma sala",
                description:
                  "Navegue pelo dashboard para ver a disponibilidade das salas em tempo real. Clique em uma sala e escolha o horário desejado.",
                color: "blue",
              },
              {
                step: "03",
                title: "Aguarde a aprovação",
                description:
                  "Sua solicitação é enviada para um administrador, que aprova ou rejeita com justificativa. Você recebe uma notificação instantânea.",
                color: "emerald",
              },
              {
                step: "04",
                title: "Use o espaço",
                description:
                  "Com a reserva aprovada, o espaço fica reservado para você. Em caso de problemas, relate incidentes diretamente no sistema.",
                color: "amber",
              },
            ].map(item => (
              <div
                key={item.step}
                className="flex gap-6 items-start group"
              >
                <div
                  className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg
                  ${item.color === "violet" ? "bg-violet-500/15 text-violet-400" : ""}
                  ${item.color === "blue" ? "bg-blue-500/15 text-blue-400" : ""}
                  ${item.color === "emerald" ? "bg-emerald-500/15 text-emerald-400" : ""}
                  ${item.color === "amber" ? "bg-amber-500/15 text-amber-400" : ""}
                `}
                >
                  {item.step}
                </div>
                <div className="pt-1">
                  <h3 className="text-white font-semibold text-lg mb-1">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
        >
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-violet-600/8 rounded-full blur-3xl" />
        </div>
        <div className="max-w-2xl mx-auto text-center relative">
          <h2 className="text-3xl font-bold text-white mb-4">
            Pronto para organizar os espaços da sua instituição?
          </h2>
          <p className="text-gray-400 mb-8">
            Faça login com sua conta institucional Google e comece a gerenciar
            salas de forma eficiente.
          </p>
          <Link
            href="/auth/login"
            id="cta-login-bottom"
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 text-base shadow-lg shadow-violet-600/20 hover:shadow-violet-500/30 hover:-translate-y-0.5"
          >
            Acessar o S.A.L.A. →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <span className="text-gray-400 text-sm">
              S.A.L.A. — Sistema de Agendamento e Locação de Ambientes
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/terms-of-service"
              className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
            >
              Termos de Serviço
            </Link>
            <Link
              href="/privacy-policy"
              className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
            >
              Política de Privacidade
            </Link>
            <Link
              href="/auth/login"
              className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
