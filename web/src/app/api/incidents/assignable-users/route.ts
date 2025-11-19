import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Força renderização dinâmica
export const dynamic = "force-dynamic";

// GET /api/incidents/assignable-users - Buscar usuários que podem ser atribuídos a incidentes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    // Apenas admins podem listar usuários para atribuição
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Apenas administradores podem listar usuários" },
        { status: 403 }
      );
    }

    console.log("🎫 Buscando usuários disponíveis para atribuição");

    // Buscar todos os usuários (admins e técnicos podem receber atribuições)
    const assignableUsers = await prisma.user.findMany({
      where: {
        role: {
          in: ["ADMIN", "USER"], // Assumindo que técnicos também têm role "USER"
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        _count: {
          select: {
            assignedIncidents: {
              where: {
                status: {
                  in: ["REPORTED", "IN_ANALYSIS", "IN_PROGRESS"],
                },
              },
            },
          },
        },
      },
      orderBy: [
        { role: "desc" }, // ADMINs primeiro
        { name: "asc" },
      ],
    });

    // Adicionar estatísticas de incidentes para cada usuário
    const usersWithStats = assignableUsers.map(user => ({
      ...user,
      activeIncidents: user._count.assignedIncidents,
    }));

    console.log(`✅ Encontrados ${usersWithStats.length} usuários disponíveis`);

    return NextResponse.json(usersWithStats);
  } catch (error) {
    console.error("❌ Erro ao buscar usuários assignáveis:", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
