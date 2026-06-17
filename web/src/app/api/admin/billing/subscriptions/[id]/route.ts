import { apiErrorResponse } from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { isNextResponse, requireSuperAdmin } from "@/lib/auth/platform";
import { prisma } from "@/lib/prisma";
import { updateSubscriptionSchema } from "@/lib/validations/admin";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSuperAdmin();
    if (isNextResponse(auth)) return auth;

    const { id } = await params;

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        plan: { select: { id: true, name: true, slug: true } },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            owner: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!subscription) {
      return apiErrorResponse(ApiErrorCode.ORGANIZATION_NOT_FOUND, 404);
    }

    return NextResponse.json(subscription);
  } catch (error) {
    console.error("Erro ao buscar assinatura admin:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSuperAdmin();
    if (isNextResponse(auth)) return auth;

    const { id } = await params;
    const body = await request.json();
    const data = updateSubscriptionSchema.parse(body);

    const existing = await prisma.subscription.findUnique({
      where: { id },
      include: { organization: true },
    });

    if (!existing) {
      return apiErrorResponse(ApiErrorCode.ORGANIZATION_NOT_FOUND, 404);
    }

    if (data.planId) {
      const plan = await prisma.plan.findUnique({ where: { id: data.planId } });
      if (!plan) {
        return apiErrorResponse(ApiErrorCode.PLAN_NOT_FOUND, 404);
      }
    }

    const subscription = await prisma.subscription.update({
      where: { id },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.currentPeriodEnd !== undefined
          ? { currentPeriodEnd: data.currentPeriodEnd }
          : {}),
        ...(data.planId !== undefined ? { planId: data.planId } : {}),
      },
      include: {
        plan: { select: { id: true, name: true, slug: true } },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            owner: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (data.planId) {
      await prisma.organization.update({
        where: { id: existing.organizationId },
        data: { planId: data.planId },
      });
    }

    await writeAuditLog({
      actorUserId: auth.id,
      action: "subscription.updated_by_super_admin",
      entityType: "Subscription",
      entityId: subscription.id,
      organizationId: existing.organizationId,
      metadata: { changes: data },
    });

    return NextResponse.json(subscription);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    console.error("Erro ao atualizar assinatura admin:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
