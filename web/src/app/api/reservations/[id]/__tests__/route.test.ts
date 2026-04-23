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

jest.mock("@/lib/googleCalendar", () => ({
  syncReservationToGoogleCalendar: jest.fn().mockResolvedValue(undefined),
}));

const mockParams = (id: string) => ({ params: Promise.resolve({ id }) });

const mockReservation = {
  id: "res-1",
  roomId: "room-1",
  userId: "user-1",
  startTime: new Date("2024-01-01T10:00:00"),
  endTime: new Date("2024-01-01T12:00:00"),
  status: "ACTIVE",
  user: { id: "user-1", name: "João" },
  room: { id: "room-1", name: "Sala 1" },
};

describe("Reservation [id] API", () => {
  beforeEach(() => jest.clearAllMocks());

  // ==================== GET ====================
  describe("GET /api/reservations/[id]", () => {
    it("should return the reservation when found", async () => {
      prismaMock.reservation.findUnique.mockResolvedValue(
        mockReservation as any
      );

      const req = new NextRequest(
        "http://localhost:3000/api/reservations/res-1"
      );
      const response = await GET(req, mockParams("res-1"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe("res-1");
    });

    it("should return 404 when reservation is not found", async () => {
      prismaMock.reservation.findUnique.mockResolvedValue(null);

      const req = new NextRequest(
        "http://localhost:3000/api/reservations/bad-id"
      );
      const response = await GET(req, mockParams("bad-id"));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain("não encontrada");
    });

    it("should return 500 on DB error", async () => {
      prismaMock.reservation.findUnique.mockRejectedValue(
        new Error("DB error")
      );

      const req = new NextRequest(
        "http://localhost:3000/api/reservations/res-1"
      );
      const response = await GET(req, mockParams("res-1"));

      expect(response.status).toBe(500);
    });
  });

  // ==================== PUT ====================
  describe("PUT /api/reservations/[id]", () => {
    it("should return 404 if reservation does not exist", async () => {
      prismaMock.reservation.findUnique.mockResolvedValue(null);

      const req = new NextRequest(
        "http://localhost:3000/api/reservations/bad-id",
        {
          method: "PUT",
          body: JSON.stringify({ purpose: "Novo propósito" }),
        }
      );
      const response = await PUT(req, mockParams("bad-id"));

      expect(response.status).toBe(404);
    });

    it("should return 409 if time conflict exists when changing time", async () => {
      prismaMock.reservation.findUnique.mockResolvedValue(
        mockReservation as any
      );
      prismaMock.reservation.findFirst.mockResolvedValue({
        id: "conflicting-res",
      } as any);

      const req = new NextRequest(
        "http://localhost:3000/api/reservations/res-1",
        {
          method: "PUT",
          body: JSON.stringify({
            startTime: "2024-01-01T10:00:00",
            endTime: "2024-01-01T11:30:00",
          }),
        }
      );
      const response = await PUT(req, mockParams("res-1"));

      expect(response.status).toBe(409);
    });

    it("should update reservation and room status to LIVRE when cancelled", async () => {
      prismaMock.reservation.findUnique.mockResolvedValue(
        mockReservation as any
      );
      prismaMock.reservation.findFirst.mockResolvedValue(null); // No conflicts
      prismaMock.reservation.update.mockResolvedValue({
        ...mockReservation,
        status: "CANCELLED",
      } as any);
      prismaMock.room.update.mockResolvedValue({} as any);

      const req = new NextRequest(
        "http://localhost:3000/api/reservations/res-1",
        {
          method: "PUT",
          body: JSON.stringify({ status: "CANCELLED" }),
        }
      );
      const response = await PUT(req, mockParams("res-1"));

      expect(response.status).toBe(200);
      expect(prismaMock.room.update).toHaveBeenCalledWith({
        where: { id: "room-1" },
        data: { status: "LIVRE" },
      });
    });

    it("should update reservation fields without conflict check when no time change", async () => {
      prismaMock.reservation.findUnique.mockResolvedValue(
        mockReservation as any
      );
      prismaMock.reservation.update.mockResolvedValue({
        ...mockReservation,
        purpose: "Treinamento",
      } as any);

      const req = new NextRequest(
        "http://localhost:3000/api/reservations/res-1",
        {
          method: "PUT",
          body: JSON.stringify({ purpose: "Treinamento" }),
        }
      );
      const response = await PUT(req, mockParams("res-1"));

      expect(response.status).toBe(200);
      expect(prismaMock.reservation.findFirst).not.toHaveBeenCalled();
    });
  });

  // ==================== DELETE ====================
  describe("DELETE /api/reservations/[id]", () => {
    beforeEach(() => {
      prismaMock.reservation.update.mockResolvedValue({
        ...mockReservation,
        status: "CANCELLED",
      } as any);
    });

    it("should return 404 if reservation not found", async () => {
      prismaMock.reservation.findUnique.mockResolvedValue(null);

      const req = new NextRequest(
        "http://localhost:3000/api/reservations/bad-id",
        {
          method: "DELETE",
        }
      );
      const response = await DELETE(req, mockParams("bad-id"));

      expect(response.status).toBe(404);
    });

    it("should delete reservation and update room status", async () => {
      prismaMock.reservation.findUnique.mockResolvedValue(
        mockReservation as any
      );
      prismaMock.reservation.delete.mockResolvedValue({} as any);
      prismaMock.room.update.mockResolvedValue({} as any);

      const req = new NextRequest(
        "http://localhost:3000/api/reservations/res-1",
        {
          method: "DELETE",
        }
      );
      const response = await DELETE(req, mockParams("res-1"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain("cancelada com sucesso");
      expect(prismaMock.reservation.delete).toHaveBeenCalledWith({
        where: { id: "res-1" },
      });
      expect(prismaMock.room.update).toHaveBeenCalledWith({
        where: { id: "room-1" },
        data: { status: "LIVRE" },
      });
      expect(notificationService.reservationCancelled).toHaveBeenCalled();
    });

    it("should succeed even if notification fails", async () => {
      prismaMock.reservation.findUnique.mockResolvedValue(
        mockReservation as any
      );
      prismaMock.reservation.delete.mockResolvedValue({} as any);
      prismaMock.room.update.mockResolvedValue({} as any);
      (notificationService.reservationCancelled as jest.Mock).mockRejectedValue(
        new Error("Notification failed")
      );

      const req = new NextRequest(
        "http://localhost:3000/api/reservations/res-1",
        {
          method: "DELETE",
        }
      );
      const response = await DELETE(req, mockParams("res-1"));

      expect(response.status).toBe(200);
    });
  });
});
