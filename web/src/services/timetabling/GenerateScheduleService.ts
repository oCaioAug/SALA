import {
  CandidateProfessor,
  ClassRequirement,
  ProfessorAvailability,
  TimetablingInputDTO,
  TimetablingOutputDTO,
} from "@/domain/timetabling/timetabling.types";
import { ProfessorAssignmentService } from "@/domain/timetabling/ProfessorAssignmentService";
import { TimetablingEngine } from "@/domain/timetabling/TimetablingEngine";
import { prisma } from "@/lib/prisma";

export class GenerateScheduleService {
  /**
   * Generates a schedule for a given organization.
   * Fetches data from the database, converts to domain types,
   * and runs the TimetablingEngine.
   */
  public async execute(organizationId: string, sectorId?: string): Promise<TimetablingOutputDTO> {
    // 1. Fetch organization to verify it's a school
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!org) {
      throw new Error(`Organização não encontrada: ${organizationId}`);
    }

    if (!org.isSchool) {
      await prisma.organization.update({
        where: { id: organizationId },
        data: { isSchool: true },
      });
    }

    // 2. Fetch Cargas Horárias (Requirements)
    // Ignorar disciplinas que são EaD ou Estágio (isOffGrid = true)
    const whereClause: any = {
      turma: { organizationId },
      disciplina: { isOffGrid: false },
    };

    if (sectorId) {
      whereClause.turma.sectorId = sectorId;
    }

    const cargas = await prisma.cargaHoraria.findMany({
      where: whereClause,
      include: {
        turma: true,
        disciplina: true,
        professor: true,
      },
    });

    const requirements: ClassRequirement[] = cargas.map(c => {
      // Determina as opções de slot baseado no turno da turma
      // Se não houver settings de turnos, criamos um default
      const shiftId = c.turma.shiftId || "default";
      const settings = (org.settings as any)?.timetabling;
      let validSlots: string[] = [];

      if (settings?.shifts) {
        const shift = settings.shifts.find((s: any) => s.id === shiftId);
        if (shift) {
          // Ex: "1_m1", "1_m2", ..., "5_m1"
          for (let day = 1; day <= shift.daysPerWeek; day++) {
            for (const slot of shift.slots) {
              validSlots.push(`${day}_${slot.id}`);
            }
          }
        }
      }

      // Fallback
      if (validSlots.length === 0) {
        for (let day = 1; day <= 5; day++) {
          for (let slot = 0; slot < 5; slot++) {
            validSlots.push(`${day}_${slot}`);
          }
        }
      }

      return {
        id: c.id,
        turmaId: c.turmaId,
        disciplinaId: c.disciplinaId,
        professorId: c.professorId || null,
        sinergiaId: c.sinergiaId || undefined,
        requiredSlots: c.quantidadeAulas,
        validSlots,
      };
    });

    // 3. Fetch Organization Professors with Disciplines and Availabilities
    const orgProfessors = await prisma.professor.findMany({
      where: { organizationId },
      include: {
        disciplinas: true,
        disponibilidades: true,
      },
    });

    const candidateProfessors: CandidateProfessor[] = orgProfessors.map(p => ({
      id: p.id,
      name: p.name,
      disciplinaIds: p.disciplinas.map(d => d.id),
      availableSlots: new Set(
        p.disponibilidades.map(d => `${d.diaSemana}_${d.slotId}`)
      ),
    }));

    // 4. Assign Professors to Requirements without a teacher
    const assignmentService = new ProfessorAssignmentService();
    const assignmentResult = assignmentService.assignProfessors({
      requirements,
      professors: candidateProfessors,
    });

    // 5. Build Input DTO
    const input: TimetablingInputDTO = {
      requirements: assignmentResult.requirements,
      availabilities: assignmentResult.availabilities,
    };

    // 6. Run Engine
    const engine = new TimetablingEngine(input);
    const result = engine.generateSchedule();

    // Propagate any professor allocation errors/warnings
    if (assignmentResult.errors.length > 0) {
      result.errors = [...(result.errors || []), ...assignmentResult.errors];
    }

    return result;
  }
}
