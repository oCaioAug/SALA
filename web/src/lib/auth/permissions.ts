import {
  OrganizationRole,
  SectorMemberRole,
  type Room,
} from "@prisma/client";

import { isOrgAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export const Capability = {
  manageOrganization: "manageOrganization",
  manageSectors: "manageSectors",
  manageRooms: "manageRooms",
  approveReservations: "approveReservations",
  viewSolicitacoes: "viewSolicitacoes",
} as const;

export type Capability = (typeof Capability)[keyof typeof Capability];

export type PermissionUser = {
  id: string;
  organizationId: string | null;
  organizationRole: OrganizationRole | null;
};

export type RoomForApproval = Pick<Room, "id" | "organizationId" | "sectorId">;

/** True if the user is a MANAGER of at least one sector in the organization. */
export async function isSectorManagerInOrg(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const membership = await prisma.sectorMember.findFirst({
    where: {
      userId,
      role: SectorMemberRole.MANAGER,
      sector: {
        organizationId,
        deletedAt: null,
      },
    },
    select: { id: true },
  });
  return !!membership;
}

/** Room IDs the user can manage as sector MANAGER (not including org-admin override). */
export async function getSectorManagedRoomIds(
  userId: string,
  organizationId: string
): Promise<string[]> {
  const rooms = await prisma.room.findMany({
    where: {
      organizationId,
      deletedAt: null,
      sector: {
        deletedAt: null,
        members: {
          some: {
            userId,
            role: SectorMemberRole.MANAGER,
          },
        },
      },
    },
    select: { id: true },
  });
  return rooms.map(r => r.id);
}

export async function isManagerOfSector(
  userId: string,
  sectorId: string
): Promise<boolean> {
  const membership = await prisma.sectorMember.findUnique({
    where: {
      sectorId_userId: { sectorId, userId },
    },
    select: { role: true, sector: { select: { deletedAt: true } } },
  });
  return (
    !!membership &&
    membership.role === SectorMemberRole.MANAGER &&
    membership.sector.deletedAt === null
  );
}

/**
 * Org admin can approve any room in their org.
 * Sector manager can approve only rooms assigned to a sector they manage.
 * Rooms without sector: only org admin.
 */
export async function canApproveRoom(
  user: PermissionUser,
  room: RoomForApproval
): Promise<boolean> {
  if (!user.organizationId || user.organizationId !== room.organizationId) {
    return false;
  }

  if (isOrgAdminRole(user.organizationRole)) {
    return true;
  }

  if (!room.sectorId) {
    return false;
  }

  return isManagerOfSector(user.id, room.sectorId);
}

export async function canApproveReservation(
  user: PermissionUser,
  reservation: {
    organizationId: string;
    userId: string;
    room: RoomForApproval;
  }
): Promise<boolean> {
  if (
    !user.organizationId ||
    user.organizationId !== reservation.organizationId
  ) {
    return false;
  }
  // Requester cannot approve or reject their own reservation.
  if (reservation.userId === user.id) {
    return false;
  }
  return canApproveRoom(user, reservation.room);
}

/** Can open the solicitações UI / list pending for approval scope. */
export async function canViewSolicitacoes(
  user: PermissionUser
): Promise<boolean> {
  if (!user.organizationId) return false;
  if (isOrgAdminRole(user.organizationRole)) return true;
  return isSectorManagerInOrg(user.id, user.organizationId);
}

export function canManageSectors(user: PermissionUser): boolean {
  return (
    !!user.organizationId && isOrgAdminRole(user.organizationRole)
  );
}

export function canManageRooms(user: PermissionUser): boolean {
  return (
    !!user.organizationId && isOrgAdminRole(user.organizationRole)
  );
}
