/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

import { prismaMock } from "../../../../../../prisma/mock";
import { POST } from "../route";

describe("Check Conflict API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should return 400 if roomId, startTime, or endTime is missing", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/reservations/check-conflict",
      {
        method: "POST",
        body: JSON.stringify({ roomId: "room-1" }), // Missing times
      }
    );
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("não fornecidos");
  });

  it("should return hasConflict: false when there are no conflicts", async () => {
    prismaMock.reservation.findMany.mockResolvedValue([]);

    const req = new NextRequest(
      "http://localhost:3000/api/reservations/check-conflict",
      {
        method: "POST",
        body: JSON.stringify({
          roomId: "room-1",
          startTime: "2024-01-01T10:00:00",
          endTime: "2024-01-01T12:00:00",
        }),
      }
    );
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.hasConflict).toBe(false);
    expect(data.conflictCount).toBe(0);
  });

  it("should return hasConflict: true with conflicting reservations", async () => {
    const conflictingRes = [{ id: "conflicting-res", user: {}, room: {} }];
    prismaMock.reservation.findMany.mockResolvedValue(conflictingRes as any);

    const req = new NextRequest(
      "http://localhost:3000/api/reservations/check-conflict",
      {
        method: "POST",
        body: JSON.stringify({
          roomId: "room-1",
          startTime: "2024-01-01T10:00:00",
          endTime: "2024-01-01T12:00:00",
        }),
      }
    );
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.hasConflict).toBe(true);
    expect(data.conflictCount).toBe(1);
  });

  it("should exclude reservation by excludeReservationId", async () => {
    prismaMock.reservation.findMany.mockResolvedValue([]);

    const req = new NextRequest(
      "http://localhost:3000/api/reservations/check-conflict",
      {
        method: "POST",
        body: JSON.stringify({
          roomId: "room-1",
          startTime: "2024-01-01T10:00:00",
          endTime: "2024-01-01T12:00:00",
          excludeReservationId: "current-res",
        }),
      }
    );

    await POST(req);

    expect(prismaMock.reservation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { not: "current-res" },
        }),
      })
    );
  });

  it("should return 500 on DB error", async () => {
    prismaMock.reservation.findMany.mockRejectedValue(new Error("DB error"));

    const req = new NextRequest(
      "http://localhost:3000/api/reservations/check-conflict",
      {
        method: "POST",
        body: JSON.stringify({
          roomId: "room-1",
          startTime: "2024-01-01T10:00:00",
          endTime: "2024-01-01T12:00:00",
        }),
      }
    );
    const response = await POST(req);

    expect(response.status).toBe(500);
  });
});
