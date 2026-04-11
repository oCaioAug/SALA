import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    console.log("Verificando todos os push tokens no banco...");

    const allTokens = await prisma.pushToken.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    console.log(` Total de tokens encontrados: ${allTokens.length}`);

    const activeTokens = allTokens.filter(token => token.isActive);
    const inactiveTokens = allTokens.filter(token => !token.isActive);

    console.log(` Tokens ativos: ${activeTokens.length}`);
    console.log(` Tokens inativos: ${inactiveTokens.length}`);

    return NextResponse.json({
      total: allTokens.length,
      active: activeTokens.length,
      inactive: inactiveTokens.length,
      tokens: allTokens.map(token => ({
        id: token.id,
        userId: token.userId,
        userName: token.user.name,
        userEmail: token.user.email,
        deviceType: token.deviceType,
        isActive: token.isActive,
        tokenPreview: token.token.substring(0, 20) + "...",
        createdAt: token.createdAt,
        updatedAt: token.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Erro ao verificar push tokens:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
