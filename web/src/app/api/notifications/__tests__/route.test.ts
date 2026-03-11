/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

import { prismaMock } from "../../../../../prisma/mock";
import { GET, POST } from "../route";

describe("Notifications API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/notifications", () => {
    it("should return 400 if userId is missing", async () => {
      const req = new NextRequest("http://localhost:3000/api/notifications");
      const response = await GET(req);
      expect(response.status).toBe(400);
    });

    it("should retrieve notifications by user email", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "user@example.com",
      } as any);
      prismaMock.notification.findMany.mockResolvedValue([
        { id: "notif-1" },
      ] as any);

      const req = new NextRequest(
        "http://localhost:3000/api/notifications?userId=user@example.com&isRead=false&limit=10"
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.length).toBe(1);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: "user@example.com" },
      });
      expect(prismaMock.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user-1", isRead: false },
          take: 10,
        })
      );
    });

    it("should retrieve notifications by user id", async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: "user-1" } as any);
      prismaMock.notification.findMany.mockResolvedValue([
        { id: "notif-1" },
      ] as any);

      const req = new NextRequest(
        "http://localhost:3000/api/notifications?userId=user-1"
      );
      const response = await GET(req);

      expect(response.status).toBe(200);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-1" },
      });
    });

    it("should return 404 if user not found", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      const req = new NextRequest(
        "http://localhost:3000/api/notifications?userId=inv"
      );
      const response = await GET(req);
      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/notifications", () => {
    const validBody = {
      userId: "user-1",
      type: "RESERVATION_CREATED",
      title: "Nova Reserva",
      message: "Sua reserva foi criada",
    };

    it("should fail if required fields are missing", async () => {
      const req = new NextRequest("http://localhost:3000/api/notifications", {
        method: "POST",
        body: JSON.stringify({ userId: "user-1" }),
      });
      const response = await POST(req);
      expect(response.status).toBe(400);
    });

    it("should fail on invalid notification type", async () => {
      const req = new NextRequest("http://localhost:3000/api/notifications", {
        method: "POST",
        body: JSON.stringify({ ...validBody, type: "INVALID_TYPE" }),
      });
      const response = await POST(req);
      expect(response.status).toBe(400);
    });

    it("should create notification successfully", async () => {
      prismaMock.notification.create.mockResolvedValue({
        id: "notif-1",
        ...validBody,
      } as any);

      const req = new NextRequest("http://localhost:3000/api/notifications", {
        method: "POST",
        body: JSON.stringify(validBody),
      });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe("notif-1");
      expect(prismaMock.notification.create).toHaveBeenCalled();
    });
  });
});
