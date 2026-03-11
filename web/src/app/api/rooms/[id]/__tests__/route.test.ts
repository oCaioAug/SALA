/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

import { prismaMock } from "../../../../../../prisma/mock";
import { DELETE, GET, PUT } from "../route";

describe("Rooms API [id]", () => {
  const mockRoom = {
    id: "room-1",
    name: "Sala 1",
    description: "Descrição da Sala 1",
    capacity: 10,
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe("GET /api/rooms/[id]", () => {
    it("should return a room if it exists", async () => {
      prismaMock.room.findUnique.mockResolvedValue(mockRoom as any);

      const req = new NextRequest("http://localhost:3000/api/rooms/room-1");
      const params = Promise.resolve({ id: "room-1" });

      const response = await GET(req, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(mockRoom.id);
      expect(prismaMock.room.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "room-1" } })
      );
    });

    it("should return 404 if room does not exist", async () => {
      prismaMock.room.findUnique.mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/rooms/invalid-id");
      const params = Promise.resolve({ id: "invalid-id" });

      const response = await GET(req, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Sala não encontrada");
    });
  });

  describe("PUT /api/rooms/[id]", () => {
    it("should update a room successfully", async () => {
      const updatedRoom = { ...mockRoom, name: "Sala Atualizada" };
      prismaMock.room.update.mockResolvedValue(updatedRoom as any);

      const req = new NextRequest("http://localhost:3000/api/rooms/room-1", {
        method: "PUT",
        body: JSON.stringify({ name: "Sala Atualizada", capacity: "15" }),
      });
      const params = Promise.resolve({ id: "room-1" });

      const response = await PUT(req, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe("Sala Atualizada");
      expect(prismaMock.room.update).toHaveBeenCalled();
    });
  });

  describe("DELETE /api/rooms/[id]", () => {
    it("should delete a room successfully", async () => {
      prismaMock.room.delete.mockResolvedValue(mockRoom as any);

      const req = new NextRequest("http://localhost:3000/api/rooms/room-1", {
        method: "DELETE",
      });
      const params = Promise.resolve({ id: "room-1" });

      const response = await DELETE(req, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Sala deletada com sucesso");
      expect(prismaMock.room.delete).toHaveBeenCalledWith({
        where: { id: "room-1" },
      });
    });
  });
});
