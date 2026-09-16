import { passwordResetIdentifier } from "@/lib/auth/password-reset-token";

describe("passwordResetIdentifier", () => {
  it("prefixes user id for verification token storage", () => {
    expect(passwordResetIdentifier("user-123")).toBe("password-reset:user-123");
  });
});
