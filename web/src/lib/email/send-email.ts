import nodemailer from "nodemailer";

type SendEmailParams = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM;

  if (!host || !from) {
    throw new Error("SMTP_HOST and EMAIL_FROM must be configured");
  }

  return {
    from,
    transport: nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    }),
  };
}

export async function sendEmail({ to, subject, text, html }: SendEmailParams) {
  const { from, transport } = getSmtpConfig();

  await transport.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}

export function isEmailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.EMAIL_FROM);
}
