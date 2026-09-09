import { NextRequest, NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { getOrgSectorCapabilities } from "@/lib/auth/permissions";
import { isNextResponse } from "@/lib/auth/platform";
import { isOrgAdminRole } from "@/lib/auth/roles";
import { requireTenantContext } from "@/lib/auth/tenant";
import { prisma } from "@/lib/prisma";
import type { SearchApiResponse, SearchResultGroup } from "@/lib/search/types";
import { searchQuerySchema } from "@/lib/validation/search";

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireTenantContext();
    if (isNextResponse(ctx)) return ctx;

    if (ctx.isSuperAdmin && !ctx.organizationId) {
      return NextResponse.json({ groups: [] } satisfies SearchApiResponse);
    }

    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = searchQuerySchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Parâmetros inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { q, limit } = parsed.data;
    const organizationId = ctx.organizationId;
    const isOrgAdmin = isOrgAdminRole(ctx.user.organizationRole);
    const sectorCaps = isOrgAdmin
      ? { sectorCanApprove: true, sectorCanManageRooms: true }
      : await getOrgSectorCapabilities(ctx.user.id, organizationId);

    const canSearchItems = isOrgAdmin || sectorCaps.sectorCanManageRooms;

    const textFilter = {
      OR: [
        { name: { contains: q, mode: "insensitive" as const } },
        { description: { contains: q, mode: "insensitive" as const } },
      ],
    };

    const roomPromise = prisma.room.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ...textFilter,
      },
      select: {
        id: true,
        name: true,
        sector: { select: { name: true } },
      },
      orderBy: { name: "asc" },
      take: limit,
    });

    const sectorPromise = isOrgAdmin
      ? prisma.sector.findMany({
          where: {
            organizationId,
            ...textFilter,
          },
          select: { id: true, name: true, description: true },
          orderBy: { name: "asc" },
          take: limit,
        })
      : Promise.resolve([]);

    const usersPromise = isOrgAdmin
      ? prisma.organizationMember.findMany({
          where: {
            organizationId,
            user: {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            },
          },
          select: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { user: { name: "asc" } },
          take: limit,
        })
      : Promise.resolve([]);

    const itemsPromise = canSearchItems
      ? prisma.item.findMany({
          where: {
            organizationId,
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            name: true,
            room: { select: { id: true, name: true } },
          },
          orderBy: { name: "asc" },
          take: limit,
        })
      : Promise.resolve([]);

    const [rooms, sectors, members, items] = await Promise.all([
      roomPromise,
      sectorPromise,
      usersPromise,
      itemsPromise,
    ]);

    const groups: SearchResultGroup[] = [];

    if (rooms.length > 0) {
      groups.push({
        type: "rooms",
        items: rooms.map(room => ({
          id: room.id,
          type: "rooms" as const,
          title: room.name,
          subtitle: room.sector?.name ?? undefined,
          href: `/salas/${room.id}`,
        })),
      });
    }

    if (sectors.length > 0) {
      groups.push({
        type: "sectors",
        items: sectors.map(sector => ({
          id: sector.id,
          type: "sectors" as const,
          title: sector.name,
          subtitle: sector.description ?? undefined,
          href: "/setores",
        })),
      });
    }

    if (members.length > 0) {
      groups.push({
        type: "users",
        items: members.map(member => ({
          id: member.user.id,
          type: "users" as const,
          title: member.user.name || member.user.email,
          subtitle: member.user.name ? member.user.email : undefined,
          href: "/users",
        })),
      });
    }

    if (items.length > 0) {
      groups.push({
        type: "items",
        items: items.map(item => ({
          id: item.id,
          type: "items" as const,
          title: item.name,
          subtitle: item.room?.name ?? undefined,
          href: `/salas/${item.room.id}`,
        })),
      });
    }

    return NextResponse.json({ groups } satisfies SearchApiResponse);
  } catch (error) {
    console.error("Erro na busca universal:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
