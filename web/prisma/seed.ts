import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

async function main() {
  console.log("[seed] Iniciando seed do banco de dados...");

  // Criar usuários de exemplo
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@sala.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@sala.com",
      role: "ADMIN",
      // teste
    },
  });

  const regularUser = await prisma.user.upsert({
    where: { email: "user@sala.com" },
    update: {},
    create: {
      name: "Usuário Teste",
      email: "user@sala.com",
      role: "USER",
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "maria.santos@universidade.edu" },
    update: {},
    create: {
      name: "Maria Santos",
      email: "maria.santos@universidade.edu",
      role: "USER",
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: "joao.silva@universidade.edu" },
    update: {},
    create: {
      name: "João Silva",
      email: "joao.silva@universidade.edu",
      role: "USER",
    },
  });

  const user4 = await prisma.user.upsert({
    where: { email: "ana.costa@universidade.edu" },
    update: {},
    create: {
      name: "Ana Costa",
      email: "ana.costa@universidade.edu",
      role: "USER",
    },
  });

  console.log("[seed] Usuários criados");

  // Criar salas de exemplo
  const labRobotica = await prisma.room.upsert({
    where: { id: "lab-robotica" },
    update: {},
    create: {
      id: "lab-robotica",
      name: "Laboratório de Robótica",
      description:
        "Sala equipada para projetos de alta performance com computadores potentes e equipamentos de robótica.",
      capacity: 20,
      status: "LIVRE",
    },
  });

  const salaReunioes = await prisma.room.upsert({
    where: { id: "sala-reunioes" },
    update: {},
    create: {
      id: "sala-reunioes",
      name: "Sala de Reuniões",
      description:
        "Ambiente para reuniões e planejamentos com equipamentos de apresentação.",
      capacity: 12,
      status: "RESERVADO",
    },
  });

  const estudioDesign = await prisma.room.upsert({
    where: { id: "estudio-design" },
    update: {},
    create: {
      id: "estudio-design",
      name: "Estúdio de Design",
      description:
        "Ambiente criativo com equipamentos específicos para design gráfico e digital.",
      capacity: 15,
      status: "EM_USO",
    },
  });

  const laboratorioQuimica = await prisma.room.upsert({
    where: { id: "lab-quimica" },
    update: {},
    create: {
      id: "lab-quimica",
      name: "Laboratório de Química",
      description:
        "Laboratório equipado para experimentos químicos com segurança.",
      capacity: 25,
      status: "LIVRE",
    },
  });

  console.log("[seed] Salas criadas");

  // Criar itens para o Laboratório de Robótica
  await prisma.item.upsert({
    where: { id: "pc-robotica-1" },
    update: {},
    create: {
      id: "pc-robotica-1",
      name: "Computador Desktop",
      description:
        "Computador de alta performance para desenvolvimento de projetos de robótica",
      specifications: [
        "Windows 11 Pro",
        "32GB RAM DDR4",
        "NVIDIA RTX 4070",
        "Intel Core i7-13700K",
        "SSD 1TB NVMe",
      ],
      quantity: 15,
      icon: "",
      roomId: labRobotica.id,
    },
  });

  await prisma.item.upsert({
    where: { id: "projetor-robotica" },
    update: {},
    create: {
      id: "projetor-robotica",
      name: "Projetor 4K",
      description: "Projetor de alta resolução para apresentações",
      specifications: [
        "4K UHD",
        "4000 Lumens",
        "Conexão HDMI/USB-C",
        "Controle remoto",
      ],
      quantity: 1,
      icon: "",
      roomId: labRobotica.id,
    },
  });

  await prisma.item.upsert({
    where: { id: "kits-robotica" },
    update: {},
    create: {
      id: "kits-robotica",
      name: "Kits de Robótica",
      description: "Kits completos para montagem de robôs",
      specifications: [
        "Arduino Uno",
        "Sensores diversos",
        "Motores DC",
        "Estruturas metálicas",
        "Ferramentas",
      ],
      quantity: 10,
      icon: "",
      roomId: labRobotica.id,
    },
  });

  // Criar itens para a Sala de Reuniões
  await prisma.item.upsert({
    where: { id: "smart-tv-reunioes" },
    update: {},
    create: {
      id: "smart-tv-reunioes",
      name: 'Smart TV 75"',
      description: "TV inteligente para apresentações e videoconferências",
      specifications: [
        "75 polegadas",
        "4K UHD",
        "Android TV",
        "Wi-Fi",
        "Bluetooth",
      ],
      quantity: 1,
      icon: "",
      roomId: salaReunioes.id,
    },
  });

  await prisma.item.upsert({
    where: { id: "mesa-reunioes" },
    update: {},
    create: {
      id: "mesa-reunioes",
      name: "Mesa de Reunião",
      description: "Mesa grande para reuniões com 12 cadeiras",
      specifications: [
        "Madeira maciça",
        "12 cadeiras",
        "Tomadas integradas",
        "Cabo de rede",
      ],
      quantity: 1,
      icon: "",
      roomId: salaReunioes.id,
    },
  });

  // Criar itens para o Estúdio de Design
  await prisma.item.upsert({
    where: { id: "imac-design" },
    update: {},
    create: {
      id: "imac-design",
      name: 'iMac 24"',
      description: "Computador Apple para design gráfico",
      specifications: [
        "macOS Monterey",
        "16GB RAM",
        "M1 Chip",
        "512GB SSD",
        "Tela Retina 4.5K",
      ],
      quantity: 8,
      icon: "",
      roomId: estudioDesign.id,
    },
  });

  await prisma.item.upsert({
    where: { id: "mesa-digitalizadora" },
    update: {},
    create: {
      id: "mesa-digitalizadora",
      name: "Mesa Digitalizadora",
      description: "Tablet digitalizador para desenho e design",
      specifications: [
        "Wacom Intuos Pro",
        'Área ativa 8.5"',
        "Pen 8192 níveis",
        "USB-C",
      ],
      quantity: 8,
      icon: "",
      roomId: estudioDesign.id,
    },
  });

  await prisma.item.upsert({
    where: { id: "impressora-design" },
    update: {},
    create: {
      id: "impressora-design",
      name: "Impressora Profissional",
      description: "Impressora de alta qualidade para impressões de design",
      specifications: [
        "A3+",
        "Resolução 4800x1200",
        "6 cores",
        "Wi-Fi",
        "Duplex automático",
      ],
      quantity: 2,
      icon: "",
      roomId: estudioDesign.id,
    },
  });

  // Criar itens para o Laboratório de Química
  await prisma.item.upsert({
    where: { id: "microscopio-quimica" },
    update: {},
    create: {
      id: "microscopio-quimica",
      name: "Microscópio Digital",
      description: "Microscópio com câmera digital integrada",
      specifications: [
        "Aumento 40x-1000x",
        "Câmera 5MP",
        "LED",
        "Software de análise",
      ],
      quantity: 12,
      icon: "",
      roomId: laboratorioQuimica.id,
    },
  });

  await prisma.item.upsert({
    where: { id: "balanca-quimica" },
    update: {},
    create: {
      id: "balanca-quimica",
      name: "Balança Analítica",
      description: "Balança de precisão para medições químicas",
      specifications: [
        "Precisão 0.0001g",
        "Capacidade 220g",
        "Calibração automática",
        "USB",
      ],
      quantity: 6,
      icon: "",
      roomId: laboratorioQuimica.id,
    },
  });

  await prisma.item.upsert({
    where: { id: "kit-vidrarias" },
    update: {},
    create: {
      id: "kit-vidrarias",
      name: "Kit de Vidrarias",
      description: "Conjunto completo de vidrarias para laboratório",
      specifications: [
        "Becker 100ml",
        "Erlenmeyer 250ml",
        "Bureta 50ml",
        "Pipeta 10ml",
        "Termômetro",
      ],
      quantity: 20,
      icon: "",
      roomId: laboratorioQuimica.id,
    },
  });

  console.log("[seed] Itens criados");

  // Criar algumas reservas de exemplo
  await prisma.reservation.upsert({
    where: { id: "reserva-1" },
    update: {},
    create: {
      id: "reserva-1",
      userId: regularUser.id,
      roomId: salaReunioes.id,
      startTime: new Date("2025-10-15T14:00:00Z"),
      endTime: new Date("2025-10-15T16:00:00Z"),
      purpose: "Reunião de planejamento do projeto",
      status: "ACTIVE",
    },
  });

  await prisma.reservation.upsert({
    where: { id: "reserva-2" },
    update: {},
    create: {
      id: "reserva-2",
      userId: adminUser.id,
      roomId: estudioDesign.id,
      startTime: new Date("2025-10-16T09:00:00Z"),
      endTime: new Date("2025-10-16T17:00:00Z"),
      purpose: "Workshop de design gráfico",
      status: "ACTIVE",
    },
  });

  // Criar solicitações pendentes (PENDING)
  await prisma.reservation.upsert({
    where: { id: "solicitacao-1" },
    update: {},
    create: {
      id: "solicitacao-1",
      userId: user2.id,
      roomId: labRobotica.id,
      startTime: new Date("2025-10-20T10:00:00Z"),
      endTime: new Date("2025-10-20T12:00:00Z"),
      purpose: "Aula prática de programação de robôs",
      status: "PENDING",
    },
  });

  await prisma.reservation.upsert({
    where: { id: "solicitacao-2" },
    update: {},
    create: {
      id: "solicitacao-2",
      userId: user3.id,
      roomId: laboratorioQuimica.id,
      startTime: new Date("2025-10-22T14:00:00Z"),
      endTime: new Date("2025-10-22T18:00:00Z"),
      purpose: "Experimento de química orgânica - síntese de compostos",
      status: "PENDING",
    },
  });

  await prisma.reservation.upsert({
    where: { id: "solicitacao-3" },
    update: {},
    create: {
      id: "solicitacao-3",
      userId: user4.id,
      roomId: estudioDesign.id,
      startTime: new Date("2025-10-25T09:00:00Z"),
      endTime: new Date("2025-10-25T11:00:00Z"),
      purpose: "Sessão de design gráfico para projeto final",
      status: "PENDING",
    },
  });

  await prisma.reservation.upsert({
    where: { id: "solicitacao-4" },
    update: {},
    create: {
      id: "solicitacao-4",
      userId: regularUser.id,
      roomId: salaReunioes.id,
      startTime: new Date("2025-10-24T15:00:00Z"),
      endTime: new Date("2025-10-24T17:00:00Z"),
      purpose: "Reunião de orientação de TCC",
      status: "PENDING",
    },
  });

  await prisma.reservation.upsert({
    where: { id: "solicitacao-5" },
    update: {},
    create: {
      id: "solicitacao-5",
      userId: user2.id,
      roomId: laboratorioQuimica.id,
      startTime: new Date("2025-10-28T08:00:00Z"),
      endTime: new Date("2025-10-28T12:00:00Z"),
      purpose: "Análise quantitativa - determinação de concentrações",
      status: "PENDING",
    },
  });

  await prisma.reservation.upsert({
    where: { id: "solicitacao-6" },
    update: {},
    create: {
      id: "solicitacao-6",
      userId: user3.id,
      roomId: labRobotica.id,
      startTime: new Date("2025-10-30T13:00:00Z"),
      endTime: new Date("2025-10-30T17:00:00Z"),
      purpose: "Desenvolvimento de projeto de robótica colaborativa",
      status: "PENDING",
    },
  });

  console.log("[seed] Reservas e solicitações criadas");

  // Temporariamente removido devido a erro de schema
  // TODO: Reativar quando o modelo Notification estiver correto
  /*
  // Criar notificações de exemplo para o admin
  await prisma.notification.createMany({
    data: [
      {
        userId: adminUser.id,
        type: 'RESERVATION_CREATED',
        title: 'Nova Reserva Criada',
        message: 'Maria Santos criou uma nova reserva para o Laboratório de Química no dia 20/01/2024 das 14:00 às 16:00.',
        data: { reservationId: 'reserva-exemplo-1', roomId: laboratorioQuimica.id },
        isRead: false,
      },
      // ... outras notificações
    ],
    skipDuplicates: true,
  });

  console.log("[seed] Notificações criadas");
  */

  console.log("[seed] Seed concluído com sucesso!");
}

main()
  .catch(e => {
    console.error(" Erro durante o seed:", e);
    console.error("Stack trace:", e.stack);
    process.exit(1);
  })
  .finally(async () => {
    try {
      await prisma.$disconnect();
      console.log("[seed] Conexão com banco de dados encerrada");
    } catch (error) {
      console.error(" Erro ao desconectar:", error);
    }
  });
