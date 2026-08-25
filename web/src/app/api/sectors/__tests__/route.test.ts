/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import {
  mockAdminContextValue,
  mockRequireOrgAdmin,
  mockRequireTenantContext,
  mockTenantContextValue,
  TEST_ADMIN_ID,
  TEST_ORG_ID,
  TEST_USER_ID,
} from "../../../../../prisma/auth-mocks";
import { prismaMock } from "../../../../../prisma/mock";
import { GET, POST } from "../route";

const mockSector = {
  id: "sector-1",
  name: "TI",
  description: null,
  organizationId: TEST_ORG_ID,
  deletedAt: null,
  members: [],
  rooms: [],
  _count: { members: 0, rooms: 0 },
};

describe("Sectors API (List and Create)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (ops: unknown) => {
      if (Array.isArray(ops)) {
        return Promise.all(ops);
      }
      return [];
    });
  });

  describe("GET /api/sectors", () => {
    it("should list all sectors for org admin", async () => {
      mockRequireTenantContext.mockResolvedValueOnce(mockAdminContextValue);
      prismaMock.sector.findMany.mockResolvedValue([mockSector] as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(prismaMock.sector.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizationId: TEST_ORG_ID,
            deletedAt: null,
          },
        })
      );
    });

    it("should scope sectors to membership for sector manager", async () => {
      mockRequireTenantContext.mockResolvedValueOnce(mockTenantContextValue);
      prismaMock.sectorMember.findFirst.mockResolvedValue({ id: "sm-1" } as any);
      prismaMock.sector.findMany.mockResolvedValue([mockSector] as any);

      const response = await GET();

      expect(response.status).toBe(200);
      expect(prismaMock.sector.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizationId: TEST_ORG_ID,
            deletedAt: null,
            members: { some: { userId: TEST_USER_ID } },
          },
        })
      );
    });

    it("should return 403 for member who is not a sector manager", async () => {
      mockRequireTenantContext.mockResolvedValueOnce(mockTenantContextValue);
      prismaMock.sectorMember.findFirst.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.errorCode).toBe("ACCESS_DENIED");
    });
  });

  describe("POST /api/sectors", () => {
    it("should create a sector for org admin", async () => {
      mockRequireOrgAdmin.mockResolvedValueOnce({
        id: TEST_ADMIN_ID,
        organizationId: TEST_ORG_ID,
      } as any);
      prismaMock.sector.create.mockResolvedValue({
        id: "sector-1",
        name: "TI",
      } as any);
      prismaMock.sector.findUnique.mockResolvedValue(mockSector as any);

      const req = new NextRequest("http://localhost:3000/api/sectors", {
        method: "POST",
        body: JSON.stringify({ name: "TI" }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe("sector-1");
      expect(prismaMock.sector.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "TI",
            organizationId: TEST_ORG_ID,
          }),
        })
      );
    });

    it("should return 409 on duplicate name", async () => {
      mockRequireOrgAdmin.mockResolvedValueOnce({
        id: TEST_ADMIN_ID,
        organizationId: TEST_ORG_ID,
      } as any);
      const conflict = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint",
        { code: "P2002", clientVersion: "test" }
      );
      prismaMock.sector.create.mockRejectedValue(conflict);

      const req = new NextRequest("http://localhost:3000/api/sectors", {
        method: "POST",
        body: JSON.stringify({ name: "TI" }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toMatch(/Já existe/);
    });

    it("should return 403 when requireOrgAdmin denies", async () => {
      mockRequireOrgAdmin.mockResolvedValueOnce(
        NextResponse.json({ errorCode: "ACCESS_DENIED" }, { status: 403 })
      );

      const req = new NextRequest("http://localhost:3000/api/sectors", {
        method: "POST",
        body: JSON.stringify({ name: "TI" }),
      });

      const response = await POST(req);
      expect(response.status).toBe(403);
    });
  });
});
