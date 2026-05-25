/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

import {
  mockGetRoomInOrganization,
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
  deletedAt: null,
  items: [],
  reservations: [],
};

describe("Rooms [id] API", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("GET /api/rooms/[id]", () => {
    it("should return a room when found", async () => {
      prismaMock.room.findFirst.mockResolvedValue(mockRoom as any);

      const req = new NextRequest("http://localhost:3000/api/rooms/room-1");
      const response = await GET(req, mockParams("room-1"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe("room-1");
    });

    it("should return 404 when room is not found", async () => {
      prismaMock.room.findFirst.mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/rooms/bad-id");
      const response = await GET(req, mockParams("bad-id"));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain("não encontrada");
    });

    it("should return 500 on DB error", async () => {
      prismaMock.room.findFirst.mockRejectedValue(new Error("DB error"));

      const req = new NextRequest("http://localhost:3000/api/rooms/room-1");
      const response = await GET(req, mockParams("room-1"));

      expect(response.status).toBe(500);
    });
  });

  describe("PUT /api/rooms/[id]", () => {
    it("should update room successfully", async () => {
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

    it("should return 404 when room is not in organization", async () => {
      mockGetRoomInOrganization.mockResolvedValueOnce(null);

      const req = new NextRequest("http://localhost:3000/api/rooms/bad-id", {
        method: "PUT",
        body: JSON.stringify({ name: "Sala 1" }),
      });
      const response = await PUT(req, mockParams("bad-id"));

      expect(response.status).toBe(404);
    });

    it("should return 500 on unexpected DB error", async () => {
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
