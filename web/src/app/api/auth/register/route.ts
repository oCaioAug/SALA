import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { writeAuditLog } from "@/lib/audit";
import {
  RegisterConflictError,
  registerUserWithOrganization,
} from "@/lib/auth/register-user";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    const user = await registerUserWithOrganization(data);

    const organization = await prisma.organization.findFirst({
      where: { ownerId: user.id },
      select: { id: true, name: true, slug: true },
    });

    if (organization) {
      await writeAuditLog({
        actorUserId: user.id,
        action: "user.registered",
        entityType: "User",
        entityId: user.id,
        organizationId: organization.id,
        metadata: {
          email: user.email,
          organizationName: organization.name,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return apiErrorResponse(ApiErrorCode.INVALID_DATA, 400, {
        issues: error.issues,
      });
    }

    if (error instanceof RegisterConflictError) {
      const codeMap = {
        email: ApiErrorCode.EMAIL_IN_USE,
        cpf: ApiErrorCode.CPF_IN_USE,
        cnpj: ApiErrorCode.CNPJ_IN_USE,
      } as const;
      return apiErrorResponse(codeMap[error.field], 409);
    }

    if (error instanceof Error && error.message === "INVALID_PLAN") {
      return apiErrorResponse(ApiErrorCode.INVALID_DATA, 400, {
        issues: [{ path: ["planId"], message: "Plano inválido ou indisponível" }],
      });
    }

    console.error("Erro no cadastro:", error);
    return apiInternalError();
  }
}
