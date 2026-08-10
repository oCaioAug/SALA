import { OrganizationRole, PlatformRole, User } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import {
  canViewSolicitacoes,
  type PermissionUser,
} from "@/lib/auth/permissions";
import { resolvePrimaryOrganization } from "@/lib/auth/resolve-primary-organization";
import { isOrgAdmin, mapOrganizationRoleToLegacyRole } from "@/lib/auth/roles";
import { ensureOrganizationOperational } from "@/lib/organization/access";
import { prisma } from "@/lib/prisma";

export type AuthUser = User & {
  organizationId: string | null;
  organizationRole: OrganizationRole | null;
};

export function toPermissionUser(user: AuthUser): PermissionUser {
  return {
    id: user.id,
    organizationId: user.organizationId,
    organizationRole: user.organizationRole,
  };
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) return null;

  const resolved = await resolvePrimaryOrganization(user.id);

  return {
    ...user,
    organizationId: resolved?.organizationId ?? null,
    organizationRole: resolved?.organizationRole ?? null,
  };
}

export async function requireAuth(): Promise<
  AuthUser | NextResponse<{ error: string }>
> {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  return user;
}

export async function requireSuperAdmin(): Promise<
  User | NextResponse<{ error: string }>
> {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (user.platformRole !== PlatformRole.SUPER_ADMIN) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  return user;
}

export async function requireOrgAdmin(): Promise<
  AuthUser | NextResponse<{ error: string }>
> {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (
    !isOrgAdmin({
      platformRole: user.platformRole,
      organizationRole: user.organizationRole,
    }) ||
    !user.organizationId
  ) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const accessBlock = await ensureOrganizationOperational(user.organizationId);
  if (accessBlock) return accessBlock;

  return user;
}

/**
 * Org admin or sector manager who can view/act on reservation approvals
 * (scope checks for specific rooms happen in the route handlers).
 */
export async function requireReservationApprover(): Promise<
  AuthUser | NextResponse<{ error: string }>
> {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!user.organizationId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const allowed = await canViewSolicitacoes(toPermissionUser(user));
  if (!allowed) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const accessBlock = await ensureOrganizationOperational(user.organizationId);
  if (accessBlock) return accessBlock;

  return user;
}

export function isNextResponse(
  value: unknown
): value is NextResponse<{ error: string }> {
  return value instanceof NextResponse;
}

export { mapOrganizationRoleToLegacyRole } from "@/lib/auth/roles";
