import { ApiErrorCode } from "@/lib/api/error-codes";

export type LoginIntentUser = {
  passwordHash: string | null;
} | null;

export type LoginIntentResult =
  | { ok: true }
  | { ok: false; code: typeof ApiErrorCode.INVALID_CREDENTIALS }
  | { ok: false; code: typeof ApiErrorCode.OAUTH_ONLY_ACCOUNT };

export function resolveLoginIntent(user: LoginIntentUser): LoginIntentResult {
  if (!user) {
    return { ok: false, code: ApiErrorCode.INVALID_CREDENTIALS };
  }

  if (!user.passwordHash) {
    return { ok: false, code: ApiErrorCode.OAUTH_ONLY_ACCOUNT };
  }

  return { ok: true };
}
