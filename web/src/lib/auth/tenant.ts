import { PlatformRole } from "@prisma/client";
import { NextResponse } from "next/server";

import {
  AuthUser,
  getAuthUser,
  isNextResponse,
  requireAuth,
} from "@/lib/auth/platform";
import { ensureOrganizationOperational } from "@/lib/organization/access";

export type TenantContext = {
  user: AuthUser;
  organizationId: string;
  isSuperAdmin: boolean;
};

export async function requireTenantContext(): Promise<
  TenantContext | NextResponse<{ error: string }>
> {
  const authResult = await requireAuth();
  if (isNextResponse(authResult)) return authResult;

  const user = authResult;

  if (user.platformRole === PlatformRole.SUPER_ADMIN) {
    if (user.organizationId) {
      const accessBlock = await ensureOrganizationOperational(
        user.organizationId
      );
      if (accessBlock) return accessBlock;

      return {
        user,
        organizationId: user.organizationId,
        isSuperAdmin: false,
      };
    }

    return {
      user,
      organizationId: "",
      isSuperAdmin: true,
    };
  }

  if (!user.organizationId) {
    return NextResponse.json(
      { error: "Usuário sem organização vinculada" },
      { status: 403 }
    );
  }

  const accessBlock = await ensureOrganizationOperational(user.organizationId);
  if (accessBlock) return accessBlock;

  return {
    user,
    organizationId: user.organizationId,
    isSuperAdmin: false,
  };
}

export async function requireTenantOrganizationId(): Promise<
  string | NextResponse<{ error: string }>
> {
  const ctx = await requireTenantContext();
  if (isNextResponse(ctx)) return ctx;

  if (ctx.isSuperAdmin && !ctx.organizationId) {
    return NextResponse.json(
      { error: "Organização não especificada" },
      { status: 400 }
    );
  }

  return ctx.organizationId;
}

export async function getOrganizationIdForUser(
  userId: string
): Promise<string | null> {
  const user = await getAuthUser();
  if (!user || user.id !== userId) {
    const membership = await import("@/lib/prisma").then(({ prisma }) =>
      prisma.organizationMember.findFirst({
        where: { userId },
        select: { organizationId: true },
      })
    );
    return membership?.organizationId ?? null;
  }
  return user.organizationId;
}
