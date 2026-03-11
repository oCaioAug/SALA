import { prismaMock } from "../../../prisma/mock";
import {
  checkRecurringConflicts,
  generateRecurringDates,
  RecurringPattern,
} from "../recurringReservations";

describe("Recurring Reservations Logic", () => {
  describe("generateRecurringDates", () => {
    // ... tests written before
    it("should generate daily recurring dates correctly", () => {
      const startTime = new Date("2024-01-01T10:00:00"); // Monday
      const endTime = new Date("2024-01-01T12:00:00");
      const recurringEndDate = new Date("2024-01-05T23:59:59"); // Friday
      const pattern: RecurringPattern = "DAILY";

      const occurrences = generateRecurringDates(
        startTime,
        endTime,
        pattern,
        [], // Empty array for DAILY
        recurringEndDate
      );

      expect(occurrences).toHaveLength(5);
    });

    it("should generate weekly recurring dates on specific days correctly", () => {
      const startTime = new Date("2024-01-01T10:00:00"); // Monday
      const endTime = new Date("2024-01-01T11:00:00");
      const recurringEndDate = new Date("2024-01-14T23:59:59"); // 2 weeks
      const pattern: RecurringPattern = "WEEKLY";
      const daysOfWeek = [1, 3]; // Mondays and Wednesdays

      const occurrences = generateRecurringDates(
        startTime,
        endTime,
        pattern,
        daysOfWeek,
        recurringEndDate
      );

      expect(occurrences).toHaveLength(4);
    });

    it("should generate monthly recurring dates correctly", () => {
      const startTime = new Date("2024-01-15T10:00:00"); // Jan 15th
      const endTime = new Date("2024-01-15T11:00:00");
      const recurringEndDate = new Date("2024-03-31T23:59:59"); // 3 months
      const pattern: RecurringPattern = "MONTHLY";

      const occurrences = generateRecurringDates(
        startTime,
        endTime,
        pattern,
        [],
        recurringEndDate
      );

      expect(occurrences).toHaveLength(3);
    });
  });

  describe("checkRecurringConflicts", () => {
    it("should return conflicts when they exist in database", async () => {
      // Mock existing reservation in DB that conflicts
      const existingConflict = {
        id: "conflict-1",
        startTime: new Date("2024-01-01T10:30:00"),
        endTime: new Date("2024-01-01T11:30:00"),
        status: "ACTIVE",
        user: { name: "João", email: "joao@example.com" },
      };

      prismaMock.reservation.findFirst.mockResolvedValueOnce(
        existingConflict as any
      );
      prismaMock.reservation.findFirst.mockResolvedValueOnce(null); // Second day has no conflicts

      const occurrences = [
        {
          startTime: new Date("2024-01-01T10:00:00"),
          endTime: new Date("2024-01-01T12:00:00"),
        },
        {
          startTime: new Date("2024-01-02T10:00:00"),
          endTime: new Date("2024-01-02T12:00:00"),
        },
      ];

      const conflicts = await checkRecurringConflicts("room-1", occurrences);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].conflict.id).toBe("conflict-1");
      expect(conflicts[0].startTime.getDate()).toBe(1);

      expect(prismaMock.reservation.findFirst).toHaveBeenCalledTimes(2);
    });

    it("should return empty array when there are no conflicts", async () => {
      // Return null for all conflict checks
      prismaMock.reservation.findFirst.mockResolvedValue(null);

      const occurrences = [
        {
          startTime: new Date("2024-01-01T10:00:00"),
          endTime: new Date("2024-01-01T12:00:00"),
        },
        {
          startTime: new Date("2024-01-02T10:00:00"),
          endTime: new Date("2024-01-02T12:00:00"),
        },
      ];

      const conflicts = await checkRecurringConflicts("room-1", occurrences);

      expect(conflicts).toHaveLength(0);
    });
  });
});
