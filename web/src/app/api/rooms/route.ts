import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { OrganizationRole, Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { isNextResponse, requireOrgAdmin } from "@/lib/auth/platform";
import { requireTenantContext } from "@/lib/auth/tenant";
import { assertCanAddRoom } from "@/lib/organization/plan-limits";
import { prisma } from "@/lib/prisma";
import { roomCreateBodySchema } from "@/lib/validation/room";

const roomsCacheByOrg = new Map<
  string,
  { data: unknown[]; timestamp: number }
>();
const CACHE_DURATION = 2 * 60 * 1000;

export async function GET() {
  try {
    const ctx = await requireTenantContext();
    if (isNextResponse(ctx)) return ctx;
    if (ctx.isSuperAdmin) {
      return apiErrorResponse(ApiErrorCode.TENANT_UNAVAILABLE, 403);
    }

    const now = Date.now();
    const cached = roomsCacheByOrg.get(ctx.organizationId);
    if (cached && now - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    const rooms = await prisma.room.findMany({
      where: { organizationId: ctx.organizationId, deletedAt: null },
      select: {
        id: true,
        name: true,
        description: true,
        capacity: true,
        status: true,
        locationDescription: true,
        outletCount: true,
        climateControlled: true,
        createdAt: true,
        updatedAt: true,
        items: {
          select: {
            id: true,
            name: true,
            quantity: true,
            icon: true,
            images: {
              select: {
                id: true,
                filename: true,
                path: true,
              },
              take: 1,
              orderBy: { createdAt: "desc" },
            },
          },
        },
        reservations: {
          where: { status: "ACTIVE" },
          select: {
            id: true,
            startTime: true,
            endTime: true,
            user: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const serializable = JSON.parse(
      JSON.stringify(rooms, (_key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );

    roomsCacheByOrg.set(ctx.organizationId, {
      data: serializable,
      timestamp: now,
    });

    return NextResponse.json(serializable);
  } catch (error) {
    console.error("Erro ao buscar salas:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireOrgAdmin();
    if (isNextResponse(auth)) return auth;
    if (!auth.organizationId) {
      return apiErrorResponse(ApiErrorCode.NO_ORGANIZATION, 403);
    }

    const roomLimit = await assertCanAddRoom(auth.organizationId);
    if (!roomLimit.ok) {
      return apiErrorResponse(roomLimit.errorCode, 403, {
        max: roomLimit.max,
      });
    }

    const json = await request.json();
    const parsed = roomCreateBodySchema.safeParse(json);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const nameErr = flat.fieldErrors.name?.[0];
      const firstOther =
        Object.entries(flat.fieldErrors)
          .filter(([key]) => key !== "name")
          .flatMap(([, msgs]) => msgs ?? [])
          .find((msg): msg is string => Boolean(msg)) ?? null;
      const normalizedName =
        nameErr && /expected string|received undefined|required/i.test(nameErr)
          ? "Nome da sala é obrigatório"
          : nameErr;
      const errorMsg = normalizedName ?? firstOther ?? "Dados inválidos";
      return NextResponse.json(
        { error: errorMsg, details: flat },
        { status: 400 }
      );
    }

    const {
      name,
      description,
      capacity,
      locationDescription,
      outletCount,
      climateControlled,
      status,
    } = parsed.data;

    const room = await prisma.room.create({
      data: {
        name,
        description: description ?? null,
        capacity,
        locationDescription: locationDescription ?? null,
        outletCount,
        climateControlled: climateControlled ?? false,
        status: status ?? "LIVRE",
        organizationId: auth.organizationId,
      },
      include: { items: true },
    });

    roomsCacheByOrg.delete(auth.organizationId);

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar sala:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
