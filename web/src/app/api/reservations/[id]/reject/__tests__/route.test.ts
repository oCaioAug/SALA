/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

import { notificationService } from "@/lib/notifications";

import {
  mockGetReservationInOrganization,
  TEST_ORG_ID,
} from "../../../../../../../prisma/auth-mocks";
import { prismaMock } from "../../../../../../../prisma/mock";
import { POST } from "../route";

jest.mock("@/lib/notifications", () => ({
  notificationService: {
    reservationRejected: jest.fn(),
  },
}));

const mockParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe("Reject Reservation API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetReservationInOrganization.mockImplementation((id, orgId) =>
      Promise.resolve({
        id,
        organizationId: orgId,
        roomId: "room-1",
        status: "PENDING",
      })
    );
  });

  it("should return 404 if reservation not found", async () => {
    mockGetReservationInOrganization.mockResolvedValueOnce(null);

    const req = new NextRequest(
      "http://localhost:3000/api/reservations/bad-id/reject",
      { method: "POST" }
    );
    const response = await POST(req, mockParams("bad-id"));

    expect(response.status).toBe(404);
  });

  it("should return 400 if reservation is not PENDING", async () => {
    mockGetReservationInOrganization.mockResolvedValueOnce({
      id: "res-1",
      organizationId: TEST_ORG_ID,
      roomId: "room-1",
      status: "REJECTED",
    });

    const req = new NextRequest(
      "http://localhost:3000/api/reservations/res-1/reject",
      { method: "POST" }
    );
    const response = await POST(req, mockParams("res-1"));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("já foi processada");
  });

  it("should reject a PENDING reservation and notify", async () => {
    prismaMock.reservation.update.mockResolvedValue({
      id: "res-1",
      status: "REJECTED",
      user: { id: "user-1" },
      room: { id: "room-1" },
    } as any);

    const req = new NextRequest(
      "http://localhost:3000/api/reservations/res-1/reject",
      { method: "POST" }
    );
    const response = await POST(req, mockParams("res-1"));

    expect(response.status).toBe(200);
    expect(prismaMock.reservation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "REJECTED" }),
      })
    );
    expect(notificationService.reservationRejected).toHaveBeenCalled();
  });

  it("should succeed even if notification fails", async () => {
    prismaMock.reservation.update.mockResolvedValue({
      id: "res-1",
      status: "REJECTED",
      user: {},
      room: {},
    } as any);
    (notificationService.reservationRejected as jest.Mock).mockRejectedValue(
      new Error("Notification failed")
    );

    const req = new NextRequest(
      "http://localhost:3000/api/reservations/res-1/reject",
      { method: "POST" }
    );
    const response = await POST(req, mockParams("res-1"));

    expect(response.status).toBe(200);
  });

  it("should return 500 on unexpected DB error", async () => {
    prismaMock.reservation.update.mockRejectedValue(new Error("DB error"));

    const req = new NextRequest(
      "http://localhost:3000/api/reservations/res-1/reject",
      { method: "POST" }
    );
    const response = await POST(req, mockParams("res-1"));

    expect(response.status).toBe(500);
  });
});
