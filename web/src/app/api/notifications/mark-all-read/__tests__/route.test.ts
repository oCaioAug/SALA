/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

import { prismaMock } from "../../../../../../prisma/mock";
import { PUT } from "../route";

describe("Mark All Notifications Read API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should return 400 if userId is missing", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/notifications/mark-all-read",
      {
        method: "PUT",
        body: JSON.stringify({}),
      }
    );
    const response = await PUT(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("userId");
  });

  it("should mark all notifications as read for a user by ID", async () => {
    prismaMock.notification.updateMany.mockResolvedValue({ count: 5 });

    const req = new NextRequest(
      "http://localhost:3000/api/notifications/mark-all-read",
      {
        method: "PUT",
        body: JSON.stringify({ userId: "user-1" }),
      }
    );
    const response = await PUT(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.count).toBe(5);
    expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: "user-1", isRead: false },
      data: { isRead: true },
    });
  });

  it("should resolve email to userId before updating", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "user-1" } as any);
    prismaMock.notification.updateMany.mockResolvedValue({ count: 3 });

    const req = new NextRequest(
      "http://localhost:3000/api/notifications/mark-all-read",
      {
        method: "PUT",
        body: JSON.stringify({ userId: "user@example.com" }),
      }
    );
    const response = await PUT(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
      select: { id: true },
    });
    expect(prismaMock.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1", isRead: false } })
    );
  });

  it("should return 404 if email is not found", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const req = new NextRequest(
      "http://localhost:3000/api/notifications/mark-all-read",
      {
        method: "PUT",
        body: JSON.stringify({ userId: "notfound@example.com" }),
      }
    );
    const response = await PUT(req);

    expect(response.status).toBe(404);
  });

  it("should return 500 on DB error", async () => {
    prismaMock.notification.updateMany.mockRejectedValue(new Error("DB error"));

    const req = new NextRequest(
      "http://localhost:3000/api/notifications/mark-all-read",
      {
        method: "PUT",
        body: JSON.stringify({ userId: "user-1" }),
      }
    );
    const response = await PUT(req);

    expect(response.status).toBe(500);
  });
});
