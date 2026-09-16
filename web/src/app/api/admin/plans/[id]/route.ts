import {
  apiErrorResponse,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { isNextResponse, requireSuperAdmin } from "@/lib/auth/platform";
import { prisma } from "@/lib/prisma";
import { planUpdateSchema } from "@/lib/validations/admin";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireSuperAdmin();
    if (isNextResponse(auth)) return auth;

    const { id } = await params;
    const body = await request.json();
    const data = planUpdateSchema.parse(body);

    const existing = await prisma.plan.findUnique({ where: { id } });
    if (!existing) {
      return apiErrorResponse(ApiErrorCode.PLAN_NOT_FOUND, 404);
    }

    if (data.slug && data.slug !== existing.slug) {
      const slugTaken = await prisma.plan.findUnique({
        where: { slug: data.slug },
      });
      if (slugTaken) {
        return apiErrorResponse(ApiErrorCode.SLUG_IN_USE, 409);
      }
    }

    const plan = await prisma.plan.update({
      where: { id },
      data,
    });

    await writeAuditLog({
      actorUserId: auth.id,
      action: "plan.updated",
      entityType: "Plan",
      entityId: plan.id,
      metadata: { changes: data },
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Erro ao atualizar plano:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
