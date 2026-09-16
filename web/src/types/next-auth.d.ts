import { OrganizationRole, PlatformRole, Role } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      platformRole: PlatformRole;
      organizationId: string | null;
      organizationRole: OrganizationRole | null;
      organizationName?: string | null;
      isSectorManager?: boolean;
      sectorCanApprove?: boolean;
      sectorCanManageRooms?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: Role;
    platformRole?: PlatformRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    platformRole?: PlatformRole;
    organizationId?: string | null;
    organizationRole?: OrganizationRole | null;
    organizationName?: string | null;
    role?: Role;
    isSectorManager?: boolean;
    sectorCanApprove?: boolean;
    sectorCanManageRooms?: boolean;
  }
}
