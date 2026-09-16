import { Prisma } from "@prisma/client";

import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import { AccountRegisterInput } from "@/lib/validations/auth";

import { assertEmailAvailable } from "./assert-email-available";

export class RegisterConflictError extends Error {
  constructor(
    public readonly field: "email" | "cpf" | "cnpj" | "oauth",
    message: string
  ) {
    super(message);
    this.name = "RegisterConflictError";
  }
}

function throwIfUniqueConflict(error: unknown): void {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return;
  if (error.code !== "P2002") return;

  const target = (error.meta?.target as string[] | undefined)?.join(",");
  if (target?.includes("email")) {
    throw new RegisterConflictError("email", "Email já cadastrado");
  }
  if (target?.includes("cpf")) {
    throw new RegisterConflictError("cpf", "CPF já cadastrado");
  }
  if (target?.includes("cnpj")) {
    throw new RegisterConflictError("cnpj", "CNPJ já cadastrado");
  }
}

function toPublicUser(user: {
  id: string;
  email: string;
  name: string | null;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}

export async function registerUser(input: AccountRegisterInput) {
  const email = input.email.toLowerCase();
  await assertEmailAvailable(email);

  const passwordHash = await hashPassword(input.password);

  try {
    const createdUser = await prisma.user.create({
      data: {
        name: input.name,
        email,
        passwordHash,
        emailVerified: new Date(),
      },
    });

    return toPublicUser(createdUser);
  } catch (error) {
    throwIfUniqueConflict(error);
    throw error;
  }
}
