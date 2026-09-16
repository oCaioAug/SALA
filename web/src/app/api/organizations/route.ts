import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { OrganizationStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { writeAuditLog } from "@/lib/audit";
import { getAuthUser, isNextResponse, requireAuth } from "@/lib/auth/platform";
import { createOrganizationWithOwner } from "@/lib/organization/create-organization";
import { prisma } from "@/lib/prisma";
import { isProfileComplete } from "@/lib/user/profile";
import { selfCreateOrganizationSchema } from "@/lib/validations/organization";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (isNextResponse(auth)) return auth;

    const owner = await prisma.user.findUnique({
      where: { id: auth.id },
      select: { cpf: true, phone: true },
    });
    if (!isProfileComplete(owner)) {
      return apiErrorResponse(ApiErrorCode.PROFILE_INCOMPLETE, 403);
    }

    const body = await request.json();
    const data = selfCreateOrganizationSchema.parse(body);

    const existingCnpj = await prisma.organization.findUnique({
      where: { cnpj: data.cnpj },
      select: { id: true },
    });
    if (existingCnpj) {
      return apiErrorResponse(ApiErrorCode.CNPJ_IN_USE, 409);
    }

    const organization = await createOrganizationWithOwner({
      name: data.name,
      legalName: data.legalName,
      cnpj: data.cnpj,
      email: data.email.toLowerCase(),
      phone: data.phone,
      slug: data.slug,
      ownerId: auth.id,
      status: OrganizationStatus.TRIAL,
      planId: data.planId,
    });

    await writeAuditLog({
      actorUserId: auth.id,
      action: "organization.self_created",
      entityType: "Organization",
      entityId: organization.id,
      organizationId: organization.id,
      metadata: {
        name: organization.name,
        slug: organization.slug,
        planId: data.planId,
      },
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
    if (error instanceof ZodError) {
      return apiErrorResponse(ApiErrorCode.INVALID_DATA, 400, {
        issues: error.issues,
      });
    }

    if (error instanceof Error && error.message === "INVALID_PLAN") {
      return apiErrorResponse(ApiErrorCode.INVALID_DATA, 400, {
        issues: [
          { path: ["planId"], message: "Plano inválido ou indisponível" },
        ],
      });
    }

    console.error("Erro ao criar organização:", error);
    return apiInternalError();
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
    return apiInternalError();
  }
}
