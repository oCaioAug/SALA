import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

// Cache simples em memória
let itemsCache: any[] | null = null;
let lastCacheTime = 0;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutos

export async function GET() {
  try {
    const now = Date.now();

    // Verificar cache
    if (itemsCache && now - lastCacheTime < CACHE_DURATION) {
      return NextResponse.json(itemsCache);
    }

    // Consulta otimizada
    const items = await prisma.item.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        specifications: true,
        quantity: true,
        icon: true,
        roomId: true,
        createdAt: true,
        updatedAt: true,
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
        room: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Atualizar cache
    itemsCache = items;
    lastCacheTime = now;

    return NextResponse.json(items);
  } catch (error) {
    console.error("Erro ao buscar itens:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, specifications, quantity, icon, roomId } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Nome do item é obrigatório" },
        { status: 400 }
      );
    }

    const item = await prisma.item.create({
      data: {
        name,
        description,
        specifications: specifications || [],
        quantity: quantity ? parseInt(quantity) : 1,
        icon,
        roomId: roomId || null,
      },
      include: {
        room: true,
      },
    });

    // Invalidar cache
    itemsCache = null;
    lastCacheTime = 0;

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar item:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
