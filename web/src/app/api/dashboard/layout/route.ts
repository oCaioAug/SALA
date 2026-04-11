import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import {
  DASHBOARD_LAYOUT_VERSION,
  type DashboardWidgetId,
  mergeDashboardLayouts,
  parseHiddenWidgetIds,
  type StoredDashboardLayout,
} from "@/lib/dashboardLayout";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const intNonNeg = z.preprocess((v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  return Math.max(0, Math.round(n));
}, z.number().int().nonnegative());

const intPos = z.preprocess((v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  return Math.max(1, Math.round(n));
}, z.number().int().positive());

const intPosOpt = z.preprocess((v) => {
  if (v === undefined || v === null) return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return Math.max(1, Math.round(n));
}, z.number().int().positive().optional());

const layoutItemSchema = z.object({
  i: z.string(),
  x: intNonNeg,
  y: intNonNeg,
  w: intPos,
  h: intPos,
  minW: intPosOpt,
  minH: intPosOpt,
  maxW: intPosOpt,
  maxH: intPosOpt,
  static: z.boolean().optional(),
});

const layoutsSchema = z
  .object({
    lg: z.array(layoutItemSchema).optional(),
    md: z.array(layoutItemSchema).optional(),
    sm: z.array(layoutItemSchema).optional(),
    xs: z.array(layoutItemSchema).optional(),
    xxs: z.array(layoutItemSchema).optional(),
  })
  .strict();

const putBodySchema = z.object({
  version: z.literal(DASHBOARD_LAYOUT_VERSION),
  layouts: layoutsSchema,
  hiddenWidgets: z.array(z.string()).optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { dashboardLayout: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const raw = user.dashboardLayout as StoredDashboardLayout | null;
    if (
      !raw ||
      typeof raw !== "object" ||
      raw.version !== DASHBOARD_LAYOUT_VERSION ||
      !raw.layouts
    ) {
      return NextResponse.json({
        layout: null as StoredDashboardLayout | null,
        merged: mergeDashboardLayouts(null),
        hiddenWidgets: [] as DashboardWidgetId[],
      });
    }

    const hiddenWidgets = parseHiddenWidgetIds(
      (raw as StoredDashboardLayout).hiddenWidgets
    );

    return NextResponse.json({
      layout: raw,
      merged: mergeDashboardLayouts(raw.layouts),
      hiddenWidgets,
    });
  } catch (error) {
    console.error("[dashboard/layout] GET:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const json = await request.json().catch(() => null);
    const parsed = putBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload inválido", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const merged = mergeDashboardLayouts(parsed.data.layouts);
    const hiddenWidgets = parseHiddenWidgetIds(parsed.data.hiddenWidgets);

    const payload: StoredDashboardLayout = {
      version: DASHBOARD_LAYOUT_VERSION,
      layouts: merged,
      ...(hiddenWidgets.length ? { hiddenWidgets } : {}),
    };

    await prisma.user.update({
      where: { email: session.user.email },
      data: { dashboardLayout: payload as object },
    });

    return NextResponse.json({ ok: true, layout: payload });
  } catch (error) {
    console.error("[dashboard/layout] PUT:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
