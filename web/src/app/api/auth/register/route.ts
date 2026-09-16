import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { writeAuditLog } from "@/lib/audit";
import { RegisterConflictError, registerUser } from "@/lib/auth/register-user";
import { accountRegisterSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = accountRegisterSchema.parse(body);

    const user = await registerUser(data);

    await writeAuditLog({
      actorUserId: user.id,
      action: "user.registered",
      entityType: "User",
      entityId: user.id,
      metadata: {
        email: user.email,
      },
    });

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
        oauth: ApiErrorCode.OAUTH_ONLY_ACCOUNT,
      } as const;
      return apiErrorResponse(codeMap[error.field], 409);
    }

    console.error("Erro no cadastro:", error);
    return apiInternalError();
  }
}
