export const PlatformRole = {
  SUPER_ADMIN: "SUPER_ADMIN",
  NONE: "NONE",
} as const;
export type PlatformRole = (typeof PlatformRole)[keyof typeof PlatformRole];

export const OrganizationRole = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MEMBER: "MEMBER",
} as const;
export type OrganizationRole =
  (typeof OrganizationRole)[keyof typeof OrganizationRole];

export const Role = {
  ADMIN: "ADMIN",
  USER: "USER",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const OrganizationStatus = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  TRIAL: "TRIAL",
} as const;
export type OrganizationStatus =
  (typeof OrganizationStatus)[keyof typeof OrganizationStatus];

export const SubscriptionStatus = {
  ACTIVE: "ACTIVE",
  PAST_DUE: "PAST_DUE",
  CANCELLED: "CANCELLED",
  TRIALING: "TRIALING",
} as const;
export type SubscriptionStatus =
  (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export type RoleContext = {
  platformRole?: PlatformRole | null;
  organizationRole?: OrganizationRole | null;
};

export function isPlatformSuperAdmin(
  platformRole?: PlatformRole | null
): boolean {
  return platformRole === PlatformRole.SUPER_ADMIN;
}

export function isOrgAdminRole(
  organizationRole?: OrganizationRole | null
): boolean {
  return (
    organizationRole === OrganizationRole.OWNER ||
    organizationRole === OrganizationRole.ADMIN
  );
}

/** Admin no tenant: somente membership (OWNER/ADMIN), nunca só por ser super admin da plataforma. */
export function isOrgAdmin(context: RoleContext): boolean {
  return isOrgAdminRole(context.organizationRole);
}

/** Alias legado para compatibilidade com APIs mobile e sessão JWT. */
export function organizationRoleToLegacyRole(orgRole: OrganizationRole): Role {
  return isOrgAdminRole(orgRole) ? Role.ADMIN : Role.USER;
}

/**
 * Papel legado na sessão UI/API tenant: deriva da membership quando existir,
 * inclusive para SUPER_ADMIN atuando como membro de uma organização.
 */
export function toLegacySessionRole(context: RoleContext): Role {
  if (context.organizationRole) {
    return organizationRoleToLegacyRole(context.organizationRole);
  }
  if (isPlatformSuperAdmin(context.platformRole)) return Role.ADMIN;
  return Role.USER;
}

export function legacyRoleToOrganizationRole(
  role: "ADMIN" | "USER"
): OrganizationRole {
  return role === "ADMIN" ? OrganizationRole.ADMIN : OrganizationRole.MEMBER;
}

export function toggleLegacyRole(role: "ADMIN" | "USER"): "ADMIN" | "USER" {
  return role === "ADMIN" ? "USER" : "ADMIN";
}

export function mapOrganizationRoleToLegacyRole(
  orgRole: OrganizationRole | null
): Role {
  return organizationRoleToLegacyRole(orgRole ?? OrganizationRole.MEMBER);
}

type UserWithMemberships = {
  memberships?: { role: OrganizationRole }[];
  [key: string]: unknown;
};

/** Select Prisma para usuário com membership (role legado derivado na serialização). */
export function userWithMembershipSelect(organizationId?: string) {
  return {
    id: true,
    name: true,
    email: true,
    memberships: {
      ...(organizationId ? { where: { organizationId } } : {}),
      take: 1,
      orderBy: { createdAt: "asc" as const },
      select: { role: true },
    },
  };
}

export function serializeUserWithLegacyRole<T extends UserWithMemberships>(
  user: T
): Omit<T, "memberships"> & {
  role: Role;
  organizationRole: OrganizationRole | null;
} {
  const orgRole = user.memberships?.[0]?.role ?? null;
  const { memberships: _m, ...rest } = user;
  return {
    ...rest,
    organizationRole: orgRole,
    role: toLegacySessionRole({ organizationRole: orgRole }),
  } as Omit<T, "memberships"> & {
    role: Role;
    organizationRole: OrganizationRole | null;
  };
}

type IncidentWithUserRelations = {
  reportedBy?: UserWithMemberships | null;
  assignedTo?: UserWithMemberships | null;
};

export function mapIncidentRelatedUsers<T extends IncidentWithUserRelations>(
  incident: T
): T {
  return {
    ...incident,
    ...(incident.reportedBy !== undefined && {
      reportedBy: incident.reportedBy
        ? serializeUserWithLegacyRole(incident.reportedBy)
        : incident.reportedBy,
    }),
    ...(incident.assignedTo !== undefined && {
      assignedTo: incident.assignedTo
        ? serializeUserWithLegacyRole(incident.assignedTo)
        : incident.assignedTo,
    }),
  };
}
