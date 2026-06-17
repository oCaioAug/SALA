export const TEST_ORG_ID = "org-test";
export const TEST_USER_ID = "user-1";
export const TEST_ADMIN_ID = "admin-1";

export type MockAuthUser = {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  organizationId: string;
  organizationRole: "MEMBER" | "ADMIN" | "OWNER";
  platformRole: "NONE";
  name: string;
};

export type MockTenantContextValue = {
  user: MockAuthUser;
  organizationId: string;
  isSuperAdmin: boolean;
};

export const mockTenantUser: MockAuthUser = {
  id: TEST_USER_ID,
  email: "test@example.com",
  role: "USER",
  organizationId: TEST_ORG_ID,
  organizationRole: "MEMBER",
  platformRole: "NONE",
  name: "Test User",
};

export const mockAdminUser: MockAuthUser = {
  ...mockTenantUser,
  id: TEST_ADMIN_ID,
  email: "admin@example.com",
  role: "ADMIN",
  organizationRole: "ADMIN",
};

export const mockTenantContextValue: MockTenantContextValue = {
  user: mockTenantUser,
  organizationId: TEST_ORG_ID,
  isSuperAdmin: false,
};

export const mockAdminContextValue: MockTenantContextValue = {
  user: mockAdminUser,
  organizationId: TEST_ORG_ID,
  isSuperAdmin: false,
};

export const mockRequireTenantContext = jest.fn(() =>
  Promise.resolve(mockTenantContextValue)
);

export const mockRequireOrgAdmin = jest.fn(() =>
  Promise.resolve(mockAdminUser)
);

export const mockGetRoomInOrganization = jest.fn(
  (roomId: string, orgId: string) =>
    Promise.resolve({ id: roomId, organizationId: orgId, deletedAt: null })
);

export const mockGetReservationInOrganization = jest.fn(
  (id: string, orgId: string) =>
    Promise.resolve({
      id,
      organizationId: orgId,
      roomId: "room-1",
      status: "ACTIVE",
    })
);

export const mockGetIncidentInOrganization = jest.fn(
  (
    id: string,
    orgId: string
  ): Promise<{ id: string; organizationId: string } | null> =>
    Promise.resolve({ id, organizationId: orgId })
);

export const mockGetItemInOrganization = jest.fn((id: string, orgId: string) =>
  Promise.resolve({ id, organizationId: orgId, roomId: "room-1" })
);

export const mockGetOrgMemberUserIds = jest.fn(() =>
  Promise.resolve([TEST_USER_ID, TEST_ADMIN_ID])
);

jest.mock("@/lib/auth/tenant", () => ({
  requireTenantContext: () => mockRequireTenantContext(),
  requireTenantOrganizationId: jest.fn(() => Promise.resolve(TEST_ORG_ID)),
  getOrganizationIdForUser: jest.fn(() => Promise.resolve(TEST_ORG_ID)),
}));

jest.mock("@/lib/auth/platform", () => {
  const actual = jest.requireActual<typeof import("@/lib/auth/platform")>(
    "@/lib/auth/platform"
  );
  return {
    ...actual,
    requireOrgAdmin: () => mockRequireOrgAdmin(),
    requireAuth: () => mockRequireOrgAdmin(),
  };
});

jest.mock("@/lib/auth/tenant-queries", () => ({
  getRoomInOrganization: (...args: unknown[]) =>
    mockGetRoomInOrganization(...(args as [string, string])),
  getReservationInOrganization: (...args: unknown[]) =>
    mockGetReservationInOrganization(...(args as [string, string])),
  getIncidentInOrganization: (...args: unknown[]) =>
    mockGetIncidentInOrganization(...(args as [string, string])),
  getItemInOrganization: (...args: unknown[]) =>
    mockGetItemInOrganization(...(args as [string, string])),
  getOrgMemberUserIds: () => mockGetOrgMemberUserIds(),
}));

beforeEach(() => {
  mockRequireTenantContext.mockResolvedValue(mockTenantContextValue);
  mockRequireOrgAdmin.mockResolvedValue(mockAdminUser);
  mockGetRoomInOrganization.mockImplementation((roomId, orgId) =>
    Promise.resolve({ id: roomId, organizationId: orgId, deletedAt: null })
  );
  mockGetReservationInOrganization.mockImplementation((id, orgId) =>
    Promise.resolve({
      id,
      organizationId: orgId,
      roomId: "room-1",
      status: "ACTIVE",
    })
  );
  mockGetIncidentInOrganization.mockImplementation((id, orgId) =>
    Promise.resolve({ id, organizationId: orgId })
  );
  mockGetItemInOrganization.mockImplementation((id, orgId) =>
    Promise.resolve({ id, organizationId: orgId, roomId: "room-1" })
  );
  mockGetOrgMemberUserIds.mockResolvedValue([TEST_USER_ID, TEST_ADMIN_ID]);
});
