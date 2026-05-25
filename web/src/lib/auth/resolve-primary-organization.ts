import { OrganizationRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type ResolvedOrganization = {
  organizationId: string;
  organizationRole: OrganizationRole;
  organizationName: string;
  organizationSlug: string;
};

/**
 * Membership explícita tem prioridade; senão, org onde o usuário é owner (ex.: seed antigo).
 */
export async function resolvePrimaryOrganization(
  userId: string
): Promise<ResolvedOrganization | null> {
  const membership = await prisma.organizationMember.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: {
      role: true,
      organization: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  if (membership?.organization) {
    return {
      organizationId: membership.organization.id,
      organizationRole: membership.role,
      organizationName: membership.organization.name,
      organizationSlug: membership.organization.slug,
    };
  }

  const owned = await prisma.organization.findFirst({
    where: { ownerId: userId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, slug: true },
  });

  if (!owned) return null;

  return {
    organizationId: owned.id,
    organizationRole: OrganizationRole.OWNER,
    organizationName: owned.name,
    organizationSlug: owned.slug,
  };
}
