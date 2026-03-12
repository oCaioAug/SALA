/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

import { prismaMock } from "../../../../../../prisma/mock";
import { DELETE, PUT } from "../route";

const mockParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe("Notification [id] API", () => {
  beforeEach(() => jest.clearAllMocks());

  // ==================== PUT ====================
  describe("PUT /api/notifications/[id]", () => {
    it("should mark a notification as read", async () => {
      const updatedNotif = {
        id: "notif-1",
        isRead: true,
        user: { name: "João" },
      };
      prismaMock.notification.update.mockResolvedValue(updatedNotif as any);

      const req = new NextRequest(
        "http://localhost:3000/api/notifications/notif-1",
        {
          method: "PUT",
        }
      );
      const response = await PUT(req, mockParams("notif-1"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(prismaMock.notification.update).toHaveBeenCalledWith({
        where: { id: "notif-1" },
        data: { isRead: true },
        include: { user: true },
      });
      expect(data.isRead).toBe(true);
    });

    it("should return 500 on DB error", async () => {
      prismaMock.notification.update.mockRejectedValue(new Error("DB error"));

      const req = new NextRequest(
        "http://localhost:3000/api/notifications/notif-1",
        {
          method: "PUT",
        }
      );
      const response = await PUT(req, mockParams("notif-1"));

      expect(response.status).toBe(500);
    });
  });

  // ==================== DELETE ====================
  describe("DELETE /api/notifications/[id]", () => {
    it("should delete a notification", async () => {
      prismaMock.notification.delete.mockResolvedValue({} as any);

      const req = new NextRequest(
        "http://localhost:3000/api/notifications/notif-1",
        {
          method: "DELETE",
        }
      );
      const response = await DELETE(req, mockParams("notif-1"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(prismaMock.notification.delete).toHaveBeenCalledWith({
        where: { id: "notif-1" },
      });
    });

    it("should return 500 on DB error", async () => {
      prismaMock.notification.delete.mockRejectedValue(new Error("DB error"));

      const req = new NextRequest(
        "http://localhost:3000/api/notifications/notif-1",
        {
          method: "DELETE",
        }
      );
      const response = await DELETE(req, mockParams("notif-1"));

      expect(response.status).toBe(500);
    });
  });
});
