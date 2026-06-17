import {
  ApiErrorCode,
  isApiErrorCode,
  type ApiErrorCodeType,
} from "@/lib/api/error-codes";

type TranslateFn = (
  key: string,
  values?: Record<string, string | number | Date>
) => string;

export type ApiErrorPayload = {
  errorCode?: string;
  error?: string;
  message?: string;
};

export function resolveApiErrorCode(
  payload: ApiErrorPayload | null | undefined
): ApiErrorCodeType {
  if (payload?.errorCode && isApiErrorCode(payload.errorCode)) {
    return payload.errorCode;
  }
  return ApiErrorCode.UNKNOWN;
}

export function mapApiError(
  payload: ApiErrorPayload | null | undefined,
  t: TranslateFn,
  values?: Record<string, string | number | Date>
): string {
  const code = resolveApiErrorCode(payload);
  const key = code as string;
  try {
    const translated = t(key, values);
    if (translated && translated !== key) {
      return translated;
    }
  } catch {
    // fall through
  }
  return payload?.error ?? payload?.message ?? t(ApiErrorCode.UNKNOWN);
}

export async function parseApiErrorFromResponse(
  response: Response,
  t: TranslateFn,
  values?: Record<string, string | number | Date>
): Promise<string> {
  try {
    const data = (await response.json()) as ApiErrorPayload;
    return mapApiError(data, t, values);
  } catch {
    return t(ApiErrorCode.UNKNOWN);
  }
}
