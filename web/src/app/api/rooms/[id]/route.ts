import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const room = await prisma.room.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            images: {
              select: {
                id: true,
                filename: true,
                path: true,
              },
              take: 1,
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        },
        reservations: {
          where: {
            status: "ACTIVE",
          },
          include: {
            user: true,
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: "Sala não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(room);
  } catch (error) {
    console.error("Erro ao buscar sala:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, description, capacity, status } = body;

    const room = await prisma.room.update({
      where: { id: params.id },
      data: {
        name,
        description,
        capacity: capacity ? parseInt(capacity) : null,
        status,
      },
      include: {
        items: {
          include: {
            images: {
              select: {
                id: true,
                filename: true,
                path: true,
              },
              take: 1,
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        },
      },
    });

    return NextResponse.json(room);
  } catch (error) {
    console.error("Erro ao atualizar sala:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.room.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Sala deletada com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar sala:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
