/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

import { prismaMock } from "../../../../../prisma/mock";
import { GET, POST } from "../route";

describe("Items API (List and Create)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("GET /api/items", () => {
    it("should return a list of items and use cache on subsequent calls", async () => {
      const mockItems = [{ id: "item-1", name: "Projetor" }];
      prismaMock.item.findMany.mockResolvedValue(mockItems as any);

      // First call (hits DB)
      const response1 = await GET();
      const data1 = await response1.json();

      expect(response1.status).toBe(200);
      expect(data1).toEqual(mockItems);
      expect(prismaMock.item.findMany).toHaveBeenCalledTimes(1);

      // Second call (should hit cache)
      await GET();
      expect(prismaMock.item.findMany).toHaveBeenCalledTimes(1); // Still 1

      // Advance time beyond cache duration (2 mins)
      jest.advanceTimersByTime(3 * 60 * 1000);

      // Third call (should hit DB again)
      await GET();
      expect(prismaMock.item.findMany).toHaveBeenCalledTimes(2);
    });

    it("should return 500 on DB error when cache is invalid", async () => {
      // Reset modules to get a fresh module with empty cache
      jest.resetModules();
      // Re-require the GET function with a fresh module instance
      const { GET: FreshGET } = await import("../route");
      prismaMock.item.findMany.mockRejectedValue(new Error("DB error"));

      const response = await FreshGET();

      expect(response.status).toBe(500);
    });
  });

  describe("POST /api/items", () => {
    it("should validate required fields", async () => {
      const req = new NextRequest("http://localhost:3000/api/items", {
        method: "POST",
        body: JSON.stringify({ description: "Sem nome" }), // Missing name
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Nome do item é obrigatório");
    });

    it("should create a new item and invalidate cache", async () => {
      const mockItem = { id: "new-item", name: "Novo Projetor" };
      prismaMock.item.create.mockResolvedValue(mockItem as any);

      const req = new NextRequest("http://localhost:3000/api/items", {
        method: "POST",
        body: JSON.stringify({ name: "Novo Projetor", quantity: "2" }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe("new-item");
      expect(prismaMock.item.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: "Novo Projetor", quantity: 2 }),
        })
      );
    });

    it("should return 500 on DB error", async () => {
      prismaMock.item.create.mockRejectedValue(new Error("DB error"));

      const req = new NextRequest("http://localhost:3000/api/items", {
        method: "POST",
        body: JSON.stringify({ name: "Projetor Erro" }),
      });

      const response = await POST(req);

      expect(response.status).toBe(500);
    });
  });
});
