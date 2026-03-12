/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

import { verifyAuth } from "@/lib/auth-hybrid";

import { prismaMock } from "../../../../../prisma/mock";
import { GET, POST } from "../route";

// Mock verifyAuth
jest.mock("@/lib/auth-hybrid", () => ({
  verifyAuth: jest.fn(),
}));

describe("Incidents API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (verifyAuth as jest.Mock).mockResolvedValue({
      success: true,
      user: { id: "admin-1", role: "ADMIN" },
    });
  });

  describe("GET /api/incidents", () => {
    it("should require authentication", async () => {
      (verifyAuth as jest.Mock).mockResolvedValue({
        success: false,
        error: "Não autorizado",
        status: 401,
      });

      const req = new NextRequest("http://localhost:3000/api/incidents");
      const response = await GET(req);

      expect(response.status).toBe(401);
    });

    it("should return paginated incidents with status filter", async () => {
      prismaMock.incident.findMany.mockResolvedValue([
        { id: "inc-1", status: "REPORTED" },
      ] as any);
      prismaMock.incident.count.mockResolvedValue(1);

      const req = new NextRequest(
        "http://localhost:3000/api/incidents?status=REPORTED&page=2&limit=10"
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.incidents).toHaveLength(1);
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.limit).toBe(10);
      expect(data.pagination.total).toBe(1);

      // Ensure offset was calculated correctly: skip = (2-1)*10 = 10
      expect(prismaMock.incident.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
          where: { status: "REPORTED" },
        })
      );
    });

    it("should apply priority filter", async () => {
      prismaMock.incident.findMany.mockResolvedValue([]);
      prismaMock.incident.count.mockResolvedValue(0);

      const req = new NextRequest(
        "http://localhost:3000/api/incidents?priority=HIGH"
      );
      await GET(req);

      expect(prismaMock.incident.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ priority: "HIGH" }),
        })
      );
    });

    it("should apply category filter", async () => {
      prismaMock.incident.findMany.mockResolvedValue([]);
      prismaMock.incident.count.mockResolvedValue(0);

      const req = new NextRequest(
        "http://localhost:3000/api/incidents?category=PLUMBING"
      );
      await GET(req);

      expect(prismaMock.incident.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: "PLUMBING" }),
        })
      );
    });

    it("should apply assignedToId filter", async () => {
      prismaMock.incident.findMany.mockResolvedValue([]);
      prismaMock.incident.count.mockResolvedValue(0);

      const req = new NextRequest(
        "http://localhost:3000/api/incidents?assignedToId=admin-1"
      );
      await GET(req);

      expect(prismaMock.incident.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ assignedToId: "admin-1" }),
        })
      );
    });

    it("should apply reportedById filter", async () => {
      prismaMock.incident.findMany.mockResolvedValue([]);
      prismaMock.incident.count.mockResolvedValue(0);

      const req = new NextRequest(
        "http://localhost:3000/api/incidents?reportedById=user-1"
      );
      await GET(req);

      expect(prismaMock.incident.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ reportedById: "user-1" }),
        })
      );
    });

    it("should apply roomId filter", async () => {
      prismaMock.incident.findMany.mockResolvedValue([]);
      prismaMock.incident.count.mockResolvedValue(0);

      const req = new NextRequest(
        "http://localhost:3000/api/incidents?roomId=room-1"
      );
      await GET(req);

      expect(prismaMock.incident.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ roomId: "room-1" }),
        })
      );
    });

    it("should apply itemId filter", async () => {
      prismaMock.incident.findMany.mockResolvedValue([]);
      prismaMock.incident.count.mockResolvedValue(0);

      const req = new NextRequest(
        "http://localhost:3000/api/incidents?itemId=item-1"
      );
      await GET(req);

      expect(prismaMock.incident.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ itemId: "item-1" }),
        })
      );
    });

    it("should return 500 on DB error", async () => {
      prismaMock.incident.findMany.mockRejectedValue(new Error("DB error"));
      prismaMock.incident.count.mockResolvedValue(0);

      const req = new NextRequest("http://localhost:3000/api/incidents");
      const response = await GET(req);

      expect(response.status).toBe(500);
    });
  });

  describe("POST /api/incidents", () => {
    const validBody = {
      title: "Vazamento",
      description: "Agua pingando",
      category: "PLUMBING",
      reportedById: "admin-1",
      roomId: "room-1",
    };

    it("should require title, description, category, and reportedById", async () => {
      const req = new NextRequest("http://localhost:3000/api/incidents", {
        method: "POST",
        body: JSON.stringify({ title: "Vazamento" }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Campos obrigatórios");
    });

    it("should prevent both roomId and itemId", async () => {
      const req = new NextRequest("http://localhost:3000/api/incidents", {
        method: "POST",
        body: JSON.stringify({ ...validBody, itemId: "item-1" }),
      });

      const response = await POST(req);
      expect(response.status).toBe(400);
    });

    it("should fail if room does not exist", async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: "admin-1" } as any);
      prismaMock.room.findUnique.mockResolvedValue(null); // Room not found

      const req = new NextRequest("http://localhost:3000/api/incidents", {
        method: "POST",
        body: JSON.stringify(validBody),
      });

      const response = await POST(req);
      expect(response.status).toBe(404);
    });

    it("should create an incident successfully", async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: "admin-1" } as any);
      prismaMock.room.findUnique.mockResolvedValue({ id: "room-1" } as any);
      prismaMock.incident.create.mockResolvedValue({
        id: "new-inc",
        ...validBody,
      } as any);
      prismaMock.incidentStatusHistory.create.mockResolvedValue({} as any);

      const req = new NextRequest("http://localhost:3000/api/incidents", {
        method: "POST",
        body: JSON.stringify(validBody),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe("new-inc");
      expect(prismaMock.incident.create).toHaveBeenCalled();
      expect(prismaMock.incidentStatusHistory.create).toHaveBeenCalled();
    });

    it("should return 500 on DB error", async () => {
      prismaMock.user.findUnique.mockRejectedValue(new Error("DB error"));

      const req = new NextRequest("http://localhost:3000/api/incidents", {
        method: "POST",
        body: JSON.stringify(validBody),
      });

      const response = await POST(req);
      expect(response.status).toBe(500);
    });

    it("should return 400 if neither roomId nor itemId is provided", async () => {
      const { roomId: _room, ...noLocation } = validBody;

      const req = new NextRequest("http://localhost:3000/api/incidents", {
        method: "POST",
        body: JSON.stringify(noLocation),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("sala ou um item");
    });

    it("should return 401 if POST is not authenticated", async () => {
      (verifyAuth as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: "Token inválido",
        status: 401,
      });

      const req = new NextRequest("http://localhost:3000/api/incidents", {
        method: "POST",
        body: JSON.stringify(validBody),
      });

      const response = await POST(req);

      expect(response.status).toBe(401);
    });

    it("should return 404 if reporter user does not exist", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null); // reporter not found

      const req = new NextRequest("http://localhost:3000/api/incidents", {
        method: "POST",
        body: JSON.stringify(validBody),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain("Usuário reportador não encontrado");
    });

    it("should return 404 if referenced item does not exist", async () => {
      const { roomId: _r, ...bodyWithItem } = validBody;
      const itemBody = { ...bodyWithItem, itemId: "item-1" };

      prismaMock.user.findUnique.mockResolvedValue({ id: "admin-1" } as any);
      prismaMock.item.findUnique.mockResolvedValue(null); // item not found

      const req = new NextRequest("http://localhost:3000/api/incidents", {
        method: "POST",
        body: JSON.stringify(itemBody),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain("Item não encontrado");
    });

    it("should create incident successfully using itemId instead of roomId", async () => {
      const { roomId: _r, ...bodyWithItem } = validBody;
      const itemBody = { ...bodyWithItem, itemId: "item-1" };

      prismaMock.user.findUnique.mockResolvedValue({ id: "admin-1" } as any);
      prismaMock.item.findUnique.mockResolvedValue({ id: "item-1" } as any);
      prismaMock.incident.create.mockResolvedValue({ id: "new-inc" } as any);
      prismaMock.incidentStatusHistory.create.mockResolvedValue({} as any);

      const req = new NextRequest("http://localhost:3000/api/incidents", {
        method: "POST",
        body: JSON.stringify(itemBody),
      });

      const response = await POST(req);

      expect(response.status).toBe(201);
    });
  });
});
