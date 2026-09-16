type PasswordResetEmailParams = {
  resetUrl: string;
  locale?: string;
};

export function buildPasswordResetEmail({
  resetUrl,
}: PasswordResetEmailParams) {
  const subject = "Redefinir sua senha — SALA";

  const text = [
    "Recebemos uma solicitação para redefinir a senha da sua conta SALA.",
    "",
    "Se foi você, acesse o link abaixo (válido por 1 hora):",
    resetUrl,
    "",
    "Se você não solicitou, ignore este e-mail. Sua senha permanece a mesma.",
  ].join("\n");

  const html = `
 <p>Recebemos uma solicitação para redefinir a senha da sua conta SALA.</p>
 <p>Se foi você, clique no link abaixo (válido por 1 hora):</p>
 <p><a href="${resetUrl}">Redefinir senha</a></p>
 <p>Se você não solicitou, ignore este e-mail. Sua senha permanece a mesma.</p>
 `.trim();

  return { subject, text, html };
}
