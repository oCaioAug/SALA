/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

import {
  mockAdminContextValue,
  mockGetIncidentInOrganization,
  mockRequireTenantContext,
  mockTenantContextValue,
  mockTenantUser,
  TEST_ORG_ID,
} from "../../../../../../prisma/auth-mocks";
import { prismaMock } from "../../../../../../prisma/mock";
import { DELETE, GET, PATCH, PUT } from "../route";

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));

import { getServerSession } from "next-auth";

const mockParams = (id: string) => ({ params: Promise.resolve({ id }) });

const mockIncident = {
  id: "inc-1",
  title: "Problema",
  status: "REPORTED",
  priority: "MEDIUM",
  organizationId: TEST_ORG_ID,
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

function mockIncidentFindFirst(incident: typeof mockIncident | null) {
  prismaMock.incident.findFirst.mockResolvedValue(incident as any);
}

describe("Incidents [id] API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "user@example.com" },
    });
    mockRequireTenantContext.mockResolvedValue(mockTenantContextValue);
  });

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
      mockGetIncidentInOrganization.mockResolvedValueOnce(null);

      const req = new NextRequest("http://localhost:3000/api/incidents/bad-id");
      const response = await GET(req, mockParams("bad-id"));

      expect(response.status).toBe(404);
    });
  });

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
      mockIncidentFindFirst(null);

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
      mockRequireTenantContext.mockResolvedValueOnce({
        user: { ...mockTenantUser, id: "other-user" },
        organizationId: TEST_ORG_ID,
        isSuperAdmin: false,
      });
      mockIncidentFindFirst({
        ...mockIncident,
        reportedById: "user-1",
        assignedToId: null,
      });

      const req = new NextRequest("http://localhost:3000/api/incidents/inc-1", {
        method: "PUT",
        body: JSON.stringify({ title: "Hacked" }),
      });
      const response = await PUT(req, mockParams("inc-1"));

      expect(response.status).toBe(403);
    });

    it("should allow admin to update and change status", async () => {
      mockRequireTenantContext.mockResolvedValueOnce(mockAdminContextValue);
      mockIncidentFindFirst({
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
      const req = new NextRequest("http://localhost:3000/api/incidents/inc-1", {
        method: "DELETE",
      });
      const response = await DELETE(req, mockParams("inc-1"));

      expect(response.status).toBe(403);
    });

    it("should return 404 if incident does not exist", async () => {
      mockRequireTenantContext.mockResolvedValueOnce(mockAdminContextValue);
      mockIncidentFindFirst(null);

      const req = new NextRequest(
        "http://localhost:3000/api/incidents/bad-id",
        { method: "DELETE" }
      );
      const response = await DELETE(req, mockParams("bad-id"));

      expect(response.status).toBe(404);
    });

    it("should delete incident as admin", async () => {
      mockRequireTenantContext.mockResolvedValueOnce(mockAdminContextValue);
      mockIncidentFindFirst(mockIncident);
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
      mockIncidentFindFirst({
        ...mockIncident,
        reportedBy: { id: mockTenantUser.id },
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
      mockIncidentFindFirst({
        ...mockIncident,
        reportedBy: { id: mockTenantUser.id },
      } as any);

      const req = new NextRequest("http://localhost:3000/api/incidents/inc-1", {
        method: "PATCH",
        body: JSON.stringify({}),
      });
      const response = await PATCH(req, mockParams("inc-1"));

      expect(response.status).toBe(400);
    });

    it("should return 403 if user has no permission to edit incident", async () => {
      mockRequireTenantContext.mockResolvedValueOnce({
        user: { ...mockTenantUser, id: "stranger" },
        organizationId: TEST_ORG_ID,
        isSuperAdmin: false,
      });
      mockIncidentFindFirst({
        ...mockIncident,
        reportedBy: { id: "user-1" },
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
      mockIncidentFindFirst({
        ...mockIncident,
        status: "RESOLVED",
        reportedBy: { id: mockTenantUser.id },
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
      mockIncidentFindFirst({
        ...mockIncident,
        reportedBy: { id: mockTenantUser.id },
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
      expect(data.warnings).toBeDefined();
      expect(data.ignoredFields).toContain("assignedToId");
    });

    it("should return 403 if user tries to change status without permission", async () => {
      mockIncidentFindFirst({
        ...mockIncident,
        reportedBy: { id: mockTenantUser.id },
        assignedTo: null,
      } as any);

      const req = new NextRequest("http://localhost:3000/api/incidents/inc-1", {
        method: "PATCH",
        body: JSON.stringify({
          status: "IN_PROGRESS",
          assignedToId: "admin-1",
        }),
      });
      const response = await PATCH(req, mockParams("inc-1"));

      expect(response.status).toBe(403);
    });

    it("should create status history entry when reporter resolves their own incident", async () => {
      mockIncidentFindFirst({
        ...mockIncident,
        status: "IN_PROGRESS",
        reportedBy: { id: mockTenantUser.id },
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
      mockIncidentFindFirst({
        ...mockIncident,
        reportedBy: { id: mockTenantUser.id },
      } as any);
      prismaMock.incident.update.mockRejectedValue(new Error("DB error"));

      const req = new NextRequest("http://localhost:3000/api/incidents/inc-1", {
        method: "PATCH",
        body: JSON.stringify({ title: "Test" }),
      });
      const response = await PATCH(req, mockParams("inc-1"));

      expect(response.status).toBe(500);
    });
  });
});
