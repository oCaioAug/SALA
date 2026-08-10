import { OrganizationRole, SectorMemberRole } from "@prisma/client";

import {
  canApproveReservation,
  canApproveRoom,
  canEditRoom,
  canManageRoomItems,
  canManageRooms,
  canManageSectors,
  canViewSolicitacoes,
  getSectorManagedRoomIds,
} from "@/lib/auth/permissions";

import { prismaMock } from "../../../../prisma/mock";

describe("permissions", () => {
  const orgId = "org-1";
  const roomWithSector = {
    id: "room-1",
    organizationId: orgId,
    sectorId: "sector-1",
  };
  const roomWithoutSector = {
    id: "room-2",
    organizationId: orgId,
    sectorId: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("canApproveRoom", () => {
    it("allows org OWNER for any room in the org", async () => {
      const ok = await canApproveRoom(
        {
          id: "user-1",
          organizationId: orgId,
          organizationRole: OrganizationRole.OWNER,
        },
        roomWithoutSector
      );
      expect(ok).toBe(true);
    });

    it("allows org ADMIN for room with sector", async () => {
      const ok = await canApproveRoom(
        {
          id: "user-1",
          organizationId: orgId,
          organizationRole: OrganizationRole.ADMIN,
        },
        roomWithSector
      );
      expect(ok).toBe(true);
    });

    it("denies MEMBER for room without sector", async () => {
      const ok = await canApproveRoom(
        {
          id: "user-1",
          organizationId: orgId,
          organizationRole: OrganizationRole.MEMBER,
        },
        roomWithoutSector
      );
      expect(ok).toBe(false);
    });

    it("allows sector MANAGER for room in their sector", async () => {
      prismaMock.sectorMember.findUnique.mockResolvedValue({
        role: SectorMemberRole.MANAGER,
        sector: { deletedAt: null },
      } as any);

      const ok = await canApproveRoom(
        {
          id: "manager-1",
          organizationId: orgId,
          organizationRole: OrganizationRole.MEMBER,
        },
        roomWithSector
      );
      expect(ok).toBe(true);
      expect(prismaMock.sectorMember.findUnique).toHaveBeenCalledWith({
        where: {
          sectorId_userId: { sectorId: "sector-1", userId: "manager-1" },
        },
        select: { role: true, sector: { select: { deletedAt: true } } },
      });
    });

    it("denies sector manager of another sector", async () => {
      prismaMock.sectorMember.findUnique.mockResolvedValue(null);

      const ok = await canApproveRoom(
        {
          id: "manager-2",
          organizationId: orgId,
          organizationRole: OrganizationRole.MEMBER,
        },
        roomWithSector
      );
      expect(ok).toBe(false);
    });

    it("denies when organization mismatch", async () => {
      const ok = await canApproveRoom(
        {
          id: "user-1",
          organizationId: "other-org",
          organizationRole: OrganizationRole.OWNER,
        },
        roomWithSector
      );
      expect(ok).toBe(false);
    });
  });

  describe("canApproveReservation", () => {
    it("denies self-approval even for org OWNER", async () => {
      const ok = await canApproveReservation(
        {
          id: "user-1",
          organizationId: orgId,
          organizationRole: OrganizationRole.OWNER,
        },
        {
          organizationId: orgId,
          userId: "user-1",
          room: roomWithoutSector,
        }
      );
      expect(ok).toBe(false);
    });

    it("allows admin to approve someone else's reservation", async () => {
      const ok = await canApproveReservation(
        {
          id: "admin-1",
          organizationId: orgId,
          organizationRole: OrganizationRole.ADMIN,
        },
        {
          organizationId: orgId,
          userId: "user-1",
          room: roomWithSector,
        }
      );
      expect(ok).toBe(true);
    });
  });

  describe("getSectorManagedRoomIds", () => {
    it("returns room ids for managed sectors", async () => {
      prismaMock.room.findMany.mockResolvedValue([
        { id: "room-1" },
        { id: "room-3" },
      ] as any);

      const ids = await getSectorManagedRoomIds("manager-1", orgId);
      expect(ids).toEqual(["room-1", "room-3"]);
    });
  });

  describe("canViewSolicitacoes", () => {
    it("allows org admin", async () => {
      const ok = await canViewSolicitacoes({
        id: "user-1",
        organizationId: orgId,
        organizationRole: OrganizationRole.ADMIN,
      });
      expect(ok).toBe(true);
    });

    it("allows sector manager", async () => {
      prismaMock.sectorMember.findFirst.mockResolvedValue({ id: "sm-1" } as any);
      const ok = await canViewSolicitacoes({
        id: "manager-1",
        organizationId: orgId,
        organizationRole: OrganizationRole.MEMBER,
      });
      expect(ok).toBe(true);
    });

    it("denies plain member", async () => {
      prismaMock.sectorMember.findFirst.mockResolvedValue(null);
      const ok = await canViewSolicitacoes({
        id: "member-1",
        organizationId: orgId,
        organizationRole: OrganizationRole.MEMBER,
      });
      expect(ok).toBe(false);
    });
  });

  describe("canManageSectors / canManageRooms", () => {
    it("only org admins manage sectors and rooms", () => {
      expect(
        canManageSectors({
          id: "a",
          organizationId: orgId,
          organizationRole: OrganizationRole.ADMIN,
        })
      ).toBe(true);
      expect(
        canManageRooms({
          id: "a",
          organizationId: orgId,
          organizationRole: OrganizationRole.MEMBER,
        })
      ).toBe(false);
    });
  });

  describe("canEditRoom", () => {
    it("allows org admin for any room", async () => {
      const ok = await canEditRoom(
        {
          id: "admin-1",
          organizationId: orgId,
          organizationRole: OrganizationRole.ADMIN,
        },
        roomWithoutSector
      );
      expect(ok).toBe(true);
    });

    it("allows sector MANAGER for room in their sector", async () => {
      prismaMock.sectorMember.findUnique.mockResolvedValue({
        role: SectorMemberRole.MANAGER,
        sector: { deletedAt: null },
      } as any);

      const ok = await canEditRoom(
        {
          id: "manager-1",
          organizationId: orgId,
          organizationRole: OrganizationRole.MEMBER,
        },
        roomWithSector
      );
      expect(ok).toBe(true);
    });

    it("denies MEMBER for room without sector", async () => {
      const ok = await canEditRoom(
        {
          id: "member-1",
          organizationId: orgId,
          organizationRole: OrganizationRole.MEMBER,
        },
        roomWithoutSector
      );
      expect(ok).toBe(false);
    });

    it("denies sector manager of another sector", async () => {
      prismaMock.sectorMember.findUnique.mockResolvedValue(null);

      const ok = await canEditRoom(
        {
          id: "manager-2",
          organizationId: orgId,
          organizationRole: OrganizationRole.MEMBER,
        },
        roomWithSector
      );
      expect(ok).toBe(false);
    });
  });

  describe("canManageRoomItems", () => {
    it("allows org admin for any room", async () => {
      const ok = await canManageRoomItems(
        {
          id: "admin-1",
          organizationId: orgId,
          organizationRole: OrganizationRole.ADMIN,
        },
        roomWithoutSector
      );
      expect(ok).toBe(true);
    });

    it("allows sector MANAGER for room in their sector", async () => {
      prismaMock.sectorMember.findUnique.mockResolvedValue({
        role: SectorMemberRole.MANAGER,
        sector: { deletedAt: null },
      } as any);

      const ok = await canManageRoomItems(
        {
          id: "manager-1",
          organizationId: orgId,
          organizationRole: OrganizationRole.MEMBER,
        },
        roomWithSector
      );
      expect(ok).toBe(true);
    });

    it("denies MEMBER for room without sector", async () => {
      const ok = await canManageRoomItems(
        {
          id: "member-1",
          organizationId: orgId,
          organizationRole: OrganizationRole.MEMBER,
        },
        roomWithoutSector
      );
      expect(ok).toBe(false);
    });

    it("denies sector manager of another sector", async () => {
      prismaMock.sectorMember.findUnique.mockResolvedValue(null);

      const ok = await canManageRoomItems(
        {
          id: "manager-2",
          organizationId: orgId,
          organizationRole: OrganizationRole.MEMBER,
        },
        roomWithSector
      );
      expect(ok).toBe(false);
    });
  });
});
