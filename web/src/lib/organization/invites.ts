import { OrganizationInvite } from "@prisma/client";

export const INVITE_EXPIRY_DAYS = 7;

export function getInviteExpiryDate(from: Date = new Date()): Date {
  const expiresAt = new Date(from);
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);
  return expiresAt;
}

export function isInviteActive(
  invite: Pick<OrganizationInvite, "expiresAt" | "acceptedAt">
): boolean {
  return invite.acceptedAt == null && invite.expiresAt > new Date();
}

export function buildInviteUrl(token: string, locale = "pt"): string {
  const base =
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/${locale}/invite/${token}`;
}
