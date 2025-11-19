import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🎫 Criando incidentes de teste...");

  try {
    // Primeiro, vamos verificar se temos usuários e salas para relacionar
    const users = await prisma.user.findMany();
    const rooms = await prisma.room.findMany();
    const items = await prisma.item.findMany();

    if (users.length === 0) {
      console.log(
        "❌ Nenhum usuário encontrado. Execute o seed de usuários primeiro."
      );
      return;
    }

    // Criar alguns incidentes de teste
    const incidentsData = [
      {
        title: "Computador não liga no Lab 01",
        description:
          "O computador da estação 3 não está ligando. Parece ser problema na fonte de alimentação.",
        priority: "HIGH" as const,
        status: "REPORTED" as const,
        category: "HARDWARE",
        reportedById: users[Math.floor(Math.random() * users.length)].id,
        roomId: rooms.length > 0 ? rooms[0].id : null,
        estimatedResolutionTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 dias
      },
      {
        title: "Projetor sem imagem",
        description:
          "O projetor da sala de aula está ligando mas não mostra imagem. Cabo HDMI testado e funcionando.",
        priority: "MEDIUM" as const,
        status: "IN_ANALYSIS" as const,
        category: "HARDWARE",
        reportedById: users[Math.floor(Math.random() * users.length)].id,
        assignedToId: users.find(u => u.role === "ADMIN")?.id || users[0].id,
        roomId: rooms.length > 1 ? rooms[1].id : null,
        estimatedResolutionTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 dia
      },
      {
        title: "Software desatualizado",
        description:
          "O software de simulação precisa ser atualizado para a versão mais recente. Versão atual apresenta bugs críticos.",
        priority: "MEDIUM" as const,
        status: "IN_PROGRESS" as const,
        category: "SOFTWARE",
        reportedById: users[Math.floor(Math.random() * users.length)].id,
        assignedToId: users.find(u => u.role === "ADMIN")?.id || users[0].id,
        roomId: rooms.length > 2 ? rooms[2].id : null,
        estimatedResolutionTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 dias
      },
      {
        title: "Rede instável no laboratório",
        description:
          "A conexão de internet está muito lenta e apresentando quedas frequentes. Impacta nas aulas práticas.",
        priority: "CRITICAL" as const,
        status: "REPORTED" as const,
        category: "NETWORK",
        reportedById: users[Math.floor(Math.random() * users.length)].id,
        roomId: rooms.length > 0 ? rooms[0].id : null,
        estimatedResolutionTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 horas
      },
      {
        title: "Ar condicionado com ruído excessivo",
        description:
          "O ar condicionado está fazendo muito ruído, atrapalhando as atividades. Necessária manutenção preventiva.",
        priority: "LOW" as const,
        status: "RESOLVED" as const,
        category: "MAINTENANCE",
        reportedById: users[Math.floor(Math.random() * users.length)].id,
        assignedToId: users.find(u => u.role === "ADMIN")?.id || users[0].id,
        roomId: rooms.length > 1 ? rooms[1].id : null,
        actualResolutionTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Resolvido há 2 dias
        resolutionNotes:
          "Manutenção realizada. Filtros limpos e lubrificação dos componentes mecânicos executada.",
      },
      {
        title: "Microscópio com lente danificada",
        description:
          "A lente objetiva de 40x do microscópio está riscada, compromitendo a qualidade das observações.",
        priority: "HIGH" as const,
        status: "IN_ANALYSIS" as const,
        category: "HARDWARE",
        reportedById: users[Math.floor(Math.random() * users.length)].id,
        itemId: items.length > 0 ? items[0].id : null,
        estimatedResolutionTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 semana
      },
      {
        title: "Problema de segurança - Extintor vencido",
        description:
          "O extintor de incêndio da sala está com a validade vencida. Necessária substituição imediata.",
        priority: "CRITICAL" as const,
        status: "IN_PROGRESS" as const,
        category: "SAFETY",
        reportedById: users[Math.floor(Math.random() * users.length)].id,
        assignedToId: users.find(u => u.role === "ADMIN")?.id || users[0].id,
        roomId: rooms.length > 2 ? rooms[2].id : null,
        estimatedResolutionTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 dia
      },
      {
        title: "Licença de software expirada",
        description:
          "A licença do software de CAD expirou e os alunos não conseguem acessar as funcionalidades principais.",
        priority: "HIGH" as const,
        status: "REPORTED" as const,
        category: "SOFTWARE",
        reportedById: users[Math.floor(Math.random() * users.length)].id,
        roomId: rooms.length > 0 ? rooms[0].id : null,
        estimatedResolutionTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 dias
      },
    ];

    // Criar os incidentes
    for (const incidentData of incidentsData) {
      console.log(`Creating incident: ${incidentData.title}`);

      const incident = await prisma.incident.create({
        data: incidentData,
      });

      // Criar histórico de status
      await prisma.incidentStatusHistory.create({
        data: {
          incidentId: incident.id,
          fromStatus: "REPORTED",
          toStatus: incident.status,
          notes: `Incidente criado com status: ${incident.status}`,
          changedById: incidentData.reportedById,
        },
      });

      // Se foi atribuído, criar entrada de histórico
      if (incidentData.assignedToId) {
        await prisma.incidentStatusHistory.create({
          data: {
            incidentId: incident.id,
            fromStatus: incident.status,
            toStatus: incident.status,
            notes: "Incidente atribuído para técnico responsável",
            changedById: incidentData.assignedToId,
          },
        });
      }

      // Se foi resolvido, criar entrada de resolução
      if (incident.status === "RESOLVED") {
        await prisma.incidentStatusHistory.create({
          data: {
            incidentId: incident.id,
            fromStatus: "IN_PROGRESS",
            toStatus: "RESOLVED",
            notes: "Incidente resolvido com sucesso",
            changedById: incidentData.assignedToId || incidentData.reportedById,
          },
        });
      }

      console.log(`✅ Incidente criado: ${incident.title}`);
    }

    console.log("🎉 Todos os incidentes de teste foram criados com sucesso!");
    console.log(`📊 Total de incidentes criados: ${incidentsData.length}`);

    // Mostrar estatísticas
    const stats = await prisma.incident.groupBy({
      by: ["status"],
      _count: { _all: true },
    });

    console.log("\n📈 Estatísticas dos incidentes criados:");
    stats.forEach(stat => {
      console.log(`   ${stat.status}: ${stat._count._all} incidentes`);
    });
  } catch (error) {
    console.error("❌ Erro ao criar incidentes de teste:", error);
    throw error;
  }
}

main()
  .catch(e => {
    console.error("❌ Erro fatal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
