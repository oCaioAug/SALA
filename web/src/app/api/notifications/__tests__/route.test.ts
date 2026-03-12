/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

import { prismaMock } from "../../../../../prisma/mock";
import { GET, POST } from "../route";

const mockUser = { id: "user-1", email: "user@example.com", role: "USER" };

describe("Notifications API", () => {
  beforeEach(() => jest.clearAllMocks());

  // ==================== GET ====================
  describe("GET /api/notifications", () => {
    it("should return 400 if userId is missing", async () => {
      const req = new NextRequest("http://localhost:3000/api/notifications");
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("userId");
    });

    it("should find user by ID when userId does not contain @", async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      prismaMock.notification.findMany.mockResolvedValue([]);

      const req = new NextRequest(
        "http://localhost:3000/api/notifications?userId=user-1"
      );
      const response = await GET(req);

      expect(response.status).toBe(200);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-1" },
      });
    });

    it("should find user by email when userId contains @", async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      prismaMock.notification.findMany.mockResolvedValue([]);

      const req = new NextRequest(
        "http://localhost:3000/api/notifications?userId=user@example.com"
      );
      await GET(req);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: "user@example.com" },
      });
    });

    it("should return 404 if user is not found", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const req = new NextRequest(
        "http://localhost:3000/api/notifications?userId=bad-id"
      );
      const response = await GET(req);

      expect(response.status).toBe(404);
    });

    it("should apply isRead and type filters when provided", async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      prismaMock.notification.findMany.mockResolvedValue([]);

      const req = new NextRequest(
        "http://localhost:3000/api/notifications?userId=user-1&isRead=true&type=RESERVATION_CREATED&limit=5"
      );
      await GET(req);

      expect(prismaMock.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: "user-1",
            isRead: true,
            type: "RESERVATION_CREATED",
          }),
          take: 5,
        })
      );
    });
  });

  // ==================== POST ====================
  describe("POST /api/notifications", () => {
    it("should return 400 if required fields are missing", async () => {
      const req = new NextRequest("http://localhost:3000/api/notifications", {
        method: "POST",
        body: JSON.stringify({ userId: "user-1" }), // Missing type, title, message
      });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("obrigatórios");
    });

    it("should return 400 for invalid notification type", async () => {
      const req = new NextRequest("http://localhost:3000/api/notifications", {
        method: "POST",
        body: JSON.stringify({
          userId: "user-1",
          type: "INVALID_TYPE",
          title: "Test",
          message: "A test",
        }),
      });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("inválido");
    });

    it("should create a notification successfully", async () => {
      const newNotification = {
        id: "notif-1",
        userId: "user-1",
        type: "RESERVATION_CREATED",
        title: "Reserva criada",
        message: "Sua reserva foi criada com sucesso.",
        user: mockUser,
      };
      prismaMock.notification.create.mockResolvedValue(newNotification as any);

      const req = new NextRequest("http://localhost:3000/api/notifications", {
        method: "POST",
        body: JSON.stringify({
          userId: "user-1",
          type: "RESERVATION_CREATED",
          title: "Reserva criada",
          message: "Sua reserva foi criada com sucesso.",
        }),
      });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe("notif-1");
    });

    it("should return 500 on DB error", async () => {
      prismaMock.notification.create.mockRejectedValue(new Error("DB error"));

      const req = new NextRequest("http://localhost:3000/api/notifications", {
        method: "POST",
        body: JSON.stringify({
          userId: "user-1",
          type: "RESERVATION_CREATED",
          title: "Test",
          message: "Test",
        }),
      });
      const response = await POST(req);

      expect(response.status).toBe(500);
    });
  });
});
