/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { SectorMemberRole } from "@prisma/client";

import {
  mockAdminContextValue,
  mockGetRoomInOrganization,
  mockRequireTenantContext,
  mockTenantContextValue,
  TEST_ORG_ID,
} from "../../../../../../prisma/auth-mocks";
import { prismaMock } from "../../../../../../prisma/mock";
import { DELETE, GET, PUT } from "../route";

const mockParams = (id: string) => ({ params: Promise.resolve({ id }) });

const mockRoom = {
  id: "room-1",
  name: "Sala 1",
  description: "Desc",
  capacity: 10,
  status: "LIVRE",
  organizationId: TEST_ORG_ID,
  sectorId: null as string | null,
  deletedAt: null,
  items: [],
  reservations: [],
};

describe("Rooms [id] API", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("GET /api/rooms/[id]", () => {
    it("should return a room when found", async () => {
      mockRequireTenantContext.mockResolvedValueOnce(mockAdminContextValue);
      prismaMock.room.findFirst.mockResolvedValue(mockRoom as any);

      const req = new NextRequest("http://localhost:3000/api/rooms/room-1");
      const response = await GET(req, mockParams("room-1"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe("room-1");
      expect(data.canManageItems).toBe(true);
      expect(data.canEditRoom).toBe(true);
    });

    it("should return room flags for sector member with manage-rooms", async () => {
      mockRequireTenantContext.mockResolvedValueOnce(mockTenantContextValue);
      prismaMock.room.findFirst.mockResolvedValue({
        ...mockRoom,
        sectorId: "sector-1",
      } as any);
      prismaMock.sectorMember.findUnique.mockResolvedValue({
        role: SectorMemberRole.MANAGER,
        canApproveReservations: false,
        canManageRooms: true,
      } as any);

      const req = new NextRequest("http://localhost:3000/api/rooms/room-1");
      const response = await GET(req, mockParams("room-1"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.canManageItems).toBe(true);
      expect(data.canEditRoom).toBe(true);
    });

    it("should return 404 when room is not found", async () => {
      prismaMock.room.findFirst.mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/rooms/bad-id");
      const response = await GET(req, mockParams("bad-id"));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.errorCode).toBe("ROOM_NOT_FOUND");
    });

    it("should return 500 on DB error", async () => {
      prismaMock.room.findFirst.mockRejectedValue(new Error("DB error"));

      const req = new NextRequest("http://localhost:3000/api/rooms/room-1");
      const response = await GET(req, mockParams("room-1"));

      expect(response.status).toBe(500);
    });
  });

  describe("PUT /api/rooms/[id]", () => {
    it("should update room successfully as org admin", async () => {
      mockRequireTenantContext.mockResolvedValueOnce(mockAdminContextValue);
      const updatedRoom = { ...mockRoom, name: "Sala Atualizada" };
      prismaMock.room.update.mockResolvedValue(updatedRoom as any);

      const req = new NextRequest("http://localhost:3000/api/rooms/room-1", {
        method: "PUT",
        body: JSON.stringify({ name: "Sala Atualizada", capacity: "15" }),
      });
      const response = await PUT(req, mockParams("room-1"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe("Sala Atualizada");
      expect(prismaMock.room.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "room-1" },
          data: expect.objectContaining({
            name: "Sala Atualizada",
            capacity: 15,
          }),
        })
      );
    });

    it("should update only fields present in the body", async () => {
      mockRequireTenantContext.mockResolvedValueOnce(mockAdminContextValue);
      prismaMock.room.update.mockResolvedValue(mockRoom as any);

      const req = new NextRequest("http://localhost:3000/api/rooms/room-1", {
        method: "PUT",
        body: JSON.stringify({ name: "Sala 1" }),
      });
      await PUT(req, mockParams("room-1"));

      expect(prismaMock.room.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "room-1" },
          data: { name: "Sala 1" },
        })
      );
    });

    it("should allow sector manager to update room in their sector", async () => {
      mockRequireTenantContext.mockResolvedValueOnce(mockTenantContextValue);
      mockGetRoomInOrganization.mockResolvedValueOnce({
        id: "room-1",
        organizationId: TEST_ORG_ID,
        sectorId: "sector-1",
        deletedAt: null,
      } as any);
      prismaMock.sectorMember.findUnique.mockResolvedValue({
        role: SectorMemberRole.MANAGER,
        canApproveReservations: true,
        canManageRooms: true,
      } as any);
      prismaMock.room.update.mockResolvedValue({
        ...mockRoom,
        sectorId: "sector-1",
        climateControlled: true,
        outletCount: 8,
      } as any);

      const req = new NextRequest("http://localhost:3000/api/rooms/room-1", {
        method: "PUT",
        body: JSON.stringify({
          climateControlled: true,
          outletCount: 8,
          locationDescription: "Bloco A",
          sectorId: "other-sector",
        }),
      });
      const response = await PUT(req, mockParams("room-1"));

      expect(response.status).toBe(200);
      expect(prismaMock.room.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "room-1" },
          data: expect.objectContaining({
            climateControlled: true,
            outletCount: 8,
            locationDescription: "Bloco A",
          }),
        })
      );
      const updateArg = prismaMock.room.update.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      expect(updateArg.data.sectorId).toBeUndefined();
    });

    it("should deny approve-only sector member from updating room", async () => {
      mockRequireTenantContext.mockResolvedValueOnce(mockTenantContextValue);
      mockGetRoomInOrganization.mockResolvedValueOnce({
        id: "room-1",
        organizationId: TEST_ORG_ID,
        sectorId: "sector-1",
        deletedAt: null,
      } as any);
      prismaMock.sectorMember.findUnique.mockResolvedValue({
        role: SectorMemberRole.MANAGER,
        canApproveReservations: true,
        canManageRooms: false,
              } as any);

      const req = new NextRequest("http://localhost:3000/api/rooms/room-1", {
        method: "PUT",
        body: JSON.stringify({ name: "Sala 1" }),
      });
      const response = await PUT(req, mockParams("room-1"));
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.errorCode).toBe("ACCESS_DENIED");
      expect(prismaMock.room.update).not.toHaveBeenCalled();
    });

    it("should deny member without sector manage rights", async () => {
      mockRequireTenantContext.mockResolvedValueOnce(mockTenantContextValue);
      mockGetRoomInOrganization.mockResolvedValueOnce({
        id: "room-1",
        organizationId: TEST_ORG_ID,
        sectorId: null,
        deletedAt: null,
      } as any);

      const req = new NextRequest("http://localhost:3000/api/rooms/room-1", {
        method: "PUT",
        body: JSON.stringify({ name: "Sala 1" }),
      });
      const response = await PUT(req, mockParams("room-1"));
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.errorCode).toBe("ACCESS_DENIED");
      expect(prismaMock.room.update).not.toHaveBeenCalled();
    });

    it("should return 404 when room is not in organization", async () => {
      mockRequireTenantContext.mockResolvedValueOnce(mockAdminContextValue);
      mockGetRoomInOrganization.mockResolvedValueOnce(null);

      const req = new NextRequest("http://localhost:3000/api/rooms/bad-id", {
        method: "PUT",
        body: JSON.stringify({ name: "Sala 1" }),
      });
      const response = await PUT(req, mockParams("bad-id"));

      expect(response.status).toBe(404);
    });

    it("should return 500 on unexpected DB error", async () => {
      mockRequireTenantContext.mockResolvedValueOnce(mockAdminContextValue);
      prismaMock.room.update.mockRejectedValue(new Error("DB error"));

      const req = new NextRequest("http://localhost:3000/api/rooms/room-1", {
        method: "PUT",
        body: JSON.stringify({ name: "Sala 1" }),
      });
      const response = await PUT(req, mockParams("room-1"));

      expect(response.status).toBe(500);
    });
  });

  describe("DELETE /api/rooms/[id]", () => {
    it("should soft-delete room and return success message", async () => {
      prismaMock.room.update.mockResolvedValue({} as any);

      const req = new NextRequest("http://localhost:3000/api/rooms/room-1", {
        method: "DELETE",
      });
      const response = await DELETE(req, mockParams("room-1"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain("deletada com sucesso");
      expect(prismaMock.room.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "room-1" },
          data: { deletedAt: expect.any(Date) },
        })
      );
    });

    it("should return 500 on DB error", async () => {
      prismaMock.room.update.mockRejectedValue(new Error("DB error"));

      const req = new NextRequest("http://localhost:3000/api/rooms/room-1", {
        method: "DELETE",
      });
      const response = await DELETE(req, mockParams("room-1"));

      expect(response.status).toBe(500);
    });
  });
});
