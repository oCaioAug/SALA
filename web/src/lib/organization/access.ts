import { OrganizationStatus, SubscriptionStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export type OrganizationAccessBlockCode =
  | "NOT_FOUND"
  | "SUSPENDED"
  | "TRIAL_EXPIRED"
  | "SUBSCRIPTION_INACTIVE";

export type OrganizationAccessResult =
  | { allowed: true }
  | {
      allowed: false;
      reason: string;
      code: OrganizationAccessBlockCode;
    };

export async function checkOrganizationAccess(
  organizationId: string
): Promise<OrganizationAccessResult> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      status: true,
      deletedAt: true,
      subscription: {
        select: {
          status: true,
          currentPeriodEnd: true,
        },
      },
    },
  });

  if (!org || org.deletedAt) {
    return {
      allowed: false,
      reason: "Organização não encontrada ou desativada",
      code: "NOT_FOUND",
    };
  }

  if (org.status === OrganizationStatus.SUSPENDED) {
    return {
      allowed: false,
      reason:
        "Esta organização está suspensa. Entre em contato com o suporte SALA.",
      code: "SUSPENDED",
    };
  }

  if (org.status === OrganizationStatus.TRIAL) {
    const periodEnd = org.subscription?.currentPeriodEnd;
    if (periodEnd && periodEnd < new Date()) {
      return {
        allowed: false,
        reason:
          "O período de trial expirou. Entre em contato para ativar sua conta.",
        code: "TRIAL_EXPIRED",
      };
    }
  }

  const subscription = org.subscription;
  if (
    subscription &&
    (subscription.status === SubscriptionStatus.CANCELLED ||
      subscription.status === SubscriptionStatus.PAST_DUE)
  ) {
    return {
      allowed: false,
      reason:
        "Assinatura inativa. Regularize o pagamento para continuar usando a plataforma.",
      code: "SUBSCRIPTION_INACTIVE",
    };
  }

  return { allowed: true };
}

export async function ensureOrganizationOperational(
  organizationId: string
): Promise<NextResponse<{ error: string }> | null> {
  const access = await checkOrganizationAccess(organizationId);
  if (!access.allowed) {
    return NextResponse.json({ error: access.reason }, { status: 403 });
  }
  return null;
}
