import {
  ClassRequirement,
  ProfessorAvailability,
  TimetablingInputDTO,
  TimetablingOutputDTO,
} from "@/domain/timetabling/timetabling.types";
import { TimetablingEngine } from "@/domain/timetabling/TimetablingEngine";
import { prisma } from "@/lib/prisma";

export class GenerateScheduleService {
  /**
   * Generates a schedule for a given organization.
   * Fetches data from the database, converts to domain types,
   * and runs the TimetablingEngine.
   */
  public async execute(organizationId: string): Promise<TimetablingOutputDTO> {
    // 1. Fetch organization to verify it's a school
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!org) {
      throw new Error(`Organização não encontrada: ${organizationId}`);
    }

    if (!org.isSchool) {
      throw new Error(
        `A organização ${org.name} não está configurada como instituição de ensino (isSchool = false).`
      );
    }

    // 2. Fetch Cargas Horárias (Requirements)
    const cargas = await prisma.cargaHoraria.findMany({
      where: {
        turma: { organizationId },
      },
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
        professorId: c.professorId,
        requiredSlots: c.quantidadeAulas,
        validSlots
      };
    });

    // 3. Fetch Professor Availabilities for the professors in this organization's requirements
    const professorIds = Array.from(
      new Set(requirements.map(r => r.professorId))
    );

    const disponibilidades = await prisma.disponibilidade.findMany({
      where: {
        professorId: { in: professorIds },
      },
    });

    // Map availabilities to Domain Type
    const availabilitiesMap = new Map<string, ProfessorAvailability>();

    for (const profId of professorIds) {
      availabilitiesMap.set(profId, {
        professorId: profId,
        availableSlots: new Set<string>(),
      });
    }

    for (const disp of disponibilidades) {
      const profAvail = availabilitiesMap.get(disp.professorId);
      if (profAvail) {
        profAvail.availableSlots.add(`${disp.diaSemana}_${disp.slotId}`);
      }
    }

    const availabilities: ProfessorAvailability[] = Array.from(
      availabilitiesMap.values()
    );

    // 4. Build Input DTO
    const input: TimetablingInputDTO = {
      requirements,
      availabilities,
    };

    // 5. Run Engine
    const engine = new TimetablingEngine(input);
    const result = engine.generateSchedule();

    // Na prática, aqui você salvaria a grade no banco ('ClassSchedule' ou algo do tipo)
    // Para agora, apenas retornamos o output do motor.
    return result;
  }
}
