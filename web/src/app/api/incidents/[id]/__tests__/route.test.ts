/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { prismaMock } from "../../../../../../prisma/mock";
import { DELETE, GET, PATCH, PUT } from "../route";

// Mock getServerSession
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

describe("Incidents [id] API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "admin@example.com" },
    });
    prismaMock.user.findUnique.mockResolvedValue({
      id: "admin-1",
      role: "ADMIN",
      email: "admin@example.com",
    } as any);
  });

  describe("GET /api/incidents/[id]", () => {
    it("should return 404 if incident does not exist", async () => {
      prismaMock.incident.findUnique.mockResolvedValue(null);
      const req = new NextRequest(
        "http://localhost:3000/api/incidents/invalid-id"
      );
      const response = await GET(req, {
        params: Promise.resolve({ id: "invalid-id" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Incidente não encontrado");
    });

    it("should return incident details", async () => {
      const mockIncident = { id: "inc-1", title: "Vazamento" };
      prismaMock.incident.findUnique.mockResolvedValue(mockIncident as any);

      const req = new NextRequest("http://localhost:3000/api/incidents/inc-1");
      const response = await GET(req, {
        params: Promise.resolve({ id: "inc-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockIncident);
    });
  });

  describe("PUT /api/incidents/[id]", () => {
    it("should prevent non-authorized users from updating", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      const req = new NextRequest("http://localhost:3000/api/incidents/inc-1", {
        method: "PUT",
        body: JSON.stringify({}),
      });
      const response = await PUT(req, {
        params: Promise.resolve({ id: "inc-1" }),
      });
      expect(response.status).toBe(401);
    });

    it("should allow admin to update incident", async () => {
      const mockIncident = { id: "inc-1", status: "REPORTED" };
      prismaMock.incident.findUnique.mockResolvedValue(mockIncident as any);
      prismaMock.incident.update.mockResolvedValue({
        ...mockIncident,
        status: "RESOLVED",
      } as any);

      const req = new NextRequest("http://localhost:3000/api/incidents/inc-1", {
        method: "PUT",
        body: JSON.stringify({ status: "RESOLVED" }),
      });
      const response = await PUT(req, {
        params: Promise.resolve({ id: "inc-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("RESOLVED");
      expect(prismaMock.incidentStatusHistory.createMany).toHaveBeenCalled();
    });
  });

  describe("DELETE /api/incidents/[id]", () => {
    it("should return 403 for non-admins", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: "user-1",
        role: "USER",
      } as any);

      const req = new NextRequest("http://localhost:3000/api/incidents/inc-1", {
        method: "DELETE",
      });
      const response = await DELETE(req, {
        params: Promise.resolve({ id: "inc-1" }),
      });

      expect(response.status).toBe(403);
    });

    it("should delete incident if admin", async () => {
      prismaMock.incident.findUnique.mockResolvedValue({ id: "inc-1" } as any);

      const req = new NextRequest("http://localhost:3000/api/incidents/inc-1", {
        method: "DELETE",
      });
      const response = await DELETE(req, {
        params: Promise.resolve({ id: "inc-1" }),
      });

      expect(response.status).toBe(200);
      expect(prismaMock.incident.delete).toHaveBeenCalledWith({
        where: { id: "inc-1" },
      });
    });
  });
});
