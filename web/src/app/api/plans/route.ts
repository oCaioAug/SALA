import { NextResponse } from "next/server";

import { apiInternalError } from "@/lib/api/api-error-response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: [{ maxRooms: "asc" }, { maxUsers: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        maxRooms: true,
        maxUsers: true,
        maxReservationsPerMonth: true,
        features: true,
      },
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error("Erro ao listar planos públicos:", error);
    return apiInternalError();
  }
}
