import { IncidentPriority, IncidentStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { verifyAuth } from "@/lib/auth-hybrid";
import { prisma } from "@/lib/prisma";

// Força renderização dinâmica
export const dynamic = "force-dynamic";

// GET /api/incidents - Listar incidentes com filtros
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação híbrida (web + mobile)
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || "Não autorizado" },
        { status: authResult.status || 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");
    const assignedToId = searchParams.get("assignedToId");
    const reportedById = searchParams.get("reportedById");
    const roomId = searchParams.get("roomId");
    const itemId = searchParams.get("itemId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    console.log("Buscando incidentes com filtros:", {
      status,
      priority,
      category,
      assignedToId,
      reportedById,
      roomId,
      itemId,
      page,
      limit,
    });

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (category) {
      where.category = category;
    }

    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    if (reportedById) {
      where.reportedById = reportedById;
    }

    if (roomId) {
      where.roomId = roomId;
    }

    if (itemId) {
      where.itemId = itemId;
    }

    const skip = (page - 1) * limit;

    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
        where,
        include: {
          reportedBy: {
            select: { id: true, name: true, email: true, role: true },
          },
          assignedTo: {
            select: { id: true, name: true, email: true, role: true },
          },
          room: {
            select: { id: true, name: true, status: true },
          },
          item: {
            select: { id: true, name: true, description: true },
          },
          statusHistory: {
            include: {
              changedBy: {
                select: { id: true, name: true, email: true },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: [
          { priority: "desc" }, // CRITICAL primeiro
          { status: "asc" }, // REPORTED primeiro
          { createdAt: "desc" }, // Mais recentes primeiro
        ],
        skip,
        take: limit,
      }),
      prisma.incident.count({ where }),
    ]);

    console.log(
      ` Encontrados ${incidents.length} incidentes de ${total} total`
    );

    return NextResponse.json({
      incidents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar incidentes:", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

// POST /api/incidents - Criar novo incidente
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação híbrida (web + mobile)
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || "Não autorizado" },
        { status: authResult.status || 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      priority,
      category,
      reportedById,
      roomId,
      itemId,
      estimatedResolutionTime,
    } = body;

    console.log("Criando novo incidente:", {
      title,
      description,
      priority,
      category,
      reportedById,
      roomId,
      itemId,
    });

    // Validações básicas
    if (!title || !description || !category || !reportedById) {
      return NextResponse.json(
        {
          error:
            "Campos obrigatórios: title, description, category, reportedById",
        },
        { status: 400 }
      );
    }

    // Verificar se deve ter room OU item (não ambos)
    if (roomId && itemId) {
      return NextResponse.json(
        {
          error:
            "Um incidente deve ser relacionado a uma sala OU um item, não ambos",
        },
        { status: 400 }
      );
    }

    if (!roomId && !itemId) {
      return NextResponse.json(
        { error: "Um incidente deve ser relacionado a uma sala ou um item" },
        { status: 400 }
      );
    }

    // Verificar se o usuário existe
    const reporter = await prisma.user.findUnique({
      where: { id: reportedById },
    });

    if (!reporter) {
      return NextResponse.json(
        { error: "Usuário reportador não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se a sala/item existe
    if (roomId) {
      const room = await prisma.room.findUnique({ where: { id: roomId } });
      if (!room) {
        return NextResponse.json(
          { error: "Sala não encontrada" },
          { status: 404 }
        );
      }
    }

    if (itemId) {
      const item = await prisma.item.findUnique({ where: { id: itemId } });
      if (!item) {
        return NextResponse.json(
          { error: "Item não encontrado" },
          { status: 404 }
        );
      }
    }

    // Criar o incidente
    const incident = await prisma.incident.create({
      data: {
        title,
        description,
        priority: priority || "MEDIUM",
        category,
        reportedById,
        roomId,
        itemId,
        estimatedResolutionTime: estimatedResolutionTime
          ? new Date(estimatedResolutionTime)
          : null,
        status: "REPORTED",
      },
      include: {
        reportedBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        room: {
          select: { id: true, name: true, status: true },
        },
        item: {
          select: { id: true, name: true, description: true },
        },
      },
    });

    // Criar entrada no histórico de status
    await prisma.incidentStatusHistory.create({
      data: {
        incidentId: incident.id,
        toStatus: "REPORTED",
        notes: "Incidente criado",
        changedById: reportedById,
      },
    });

    // TODO: Criar notificações para administradores
    // TODO: Se for incidente crítico, bloquear a sala/item

    console.log(` Incidente criado com ID: ${incident.id}`);

    return NextResponse.json(incident, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar incidente:", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
