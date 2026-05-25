"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";

import {
  mapApiError,
  parseApiErrorFromResponse,
  type ApiErrorPayload,
} from "@/lib/api/map-api-error";

export function useApiErrorMessage() {
  const t = useTranslations("ApiErrors");

  const fromPayload = useCallback(
    (
      payload: ApiErrorPayload | null | undefined,
      values?: Record<string, string | number | Date>
    ) => mapApiError(payload, t, values),
    [t]
  );

  const fromResponse = useCallback(
    async (
      response: Response,
      values?: Record<string, string | number | Date>
    ) => parseApiErrorFromResponse(response, t, values),
    [t]
  );

  return { fromPayload, fromResponse, t };
}
