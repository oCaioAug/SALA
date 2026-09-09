/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

import {
  mockAdminContextValue,
  mockRequireTenantContext,
  mockTenantContextValue,
  TEST_ORG_ID,
} from "../../../../../prisma/auth-mocks";
import { prismaMock } from "../../../../../prisma/mock";
import { GET } from "../route";

const mockGetOrgSectorCapabilities = jest.fn();

jest.mock("@/lib/auth/permissions", () => ({
  getOrgSectorCapabilities: (...args: unknown[]) =>
    mockGetOrgSectorCapabilities(...args),
}));

describe("GET /api/search", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetOrgSectorCapabilities.mockResolvedValue({
      sectorCanApprove: false,
      sectorCanManageRooms: false,
    });
  });

  it("returns 400 when query is too short", async () => {
    mockRequireTenantContext.mockResolvedValueOnce(mockAdminContextValue);

    const request = new NextRequest("http://localhost:3000/api/search?q=a");
    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it("returns rooms for members", async () => {
    mockRequireTenantContext.mockResolvedValueOnce(mockTenantContextValue);
    prismaMock.room.findMany.mockResolvedValue([
      {
        id: "room-1",
        name: "Lab 1",
        sector: { name: "TI" },
      },
    ] as any);

    const request = new NextRequest(
      "http://localhost:3000/api/search?q=lab"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.groups).toHaveLength(1);
    expect(data.groups[0].type).toBe("rooms");
    expect(prismaMock.sector.findMany).not.toHaveBeenCalled();
    expect(prismaMock.organizationMember.findMany).not.toHaveBeenCalled();
  });

  it("returns rooms, sectors and users for org admin", async () => {
    mockRequireTenantContext.mockResolvedValueOnce(mockAdminContextValue);
    prismaMock.room.findMany.mockResolvedValue([
      { id: "room-1", name: "Sala A", sector: null },
    ] as any);
    prismaMock.sector.findMany.mockResolvedValue([
      { id: "sector-1", name: "TI", description: "Setor de TI" },
    ] as any);
    prismaMock.organizationMember.findMany.mockResolvedValue([
      {
        user: { id: "user-1", name: "Maria", email: "maria@test.com" },
      },
    ] as any);
    prismaMock.item.findMany.mockResolvedValue([]);

    const request = new NextRequest(
      "http://localhost:3000/api/search?q=ti"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.groups.map((group: { type: string }) => group.type)).toEqual(
      expect.arrayContaining(["rooms", "sectors", "users"])
    );
  });

  it("returns items when member can manage rooms in sector", async () => {
    mockRequireTenantContext.mockResolvedValueOnce(mockTenantContextValue);
    mockGetOrgSectorCapabilities.mockResolvedValueOnce({
      sectorCanApprove: false,
      sectorCanManageRooms: true,
    });
    prismaMock.room.findMany.mockResolvedValue([]);
    prismaMock.item.findMany.mockResolvedValue([
      {
        id: "item-1",
        name: "Projetor",
        room: { id: "room-1", name: "Sala A" },
      },
    ] as any);

    const request = new NextRequest(
      "http://localhost:3000/api/search?q=proj"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.groups[0].type).toBe("items");
    expect(prismaMock.item.findMany).toHaveBeenCalled();
  });

  it("scopes room search to organization", async () => {
    mockRequireTenantContext.mockResolvedValueOnce(mockAdminContextValue);
    prismaMock.room.findMany.mockResolvedValue([]);
    prismaMock.sector.findMany.mockResolvedValue([]);
    prismaMock.organizationMember.findMany.mockResolvedValue([]);
    prismaMock.item.findMany.mockResolvedValue([]);

    const request = new NextRequest(
      "http://localhost:3000/api/search?q=sala"
    );
    await GET(request);

    expect(prismaMock.room.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: TEST_ORG_ID,
          deletedAt: null,
        }),
      })
    );
  });
});
