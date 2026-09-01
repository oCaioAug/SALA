import {
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  setPasswordSchema,
} from "@/lib/validations/auth";

describe("password schemas", () => {
  it("creates a password when confirmation matches", () => {
    const result = setPasswordSchema.safeParse({
      password: "Senha123",
      confirmPassword: "Senha123",
    });

    expect(result.success).toBe(true);
  });

  it("rejects create when confirmation differs", () => {
    const result = setPasswordSchema.safeParse({
      password: "Senha123",
      confirmPassword: "Outra123",
    });

    expect(result.success).toBe(false);
  });

  it("requires current password to change", () => {
    const missing = changePasswordSchema.safeParse({
      password: "Senha1234",
      confirmPassword: "Senha1234",
    });
    expect(missing.success).toBe(false);

    const ok = changePasswordSchema.safeParse({
      currentPassword: "Senha123",
      password: "Senha1234",
      confirmPassword: "Senha1234",
    });
    expect(ok.success).toBe(true);
  });

  it("validates forgot password email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "a@b.com" }).success).toBe(
      true
    );
    expect(forgotPasswordSchema.safeParse({ email: "invalid" }).success).toBe(
      false
    );
  });

  it("validates reset password token and confirmation", () => {
    const ok = resetPasswordSchema.safeParse({
      token: "abc",
      password: "Senha123",
      confirmPassword: "Senha123",
    });
    expect(ok.success).toBe(true);

    const mismatch = resetPasswordSchema.safeParse({
      token: "abc",
      password: "Senha123",
      confirmPassword: "Outra123",
    });
    expect(mismatch.success).toBe(false);
  });
});
