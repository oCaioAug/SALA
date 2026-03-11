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

    it("should return paginated incidents with filters", async () => {
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
  });
});
