export type PublicPlan = {
  id: string;
  name: string;
  slug: string;
  maxRooms: number;
  maxUsers: number;
  maxReservationsPerMonth: number | null;
  features: unknown;
};

export const REGISTER_STEPS = [1, 2, 3, 4] as const;
export type RegisterStep = (typeof REGISTER_STEPS)[number];
