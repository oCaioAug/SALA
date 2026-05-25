import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { isNextResponse, requireSuperAdmin } from "@/lib/auth/platform";
import { prisma } from "@/lib/prisma";
import { updateSubscriptionSchema } from "@/lib/validations/admin";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireSuperAdmin();
    if (isNextResponse(auth)) return auth;

    const { id: organizationId } = await params;
    const body = await request.json();
    const data = updateSubscriptionSchema.parse(body);

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: { subscription: true },
    });

    if (!organization) {
      return apiErrorResponse(ApiErrorCode.ORGANIZATION_NOT_FOUND, 404);
    }

    if (data.planId) {
      const plan = await prisma.plan.findUnique({ where: { id: data.planId } });
      if (!plan) {
        return apiErrorResponse(ApiErrorCode.PLAN_NOT_FOUND, 404);
      }
    }

    const subscriptionData = {
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.currentPeriodEnd !== undefined
        ? { currentPeriodEnd: data.currentPeriodEnd }
        : {}),
      ...(data.planId !== undefined ? { planId: data.planId } : {}),
    };

    let subscription;
    if (organization.subscription) {
      subscription = await prisma.subscription.update({
        where: { organizationId },
        data: subscriptionData,
        include: { plan: true },
      });
    } else if (data.planId) {
      subscription = await prisma.subscription.create({
        data: {
          organizationId,
          planId: data.planId,
          currentPeriodEnd:
            data.currentPeriodEnd ??
            new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          ...(data.status !== undefined ? { status: data.status } : {}),
        },
        include: { plan: true },
      });
    } else {
      return NextResponse.json(
        { error: "Organização sem assinatura. Informe planId." },
        { status: 400 }
      );
    }

    if (data.planId) {
      await prisma.organization.update({
        where: { id: organizationId },
        data: { planId: data.planId },
      });
    }

    await writeAuditLog({
      actorUserId: auth.id,
      action: "subscription.updated",
      entityType: "Subscription",
      entityId: subscription.id,
      organizationId,
      metadata: { changes: data },
    });

    return NextResponse.json(subscription);
  } catch (error) {
    console.error("Erro ao atualizar assinatura:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
