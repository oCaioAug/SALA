import { OrganizationRole, type Room, SectorMemberRole } from "@prisma/client";

import { isOrgAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export const Capability = {
  manageOrganization: "manageOrganization",
  manageSectors: "manageSectors",
  manageRooms: "manageRooms",
  editRoom: "editRoom",
  manageRoomItems: "manageRoomItems",
  approveReservations: "approveReservations",
  viewSolicitacoes: "viewSolicitacoes",
} as const;

export type Capability = (typeof Capability)[keyof typeof Capability];

export type SectorCapability = "canApproveReservations" | "canManageRooms";

export type PermissionUser = {
  id: string;
  organizationId: string | null;
  organizationRole: OrganizationRole | null;
};

export type RoomForApproval = Pick<Room, "id" | "organizationId" | "sectorId">;

export type OrgSectorCapabilities = {
  sectorCanApprove: boolean;
  sectorCanManageRooms: boolean;
};

const membershipSelect = {
  role: true,
  canApproveReservations: true,
  canManageRooms: true,
} as const;

/** True if the user has any sector membership in the organization. */
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
      },
    },
    select: { id: true },
  });
  return !!membership;
}

export async function hasSectorCapabilityInOrg(
  userId: string,
  organizationId: string,
  capability: SectorCapability
): Promise<boolean> {
  const membership = await prisma.sectorMember.findFirst({
    where: {
      userId,
      role: SectorMemberRole.MANAGER,
      [capability]: true,
      sector: {
        organizationId,
      },
    },
    select: { id: true },
  });
  return !!membership;
}

export async function getOrgSectorCapabilities(
  userId: string,
  organizationId: string
): Promise<OrgSectorCapabilities> {
  const memberships = await prisma.sectorMember.findMany({
    where: {
      userId,
      role: SectorMemberRole.MANAGER,
      sector: {
        organizationId,
      },
    },
    select: {
      canApproveReservations: true,
      canManageRooms: true,
    },
  });

  return {
    sectorCanApprove: memberships.some(m => m.canApproveReservations),
    sectorCanManageRooms: memberships.some(m => m.canManageRooms),
  };
}

export async function getSectorRoomIdsForCapability(
  userId: string,
  organizationId: string,
  capabilities: SectorCapability[]
): Promise<string[]> {
  if (capabilities.length === 0) return [];

  const rooms = await prisma.room.findMany({
    where: {
      organizationId,
      deletedAt: null,
      sector: {
        members: {
          some: {
            userId,
            role: SectorMemberRole.MANAGER,
            OR: capabilities.map(capability => ({ [capability]: true })),
          },
        },
      },
    },
    select: { id: true },
  });
  return rooms.map(r => r.id);
}

/** Room IDs the user can approve as sector member (not including org-admin override). */
export async function getSectorManagedRoomIds(
  userId: string,
  organizationId: string
): Promise<string[]> {
  return getSectorRoomIdsForCapability(userId, organizationId, [
    "canApproveReservations",
  ]);
}

export async function hasSectorCapability(
  userId: string,
  sectorId: string,
  capability: SectorCapability
): Promise<boolean> {
  const membership = await prisma.sectorMember.findUnique({
    where: {
      sectorId_userId: { sectorId, userId },
    },
    select: membershipSelect,
  });
  return (
    !!membership &&
    membership.role === SectorMemberRole.MANAGER &&
    membership[capability] === true
  );
}

export async function isManagerOfSector(
  userId: string,
  sectorId: string
): Promise<boolean> {
  const membership = await prisma.sectorMember.findUnique({
    where: {
      sectorId_userId: { sectorId, userId },
    },
    select: membershipSelect,
  });
  return (
    !!membership && membership.role === SectorMemberRole.MANAGER
  );
}

/**
 * Org admin can approve any room in their org.
 * Sector member can approve only rooms in a sector with canApproveReservations.
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

  return hasSectorCapability(user.id, room.sectorId, "canApproveReservations");
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
  return hasSectorCapabilityInOrg(
    user.id,
    user.organizationId,
    "canApproveReservations"
  );
}

export function canManageSectors(user: PermissionUser): boolean {
  return !!user.organizationId && isOrgAdminRole(user.organizationRole);
}

/** Create / soft-delete rooms — org admin only. */
export function canManageRooms(user: PermissionUser): boolean {
  return !!user.organizationId && isOrgAdminRole(user.organizationRole);
}

/**
 * Update room attributes and manage items in sector scope.
 * Org admin: any room in org. Sector member: rooms in sectors with canManageRooms.
 */
export async function canEditRoom(
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

  return hasSectorCapability(user.id, room.sectorId, "canManageRooms");
}

/** Same scope as canEditRoom — infos da sala + itens no setor. */
export async function canManageRoomItems(
  user: PermissionUser,
  room: RoomForApproval
): Promise<boolean> {
  return canEditRoom(user, room);
}
