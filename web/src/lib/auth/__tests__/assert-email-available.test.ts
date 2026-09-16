import { RegisterConflictError } from "@/lib/auth/register-user";
import { assertEmailAvailable } from "@/lib/auth/assert-email-available";

import { prismaMock } from "../../../../prisma/mock";

describe("assertEmailAvailable", () => {
  it("allows unused emails", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null as never);

    await expect(
      assertEmailAvailable("novo@gmail.com")
    ).resolves.toBeUndefined();
  });

  it("flags Google-only accounts", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u1",
      passwordHash: null,
    } as never);

    await expect(
      assertEmailAvailable("testando@gmail.com")
    ).rejects.toMatchObject({
      name: "RegisterConflictError",
      field: "oauth",
    });
    await expect(
      assertEmailAvailable("testando@gmail.com")
    ).rejects.toBeInstanceOf(RegisterConflictError);
  });

  it("flags emails that already have a password", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u1",
      passwordHash: "hash",
    } as never);

    await expect(
      assertEmailAvailable("testando@gmail.com")
    ).rejects.toMatchObject({
      field: "email",
    });
  });
});
