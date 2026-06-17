import { apiErrorResponse } from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { SubscriptionStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { isNextResponse, requireSuperAdmin } from "@/lib/auth/platform";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const auth = await requireSuperAdmin();
    if (isNextResponse(auth)) return auth;

    const now = new Date();
    const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const activeOrgFilter = { deletedAt: null };

    const [
      active,
      trialing,
      pastDue,
      cancelled,
      total,
      expiringSoon,
      orgsWithoutSubscription,
    ] = await Promise.all([
      prisma.subscription.count({
        where: {
          status: SubscriptionStatus.ACTIVE,
          organization: activeOrgFilter,
        },
      }),
      prisma.subscription.count({
        where: {
          status: SubscriptionStatus.TRIALING,
          organization: activeOrgFilter,
        },
      }),
      prisma.subscription.count({
        where: {
          status: SubscriptionStatus.PAST_DUE,
          organization: activeOrgFilter,
        },
      }),
      prisma.subscription.count({
        where: {
          status: SubscriptionStatus.CANCELLED,
          organization: activeOrgFilter,
        },
      }),
      prisma.subscription.count({
        where: { organization: activeOrgFilter },
      }),
      prisma.subscription.count({
        where: {
          status: {
            in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
          },
          currentPeriodEnd: { gte: now, lte: inSevenDays },
          organization: activeOrgFilter,
        },
      }),
      prisma.organization.count({
        where: { ...activeOrgFilter, subscription: null },
      }),
    ]);

    return NextResponse.json({
      active,
      trialing,
      pastDue,
      cancelled,
      total,
      expiringSoon,
      orgsWithoutSubscription,
    });
  } catch (error) {
    console.error("Erro ao buscar stats de billing admin:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
