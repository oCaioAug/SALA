"use server";

import { revalidatePath } from "next/cache";

import { isNextResponse } from "@/lib/auth/platform";
import { requireTenantContext } from "@/lib/auth/tenant";
import { prisma } from "@/lib/prisma";
import { GenerateScheduleService } from "@/services/timetabling/GenerateScheduleService";

export async function getOrgId(): Promise<string> {
  const ctx = await requireTenantContext();
  if (isNextResponse(ctx) || ctx.isSuperAdmin) {
    throw new Error("Unauthorized or invalid context");
  }
  return ctx.organizationId;
}

export async function getTurmas() {
  const orgId = await getOrgId();
  return prisma.turma.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
  });
}

export async function createTurma(name: string, shiftId: string) {
  const orgId = await getOrgId();
  const turma = await prisma.turma.create({
    data: {
      name,
      organizationId: orgId,
      shiftId,
    },
  });
  revalidatePath("/[locale]/grade-horaria/turmas", "page");
  return turma;
}

export async function deleteTurma(id: string) {
  const orgId = await getOrgId();
  await prisma.turma.delete({ where: { id, organizationId: orgId } });
  revalidatePath("/[locale]/grade-horaria/turmas", "page");
}

export async function getDisciplinas() {
  const orgId = await getOrgId();
  return prisma.disciplina.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
  });
}

export async function createDisciplina(name: string, code?: string) {
  const orgId = await getOrgId();
  const disciplina = await prisma.disciplina.create({
    data: { name, code, organizationId: orgId },
  });
  revalidatePath("/[locale]/grade-horaria/disciplinas", "page");
  return disciplina;
}

export async function deleteDisciplina(id: string) {
  const orgId = await getOrgId();
  await prisma.disciplina.delete({ where: { id, organizationId: orgId } });
  revalidatePath("/[locale]/grade-horaria/disciplinas", "page");
}

export async function getProfessores() {
  const orgId = await getOrgId();
  return prisma.professor.findMany({
    where: { organizationId: orgId },
    include: { user: true },
    orderBy: { name: "asc" },
  });
}

export async function createProfessor(
  name: string,
  email?: string,
  userId?: string
) {
  const orgId = await getOrgId();
  const professor = await prisma.professor.create({
    data: { name, email, userId, organizationId: orgId },
  });
  revalidatePath("/[locale]/grade-horaria/professores", "page");
  return professor;
}

export async function deleteProfessor(id: string) {
  const orgId = await getOrgId();
  await prisma.professor.delete({ where: { id, organizationId: orgId } });
  revalidatePath("/[locale]/grade-horaria/professores", "page");
}

export async function createCargaHoraria(
  turmaId: string,
  disciplinaId: string,
  professorId: string,
  quantidadeAulas: number
) {
  const orgId = await getOrgId();
  const carga = await prisma.cargaHoraria.create({
    data: { turmaId, disciplinaId, professorId, quantidadeAulas },
  });
  revalidatePath("/[locale]/grade-horaria/cargas", "page");
  return carga;
}

export async function getCargasHorarias() {
  const orgId = await getOrgId();
  return prisma.cargaHoraria.findMany({
    where: { turma: { organizationId: orgId } },
    include: { turma: true, disciplina: true, professor: true },
  });
}

export async function deleteCargaHoraria(id: string) {
  const orgId = await getOrgId();
  await prisma.cargaHoraria.delete({
    where: { id, turma: { organizationId: orgId } },
  });
  revalidatePath("/[locale]/grade-horaria/cargas", "page");
}

export async function setDisponibilidade(
  professorId: string,
  diaSemana: number,
  slotIds: string[]
) {
  const orgId = await getOrgId();
  // Ensure the professor belongs to this org
  const prof = await prisma.professor.findUnique({
    where: { id: professorId, organizationId: orgId },
  });
  if (!prof) throw new Error("Professor não encontrado");

  // Removendo todas as disponibilidades atuais desse professor para esse dia específico
  await prisma.disponibilidade.deleteMany({
    where: {
      professorId,
      diaSemana,
    },
  });

  if (slotIds.length > 0) {
    const data = slotIds.map(slotId => ({
      professorId,
      diaSemana,
      slotId,
    }));
    await prisma.disponibilidade.createMany({ data });
  }

  revalidatePath("/[locale]/grade-horaria/disponibilidades", "page");
  return true;
}

export async function getDisponibilidades(professorId: string) {
  return prisma.disponibilidade.findMany({
    where: { professorId },
  });
}

export async function getOrgUsers() {
  const orgId = await getOrgId();
  const members = await prisma.organizationMember.findMany({
    where: { organizationId: orgId },
    include: { user: true },
  });
  return members.map(m => m.user);
}

export async function runTimetablingEngine() {
  const orgId = await getOrgId();
  const service = new GenerateScheduleService();
  const result = await service.execute(orgId);
  return result;
}

export async function getGradeSettings() {
  const orgId = await getOrgId();
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { settings: true },
  });

  const defaultSettings = {
    timetabling: {
      shifts: [
        {
          id: "default",
          name: "Turno Principal",
          daysPerWeek: 5,
          slots: [
            {
              id: 0,
              label: "Aula 1 (07:30)",
              startTime: "07:30",
              endTime: "08:20",
            },
            {
              id: 1,
              label: "Aula 2 (08:20)",
              startTime: "08:20",
              endTime: "09:10",
            },
            {
              id: 2,
              label: "Aula 3 (09:10)",
              startTime: "09:10",
              endTime: "10:00",
            },
            {
              id: 3,
              label: "Aula 4 (10:20)",
              startTime: "10:20",
              endTime: "11:10",
            },
            {
              id: 4,
              label: "Aula 5 (11:10)",
              startTime: "11:10",
              endTime: "12:00",
            },
          ],
        },
      ],
    },
  };

  if (
    !org?.settings ||
    typeof org.settings !== "object" ||
    !(org.settings as any).timetabling
  ) {
    return defaultSettings;
  }

  return org.settings as typeof defaultSettings;
}

export async function updateGradeSettings(timetablingSettings: any) {
  const orgId = await getOrgId();

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
        timetabling: timetablingSettings,
      },
    },
  });
}
