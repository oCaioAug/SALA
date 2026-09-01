import { randomBytes } from "crypto";

import { prisma } from "@/lib/prisma";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export function passwordResetIdentifier(userId: string) {
  return `password-reset:${userId}`;
}

export async function createPasswordResetToken(userId: string) {
  const identifier = passwordResetIdentifier(userId);
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await prisma.verificationToken.deleteMany({
    where: { identifier },
  });

  await prisma.verificationToken.create({
    data: { identifier, token, expires },
  });

  return token;
}

export async function consumePasswordResetToken(token: string) {
  const record = await prisma.verificationToken.findFirst({
    where: { token },
  });

  if (!record) {
    return { ok: false as const, reason: "invalid" as const };
  }

  if (record.expires.getTime() < Date.now()) {
    await prisma.verificationToken.deleteMany({
      where: { identifier: record.identifier, token: record.token },
    });
    return { ok: false as const, reason: "expired" as const };
  }

  const userId = record.identifier.replace(/^password-reset:/, "");
  if (!userId) {
    return { ok: false as const, reason: "invalid" as const };
  }

  await prisma.verificationToken.deleteMany({
    where: { identifier: record.identifier },
  });

  return { ok: true as const, userId };
}
