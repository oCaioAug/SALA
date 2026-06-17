import { User } from "@prisma/client";

export function isProfileComplete(
  user: Pick<User, "cpf" | "phone"> | null | undefined
): boolean {
  if (!user) return false;
  const cpf = user.cpf?.replace(/\D/g, "") ?? "";
  const phone = user.phone?.replace(/\D/g, "") ?? "";
  return cpf.length === 11 && phone.length >= 10;
}
