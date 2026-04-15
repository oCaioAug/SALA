import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos de Serviço - SALA",
  description:
    "Termos de Serviço do Sistema SALA - condições de uso do sistema de gerenciamento de salas.",
};

export default function TermsOfServicePage() {
  const lastUpdated = "15 de abril de 2026";

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors mb-6 inline-block"
          >
            ← Voltar ao início
          </Link>
          <h1 className="text-3xl font-bold text-white mt-2">
            Termos de Serviço
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            Última atualização: {lastUpdated}
          </p>
        </div>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          {/* Aceitação */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              1. Aceitação dos Termos
            </h2>
            <p>
              Ao acessar ou utilizar o{" "}
              <strong className="text-white">SALA</strong> (Sistema de
              Gerenciamento de Salas), você concorda com estes Termos de
              Serviço. Caso não concorde com qualquer disposição, não utilize o
              sistema.
            </p>
          </section>

          {/* Descrição */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              2. Descrição do Serviço
            </h2>
            <p>
              O SALA é um sistema institucional para gerenciamento de reservas
              de salas e equipamentos, controle de incidentes, e comunicação
              entre usuários e administradores. O acesso é restrito a membros
              autorizados da instituição.
            </p>
          </section>

          {/* Elegibilidade */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              3. Elegibilidade e Acesso
            </h2>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                O acesso requer autenticação via conta Google vinculada à
                instituição.
              </li>
              <li>
                Contas são criadas automaticamente no primeiro login (provisionamento
                just-in-time) e podem ser desativadas pelo administrador.
              </li>
              <li>
                Cada usuário é responsável pela segurança de suas credenciais de
                acesso.
              </li>
              <li>
                O compartilhamento de conta com terceiros é proibido.
              </li>
            </ul>
          </section>

          {/* Reservas */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              4. Regras de Uso — Reservas
            </h2>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                Reservas devem ser feitas exclusivamente para finalidades
                legítimas e relacionadas às atividades da instituição.
              </li>
              <li>
                Reservas de usuários comuns ficam sujeitas à aprovação de um
                Administrador antes de serem confirmadas.
              </li>
              <li>
                O cancelamento de reservas deve ser realizado com antecedência
                razoável para permitir que outros usuários utilizem o espaço.
              </li>
              <li>
                Reservas recorrentes podem ser canceladas individualmente ou em
                série.
              </li>
              <li>
                O uso indevido do sistema de reservas (reservas fictícias,
                bloqueio malicioso de salas etc.) pode resultar na suspensão do
                acesso.
              </li>
            </ul>
          </section>

          {/* Incidentes */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              5. Reporte de Incidentes
            </h2>
            <p>
              Os usuários devem reportar incidentes relacionados às salas e
              equipamentos de forma precisa e responsável. Relatórios
              intencionalmente falsos ou abusivos podem resultar em sanções
              disciplinares conforme as normas da instituição.
            </p>
          </section>

          {/* Condutas proibidas */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              6. Condutas Proibidas
            </h2>
            <p className="mb-3">É expressamente proibido:</p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>Tentar acessar áreas ou dados restritos sem autorização.</li>
              <li>
                Realizar engenharia reversa, decompilação ou qualquer tentativa
                de comprometer a segurança do sistema.
              </li>
              <li>
                Utilizar o sistema para fins ilícitos ou que violem as normas
                da instituição.
              </li>
              <li>
                Inserir dados falsos, enganosos ou que prejudiquem outros
                usuários.
              </li>
              <li>
                Sobrecarregar intencionalmente os servidores do sistema
                (ataques de negação de serviço).
              </li>
            </ul>
          </section>

          {/* Integrações externas */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              7. Integrações com Serviços Externos
            </h2>
            <p>
              O SALA pode se integrar a serviços externos como Google Calendar
              mediante autorização explícita do usuário. Ao conceder acesso, o
              usuário está sujeito também aos termos dos respectivos serviços
              externos. O SALA não se responsabiliza por indisponibilidades ou
              alterações nesses serviços.
            </p>
          </section>

          {/* Disponibilidade */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              8. Disponibilidade do Serviço
            </h2>
            <p>
              A instituição envidará esforços para manter o sistema disponível
              continuamente. No entanto, interrupções para manutenção, atualizações
              ou por motivos de força maior podem ocorrer sem aviso prévio. Não
              há garantia de disponibilidade ininterrupta.
            </p>
          </section>

          {/* Responsabilidade */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              9. Limitação de Responsabilidade
            </h2>
            <p>
              O sistema é fornecido "no estado em que se encontra" para uso
              institucional interno. A instituição não se responsabiliza por
              danos decorrentes de uso indevido, perda de dados por falhas de
              terceiros (Google, Cloudinary etc.) ou decisões de negócio tomadas
              com base nas informações exibidas no sistema.
            </p>
          </section>

          {/* Modificações */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              10. Modificações dos Termos
            </h2>
            <p>
              Estes Termos podem ser atualizados a qualquer momento. A
              continuidade do uso do sistema após as alterações implica a
              aceitação dos novos termos. Comunicações sobre alterações
              relevantes serão enviadas por meio das notificações do sistema.
            </p>
          </section>

          {/* Contato */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              11. Contato
            </h2>
            <p>
              Dúvidas sobre estes Termos de Serviço devem ser direcionadas ao
              administrador responsável pelo sistema SALA em sua instituição.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-800 text-center">
          <Link
            href="/"
            className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
          >
            Página inicial
          </Link>
          <span className="text-gray-600 mx-3">·</span>
          <Link
            href="/privacy-policy"
            className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
          >
            Política de Privacidade
          </Link>
        </div>
      </div>
    </div>
  );
}
