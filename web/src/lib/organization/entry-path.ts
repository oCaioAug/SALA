import { OrganizationRole } from "@prisma/client";

export function organizationEntryPath(role: OrganizationRole | string): string {
  return role === OrganizationRole.MEMBER ? "/explorar" : "/dashboard";
}
