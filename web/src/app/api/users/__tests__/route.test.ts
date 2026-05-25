/**
 * @jest-environment node
 */
import { prismaMock } from "../../../../../prisma/mock";
import { GET } from "../route";

describe("Users Route API", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("GET /api/users", () => {
    it("should return all users", async () => {
      const mockMembers = [
        {
          role: "MEMBER",
          user: {
            id: "user-1",
            name: "João",
            email: "joao@example.com",
            role: "USER",
          },
        },
        {
          role: "ADMIN",
          user: {
            id: "admin-1",
            name: "Admin",
            email: "admin@example.com",
            role: "ADMIN",
          },
        },
      ];
      prismaMock.organizationMember.findMany.mockResolvedValue(
        mockMembers as any
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(2);
    });

    it("should return 500 on DB error", async () => {
      prismaMock.organizationMember.findMany.mockRejectedValue(
        new Error("DB error")
      );

      const response = await GET();

      expect(response.status).toBe(500);
    });
  });
});
