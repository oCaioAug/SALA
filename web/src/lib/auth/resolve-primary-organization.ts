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
 * Se `preferredOrganizationId` for informado e o usuário for membro/owner, usa essa org.
 */
export async function resolvePrimaryOrganization(
  userId: string,
  preferredOrganizationId?: string | null
): Promise<ResolvedOrganization | null> {
  if (preferredOrganizationId) {
    const preferredMembership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: preferredOrganizationId,
          userId,
        },
      },
      select: {
        role: true,
        organization: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (preferredMembership?.organization) {
      return {
        organizationId: preferredMembership.organization.id,
        organizationRole: preferredMembership.role,
        organizationName: preferredMembership.organization.name,
        organizationSlug: preferredMembership.organization.slug,
      };
    }

    const preferredOwned = await prisma.organization.findFirst({
      where: { id: preferredOrganizationId, ownerId: userId },
      select: { id: true, name: true, slug: true },
    });

    if (preferredOwned) {
      return {
        organizationId: preferredOwned.id,
        organizationRole: OrganizationRole.OWNER,
        organizationName: preferredOwned.name,
        organizationSlug: preferredOwned.slug,
      };
    }
  }

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
