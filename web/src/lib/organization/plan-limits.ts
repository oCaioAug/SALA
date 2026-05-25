import { ApiErrorCode, type ApiErrorCodeType } from "@/lib/api/error-codes";
import { prisma } from "@/lib/prisma";

export type OrganizationUsage = {
  planId: string | null;
  planName: string | null;
  maxRooms: number | null;
  maxUsers: number | null;
  maxReservationsPerMonth: number | null;
  roomsCount: number;
  membersCount: number;
  reservationsThisMonth: number;
};

export async function getOrganizationUsage(
  organizationId: string
): Promise<OrganizationUsage> {
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      planId: true,
      plan: {
        select: {
          name: true,
          maxRooms: true,
          maxUsers: true,
          maxReservationsPerMonth: true,
        },
      },
    },
  });

  const [roomsCount, membersCount, reservationsThisMonth] = await Promise.all([
    prisma.room.count({
      where: { organizationId, deletedAt: null },
    }),
    prisma.organizationMember.count({ where: { organizationId } }),
    prisma.reservation.count({
      where: {
        organizationId,
        createdAt: { gte: monthStart },
      },
    }),
  ]);

  return {
    planId: org?.planId ?? null,
    planName: org?.plan?.name ?? null,
    maxRooms: org?.plan?.maxRooms ?? null,
    maxUsers: org?.plan?.maxUsers ?? null,
    maxReservationsPerMonth: org?.plan?.maxReservationsPerMonth ?? null,
    roomsCount,
    membersCount,
    reservationsThisMonth,
  };
}

type LimitCheckResult =
  | { ok: true }
  | { ok: false; errorCode: ApiErrorCodeType; max: number };

export async function assertCanAddRoom(
  organizationId: string
): Promise<LimitCheckResult> {
  const usage = await getOrganizationUsage(organizationId);
  if (usage.maxRooms != null && usage.roomsCount >= usage.maxRooms) {
    return {
      ok: false,
      errorCode: ApiErrorCode.PLAN_LIMIT_ROOMS,
      max: usage.maxRooms,
    };
  }
  return { ok: true };
}

export async function assertCanAddMember(
  organizationId: string
): Promise<LimitCheckResult> {
  const usage = await getOrganizationUsage(organizationId);
  if (usage.maxUsers != null && usage.membersCount >= usage.maxUsers) {
    return {
      ok: false,
      errorCode: ApiErrorCode.PLAN_LIMIT_USERS,
      max: usage.maxUsers,
    };
  }
  return { ok: true };
}

export async function assertCanCreateReservation(
  organizationId: string
): Promise<LimitCheckResult> {
  const usage = await getOrganizationUsage(organizationId);
  if (
    usage.maxReservationsPerMonth != null &&
    usage.reservationsThisMonth >= usage.maxReservationsPerMonth
  ) {
    return {
      ok: false,
      errorCode: ApiErrorCode.PLAN_LIMIT_RESERVATIONS,
      max: usage.maxReservationsPerMonth,
    };
  }
  return { ok: true };
}

export function usagePercent(
  current: number,
  max: number | null
): number | null {
  if (max == null || max === 0) return null;
  return Math.min(100, Math.round((current / max) * 100));
}
