import { OrganizationStatus, Prisma } from "@prisma/client";

import { hashPassword } from "@/lib/auth/password";
import { createOrganizationWithOwner } from "@/lib/organization/create-organization";
import { refreshOrganizationDailyStats } from "@/lib/organization/stats";
import { prisma } from "@/lib/prisma";
import { RegisterInput } from "@/lib/validations/auth";

export class RegisterConflictError extends Error {
  constructor(
    public readonly field: "email" | "cpf" | "cnpj",
    message: string
  ) {
    super(message);
    this.name = "RegisterConflictError";
  }
}

export async function registerUserWithOrganization(input: RegisterInput) {
  const existingEmail = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
    select: { id: true },
  });
  if (existingEmail) {
    throw new RegisterConflictError("email", "Email já cadastrado");
  }

  const existingCpf = await prisma.user.findUnique({
    where: { cpf: input.cpf },
    select: { id: true },
  });
  if (existingCpf) {
    throw new RegisterConflictError("cpf", "CPF já cadastrado");
  }

  const existingCnpj = await prisma.organization.findUnique({
    where: { cnpj: input.cnpj },
    select: { id: true },
  });
  if (existingCnpj) {
    throw new RegisterConflictError("cnpj", "CNPJ já cadastrado");
  }

  const passwordHash = await hashPassword(input.password);

  try {
    const result = await prisma.$transaction(async tx => {
      const createdUser = await tx.user.create({
        data: {
          name: input.name,
          email: input.email.toLowerCase(),
          passwordHash,
          cpf: input.cpf,
          phone: input.phone,
          emailVerified: new Date(),
        },
      });

      const organization = await createOrganizationWithOwner(
        {
          name: input.organizationName,
          legalName: input.legalName,
          cnpj: input.cnpj,
          email: input.organizationEmail.toLowerCase(),
          phone: input.organizationPhone,
          ownerId: createdUser.id,
          status: OrganizationStatus.TRIAL,
          planId: input.planId,
        },
        tx
      );

      return { user: createdUser, organization };
    });

    void refreshOrganizationDailyStats(result.organization.id);

    return {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
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
    }
    throw error;
  }
}
