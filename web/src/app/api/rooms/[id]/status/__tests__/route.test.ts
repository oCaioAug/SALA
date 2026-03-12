/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

import { prismaMock } from "../../../../../../../prisma/mock";
import { GET } from "../route";

const mockParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe("Room Status API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should return occupied=false when no active reservation matches now", async () => {
    prismaMock.reservation.findFirst.mockResolvedValue(null); // No current active reservation
    prismaMock.reservation.findMany.mockResolvedValue([]); // No upcoming reservations

    const req = new NextRequest(
      "http://localhost:3000/api/rooms/room-1/status"
    );
    const response = await GET(req, mockParams("room-1"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.isCurrentlyOccupied).toBe(false);
    expect(data.currentReservation).toBeNull();
    expect(data.upcomingReservations).toHaveLength(0);
    expect(data.canMakeReservation).toBe(true);
  });

  it("should return occupied=true when there is an active reservation now", async () => {
    const activeReservation = {
      id: "res-1",
      status: "ACTIVE",
      user: { name: "João" },
    };
    prismaMock.reservation.findFirst.mockResolvedValue(
      activeReservation as any
    );
    prismaMock.reservation.findMany.mockResolvedValue([]); // No upcoming

    const req = new NextRequest(
      "http://localhost:3000/api/rooms/room-1/status"
    );
    const response = await GET(req, mockParams("room-1"));
    const data = await response.json();

    expect(data.isCurrentlyOccupied).toBe(true);
    expect(data.currentReservation).toEqual(activeReservation);
  });

  it("should return upcoming reservations", async () => {
    prismaMock.reservation.findFirst.mockResolvedValue(null); // Not occupied now
    const upcoming = [
      { id: "res-2", startTime: new Date(), user: { name: "Maria" } },
    ];
    prismaMock.reservation.findMany.mockResolvedValue(upcoming as any);

    const req = new NextRequest(
      "http://localhost:3000/api/rooms/room-1/status"
    );
    const response = await GET(req, mockParams("room-1"));
    const data = await response.json();

    expect(data.upcomingReservations).toHaveLength(1);
    expect(data.upcomingReservations[0].id).toBe("res-2");
  });

  it("should return 500 on DB error", async () => {
    prismaMock.reservation.findFirst.mockRejectedValue(new Error("DB error"));
    // findMany should not be reached, but mock it to be safe
    prismaMock.reservation.findMany.mockResolvedValue([]);

    const req = new NextRequest(
      "http://localhost:3000/api/rooms/room-1/status"
    );
    const response = await GET(req, mockParams("room-1"));

    expect(response.status).toBe(500);
  });
});
