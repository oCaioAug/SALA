import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { apiInternalError } from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { writeAuditLog } from "@/lib/audit";
import { createPasswordResetToken } from "@/lib/auth/password-reset-token";
import { buildPasswordResetEmail } from "@/lib/email/templates/password-reset";
import { isEmailConfigured, sendEmail } from "@/lib/email/send-email";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations/auth";

const GENERIC_MESSAGE =
  "Se existir uma conta com senha para este e-mail, enviaremos um link de redefinição.";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, passwordHash: true },
    });

    if (user?.passwordHash && isEmailConfigured()) {
      const token = await createPasswordResetToken(user.id);
      const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
      const resetUrl = `${baseUrl}/auth/reset-password?token=${encodeURIComponent(token)}`;
      const { subject, text, html } = buildPasswordResetEmail({ resetUrl });

      await sendEmail({
        to: user.email,
        subject,
        text,
        html,
      });

      await writeAuditLog({
        actorUserId: user.id,
        action: "user.password_reset_requested",
        entityType: "User",
        entityId: user.id,
      });
    } else if (user?.passwordHash && !isEmailConfigured()) {
      console.warn(
        "Forgot password requested but SMTP is not configured (user:",
        user.id,
        ")"
      );
    }

    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { errorCode: ApiErrorCode.EMAIL_INVALID, message: GENERIC_MESSAGE },
        { status: 400 }
      );
    }

    console.error("Erro ao solicitar reset de senha:", error);
    return apiInternalError();
  }
}
