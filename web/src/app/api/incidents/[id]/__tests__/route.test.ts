/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

import { prismaMock } from "../../../../../../prisma/mock";
import { DELETE, GET, PATCH, PUT } from "../route";

// Mock getServerSession for routes that require it
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));

import { getServerSession } from "next-auth";

const mockParams = (id: string) => ({ params: Promise.resolve({ id }) });

const mockAdminUser = {
  id: "admin-1",
  email: "admin@example.com",
  role: "ADMIN",
};
const mockNormalUser = {
  id: "user-1",
  email: "user@example.com",
  role: "USER",
};

const mockIncident = {
  id: "inc-1",
  title: "Problema",
  status: "REPORTED",
  priority: "MEDIUM",
  reportedById: "user-1",
  assignedToId: null,
  reportedBy: {
    id: "user-1",
    name: "User",
    email: "user@example.com",
    role: "USER",
  },
  assignedTo: null,
  room: null,
  item: null,
  statusHistory: [],
};

describe("Incidents [id] API", () => {
  beforeEach(() => jest.clearAllMocks());

  // ==================== GET ====================
  describe("GET /api/incidents/[id]", () => {
    it("should return the incident when found", async () => {
      prismaMock.incident.findUnique.mockResolvedValue(mockIncident as any);

      const req = new NextRequest("http://localhost:3000/api/incidents/inc-1");
      const response = await GET(req, mockParams("inc-1"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe("inc-1");
    });

    it("should return 404 when incident is not found", async () => {
      prismaMock.incident.findUnique.mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/incidents/bad-id");
      const response = await GET(req, mockParams("bad-id"));

      expect(response.status).toBe(404);
    });
  });

  // ==================== PUT ====================
  describe("PUT /api/incidents/[id]", () => {
    it("should return 401 when not authenticated", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/incidents/inc-1", {
        method: "PUT",
        body: JSON.stringify({ title: "Updated" }),
      });
      const response = await PUT(req, mockParams("inc-1"));

      expect(response.status).toBe(401);
    });

    it("should return 404 when incident is not found", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: "admin@example.com" },
      });
      prismaMock.user.findUnique.mockResolvedValue(mockAdminUser as any);
      prismaMock.incident.findUnique.mockResolvedValue(null);

      const req = new NextRequest(
        "http://localhost:3000/api/incidents/bad-id",
        {
          method: "PUT",
          body: JSON.stringify({ title: "Updated" }),
        }
      );
      const response = await PUT(req, mockParams("bad-id"));

      expect(response.status).toBe(404);
    });

    it("should return 403 if user has no permission", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: "other@example.com" },
      });
      prismaMock.user.findUnique.mockResolvedValue({
        id: "other-user",
        email: "other@example.com",
        role: "USER",
      } as any);
      prismaMock.incident.findUnique.mockResolvedValue({
        ...mockIncident,
        assignedTo: null,
      } as any);

      const req = new NextRequest("http://localhost:3000/api/incidents/inc-1", {
        method: "PUT",
        body: JSON.stringify({ title: "Hacked" }),
      });
      const response = await PUT(req, mockParams("inc-1"));

      expect(response.status).toBe(403);
    });

    it("should allow admin to update and change status", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: "admin@example.com" },
      });
      prismaMock.user.findUnique.mockResolvedValue(mockAdminUser as any);
      prismaMock.incident.findUnique.mockResolvedValue({
        ...mockIncident,
        assignedTo: null,
        reportedBy: { id: "user-1" },
      } as any);
      prismaMock.incident.update.mockResolvedValue({
        ...mockIncident,
        status: "RESOLVED",
      } as any);
      prismaMock.incidentStatusHistory.createMany.mockResolvedValue({
        count: 1,
      } as any);

      const req = new NextRequest("http://localhost:3000/api/incidents/inc-1", {
        method: "PUT",
        body: JSON.stringify({ status: "RESOLVED" }),
      });
      const response = await PUT(req, mockParams("inc-1"));

      expect(response.status).toBe(200);
      expect(prismaMock.incident.update).toHaveBeenCalled();
    });
  });

  // ==================== DELETE ====================
  describe("DELETE /api/incidents/[id]", () => {
    it("should return 401 when not authenticated", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/incidents/inc-1", {
        method: "DELETE",
      });
      const response = await DELETE(req, mockParams("inc-1"));

      expect(response.status).toBe(401);
    });

    it("should return 403 if user is not an admin", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: "user@example.com" },
      });
      prismaMock.user.findUnique.mockResolvedValue(mockNormalUser as any);

      const req = new NextRequest("http://localhost:3000/api/incidents/inc-1", {
        method: "DELETE",
      });
      const response = await DELETE(req, mockParams("inc-1"));

      expect(response.status).toBe(403);
    });

    it("should return 404 if incident does not exist", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: "admin@example.com" },
      });
      prismaMock.user.findUnique.mockResolvedValue(mockAdminUser as any);
      prismaMock.incident.findUnique.mockResolvedValue(null);

      const req = new NextRequest(
        "http://localhost:3000/api/incidents/bad-id",
        {
          method: "DELETE",
        }
      );
      const response = await DELETE(req, mockParams("bad-id"));

      expect(response.status).toBe(404);
    });

    it("should delete incident as admin", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: "admin@example.com" },
      });
      prismaMock.user.findUnique.mockResolvedValue(mockAdminUser as any);
      prismaMock.incident.findUnique.mockResolvedValue(mockIncident as any);
      prismaMock.incident.delete.mockResolvedValue({} as any);

      const req = new NextRequest("http://localhost:3000/api/incidents/inc-1", {
        method: "DELETE",
      });
      const response = await DELETE(req, mockParams("inc-1"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(prismaMock.incident.delete).toHaveBeenCalledWith({
        where: { id: "inc-1" },
      });
    });
  });

  // ==================== PATCH ====================
  describe("PATCH /api/incidents/[id]", () => {
    it("should return 401 when not authenticated", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/incidents/inc-1", {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated" }),
      });
      const response = await PATCH(req, mockParams("inc-1"));

      expect(response.status).toBe(401);
    });

    it("should allow reporter to update their own incident title", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: "user@example.com" },
      });
      prismaMock.user.findUnique.mockResolvedValue(mockNormalUser as any);
      prismaMock.incident.findUnique.mockResolvedValue({
        ...mockIncident,
        reportedBy: { id: "user-1" },
        assignedTo: null,
      } as any);
      prismaMock.incident.update.mockResolvedValue({
        ...mockIncident,
        title: "Updated title",
      } as any);

      const req = new NextRequest("http://localhost:3000/api/incidents/inc-1", {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated title" }),
      });
      const response = await PATCH(req, mockParams("inc-1"));

      expect(response.status).toBe(200);
    });

    it("should return 400 when no update data is provided", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: "user@example.com" },
      });
      prismaMock.user.findUnique.mockResolvedValue(mockNormalUser as any);
      prismaMock.incident.findUnique.mockResolvedValue({
        ...mockIncident,
        reportedBy: { id: "user-1" },
        assignedTo: null,
      } as any);

      const req = new NextRequest("http://localhost:3000/api/incidents/inc-1", {
        method: "PATCH",
        body: JSON.stringify({}), // No update data
      });
      const response = await PATCH(req, mockParams("inc-1"));

      expect(response.status).toBe(400);
    });
    it("should return 403 if user has no permission to edit incident", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: "stranger@example.com" },
      });
      prismaMock.user.findUnique.mockResolvedValue({
        id: "stranger",
        email: "stranger@example.com",
        role: "USER",
      } as any);
      prismaMock.incident.findUnique.mockResolvedValue({
        ...mockIncident,
        reportedBy: { id: "user-1" }, // different user
        assignedTo: null,
      } as any);

      const req = new NextRequest("http://localhost:3000/api/incidents/inc-1", {
        method: "PATCH",
        body: JSON.stringify({ title: "Hacked" }),
      });
      const response = await PATCH(req, mockParams("inc-1"));

      expect(response.status).toBe(403);
    });

    it("should return 400 if incident is RESOLVED and user is not admin", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: "user@example.com" },
      });
      prismaMock.user.findUnique.mockResolvedValue(mockNormalUser as any);
      prismaMock.incident.findUnique.mockResolvedValue({
        ...mockIncident,
        status: "RESOLVED",
        reportedBy: { id: "user-1" },
        assignedTo: null,
      } as any);

      const req = new NextRequest("http://localhost:3000/api/incidents/inc-1", {
        method: "PATCH",
        body: JSON.stringify({ title: "Try edit" }),
      });
      const response = await PATCH(req, mockParams("inc-1"));

      expect(response.status).toBe(400);
    });

    it("should ignore assignedToId for non-admins and return warning", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: "user@example.com" },
      });
      prismaMock.user.findUnique.mockResolvedValue(mockNormalUser as any);
      prismaMock.incident.findUnique.mockResolvedValue({
        ...mockIncident,
        reportedBy: { id: "user-1" },
        assignedTo: null,
      } as any);
      prismaMock.incident.update.mockResolvedValue({
        ...mockIncident,
        title: "Updated",
      } as any);

      const req = new NextRequest("http://localhost:3000/api/incidents/inc-1", {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated", assignedToId: "admin-1" }),
      });
      const response = await PATCH(req, mockParams("inc-1"));
      const data = await response.json();

      expect(response.status).toBe(200);
      // The warning about ignored assignedToId should be in the response
      expect(data.warnings).toBeDefined();
      expect(data.ignoredFields).toContain("assignedToId");
    });

    it("should return 403 if user tries to change status without permission", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: "user@example.com" },
      });
      prismaMock.user.findUnique.mockResolvedValue(mockNormalUser as any);
      prismaMock.incident.findUnique.mockResolvedValue({
        ...mockIncident,
        reportedBy: { id: "user-1" },
        assignedTo: null,
      } as any);

      // Only assignedToId (not title or description) — all will be ignored
      const req = new NextRequest("http://localhost:3000/api/incidents/inc-1", {
        method: "PATCH",
        // Normal user tries to change status to IN_PROGRESS (only allowed: RESOLVED for reporter)
        body: JSON.stringify({
          status: "IN_PROGRESS",
          assignedToId: "admin-1",
        }),
      });
      const response = await PATCH(req, mockParams("inc-1"));

      // All fields ignored → 403 with ignoredFields
      expect(response.status).toBe(403);
    });

    it("should create status history entry when reporter resolves their own incident", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: "user@example.com" },
      });
      prismaMock.user.findUnique.mockResolvedValue(mockNormalUser as any);
      prismaMock.incident.findUnique.mockResolvedValue({
        ...mockIncident,
        status: "IN_PROGRESS",
        reportedBy: { id: "user-1" },
        assignedTo: null,
      } as any);
      prismaMock.incident.update.mockResolvedValue({
        ...mockIncident,
        status: "RESOLVED",
      } as any);
      prismaMock.incidentStatusHistory.create.mockResolvedValue({} as any);

      const req = new NextRequest("http://localhost:3000/api/incidents/inc-1", {
        method: "PATCH",
        body: JSON.stringify({ status: "RESOLVED" }),
      });
      const response = await PATCH(req, mockParams("inc-1"));

      expect(response.status).toBe(200);
      expect(prismaMock.incidentStatusHistory.create).toHaveBeenCalled();
    });

    it("should return 500 on DB error in PATCH", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: "user@example.com" },
      });
      prismaMock.user.findUnique.mockResolvedValue(mockNormalUser as any);
      prismaMock.incident.findUnique.mockRejectedValue(new Error("DB error"));

      const req = new NextRequest("http://localhost:3000/api/incidents/inc-1", {
        method: "PATCH",
        body: JSON.stringify({ title: "Test" }),
      });
      const response = await PATCH(req, mockParams("inc-1"));

      expect(response.status).toBe(500);
    });
  });
});
