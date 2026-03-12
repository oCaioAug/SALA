/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

import { verifyAuth } from "@/lib/auth-hybrid";

import { prismaMock } from "../../../../../../prisma/mock";
import { GET, PATCH } from "../route";

jest.mock("@/lib/auth-hybrid", () => ({
  verifyAuth: jest.fn(),
}));

const mockParams = (userId: string) => ({
  params: Promise.resolve({ userId }),
});

const mockAdminAuth = {
  success: true,
  user: { id: "admin-1", role: "ADMIN" },
};
const mockUserAuth = {
  success: true,
  user: { id: "user-1", role: "USER" },
};
const mockUser = {
  id: "user-1",
  name: "João",
  email: "joao@example.com",
  role: "USER",
  image: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Users [userId] API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (verifyAuth as jest.Mock).mockResolvedValue(mockAdminAuth);
  });

  // ==================== GET ====================
  describe("GET /api/users/[userId]", () => {
    it("should return 401 when not authenticated", async () => {
      (verifyAuth as jest.Mock).mockResolvedValue({
        success: false,
        error: "Não autorizado",
        status: 401,
      });

      const req = new NextRequest("http://localhost:3000/api/users/user-1");
      const response = await GET(req, mockParams("user-1"));

      expect(response.status).toBe(401);
    });

    it("should return 404 if user is not found", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/users/bad-id");
      const response = await GET(req, mockParams("bad-id"));

      expect(response.status).toBe(404);
    });

    it("should allow admin to view any user profile", async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

      const req = new NextRequest("http://localhost:3000/api/users/user-1");
      const response = await GET(req, mockParams("user-1"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe("user-1");
    });

    it("should allow a user to view their own profile", async () => {
      (verifyAuth as jest.Mock).mockResolvedValue(mockUserAuth);
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

      const req = new NextRequest("http://localhost:3000/api/users/user-1");
      const response = await GET(req, mockParams("user-1")); // Own profile

      expect(response.status).toBe(200);
    });

    it("should return 403 when user tries to view another user's profile", async () => {
      (verifyAuth as jest.Mock).mockResolvedValue(mockUserAuth);
      prismaMock.user.findUnique.mockResolvedValue({
        ...mockUser,
        id: "other-user",
      } as any);

      const req = new NextRequest("http://localhost:3000/api/users/other-user");
      const response = await GET(req, mockParams("other-user"));

      expect(response.status).toBe(403);
    });
  });

  // ==================== PATCH ====================
  describe("PATCH /api/users/[userId]", () => {
    it("should return 400 if neither name nor email is provided", async () => {
      const req = new NextRequest("http://localhost:3000/api/users/user-1", {
        method: "PATCH",
        body: JSON.stringify({}),
      });
      const response = await PATCH(req, mockParams("user-1"));

      expect(response.status).toBe(400);
    });

    it("should return 400 for invalid email format", async () => {
      const req = new NextRequest("http://localhost:3000/api/users/user-1", {
        method: "PATCH",
        body: JSON.stringify({ email: "not-an-email" }),
      });
      const response = await PATCH(req, mockParams("user-1"));

      expect(response.status).toBe(400);
    });

    it("should return 404 if user does not exist", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/users/bad-id", {
        method: "PATCH",
        body: JSON.stringify({ name: "New Name" }),
      });
      const response = await PATCH(req, mockParams("bad-id"));

      expect(response.status).toBe(404);
    });

    it("should return 400 if new email is already in use", async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce(mockUser as any) // User exists
        .mockResolvedValueOnce({
          id: "other-user",
          email: "taken@example.com",
        } as any); // Email taken

      const req = new NextRequest("http://localhost:3000/api/users/user-1", {
        method: "PATCH",
        body: JSON.stringify({ email: "taken@example.com" }),
      });
      const response = await PATCH(req, mockParams("user-1"));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("email");
    });

    it("should update user name successfully", async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        name: "Novo Nome",
      } as any);

      const req = new NextRequest("http://localhost:3000/api/users/user-1", {
        method: "PATCH",
        body: JSON.stringify({ name: "Novo Nome" }),
      });
      const response = await PATCH(req, mockParams("user-1"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe("Novo Nome");
    });
  });
});
