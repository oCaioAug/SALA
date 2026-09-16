import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { writeAuditLog } from "@/lib/audit";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { isNextResponse, requireAuth } from "@/lib/auth/platform";
import { prisma } from "@/lib/prisma";
import {
  changePasswordSchema,
  setPasswordSchema,
} from "@/lib/validations/auth";

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (isNextResponse(auth)) return auth;

    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      return apiErrorResponse(ApiErrorCode.USER_NOT_FOUND, 404);
    }

    const body = await request.json();
    const hasPassword = Boolean(user.passwordHash);

    if (hasPassword) {
      const data = changePasswordSchema.parse(body);
      const currentValid = await verifyPassword(
        data.currentPassword,
        user.passwordHash as string
      );
      if (!currentValid) {
        return apiErrorResponse(ApiErrorCode.CURRENT_PASSWORD_INVALID, 400);
      }

      const passwordHash = await hashPassword(data.password);
      await prisma.user.update({
        where: { id: auth.id },
        data: { passwordHash },
      });

      await writeAuditLog({
        actorUserId: auth.id,
        action: "user.password_changed",
        entityType: "User",
        entityId: auth.id,
      });

      return NextResponse.json({ hasPassword: true });
    }

    const data = setPasswordSchema.parse(body);
    const passwordHash = await hashPassword(data.password);
    await prisma.user.update({
      where: { id: auth.id },
      data: { passwordHash },
    });

    await writeAuditLog({
      actorUserId: auth.id,
      action: "user.password_set",
      entityType: "User",
      entityId: auth.id,
    });

    return NextResponse.json({ hasPassword: true });
  } catch (error) {
    if (error instanceof ZodError) {
      if (error.issues.some(issue => issue.path?.[0] === "currentPassword")) {
        return apiErrorResponse(ApiErrorCode.CURRENT_PASSWORD_REQUIRED, 400, {
          issues: error.issues,
        });
      }
      return apiErrorResponse(ApiErrorCode.INVALID_DATA, 400, {
        issues: error.issues,
      });
    }

    console.error("Erro ao atualizar senha:", error);
    return apiInternalError();
  }
}
