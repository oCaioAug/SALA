/**
 * @deprecated User.role não é mais sincronizado. Use OrganizationMember.role.
 * Mantido apenas para scripts de migração legados.
 */
export async function syncUserRoleFromMembership(
  _userId: string,
  _organizationId?: string
): Promise<void> {
  // no-op: fonte de verdade é OrganizationMember.role
}

/** @deprecated */
export async function syncAllUserRolesFromMemberships(): Promise<number> {
  return 0;
}

export {
  legacyRoleToOrganizationRole,
  mapOrganizationRoleToLegacyRole,
  organizationRoleToLegacyRole,
  toLegacySessionRole,
} from "@/lib/auth/roles";
