/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from "next/server";

import {
  mockAdminContextValue,
  mockRequireOrgAdmin,
  mockRequireTenantContext,
  mockTenantContextValue,
  TEST_ADMIN_ID,
  TEST_ORG_ID,
} from "../../../../../../prisma/auth-mocks";
import { prismaMock } from "../../../../../../prisma/mock";
import { DELETE, GET, PUT } from "../route";

const mockParams = (id: string) => ({ params: Promise.resolve({ id }) });

const mockSector = {
  id: "sector-1",
  name: "TI",
  description: null,
  organizationId: TEST_ORG_ID,
  members: [],
  rooms: [],
  _count: { members: 0, rooms: 0 },
};

describe("Sectors [id] API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (ops: unknown) => {
      if (Array.isArray(ops)) {
        return Promise.all(ops);
      }
      return [];
    });
  });

  describe("GET /api/sectors/[id]", () => {
    it("should return sector for org admin", async () => {
      mockRequireTenantContext.mockResolvedValueOnce(mockAdminContextValue);
      prismaMock.sector.findFirst.mockResolvedValue(mockSector as any);

      const req = new NextRequest("http://localhost:3000/api/sectors/sector-1");
      const response = await GET(req, mockParams("sector-1"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe("sector-1");
    });

    it("should return sector for sector manager", async () => {
      mockRequireTenantContext.mockResolvedValueOnce(mockTenantContextValue);
      prismaMock.sectorMember.findUnique.mockResolvedValue({
        role: "MANAGER",
        canApproveReservations: true,
        canManageRooms: true,
      } as any);
      prismaMock.sector.findFirst.mockResolvedValue(mockSector as any);

      const req = new NextRequest("http://localhost:3000/api/sectors/sector-1");
      const response = await GET(req, mockParams("sector-1"));

      expect(response.status).toBe(200);
    });

    it("should return 403 for non-member", async () => {
      mockRequireTenantContext.mockResolvedValueOnce(mockTenantContextValue);
      prismaMock.sectorMember.findUnique.mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/sectors/sector-1");
      const response = await GET(req, mockParams("sector-1"));
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.errorCode).toBe("ACCESS_DENIED");
    });

    it("should return 404 when sector is missing", async () => {
      mockRequireTenantContext.mockResolvedValueOnce(mockAdminContextValue);
      prismaMock.sector.findFirst.mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/sectors/missing");
      const response = await GET(req, mockParams("missing"));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toMatch(/não encontrado/i);
    });
  });

  describe("PUT /api/sectors/[id]", () => {
    it("should update sector name", async () => {
      mockRequireOrgAdmin.mockResolvedValueOnce({
        id: TEST_ADMIN_ID,
        organizationId: TEST_ORG_ID,
      } as any);
      prismaMock.sector.findFirst.mockResolvedValue(mockSector as any);
      prismaMock.sector.update.mockResolvedValue({
        ...mockSector,
        name: "Novo",
      } as any);
      prismaMock.sector.findUnique.mockResolvedValue({
        ...mockSector,
        name: "Novo",
      } as any);

      const req = new NextRequest(
        "http://localhost:3000/api/sectors/sector-1",
        {
          method: "PUT",
          body: JSON.stringify({ name: "Novo" }),
        }
      );
      const response = await PUT(req, mockParams("sector-1"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe("Novo");
    });

    it("should return 403 when not org admin", async () => {
      mockRequireOrgAdmin.mockResolvedValueOnce(
        NextResponse.json({ errorCode: "ACCESS_DENIED" }, { status: 403 })
      );

      const req = new NextRequest(
        "http://localhost:3000/api/sectors/sector-1",
        {
          method: "PUT",
          body: JSON.stringify({ name: "Novo" }),
        }
      );
      const response = await PUT(req, mockParams("sector-1"));
      expect(response.status).toBe(403);
    });
  });

  describe("DELETE /api/sectors/[id]", () => {
    it("should hard-delete sector and write audit log", async () => {
      mockRequireOrgAdmin.mockResolvedValueOnce({
        id: TEST_ADMIN_ID,
        organizationId: TEST_ORG_ID,
      } as any);
      prismaMock.sector.findFirst.mockResolvedValue({
        ...mockSector,
        _count: { members: 1, rooms: 2 },
      } as any);
      prismaMock.sector.delete.mockResolvedValue(mockSector as any);
      prismaMock.auditLog.create.mockResolvedValue({ id: "audit-1" } as any);

      const req = new NextRequest(
        "http://localhost:3000/api/sectors/sector-1",
        { method: "DELETE" }
      );
      const response = await DELETE(req, mockParams("sector-1"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toMatch(/removido/i);
      expect(prismaMock.sector.delete).toHaveBeenCalledWith({
        where: { id: "sector-1" },
      });
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            actorUserId: TEST_ADMIN_ID,
            action: "sector.deleted",
            entityType: "Sector",
            entityId: "sector-1",
            organizationId: TEST_ORG_ID,
          }),
        })
      );
    });

    it("should return 404 when sector is missing", async () => {
      mockRequireOrgAdmin.mockResolvedValueOnce({
        id: TEST_ADMIN_ID,
        organizationId: TEST_ORG_ID,
      } as any);
      prismaMock.sector.findFirst.mockResolvedValue(null);

      const req = new NextRequest(
        "http://localhost:3000/api/sectors/missing",
        { method: "DELETE" }
      );
      const response = await DELETE(req, mockParams("missing"));
      expect(response.status).toBe(404);
    });
  });
});
