import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade - SALA",
  description:
    "Política de Privacidade do Sistema SALA - como coletamos e tratamos seus dados pessoais.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "15 de abril de 2026";

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/auth/login"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors mb-6 inline-block"
          >
            ← Voltar ao login
          </Link>
          <h1 className="text-3xl font-bold text-white mt-2">
            Política de Privacidade
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            Última atualização: {lastUpdated}
          </p>
        </div>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          {/* Introdução */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              1. Introdução
            </h2>
            <p>
              O <strong className="text-white">SALA</strong> (Sistema de
              Gerenciamento de Salas) é operado pela instituição responsável por
              seu ambiente. Esta Política de Privacidade descreve como coletamos,
              usamos, armazenamos e protegemos suas informações pessoais ao
              utilizar o sistema, em conformidade com a{" "}
              <strong className="text-white">
                Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)
              </strong>
              .
            </p>
          </section>

          {/* Dados coletados */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              2. Dados Coletados
            </h2>
            <p className="mb-3">
              Ao utilizar o SALA, podemos coletar as seguintes categorias de
              dados:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                <strong className="text-white">Dados de identificação:</strong>{" "}
                nome completo e endereço de e-mail fornecidos pela sua conta
                Google via OAuth 2.0.
              </li>
              <li>
                <strong className="text-white">Foto de perfil:</strong> imagem
                de perfil associada à sua conta Google ou enviada manualmente.
              </li>
              <li>
                <strong className="text-white">Dados de uso:</strong> informações
                sobre reservas criadas, cancelamentos, incidentes reportados e
                interações no sistema.
              </li>
              <li>
                <strong className="text-white">Tokens de autenticação:</strong>{" "}
                tokens OAuth2 (access e refresh token) necessários para
                integração com o Google Calendar, armazenados de forma segura no
                banco de dados.
              </li>
              <li>
                <strong className="text-white">
                  Tokens de notificação push:
                </strong>{" "}
                identificador do dispositivo móvel para envio de notificações,
                caso o aplicativo mobile seja utilizado.
              </li>
            </ul>
          </section>

          {/* Finalidade */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              3. Finalidade do Tratamento
            </h2>
            <p className="mb-3">
              Os dados são utilizados exclusivamente para as seguintes
              finalidades:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>Autenticação e controle de acesso ao sistema.</li>
              <li>
                Gerenciamento de reservas de salas e equipamentos da
                instituição.
              </li>
              <li>
                Envio de notificações sobre o status de suas solicitações
                (aprovações, rejeições, cancelamentos).
              </li>
              <li>
                Sincronização de eventos de reserva com o Google Calendar
                pessoal do usuário, quando autorizado.
              </li>
              <li>Registro e acompanhamento de incidentes.</li>
              <li>
                Geração de estatísticas de uso para administradores da
                instituição.
              </li>
            </ul>
          </section>

          {/* Base legal */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              4. Base Legal
            </h2>
            <p>
              O tratamento de dados é realizado com base no{" "}
              <strong className="text-white">
                legítimo interesse da instituição
              </strong>{" "}
              (Art. 7º, IX da LGPD) para o gerenciamento de seus espaços e
              recursos, e no{" "}
              <strong className="text-white">consentimento do usuário</strong>{" "}
              (Art. 7º, I da LGPD) para funcionalidades opcionais como a
              integração com o Google Calendar.
            </p>
          </section>

          {/* Compartilhamento */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              5. Compartilhamento de Dados
            </h2>
            <p className="mb-3">
              Seus dados pessoais não são comercializados ou compartilhados com
              terceiros para fins comerciais. O compartilhamento ocorre apenas
              com:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                <strong className="text-white">Google LLC:</strong> para
                autenticação via OAuth 2.0 e, quando autorizado, sincronização
                com o Google Calendar. Sujeito à{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Política de Privacidade do Google
                </a>
                .
              </li>
              <li>
                <strong className="text-white">Cloudinary:</strong> para
                armazenamento e otimização de imagens de perfil e itens.
              </li>
              <li>
                <strong className="text-white">Expo / Firebase:</strong> para
                entrega de notificações push ao aplicativo mobile, quando
                aplicável.
              </li>
            </ul>
          </section>

          {/* Retenção */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              6. Retenção de Dados
            </h2>
            <p>
              Seus dados são mantidos enquanto sua conta estiver ativa no
              sistema. Registros de reservas e incidentes são retidos para fins
              de auditoria e histórico institucional. Você pode solicitar a
              exclusão dos seus dados a qualquer momento através dos canais de
              contato da instituição.
            </p>
          </section>

          {/* Direitos */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              7. Seus Direitos (LGPD)
            </h2>
            <p className="mb-3">
              Nos termos da LGPD, você tem direito a:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>Confirmar a existência de tratamento dos seus dados.</li>
              <li>Acessar seus dados pessoais tratados pelo sistema.</li>
              <li>
                Corrigir dados incompletos, inexatos ou desatualizados.
              </li>
              <li>
                Solicitar a anonimização, bloqueio ou eliminação de dados
                desnecessários.
              </li>
              <li>
                Revogar o consentimento para funcionalidades opcionais (como
                integração com Google Calendar) a qualquer momento.
              </li>
              <li>
                Opor-se ao tratamento realizado em descumprimento à legislação.
              </li>
            </ul>
            <p className="mt-3">
              Para exercer seus direitos, entre em contato com o administrador
              responsável pelo sistema em sua instituição.
            </p>
          </section>

          {/* Segurança */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              8. Segurança
            </h2>
            <p>
              Adotamos medidas técnicas e organizacionais adequadas para
              proteger seus dados contra acesso não autorizado, alteração,
              divulgação ou destruição. O sistema utiliza HTTPS em todas as
              comunicações, autenticação segura via OAuth 2.0, tokens com prazo
              de expiração e controle de acesso baseado em papéis (RBAC).
            </p>
          </section>

          {/* Alterações */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              9. Alterações nesta Política
            </h2>
            <p>
              Esta Política de Privacidade pode ser atualizada periodicamente.
              Alterações significativas serão comunicadas por meio do sistema.
              Recomendamos a revisão periódica deste documento.
            </p>
          </section>

          {/* Contato */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              10. Contato
            </h2>
            <p>
              Dúvidas ou solicitações relacionadas a esta Política de
              Privacidade devem ser encaminhadas ao administrador responsável
              pelo sistema SALA em sua instituição.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-800 text-center">
          <Link
            href="/auth/login"
            className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
          >
            Voltar ao login
          </Link>
          <span className="text-gray-600 mx-3">·</span>
          <Link
            href="/terms-of-service"
            className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
          >
            Termos de Serviço
          </Link>
        </div>
      </div>
    </div>
  );
}
