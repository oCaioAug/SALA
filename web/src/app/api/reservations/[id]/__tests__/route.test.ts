/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

import { notificationService } from "@/lib/notifications";

import { prismaMock } from "../../../../../../prisma/mock";
import { DELETE, GET, PUT } from "../route";
jest.mock("@/lib/notifications", () => ({
  notificationService: {
    reservationCancelled: jest.fn(),
  },
}));

describe("Reservations [id] API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/reservations/[id]", () => {
    it("should return 404 if reservation missing", async () => {
      prismaMock.reservation.findUnique.mockResolvedValue(null);
      const req = new NextRequest(
        "http://localhost:3000/api/reservations/inv-id"
      );
      const response = await GET(req, {
        params: Promise.resolve({ id: "inv-id" }),
      });
      expect(response.status).toBe(404);
    });

    it("should return reservation", async () => {
      prismaMock.reservation.findUnique.mockResolvedValue({
        id: "res-1",
      } as any);
      const req = new NextRequest(
        "http://localhost:3000/api/reservations/res-1"
      );
      const response = await GET(req, {
        params: Promise.resolve({ id: "res-1" }),
      });
      expect(response.status).toBe(200);
    });
  });

  describe("PUT /api/reservations/[id]", () => {
    it("should handle missing reservation", async () => {
      prismaMock.reservation.findUnique.mockResolvedValue(null);
      const req = new NextRequest(
        "http://localhost:3000/api/reservations/inv",
        {
          method: "PUT",
          body: JSON.stringify({ status: "APPROVED" }),
        }
      );
      const response = await PUT(req, {
        params: Promise.resolve({ id: "inv" }),
      });
      expect(response.status).toBe(404);
    });

    it("should update reservation and handle CANCELLED status", async () => {
      prismaMock.reservation.findUnique.mockResolvedValue({
        id: "res-1",
        roomId: "room-1",
      } as any);
      prismaMock.reservation.update.mockResolvedValue({
        id: "res-1",
        status: "CANCELLED",
      } as any);

      const req = new NextRequest(
        "http://localhost:3000/api/reservations/res-1",
        {
          method: "PUT",
          body: JSON.stringify({ status: "CANCELLED" }),
        }
      );
      const response = await PUT(req, {
        params: Promise.resolve({ id: "res-1" }),
      });

      expect(response.status).toBe(200);
      expect(prismaMock.room.update).toHaveBeenCalledWith({
        where: { id: "room-1" },
        data: { status: "LIVRE" },
      });
    });

    it("should prevent conflicting time updates", async () => {
      prismaMock.reservation.findUnique.mockResolvedValue({
        id: "res-1",
        roomId: "room-1",
      } as any);
      // Mock conflicting reservation
      prismaMock.reservation.findFirst.mockResolvedValue({
        id: "res-2",
      } as any);

      const req = new NextRequest(
        "http://localhost:3000/api/reservations/res-1",
        {
          method: "PUT",
          body: JSON.stringify({
            startTime: new Date("2024-01-01T10:00:00"),
            endTime: new Date("2024-01-01T11:00:00"),
          }),
        }
      );
      const response = await PUT(req, {
        params: Promise.resolve({ id: "res-1" }),
      });

      expect(response.status).toBe(409);
    });
  });

  describe("DELETE /api/reservations/[id]", () => {
    it("should handle missing reservation", async () => {
      prismaMock.reservation.findUnique.mockResolvedValue(null);
      const req = new NextRequest(
        "http://localhost:3000/api/reservations/inv",
        { method: "DELETE" }
      );
      const response = await DELETE(req, {
        params: Promise.resolve({ id: "inv" }),
      });
      expect(response.status).toBe(404);
    });

    it("should delete reservation and notify user", async () => {
      const mockRes = { id: "res-1", roomId: "room-1", user: { name: "João" } };
      prismaMock.reservation.findUnique.mockResolvedValue(mockRes as any);

      const req = new NextRequest(
        "http://localhost:3000/api/reservations/res-1",
        { method: "DELETE" }
      );
      const response = await DELETE(req, {
        params: Promise.resolve({ id: "res-1" }),
      });

      expect(response.status).toBe(200);
      expect(prismaMock.reservation.delete).toHaveBeenCalledWith({
        where: { id: "res-1" },
      });
      expect(prismaMock.room.update).toHaveBeenCalledWith({
        where: { id: "room-1" },
        data: { status: "LIVRE" },
      });
      expect(notificationService.reservationCancelled).toHaveBeenCalledWith(
        mockRes
      );
    });
  });
});
