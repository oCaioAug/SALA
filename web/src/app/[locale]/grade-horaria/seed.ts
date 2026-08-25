"use server";

import { prisma } from "@/lib/prisma";
import { getOrgId } from "./actions";

// Interfaces baseadas no que o seu agente de IA provavelmente gerou (Passo 2)
type DiaSemana = "SEG" | "TER" | "QUA" | "QUI" | "SEX";
type Turno = "M1" | "M2"; // M1: 08h-10h, M2: 10h-12h

interface DisponibilidadeMock {
  dia: DiaSemana;
  turno: Turno;
}

interface ProfessorMock {
  id: string;
  nome: string;
  disponibilidades: DisponibilidadeMock[];
}

interface TurmaMock {
  id: string;
  nome: string;
}

interface DisciplinaMock {
  id: string;
  nome: string;
}

interface CargaHorariaMock {
  id: string;
  professorId: string;
  turmaId: string;
  disciplinaId: string;
  quantidadeAulas: number; // Quantos blocos/turnos essa matéria precisa na semana
}

// 1. Mock de Turmas
const turmasMock: TurmaMock[] = [
  { id: "T1", nome: "1º Período - Sistemas de Informação" },
  { id: "T2", nome: "3º Período - Sistemas de Informação" },
];

// 2. Mock de Disciplinas
const disciplinasMock: DisciplinaMock[] = [
  { id: "D1", nome: "Algoritmos e Lógica" },
  { id: "D2", nome: "Banco de Dados I" },
  { id: "D3", nome: "Engenharia de Software" },
  { id: "D4", nome: "Inteligência Computacional" },
];

// 3. Mock de Professores e suas Disponibilidades
const professoresMock: ProfessorMock[] = [
  {
    id: "P1",
    nome: "Prof. Alan Turing",
    // Disponível apenas no início da semana
    disponibilidades: [
      { dia: "SEG", turno: "M1" },
      { dia: "SEG", turno: "M2" },
      { dia: "TER", turno: "M1" },
      { dia: "TER", turno: "M2" },
    ],
  },
  {
    id: "P2",
    nome: "Profa. Ada Lovelace",
    // Disponível no meio/fim da semana
    disponibilidades: [
      { dia: "QUA", turno: "M1" },
      { dia: "QUA", turno: "M2" },
      { dia: "QUI", turno: "M1" },
      { dia: "QUI", turno: "M2" },
      { dia: "SEX", turno: "M1" },
    ],
  },
  {
    id: "P3",
    nome: "Prof. Linus Torvalds",
    // Disponibilidade espaçada (difícil alocação)
    disponibilidades: [
      { dia: "SEG", turno: "M1" },
      { dia: "QUA", turno: "M2" },
      { dia: "SEX", turno: "M1" },
      { dia: "SEX", turno: "M2" },
    ],
  },
];

// 4. Mock de Carga Horária (Onde a mágica/conflito acontece)
const cargaHorariaMock: CargaHorariaMock[] = [
  // Aulas da Turma 1 (Total: 4 aulas necessárias)
  {
    id: "CH1",
    professorId: "P1",
    turmaId: "T1",
    disciplinaId: "D1",
    quantidadeAulas: 2,
  },
  {
    id: "CH2",
    professorId: "P2",
    turmaId: "T1",
    disciplinaId: "D3",
    quantidadeAulas: 2,
  },

  // Aulas da Turma 2 (Total: 5 aulas necessárias)
  {
    id: "CH3",
    professorId: "P1",
    turmaId: "T2",
    disciplinaId: "D2",
    quantidadeAulas: 2,
  }, // Conflito de agenda para o P1!
  {
    id: "CH4",
    professorId: "P2",
    turmaId: "T2",
    disciplinaId: "D4",
    quantidadeAulas: 1,
  },
  {
    id: "CH5",
    professorId: "P3",
    turmaId: "T2",
    disciplinaId: "D1",
    quantidadeAulas: 2,
  },
];

const DIA_MAP: Record<DiaSemana, number> = {
  SEG: 1,
  TER: 2,
  QUA: 3,
  QUI: 4,
  SEX: 5,
};

export async function injectMockData() {
  const orgId = await getOrgId();

  // Limpar dados existentes (apenas os relacionados a grade horaria para evitar conflitos com outros módulos)
  await prisma.cargaHoraria.deleteMany({
    where: { turma: { organizationId: orgId } },
  });
  await prisma.disponibilidade.deleteMany({
    where: { professor: { organizationId: orgId } },
  });
  await prisma.turma.deleteMany({ where: { organizationId: orgId } });
  await prisma.disciplina.deleteMany({ where: { organizationId: orgId } });
  await prisma.professor.deleteMany({ where: { organizationId: orgId } });

  // 1. Configurar Turnos (Settings) da Organização
  const mockSettings = {
    timetabling: {
      shifts: [
        {
          id: "manha",
          name: "Manhã",
          daysPerWeek: 5,
          slots: [
            {
              id: "M1",
              label: "M1 (08h-10h)",
              startTime: "08:00",
              endTime: "10:00",
            },
            {
              id: "M2",
              label: "M2 (10h-12h)",
              startTime: "10:00",
              endTime: "12:00",
            },
          ],
        },
      ],
    },
  };

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { settings: true },
  });
  const currentSettings =
    org?.settings && typeof org.settings === "object" ? org.settings : {};

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      settings: {
        ...currentSettings,
        timetabling: mockSettings.timetabling,
      },
    },
  });

  // 2. Criar Turmas
  const turmasDb = await Promise.all(
    turmasMock.map(t =>
      prisma.turma.create({
        data: {
          id: t.id + orgId, // Sufixo para evitar colisões entre orgs
          name: t.nome,
          organizationId: orgId,
          shiftId: "manha", // Todas no turno da manhã
        },
      })
    )
  );

  // 3. Criar Disciplinas
  const discDb = await Promise.all(
    disciplinasMock.map(d =>
      prisma.disciplina.create({
        data: {
          id: d.id + orgId,
          name: d.nome,
          organizationId: orgId,
        },
      })
    )
  );

  // 4. Criar Professores e Disponibilidades
  const profsDb = await Promise.all(
    professoresMock.map(async p => {
      const prof = await prisma.professor.create({
        data: {
          id: p.id + orgId,
          name: p.nome,
          organizationId: orgId,
        },
      });

      const disponibilidadesData = p.disponibilidades.map(d => ({
        professorId: prof.id,
        diaSemana: DIA_MAP[d.dia],
        slotId: d.turno,
      }));

      await prisma.disponibilidade.createMany({
        data: disponibilidadesData,
      });

      return prof;
    })
  );

  // 5. Criar Cargas Horárias
  await Promise.all(
    cargaHorariaMock.map(ch =>
      prisma.cargaHoraria.create({
        data: {
          turmaId: ch.turmaId + orgId,
          disciplinaId: ch.disciplinaId + orgId,
          professorId: ch.professorId + orgId,
          quantidadeAulas: ch.quantidadeAulas,
        },
      })
    )
  );

  return true;
}
