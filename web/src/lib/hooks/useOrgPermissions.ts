"use client";

import { useSession } from "next-auth/react";

import { isOrgAdminRole, isPlatformSuperAdmin } from "@/lib/auth/roles";

export function useOrgPermissions() {
  const { data: session, status } = useSession();
  const organizationRole = session?.user?.organizationRole ?? null;
  const platformRole = session?.user?.platformRole ?? null;

  const isSuperAdmin = isPlatformSuperAdmin(platformRole);

  const isOrgAdmin = isOrgAdminRole(organizationRole);

  const hasOrganization = !!session?.user?.organizationId;

  const isOrgMember =
    status === "authenticated" && hasOrganization && !isOrgAdmin;

  return {
    session,
    status,
    organizationRole,
    platformRole,
    hasOrganization,
    isSuperAdmin,
    isOrgAdmin,
    isOrgMember,
    isLoading: status === "loading",
  };
}
