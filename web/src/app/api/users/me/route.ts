import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { writeAuditLog } from "@/lib/audit";
import { isNextResponse, requireAuth } from "@/lib/auth/platform";
import { resolvePrimaryOrganization } from "@/lib/auth/resolve-primary-organization";
import { prisma } from "@/lib/prisma";
import { isProfileComplete } from "@/lib/user/profile";
import { completeProfileSchema } from "@/lib/validations/user-profile";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (isNextResponse(auth)) return auth;

    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        phone: true,
        image: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return apiErrorResponse(ApiErrorCode.USER_NOT_FOUND, 404);
    }

    const resolved = await resolvePrimaryOrganization(auth.id);
    const { passwordHash, ...publicUser } = user;

    return NextResponse.json({
      ...publicUser,
      hasPassword: Boolean(passwordHash),
      profileComplete: isProfileComplete(user),
      hasOrganization: Boolean(resolved?.organizationId),
      organizationId: resolved?.organizationId ?? null,
      organizationName: resolved?.organizationName ?? null,
    });
  } catch (error) {
    console.error("Erro ao buscar usuário autenticado:", error);
    return apiInternalError();
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (isNextResponse(auth)) return auth;

    const body = await request.json();
    const data = completeProfileSchema.parse(body);

    const existingCpf = await prisma.user.findFirst({
      where: { cpf: data.cpf, id: { not: auth.id } },
      select: { id: true },
    });
    if (existingCpf) {
      return apiErrorResponse(ApiErrorCode.CPF_IN_USE, 409);
    }

    const user = await prisma.user.update({
      where: { id: auth.id },
      data: {
        cpf: data.cpf,
        phone: data.phone,
      },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        phone: true,
        image: true,
      },
    });

    await writeAuditLog({
      actorUserId: auth.id,
      action: "user.profile_completed",
      entityType: "User",
      entityId: auth.id,
      metadata: { cpf: data.cpf },
    });

    return NextResponse.json({
      ...user,
      profileComplete: isProfileComplete(user),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return apiErrorResponse(ApiErrorCode.INVALID_DATA, 400, {
        issues: error.issues,
      });
    }

    console.error("Erro ao atualizar perfil:", error);
    return apiInternalError();
  }
}
