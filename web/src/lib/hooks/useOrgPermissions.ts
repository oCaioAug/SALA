"use client";

import { useSession } from "next-auth/react";

import { isOrgAdminRole, isPlatformSuperAdmin } from "@/lib/auth/roles";

/**
 * Papéis/capabilities do tenant na sessão.
 * `isSectorManager` é reavaliado no callback JWT do NextAuth a cada
 * refresh de sessão — sem forçar `update()` aqui (evita rajadas de
 * /api/auth/session e erros de fetch sob Turbopack/HMR instável).
 */
export function useOrgPermissions() {
  const { data: session, status } = useSession();
  const organizationRole = session?.user?.organizationRole ?? null;
  const platformRole = session?.user?.platformRole ?? null;

  const isSuperAdmin = isPlatformSuperAdmin(platformRole);

  const isOrgAdmin = isOrgAdminRole(organizationRole);

  const hasOrganization = !!session?.user?.organizationId;

  const isSectorManager = Boolean(session?.user?.isSectorManager);

  const canAccessSolicitacoes = isOrgAdmin || isSectorManager;

  /** Menu/list access to /salas — item mutations still checked per room on the API. */
  const canAccessSalas = isOrgAdmin || isSectorManager;

  const canManageSectorRoomItems = isOrgAdmin || isSectorManager;

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
    isSectorManager,
    canAccessSolicitacoes,
    canAccessSalas,
    canManageSectorRoomItems,
    isLoading: status === "loading",
  };
}
