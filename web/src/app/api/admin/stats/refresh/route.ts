import { NextResponse } from "next/server";
import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";

import { isNextResponse, requireSuperAdmin } from "@/lib/auth/platform";
import { refreshAllOrganizationsDailyStats } from "@/lib/organization/stats";

export async function POST() {
  try {
    const auth = await requireSuperAdmin();
    if (isNextResponse(auth)) return auth;

    const count = await refreshAllOrganizationsDailyStats();

    return NextResponse.json({
      success: true,
      organizationsUpdated: count,
    });
  } catch (error) {
    console.error("Erro ao atualizar stats diárias:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
