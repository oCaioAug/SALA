import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

// Force dynamic behavior to prevent static optimization
export const dynamic = "force-dynamic";

// Cache simples em memória para reduzir queries
const cache = new Map<string, { count: number; timestamp: number }>();
const CACHE_DURATION = 10000; // 10 segundos

// GET /api/notifications/count - Contar notificações não lidas do usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    console.log("🔔 Contando notificações não lidas para usuário:", userId);

    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar cache primeiro
    const cacheKey = `count_${userId}`;
    const cached = cache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_DURATION) {
      console.log(`📦 Cache hit para ${userId}: ${cached.count}`);
      return NextResponse.json({ count: cached.count });
    }

    // Buscar usuário por ID ou email com timeout
    let user;

    const userQuery = userId.includes("@")
      ? prisma.user.findUnique({ where: { email: userId } })
      : prisma.user.findUnique({ where: { id: userId } });

    // Timeout de 5 segundos para a query
    user = (await Promise.race([
      userQuery,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Query timeout")), 5000)
      ),
    ])) as any;

    if (!user) {
      console.log(`❌ Usuário não encontrado: ${userId}`);
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const countQuery = prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false,
      },
    });

    // Timeout de 5 segundos para a contagem
    const count = (await Promise.race([
      countQuery,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Count query timeout")), 5000)
      ),
    ])) as number;

    // Salvar no cache
    cache.set(cacheKey, { count, timestamp: now });

    console.log(
      `✅ Usuário ${user.email} (${user.id}) tem ${count} notificações não lidas`
    );

    return NextResponse.json({ count });
  } catch (error) {
    console.error("❌ Erro ao contar notificações:", error);

    // Se for erro de timeout ou conexão, retornar 0 em vez de erro
    if (
      error instanceof Error &&
      (error.message.includes("timeout") ||
        error.message.includes("connection pool") ||
        error.message.includes("P2024"))
    ) {
      console.log("⚠️ Retornando 0 devido a timeout de conexão");
      return NextResponse.json({ count: 0 });
    }

    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
