import { NextResponse } from "next/server";

import { ApiErrorCode, type ApiErrorCodeType } from "@/lib/api/error-codes";

type ApiErrorBody = {
  errorCode: ApiErrorCodeType;
  error?: string;
  details?: unknown;
  [key: string]: unknown;
};

export function apiErrorResponse(
  errorCode: ApiErrorCodeType,
  status: number,
  extra?: Omit<ApiErrorBody, "errorCode">
) {
  return NextResponse.json(
    {
      errorCode,
      ...extra,
    } satisfies ApiErrorBody,
    { status }
  );
}

export function apiInternalError(extra?: Record<string, unknown>) {
  return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500, extra);
}
