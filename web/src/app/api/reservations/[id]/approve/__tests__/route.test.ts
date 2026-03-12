/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

import { notificationService } from "@/lib/notifications";

import { prismaMock } from "../../../../../../../prisma/mock";
import { POST } from "../route";

jest.mock("@/lib/notifications", () => ({
  notificationService: {
    reservationApproved: jest.fn(),
  },
}));

const mockParams = (id: string) => ({ params: Promise.resolve({ id }) });

const mockPendingReservation = {
  id: "res-1",
  status: "PENDING",
  userId: "user-1",
  user: { id: "user-1", name: "Maria", email: "maria@example.com" },
  room: { id: "room-1", name: "Sala 1" },
};

describe("Approve Reservation API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should return 404 if reservation not found", async () => {
    prismaMock.reservation.findUnique.mockResolvedValue(null);

    const req = new NextRequest(
      "http://localhost:3000/api/reservations/bad-id/approve",
      {
        method: "POST",
      }
    );
    const response = await POST(req, mockParams("bad-id"));

    expect(response.status).toBe(404);
  });

  it("should return 400 if reservation is not PENDING", async () => {
    prismaMock.reservation.findUnique.mockResolvedValue({
      ...mockPendingReservation,
      status: "APPROVED",
    } as any);

    const req = new NextRequest(
      "http://localhost:3000/api/reservations/res-1/approve",
      {
        method: "POST",
      }
    );
    const response = await POST(req, mockParams("res-1"));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("já foi processada");
  });

  it("should approve a PENDING reservation and notify", async () => {
    prismaMock.reservation.findUnique.mockResolvedValue(
      mockPendingReservation as any
    );
    prismaMock.reservation.update.mockResolvedValue({
      ...mockPendingReservation,
      status: "APPROVED",
    } as any);

    const req = new NextRequest(
      "http://localhost:3000/api/reservations/res-1/approve",
      {
        method: "POST",
      }
    );
    const response = await POST(req, mockParams("res-1"));

    expect(response.status).toBe(200);
    expect(prismaMock.reservation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "res-1" },
        data: expect.objectContaining({ status: "APPROVED" }),
      })
    );
    expect(notificationService.reservationApproved).toHaveBeenCalled();
  });

  it("should succeed even if notification service throws", async () => {
    prismaMock.reservation.findUnique.mockResolvedValue(
      mockPendingReservation as any
    );
    prismaMock.reservation.update.mockResolvedValue({
      ...mockPendingReservation,
      status: "APPROVED",
    } as any);
    (notificationService.reservationApproved as jest.Mock).mockRejectedValue(
      new Error("Notification failed")
    );

    const req = new NextRequest(
      "http://localhost:3000/api/reservations/res-1/approve",
      {
        method: "POST",
      }
    );
    const response = await POST(req, mockParams("res-1"));

    expect(response.status).toBe(200);
  });

  it("should return 500 on unexpected DB error", async () => {
    prismaMock.reservation.findUnique.mockRejectedValue(new Error("DB error"));

    const req = new NextRequest(
      "http://localhost:3000/api/reservations/res-1/approve",
      {
        method: "POST",
      }
    );
    const response = await POST(req, mockParams("res-1"));

    expect(response.status).toBe(500);
  });
});
