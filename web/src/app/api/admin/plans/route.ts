import {
  apiErrorResponse,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { isNextResponse, requireSuperAdmin } from "@/lib/auth/platform";
import { prisma } from "@/lib/prisma";
import { planSchema } from "@/lib/validations/admin";

export async function GET() {
  try {
    const auth = await requireSuperAdmin();
    if (isNextResponse(auth)) return auth;

    const plans = await prisma.plan.findMany({
      orderBy: { maxRooms: "asc" },
      include: {
        _count: { select: { organizations: true, subscriptions: true } },
      },
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error("Erro ao listar planos:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (isNextResponse(auth)) return auth;

    const body = await request.json();
    const data = planSchema.parse(body);

    const slugTaken = await prisma.plan.findUnique({
      where: { slug: data.slug },
    });
    if (slugTaken) {
      return apiErrorResponse(ApiErrorCode.SLUG_IN_USE, 409);
    }

    const plan = await prisma.plan.create({
      data: {
        name: data.name,
        slug: data.slug,
        maxRooms: data.maxRooms,
        maxUsers: data.maxUsers,
        maxReservationsPerMonth: data.maxReservationsPerMonth ?? null,
        isActive: data.isActive,
      },
    });

    await writeAuditLog({
      actorUserId: auth.id,
      action: "plan.created",
      entityType: "Plan",
      entityId: plan.id,
      metadata: { name: plan.name, slug: plan.slug },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar plano:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
