/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

import { prismaMock } from "../../../../../../prisma/mock";
import { DELETE, GET, PUT } from "../route";

// Mock dynamically imported module
jest.mock("@/lib/utils/imageProcessor", () => ({
  deleteImageFiles: jest.fn().mockResolvedValue(undefined),
}));

const mockParams = (id: string) => ({ params: Promise.resolve({ id }) });

const mockItem = {
  id: "item-1",
  name: "Projetor",
  description: "Projetor Full HD",
  specifications: ["HDMI", "4K"],
  quantity: 1,
  icon: "projector",
  roomId: "room-1",
  room: { id: "room-1", name: "Sala 1" },
  images: [],
};

describe("Items [id] API", () => {
  beforeEach(() => jest.clearAllMocks());

  // ==================== GET ====================
  describe("GET /api/items/[id]", () => {
    it("should return item when found", async () => {
      prismaMock.item.findUnique.mockResolvedValue(mockItem as any);

      const req = new NextRequest("http://localhost:3000/api/items/item-1");
      const response = await GET(req, mockParams("item-1"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe("item-1");
    });

    it("should return 404 when item is not found", async () => {
      prismaMock.item.findUnique.mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/items/bad-id");
      const response = await GET(req, mockParams("bad-id"));

      expect(response.status).toBe(404);
    });

    it("should return 500 on DB error", async () => {
      prismaMock.item.findUnique.mockRejectedValue(new Error("DB error"));

      const req = new NextRequest("http://localhost:3000/api/items/item-1");
      const response = await GET(req, mockParams("item-1"));

      expect(response.status).toBe(500);
    });
  });

  // ==================== PUT ====================
  describe("PUT /api/items/[id]", () => {
    it("should return 404 when item does not exist", async () => {
      prismaMock.item.findUnique.mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/items/bad-id", {
        method: "PUT",
        body: JSON.stringify({ name: "Novo Projetor" }),
      });
      const response = await PUT(req, mockParams("bad-id"));

      expect(response.status).toBe(404);
    });

    it("should update item successfully with defaults", async () => {
      prismaMock.item.findUnique.mockResolvedValue(mockItem as any);
      prismaMock.item.update.mockResolvedValue({
        ...mockItem,
        name: "Projetor Atualizado",
      } as any);

      const req = new NextRequest("http://localhost:3000/api/items/item-1", {
        method: "PUT",
        body: JSON.stringify({ name: "Projetor Atualizado", quantity: "2" }),
      });
      const response = await PUT(req, mockParams("item-1"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(prismaMock.item.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "Projetor Atualizado",
            quantity: 2,
          }),
        })
      );
    });

    it("should default quantity to 1 when not provided", async () => {
      prismaMock.item.findUnique.mockResolvedValue(mockItem as any);
      prismaMock.item.update.mockResolvedValue(mockItem as any);

      const req = new NextRequest("http://localhost:3000/api/items/item-1", {
        method: "PUT",
        body: JSON.stringify({ name: "Projetor" }), // No quantity
      });
      await PUT(req, mockParams("item-1"));

      expect(prismaMock.item.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ quantity: 1 }),
        })
      );
    });

    it("should return 500 on DB error", async () => {
      prismaMock.item.findUnique.mockResolvedValue(mockItem as any);
      prismaMock.item.update.mockRejectedValue(new Error("DB error"));

      const req = new NextRequest("http://localhost:3000/api/items/item-1", {
        method: "PUT",
        body: JSON.stringify({ name: "Projetor" }),
      });
      const response = await PUT(req, mockParams("item-1"));

      expect(response.status).toBe(500);
    });
  });

  // ==================== DELETE ====================
  describe("DELETE /api/items/[id]", () => {
    it("should delete item with no images successfully", async () => {
      prismaMock.item.findUnique.mockResolvedValue({
        ...mockItem,
        images: [],
      } as any);
      prismaMock.item.delete.mockResolvedValue({} as any);

      const req = new NextRequest("http://localhost:3000/api/items/item-1", {
        method: "DELETE",
      });
      const response = await DELETE(req, mockParams("item-1"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain("deletado com sucesso");
      expect(prismaMock.item.delete).toHaveBeenCalledWith({
        where: { id: "item-1" },
      });
    });

    it("should delete image files before deleting item with images", async () => {
      const { deleteImageFiles } = await import("@/lib/utils/imageProcessor");
      prismaMock.item.findUnique.mockResolvedValue({
        ...mockItem,
        images: [{ id: "img-1", filename: "test.jpg", path: "/path/test.jpg" }],
      } as any);
      prismaMock.item.delete.mockResolvedValue({} as any);

      const req = new NextRequest("http://localhost:3000/api/items/item-1", {
        method: "DELETE",
      });
      await DELETE(req, mockParams("item-1"));

      expect(deleteImageFiles).toHaveBeenCalledWith("test.jpg");
    });

    it("should return 500 on DB error", async () => {
      prismaMock.item.findUnique.mockResolvedValue(mockItem as any);
      prismaMock.item.delete.mockRejectedValue(new Error("DB error"));

      const req = new NextRequest("http://localhost:3000/api/items/item-1", {
        method: "DELETE",
      });
      const response = await DELETE(req, mockParams("item-1"));

      expect(response.status).toBe(500);
    });
  });
});
