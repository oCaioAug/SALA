import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { roomUpdateBodySchema } from "@/lib/validation/room";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const room = await prisma.room.findUnique({
      where: { id },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const json = await request.json();
    const parsed = roomUpdateBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const room = await prisma.room.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.capacity !== undefined && { capacity: data.capacity }),
        ...(data.locationDescription !== undefined && {
          locationDescription: data.locationDescription,
        }),
        ...(data.outletCount !== undefined && {
          outletCount: data.outletCount,
        }),
        ...(data.climateControlled !== undefined && {
          climateControlled: data.climateControlled,
        }),
        ...(data.status !== undefined && { status: data.status }),
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.room.delete({
      where: { id },
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
