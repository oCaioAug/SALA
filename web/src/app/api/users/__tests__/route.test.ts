/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

import { prismaMock } from "../../../../../prisma/mock";
import { GET } from "../route";

describe("Users API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/users", () => {
    it("should return a list of users", async () => {
      const mockUsers = [
        { id: "user-1", name: "Admin", email: "admin@sala.com", role: "ADMIN" },
      ];
      prismaMock.user.findMany.mockResolvedValue(mockUsers as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockUsers);
      expect(prismaMock.user.findMany).toHaveBeenCalledTimes(1);
    });
  });
});
