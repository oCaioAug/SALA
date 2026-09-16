import { prisma } from "@/lib/prisma";

import { RegisterConflictError } from "./register-user";

export async function assertEmailAvailable(email: string) {
  const existingEmail = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, passwordHash: true },
  });
  if (!existingEmail) return;

  if (!existingEmail.passwordHash) {
    throw new RegisterConflictError(
      "oauth",
      "Esta conta foi criada com Google"
    );
  }

  throw new RegisterConflictError("email", "Email já cadastrado");
}
