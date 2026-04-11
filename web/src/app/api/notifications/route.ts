import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

// GET /api/notifications - Buscar notificações do usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const isRead = searchParams.get("isRead");
    const type = searchParams.get("type");
    const limit = searchParams.get("limit");

    console.log("Buscando notificações com filtros:", {
      userId,
      isRead,
      type,
      limit,
    });

    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar usuário por ID ou email
    let user;
    if (userId.includes("@")) {
      // Se contém @, é um email
      console.log("Buscando usuário por email:", userId);
      user = await prisma.user.findUnique({
        where: { email: userId },
      });
    } else {
      // Senão, é um ID
      console.log("Buscando usuário por ID:", userId);
      user = await prisma.user.findUnique({
        where: { id: userId },
      });
    }

    if (!user) {
      console.log(` Usuário não encontrado: ${userId}`);
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    console.log(` Usuário encontrado: ${user.email} (${user.role})`);

    const where: any = {
      userId: user.id,
    };

    if (isRead !== null) {
      where.isRead = isRead === "true";
    }

    if (type) {
      where.type = type;
    }

    const notifications = await prisma.notification.findMany({
      where,
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit ? parseInt(limit) : undefined,
    });

    console.log(
      ` Encontradas ${notifications.length} notificações para ${user.email}`
    );

    // Log detalhado das notificações
    if (notifications.length > 0) {
      console.log("Notificações encontradas:");
      notifications.forEach((notif, index) => {
        console.log(
          `  ${index + 1}. [${notif.type}] ${notif.title} - ${notif.isRead ? "Lida" : "Não lida"} - ${notif.createdAt}`
        );
      });
    }

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Erro ao buscar notificações:", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Criar nova notificação
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, title, message, data } = body;

    console.log("Criando notificação:", { userId, type, title });

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: "userId, type, title e message são obrigatórios" },
        { status: 400 }
      );
    }

    // Validar se o tipo é válido
    const validTypes = [
      "RESERVATION_CREATED",
      "RESERVATION_APPROVED",
      "RESERVATION_REJECTED",
      "RESERVATION_CANCELLED",
      "RESERVATION_CONFLICT",
      "RESERVATION_REMINDER", // Adicionado para suportar lembretes do mobile
      "ROOM_STATUS_CHANGED",
      "SYSTEM_ANNOUNCEMENT",
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Tipo de notificação inválido" },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data || null,
      },
      include: {
        user: true,
      },
    });

    console.log(` Notificação criada com ID: ${notification.id}`);

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar notificação:", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
