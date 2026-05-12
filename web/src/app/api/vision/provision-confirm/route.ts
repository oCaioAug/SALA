import { NextRequest, NextResponse } from "next/server";

import { verifyAuth } from "@/lib/auth-hybrid";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface ProvisionItemDto {
  name: string;
  quantity: number;
  icon: string;
}

/**
 * POST /api/vision/provision-confirm
 * Recebe a lista revisada de itens detectados e cadastra-os em lote no banco para a sala especificada.
 * Apenas acessível por Administradores (ADMIN).
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticação e permissão de ADMIN
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (authResult.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acesso proibido: Requer nível Administrador para provisionar salas." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { roomId, items } = body as { roomId: string; items: ProvisionItemDto[] };

    if (!roomId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Campos obrigatórios: roomId e array de items contendo ao menos 1 item." },
        { status: 400 }
      );
    }

    // 2. Verificar se a sala existe
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
    }

    console.log(`🔨 [ProvisionConfirm] Cadastrando ${items.length} itens detectados na sala "${room.name}" (ID: ${roomId})...`);

    // 3. Cadastrar os itens no banco associados à sala
    // Usamos uma transação para garantir atomicidade e consistência (KISS + SOLID)
    const createdItems = await prisma.$transaction(
      items.map(item =>
        prisma.item.create({
          data: {
            name: item.name,
            quantity: Math.max(1, item.quantity),
            icon: item.icon || "📦",
            roomId: roomId,
            description: `Provisionado de forma autônoma via IA em ${new Date().toLocaleDateString("pt-BR")}.`,
            specifications: ["Detectado por Inteligência Artificial (Visão Computacional)."],
          },
        })
      )
    );

    console.log(`✅ [ProvisionConfirm] Sincronização em lote concluída com sucesso! ${createdItems.length} itens inseridos.`);

    return NextResponse.json({
      success: true,
      message: `${createdItems.length} equipamentos foram provisionados e cadastrados com sucesso na sala "${room.name}"!`,
      roomId,
      roomName: room.name,
      itemsCreatedCount: createdItems.length,
      items: createdItems,
    });
  } catch (error) {
    console.error("❌ Erro ao confirmar provisionamento de sala:", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor ao salvar itens provisionados",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
