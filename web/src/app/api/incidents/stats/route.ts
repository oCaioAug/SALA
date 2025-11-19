import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Força renderização dinâmica
export const dynamic = "force-dynamic";

// GET /api/incidents/stats - Buscar estatísticas de incidentes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    console.log("🎫 Buscando estatísticas de incidentes");

    // Estatísticas básicas
    const [
      totalIncidents,
      reportedIncidents,
      inAnalysisIncidents,
      inProgressIncidents,
      resolvedIncidents,
    ] = await Promise.all([
      prisma.incident.count(),
      prisma.incident.count({ where: { status: "REPORTED" } }),
      prisma.incident.count({ where: { status: "IN_ANALYSIS" } }),
      prisma.incident.count({ where: { status: "IN_PROGRESS" } }),
      prisma.incident.count({ where: { status: "RESOLVED" } }),
    ]);

    // Estatísticas por prioridade
    const [criticalIncidents, highIncidents, mediumIncidents, lowIncidents] =
      await Promise.all([
        prisma.incident.count({
          where: {
            priority: "CRITICAL",
            status: { not: "RESOLVED" },
          },
        }),
        prisma.incident.count({
          where: {
            priority: "HIGH",
            status: { not: "RESOLVED" },
          },
        }),
        prisma.incident.count({
          where: {
            priority: "MEDIUM",
            status: { not: "RESOLVED" },
          },
        }),
        prisma.incident.count({
          where: {
            priority: "LOW",
            status: { not: "RESOLVED" },
          },
        }),
      ]);

    // Estatísticas pessoais (se não for admin)
    let personalStats = null;
    if (currentUser.role !== "ADMIN") {
      personalStats = {
        reported: await prisma.incident.count({
          where: { reportedById: currentUser.id },
        }),
        assigned: await prisma.incident.count({
          where: {
            assignedToId: currentUser.id,
            status: { not: "RESOLVED" },
          },
        }),
        assignedResolved: await prisma.incident.count({
          where: {
            assignedToId: currentUser.id,
            status: "RESOLVED",
          },
        }),
      };
    }

    // Incidentes por categoria (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const incidentsByCategory = await prisma.incident.groupBy({
      by: ["category"],
      _count: { _all: true },
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // Tempo médio de resolução (últimos 30 dias)
    const resolvedIncidentsWithTime = await prisma.incident.findMany({
      where: {
        status: "RESOLVED",
        actualResolutionTime: { not: null },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        createdAt: true,
        actualResolutionTime: true,
      },
    });

    let averageResolutionTimeHours = 0;
    if (resolvedIncidentsWithTime.length > 0) {
      const totalResolutionTime = resolvedIncidentsWithTime.reduce(
        (sum, incident) => {
          if (incident.actualResolutionTime) {
            const diff =
              incident.actualResolutionTime.getTime() -
              incident.createdAt.getTime();
            return sum + diff;
          }
          return sum;
        },
        0
      );
      averageResolutionTimeHours = Math.round(
        totalResolutionTime /
          resolvedIncidentsWithTime.length /
          (1000 * 60 * 60)
      );
    }

    // Salas/itens mais afetados (últimos 30 dias)
    const [affectedRooms, affectedItems] = await Promise.all([
      prisma.incident.groupBy({
        by: ["roomId"],
        _count: { roomId: true },
        where: {
          roomId: { not: null },
          createdAt: { gte: thirtyDaysAgo },
        },
        orderBy: { _count: { roomId: "desc" } },
        take: 5,
      }),
      prisma.incident.groupBy({
        by: ["itemId"],
        _count: { itemId: true },
        where: {
          itemId: { not: null },
          createdAt: { gte: thirtyDaysAgo },
        },
        orderBy: { _count: { itemId: "desc" } },
        take: 5,
      }),
    ]);

    // Buscar nomes das salas e itens
    const roomIds = affectedRooms
      .map(r => r.roomId)
      .filter((id): id is string => id !== null);
    const itemIds = affectedItems
      .map(i => i.itemId)
      .filter((id): id is string => id !== null);

    const [roomNames, itemNames] = await Promise.all([
      roomIds.length > 0
        ? prisma.room.findMany({
            where: { id: { in: roomIds } },
            select: { id: true, name: true },
          })
        : [],
      itemIds.length > 0
        ? prisma.item.findMany({
            where: { id: { in: itemIds } },
            select: { id: true, name: true },
          })
        : [],
    ]);

    const roomNameMap = Object.fromEntries(roomNames.map(r => [r.id, r.name]));
    const itemNameMap = Object.fromEntries(itemNames.map(i => [i.id, i.name]));

    const stats = {
      overview: {
        total: totalIncidents,
        reported: reportedIncidents,
        inAnalysis: inAnalysisIncidents,
        inProgress: inProgressIncidents,
        resolved: resolvedIncidents,
        activeTotal:
          reportedIncidents + inAnalysisIncidents + inProgressIncidents,
      },
      priority: {
        critical: criticalIncidents,
        high: highIncidents,
        medium: mediumIncidents,
        low: lowIncidents,
      },
      personal: personalStats,
      categories: incidentsByCategory.map(cat => ({
        category: cat.category,
        count: cat._count._all,
      })),
      performance: {
        averageResolutionTimeHours,
        resolvedLast30Days: resolvedIncidentsWithTime.length,
      },
      mostAffected: {
        rooms: affectedRooms.map(room => ({
          id: room.roomId,
          name: roomNameMap[room.roomId!] || "Sala desconhecida",
          incidents: room._count.roomId,
        })),
        items: affectedItems.map(item => ({
          id: item.itemId,
          name: itemNameMap[item.itemId!] || "Item desconhecido",
          incidents: item._count.itemId,
        })),
      },
    };

    console.log("✅ Estatísticas de incidentes calculadas");

    return NextResponse.json(stats);
  } catch (error) {
    console.error("❌ Erro ao buscar estatísticas de incidentes:", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
