import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { OrganizationRole, OrganizationStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { isNextResponse, requireSuperAdmin } from "@/lib/auth/platform";
import { refreshOrganizationDailyStats } from "@/lib/organization/stats";
import { prisma } from "@/lib/prisma";
import {
  createOrganizationSchema,
  organizationListQuerySchema,
  slugifyOrganizationName,
} from "@/lib/validations/admin";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (isNextResponse(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const query = organizationListQuerySchema.parse({
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    });

    const where = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
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

    let slug = data.slug ?? slugifyOrganizationName(data.name);
    if (!slug) slug = `org-${Date.now()}`;

    const slugExists = await prisma.organization.findUnique({
      where: { slug },
    });
    if (slugExists) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    let owner = await prisma.user.findUnique({
      where: { email: data.ownerEmail },
    });

    if (!owner) {
      owner = await prisma.user.create({
        data: {
          email: data.ownerEmail,
          name: data.ownerName ?? data.ownerEmail.split("@")[0],
        },
      });
    }

    const organization = await prisma.$transaction(async tx => {
      const org = await tx.organization.create({
        data: {
          name: data.name,
          slug,
          status: data.status ?? OrganizationStatus.ACTIVE,
          ownerId: owner!.id,
          planId: "plan-starter",
        },
      });

      await tx.subscription.create({
        data: {
          organizationId: org.id,
          planId: "plan-starter",
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });

      await tx.organizationMember.upsert({
        where: {
          organizationId_userId: {
            organizationId: org.id,
            userId: owner!.id,
          },
        },
        create: {
          organizationId: org.id,
          userId: owner!.id,
          role: OrganizationRole.OWNER,
        },
        update: { role: OrganizationRole.OWNER },
      });

      return org;
    });

    await writeAuditLog({
      actorUserId: auth.id,
      action: "organization.created",
      entityType: "Organization",
      entityId: organization.id,
      organizationId: organization.id,
      metadata: { name: organization.name, slug: organization.slug },
    });

    void refreshOrganizationDailyStats(organization.id);

    const result = await prisma.organization.findUnique({
      where: { id: organization.id },
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
        _count: { select: { members: true, rooms: true } },
      },
    });

    return NextResponse.json(result, { status: 201 });
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
