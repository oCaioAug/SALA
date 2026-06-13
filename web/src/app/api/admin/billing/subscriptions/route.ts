import { apiErrorResponse } from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { SubscriptionStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { isNextResponse, requireSuperAdmin } from "@/lib/auth/platform";
import { prisma } from "@/lib/prisma";
import { adminBillingQuerySchema } from "@/lib/validations/admin";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (isNextResponse(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const query = adminBillingQuerySchema.parse({
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      planId: searchParams.get("planId") ?? undefined,
      scope: searchParams.get("scope") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    });

    const now = new Date();
    const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const scopeFilter =
      query.status !== undefined
        ? {}
        : query.scope === "active"
          ? {
              status: {
                in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
              },
            }
          : query.scope === "attention"
            ? {
                OR: [
                  { status: SubscriptionStatus.PAST_DUE },
                  {
                    status: {
                      in: [
                        SubscriptionStatus.ACTIVE,
                        SubscriptionStatus.TRIALING,
                      ],
                    },
                    currentPeriodEnd: { gte: now, lte: inSevenDays },
                  },
                ],
              }
            : query.scope === "cancelled"
              ? { status: SubscriptionStatus.CANCELLED }
              : {};

    const where = {
      organization: { deletedAt: null },
      ...(query.planId ? { planId: query.planId } : {}),
      ...(query.status ? { status: query.status } : scopeFilter),
      ...(query.search
        ? {
            OR: [
              {
                organization: {
                  name: {
                    contains: query.search,
                    mode: "insensitive" as const,
                  },
                },
              },
              {
                organization: {
                  slug: {
                    contains: query.search,
                    mode: "insensitive" as const,
                  },
                },
              },
              {
                plan: {
                  name: {
                    contains: query.search,
                    mode: "insensitive" as const,
                  },
                },
              },
              {
                externalId: {
                  contains: query.search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    const skip = (query.page - 1) * query.pageSize;

    const [total, subscriptions] = await Promise.all([
      prisma.subscription.count({ where }),
      prisma.subscription.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: [{ currentPeriodEnd: "asc" }, { createdAt: "desc" }],
        include: {
          plan: {
            select: { id: true, name: true, slug: true },
          },
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              status: true,
              owner: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      data: subscriptions,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    });
  } catch (error) {
    console.error("Erro ao listar assinaturas admin:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
