/**
 * @jest-environment node
 */
import { prismaMock } from "../../../prisma/mock";
import {
  checkRecurringConflicts,
  generateRecurringDates,
  generateRecurringReservations,
} from "../recurringReservations";

describe("recurringReservations lib", () => {
  beforeEach(() => jest.clearAllMocks());

  // ==================== generateRecurringDates ====================
  describe("generateRecurringDates", () => {
    const start = new Date("2024-01-01T10:00:00");
    const end = new Date("2024-01-01T12:00:00");

    it("DAILY: should generate one occurrence per day", () => {
      const endDate = new Date("2024-01-03T23:59:59");
      const dates = generateRecurringDates(start, end, "DAILY", [], endDate);

      expect(dates).toHaveLength(3); // Jan 1, 2, 3
      expect(dates[0].startTime.getDate()).toBe(1);
      expect(dates[1].startTime.getDate()).toBe(2);
      expect(dates[2].startTime.getDate()).toBe(3);
    });

    it("WEEKLY: should generate occurrences only on selected days of week", () => {
      const endDate = new Date("2024-01-31T23:59:59");
      // 2024-01-01 is Monday (1). Select Mondays (1) and Fridays (5).
      const dates = generateRecurringDates(
        start,
        end,
        "WEEKLY",
        [1, 5],
        endDate
      );

      // All occurrences should be on Monday or Friday
      for (const d of dates) {
        const day = d.startTime.getDay();
        expect([1, 5]).toContain(day);
      }
      expect(dates.length).toBeGreaterThan(0);
    });

    it("MONTHLY: should generate occurrences only on the same day of month", () => {
      const endDate = new Date("2024-03-31T23:59:59");
      const dates = generateRecurringDates(start, end, "MONTHLY", [], endDate);

      // Jan 1, Feb 1, Mar 1
      expect(dates).toHaveLength(3);
      for (const d of dates) {
        expect(d.startTime.getDate()).toBe(1);
      }
    });

    it("should respect the endDate boundary", () => {
      const endDate = new Date("2024-01-02T09:00:00"); // Before 10:00, so Jan 2 occurrence should be excluded
      const dates = generateRecurringDates(start, end, "DAILY", [], endDate);

      expect(dates).toHaveLength(1); // Only Jan 1
    });
  });

  // ==================== checkRecurringConflicts ====================
  describe("checkRecurringConflicts", () => {
    it("should return empty array when no conflicts exist", async () => {
      prismaMock.reservation.findFirst.mockResolvedValue(null);

      const slots = [
        {
          startTime: new Date("2024-01-01T10:00:00"),
          endTime: new Date("2024-01-01T12:00:00"),
        },
      ];
      const conflicts = await checkRecurringConflicts("room-1", slots);

      expect(conflicts).toHaveLength(0);
    });

    it("should return conflicts when they exist", async () => {
      const conflictingReservation = {
        id: "existing",
        startTime: new Date("2024-01-01T09:00:00"),
        endTime: new Date("2024-01-01T11:00:00"),
        status: "ACTIVE",
        user: { name: "Maria", email: "maria@example.com" },
      };
      prismaMock.reservation.findFirst.mockResolvedValue(
        conflictingReservation as any
      );

      const slots = [
        {
          startTime: new Date("2024-01-01T10:00:00"),
          endTime: new Date("2024-01-01T12:00:00"),
        },
      ];
      const conflicts = await checkRecurringConflicts("room-1", slots);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].conflict.id).toBe("existing");
    });

    it("should check each slot independently", async () => {
      // First slot no conflict, second slot has conflict
      prismaMock.reservation.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: "conflict-2",
          startTime: new Date("2024-01-02T09:00:00"),
          endTime: new Date("2024-01-02T11:00:00"),
          status: "ACTIVE",
          user: { name: "Maria", email: "maria@example.com" },
        } as any);

      const slots = [
        {
          startTime: new Date("2024-01-01T10:00:00"),
          endTime: new Date("2024-01-01T12:00:00"),
        },
        {
          startTime: new Date("2024-01-02T10:00:00"),
          endTime: new Date("2024-01-02T12:00:00"),
        },
      ];
      const conflicts = await checkRecurringConflicts("room-1", slots);

      expect(conflicts).toHaveLength(1);
      expect(prismaMock.reservation.findFirst).toHaveBeenCalledTimes(2);
    });
  });

  // ==================== generateRecurringReservations ====================
  describe("generateRecurringReservations", () => {
    const baseData = {
      userId: "user-1",
      roomId: "room-1",
      startTime: new Date("2024-01-01T10:00:00"),
      endTime: new Date("2024-01-01T12:00:00"),
      purpose: "Reunião",
      recurringPattern: "DAILY" as const,
      recurringDaysOfWeek: [1],
      recurringEndDate: new Date("2024-01-03T23:59:59"),
      status: "PENDING" as const,
      recurringTemplateId: "template-1",
    };

    it("should create reservations and return IDs", async () => {
      prismaMock.reservation.create
        .mockResolvedValueOnce({ id: "res-1" } as any)
        .mockResolvedValueOnce({ id: "res-2" } as any)
        .mockResolvedValueOnce({ id: "res-3" } as any);
      prismaMock.reservation.updateMany.mockResolvedValue({ count: 2 } as any);

      const ids = await generateRecurringReservations(baseData);

      expect(ids).toHaveLength(3);
      expect(ids[0]).toBe("res-1");
      // updateMany should be called to set parentReservationId on children
      expect(prismaMock.reservation.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ recurringTemplateId: "template-1" }),
          data: { parentReservationId: "res-1" },
        })
      );
    });

    it("should NOT call updateMany when only one reservation is created", async () => {
      prismaMock.reservation.create.mockResolvedValueOnce({
        id: "res-1",
      } as any);

      const singleDayData = {
        ...baseData,
        startTime: new Date("2024-01-01T10:00:00"),
        recurringEndDate: new Date("2024-01-01T23:59:59"), // Same day - only 1 occurrence
      };

      const ids = await generateRecurringReservations(singleDayData);

      expect(ids).toHaveLength(1);
      expect(prismaMock.reservation.updateMany).not.toHaveBeenCalled();
    });
  });
});
