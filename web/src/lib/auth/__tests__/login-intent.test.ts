import { ApiErrorCode } from "@/lib/api/error-codes";
import { resolveLoginIntent } from "@/lib/auth/login-intent";

describe("resolveLoginIntent", () => {
  it("returns invalid credentials when user does not exist", () => {
    expect(resolveLoginIntent(null)).toEqual({
      ok: false,
      code: ApiErrorCode.INVALID_CREDENTIALS,
    });
  });

  it("returns oauth only when user has no password hash", () => {
    expect(resolveLoginIntent({ passwordHash: null })).toEqual({
      ok: false,
      code: ApiErrorCode.OAUTH_ONLY_ACCOUNT,
    });
  });

  it("allows password login when hash exists", () => {
    expect(resolveLoginIntent({ passwordHash: "hash" })).toEqual({ ok: true });
  });
});
