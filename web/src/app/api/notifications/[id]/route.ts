import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

// PUT /api/notifications/[id]/read - Marcar notificação como lida
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log(` Marcando notificação ${id} como lida`);

    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
      include: {
        user: true,
      },
    });

    console.log(` Notificação ${id} marcada como lida`);

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Erro ao marcar notificação como lida:", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/[id] - Deletar notificação
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log(` Deletando notificação ${id}`);

    await prisma.notification.delete({
      where: { id },
    });

    console.log(` Notificação ${id} deletada`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar notificação:", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
