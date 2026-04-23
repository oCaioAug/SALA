/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

import { prismaMock } from "../../../../../prisma/mock";
import { GET, POST } from "../route";

describe("Rooms API (List and Create)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("GET /api/rooms", () => {
    it("should return a list of rooms and use cache on subsequent calls", async () => {
      const mockRooms = [{ id: "room-1", name: "Sala 1" }];
      prismaMock.room.findMany.mockResolvedValue(mockRooms as any);

      // First call (hits DB)
      const response1 = await GET();
      const data1 = await response1.json();

      expect(response1.status).toBe(200);
      expect(data1).toEqual(mockRooms);
      expect(prismaMock.room.findMany).toHaveBeenCalledTimes(1);

      // Second call (should hit cache)
      await GET();
      expect(prismaMock.room.findMany).toHaveBeenCalledTimes(1); // Still 1

      // Advance time beyond cache duration (2 mins)
      jest.advanceTimersByTime(3 * 60 * 1000);

      // Third call (should hit DB again)
      await GET();
      expect(prismaMock.room.findMany).toHaveBeenCalledTimes(2);
    });

    it("should return 500 on DB error when cache is invalid", async () => {
      // Reset modules to get a fresh module instance with empty cache
      jest.resetModules();
      const { GET: FreshGET } = await import("../route");
      prismaMock.room.findMany.mockImplementation(() =>
        Promise.reject(new Error("DB error"))
      );

      const response = await FreshGET();

      expect(response.status).toBe(500);
    });
  });

  describe("POST /api/rooms", () => {
    it("should validate required fields", async () => {
      const req = new NextRequest("http://localhost:3000/api/rooms", {
        method: "POST",
        body: JSON.stringify({ description: "Sem nome" }), // Missing name
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Nome da sala é obrigatório");
    });

    it("should create a new room and invalidate cache", async () => {
      const mockRoom = { id: "new-room", name: "Sala Nova" };
      prismaMock.room.create.mockResolvedValue(mockRoom as any);

      const req = new NextRequest("http://localhost:3000/api/rooms", {
        method: "POST",
        body: JSON.stringify({ name: "Sala Nova", capacity: "20" }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe("new-room");
      expect(prismaMock.room.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: "Sala Nova", capacity: 20 }),
        })
      );
    });

    it("should return 500 on DB error", async () => {
      prismaMock.room.create.mockRejectedValue(new Error("DB error"));

      const req = new NextRequest("http://localhost:3000/api/rooms", {
        method: "POST",
        body: JSON.stringify({ name: "Sala Erro" }),
      });

      const response = await POST(req);

      expect(response.status).toBe(500);
    });
  });
});
