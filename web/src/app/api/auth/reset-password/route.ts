import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { writeAuditLog } from "@/lib/audit";
import { hashPassword } from "@/lib/auth/password";
import { consumePasswordResetToken } from "@/lib/auth/password-reset-token";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = resetPasswordSchema.parse(body);

    const consumed = await consumePasswordResetToken(token);
    if (!consumed.ok) {
      const code =
        consumed.reason === "expired"
          ? ApiErrorCode.RESET_TOKEN_EXPIRED
          : ApiErrorCode.RESET_TOKEN_INVALID;
      return apiErrorResponse(code, 400);
    }

    const passwordHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: consumed.userId },
      data: { passwordHash },
    });

    await writeAuditLog({
      actorUserId: consumed.userId,
      action: "user.password_reset",
      entityType: "User",
      entityId: consumed.userId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return apiErrorResponse(ApiErrorCode.INVALID_DATA, 400, {
        issues: error.issues,
      });
    }

    console.error("Erro ao redefinir senha:", error);
    return apiInternalError();
  }
}
