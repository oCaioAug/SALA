/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

import { prismaMock } from "../../../../../../prisma/mock";
import { DELETE, GET, PUT } from "../route";

// Mock utils
jest.mock("@/lib/utils/imageProcessor", () => ({
  deleteImageFiles: jest.fn(),
}));
import { deleteImageFiles } from "@/lib/utils/imageProcessor";

describe("Items [id] API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/items/[id]", () => {
    it("should return 404 if item does not exist", async () => {
      prismaMock.item.findUnique.mockResolvedValue(null);
      const req = new NextRequest("http://localhost:3000/api/items/invalid-id");
      const response = await GET(req, {
        params: Promise.resolve({ id: "invalid-id" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Item não encontrado");
    });

    it("should return item details", async () => {
      const mockItem = { id: "item-1", name: "Projector" };
      prismaMock.item.findUnique.mockResolvedValue(mockItem as any);

      const req = new NextRequest("http://localhost:3000/api/items/item-1");
      const response = await GET(req, {
        params: Promise.resolve({ id: "item-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockItem);
    });
  });

  describe("PUT /api/items/[id]", () => {
    it("should return 404 if item does not exist", async () => {
      prismaMock.item.findUnique.mockResolvedValue(null);
      const req = new NextRequest(
        "http://localhost:3000/api/items/invalid-id",
        {
          method: "PUT",
          body: JSON.stringify({ name: "New Name" }),
        }
      );
      const response = await PUT(req, {
        params: Promise.resolve({ id: "invalid-id" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Item não encontrado");
    });

    it("should update item successfully", async () => {
      const mockItem = { id: "item-1", name: "Projector" };
      prismaMock.item.findUnique.mockResolvedValue(mockItem as any);
      prismaMock.item.update.mockResolvedValue({
        ...mockItem,
        name: "Projector 4K",
      } as any);

      const req = new NextRequest("http://localhost:3000/api/items/item-1", {
        method: "PUT",
        body: JSON.stringify({ name: "Projector 4K" }),
      });
      const response = await PUT(req, {
        params: Promise.resolve({ id: "item-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe("Projector 4K");
      expect(prismaMock.item.update).toHaveBeenCalled();
    });
  });

  describe("DELETE /api/items/[id]", () => {
    it("should delete item and its images", async () => {
      prismaMock.item.findUnique.mockResolvedValue({
        id: "item-1",
        images: [{ filename: "img1.png" }],
      } as any);

      const req = new NextRequest("http://localhost:3000/api/items/item-1", {
        method: "DELETE",
      });
      const response = await DELETE(req, {
        params: Promise.resolve({ id: "item-1" }),
      });

      expect(response.status).toBe(200);
      expect(deleteImageFiles).toHaveBeenCalledWith("img1.png");
      expect(prismaMock.item.delete).toHaveBeenCalledWith({
        where: { id: "item-1" },
      });
    });
  });
});
