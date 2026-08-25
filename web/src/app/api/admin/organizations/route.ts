import {
  apiErrorResponse,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { isNextResponse, requireSuperAdmin } from "@/lib/auth/platform";
import { createOrganizationWithOwner } from "@/lib/organization/create-organization";
import { prisma } from "@/lib/prisma";
import {
  createOrganizationSchema,
  organizationListQuerySchema,
} from "@/lib/validations/admin";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (isNextResponse(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const query = organizationListQuerySchema.parse({
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      planId: searchParams.get("planId") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    });

    const where = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.planId ? { planId: query.planId } : {}),
      ...(query.search
        ? {
            OR: [
              {
                name: { contains: query.search, mode: "insensitive" as const },
              },
              {
                slug: { contains: query.search, mode: "insensitive" as const },
              },
              {
                owner: {
                  email: {
                    contains: query.search,
                    mode: "insensitive" as const,
                  },
                },
              },
            ],
          }
        : {}),
    };

    const skip = (query.page - 1) * query.pageSize;

    const [total, organizations] = await Promise.all([
      prisma.organization.count({ where }),
      prisma.organization.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          owner: {
            select: { id: true, name: true, email: true, image: true },
          },
          plan: {
            select: { id: true, name: true, slug: true },
          },
          _count: { select: { members: true, rooms: true } },
        },
      }),
    ]);

    return NextResponse.json({
      data: organizations,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    });
  } catch (error) {
    console.error("Erro ao listar organizações:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (isNextResponse(auth)) return auth;

    const body = await request.json();
    const data = createOrganizationSchema.parse(body);

    let owner = await prisma.user.findUnique({
      where: { email: data.ownerEmail },
      select: { id: true, passwordHash: true },
    });

    let ownerCreatedWithoutPassword = false;

    if (!owner) {
      owner = await prisma.user.create({
        data: {
          email: data.ownerEmail,
          name: data.ownerName ?? data.ownerEmail.split("@")[0],
        },
        select: { id: true, passwordHash: true },
      });
      ownerCreatedWithoutPassword = true;
    } else if (!owner.passwordHash) {
      ownerCreatedWithoutPassword = true;
    }

    let organization;
    try {
      organization = await createOrganizationWithOwner({
        name: data.name,
        slug: data.slug,
        ownerId: owner.id,
        status: data.status,
        planId: data.planId,
        isSchool: data.isSchool,
      });
    } catch (err) {
      if (err instanceof Error && err.message === "INVALID_PLAN") {
        return apiErrorResponse(ApiErrorCode.PLAN_NOT_FOUND, 404);
      }
      throw err;
    }

    await writeAuditLog({
      actorUserId: auth.id,
      action: "organization.created",
      entityType: "Organization",
      entityId: organization.id,
      organizationId: organization.id,
      metadata: { name: organization.name, slug: organization.slug },
    });

    const result = await prisma.organization.findUnique({
      where: { id: organization.id },
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
        _count: { select: { members: true, rooms: true } },
      },
    });

    return NextResponse.json(
      { ...result, ownerCreatedWithoutPassword },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Dados inválidos", details: error },
        { status: 400 }
      );
    }
    console.error("Erro ao criar organização:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
