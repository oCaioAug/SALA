import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { roomCreateBodySchema } from "@/lib/validation/room";

// Cache simples em memória
let roomsCache: any[] | null = null;
let lastCacheTime = 0;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutos

export async function GET() {
  try {
    const now = Date.now();

    // Verificar cache
    if (roomsCache && now - lastCacheTime < CACHE_DURATION) {
      return NextResponse.json(roomsCache);
    }

    // Consulta otimizada - apenas dados essenciais
    const rooms = await prisma.room.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        capacity: true,
        status: true,
        locationDescription: true,
        outletCount: true,
        climateControlled: true,
        createdAt: true,
        updatedAt: true,
        items: {
          select: {
            id: true,
            name: true,
            quantity: true,
            icon: true,
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
          select: {
            id: true,
            startTime: true,
            endTime: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Atualizar cache
    roomsCache = rooms;
    lastCacheTime = now;

    return NextResponse.json(rooms);
  } catch (error) {
    console.error("Erro ao buscar salas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = roomCreateBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const {
      name,
      description,
      capacity,
      locationDescription,
      outletCount,
      climateControlled,
      status,
    } = parsed.data;

    const room = await prisma.room.create({
      data: {
        name,
        description: description ?? null,
        capacity,
        locationDescription: locationDescription ?? null,
        outletCount,
        climateControlled: climateControlled ?? false,
        status: status ?? "LIVRE",
      },
      include: {
        items: true,
      },
    });

    // Invalidar cache
    roomsCache = null;
    lastCacheTime = 0;

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar sala:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
