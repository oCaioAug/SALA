import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { OrganizationStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { getAuthUser, isNextResponse, requireAuth } from "@/lib/auth/platform";
import { createOrganizationWithOwner } from "@/lib/organization/create-organization";
import { prisma } from "@/lib/prisma";
import { selfCreateOrganizationSchema } from "@/lib/validations/organization";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (isNextResponse(auth)) return auth;

    if (auth.organizationId) {
      return apiErrorResponse(ApiErrorCode.ALREADY_IN_ORGANIZATION, 409);
    }

    const body = await request.json();
    const data = selfCreateOrganizationSchema.parse(body);

    const organization = await createOrganizationWithOwner({
      name: data.name,
      slug: data.slug,
      ownerId: auth.id,
      status: OrganizationStatus.TRIAL,
    });

    await writeAuditLog({
      actorUserId: auth.id,
      action: "organization.self_created",
      entityType: "Organization",
      entityId: organization.id,
      organizationId: organization.id,
      metadata: { name: organization.name, slug: organization.slug },
    });

    return NextResponse.json(
      {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        status: organization.status,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar organização:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return apiErrorResponse(ApiErrorCode.UNAUTHORIZED, 401);
    }

    if (!user.organizationId) {
      return NextResponse.json({ hasOrganization: false, organization: null });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
      },
    });

    return NextResponse.json({
      hasOrganization: true,
      organization,
    });
  } catch (error) {
    console.error("Erro ao buscar organização do usuário:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
