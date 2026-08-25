import { NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";

import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { resolveLoginIntent } from "@/lib/auth/login-intent";
import { prisma } from "@/lib/prisma";

const loginIntentSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = loginIntentSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { passwordHash: true },
    });

    return NextResponse.json(resolveLoginIntent(user));
  } catch (error) {
    if (error instanceof ZodError) {
      return apiErrorResponse(ApiErrorCode.EMAIL_INVALID, 400, {
        issues: error.issues,
      });
    }

    console.error("Erro ao verificar intenção de login:", error);
    return apiInternalError();
  }
}
