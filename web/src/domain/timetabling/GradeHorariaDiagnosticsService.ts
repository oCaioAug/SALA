export interface DiagnosticAlert {
  id: string;
  severity: "error" | "warning";
  category: "turma_overload" | "discipline_no_teacher" | "teacher_no_discipline";
  title: string;
  description: string;
  linkUrl: string;
  linkLabel: string;
  details?: Record<string, any>;
}

export interface TurmaCapacitySummary {
  turmaId: string;
  turmaName: string;
  shiftId: string;
  totalClasses: number;
  maxCapacity: number;
  isOverloaded: boolean;
  excessClasses: number;
}

export interface DiagnosticsInput {
  turmas: Array<{ id: string; name: string; shiftId?: string | null }>;
  disciplinas: Array<{
    id: string;
    name: string;
    isOffGrid?: boolean;
    professores?: Array<{ id: string; name?: string }>;
  }>;
  professores: Array<{
    id: string;
    name: string;
    disciplinas?: Array<{ id: string; name?: string }>;
  }>;
  cargas: Array<{
    id: string;
    turmaId: string;
    disciplinaId: string;
    professorId?: string | null;
    quantidadeAulas: number;
    disciplina?: { isOffGrid?: boolean };
  }>;
  shiftsConfig?: Array<{
    id: string;
    name: string;
    daysPerWeek: number;
    slots: Array<{ id: any }>;
  }>;
}

export interface GradeHorariaDiagnosticsResult {
  hasIssues: boolean;
  alerts: DiagnosticAlert[];
  turmasSummary: Record<string, TurmaCapacitySummary>;
}

export class GradeHorariaDiagnosticsService {
  /**
   * Executa diagnósticos preventivos pré-grade horária, identificando:
   * 1. Turmas com aulas cadastradas além da capacidade máxima do turno;
   * 2. Disciplinas presenciais da grade sem nenhum professor vinculado/atribuído;
   * 3. Professores cadastrados sem nenhuma disciplina vinculada.
   */
  public runDiagnostics(input: DiagnosticsInput): GradeHorariaDiagnosticsResult {
    const {
      turmas = [],
      disciplinas = [],
      professores = [],
      cargas = [],
      shiftsConfig = [],
    } = input;

    const alerts: DiagnosticAlert[] = [];
    const turmasSummary: Record<string, TurmaCapacitySummary> = {};

    // Mapeamento rápido de turnos e suas capacidades
    const shiftMap = new Map<string, { daysPerWeek: number; slotsCount: number }>();
    for (const shift of shiftsConfig) {
      shiftMap.set(shift.id, {
        daysPerWeek: shift.daysPerWeek || 5,
        slotsCount: shift.slots?.length || 5,
      });
    }

    const getShiftCapacity = (shiftId?: string | null): number => {
      const sId = shiftId || "default";
      const config = shiftMap.get(sId);
      if (config && config.daysPerWeek > 0 && config.slotsCount > 0) {
        return config.daysPerWeek * config.slotsCount;
      }
      return 25; // Padrão de 5 dias x 5 aulas
    };

    // Mapeamento de disciplinas por ID para consulta rápida de isOffGrid
    const discMap = new Map<string, (typeof disciplinas)[0]>();
    for (const d of disciplinas) {
      discMap.set(d.id, d);
    }

    // 1. Diagnóstico de Sobrecarga de Aulas por Turma
    for (const turma of turmas) {
      const maxCapacity = getShiftCapacity(turma.shiftId);
      const turmaCargas = cargas.filter(c => c.turmaId === turma.id);

      let totalClasses = 0;
      for (const carga of turmaCargas) {
        const disc = discMap.get(carga.disciplinaId) || carga.disciplina;
        // Disciplinas EaD / Estágio não entram na contagem de horários presenciais da grade
        if (!disc?.isOffGrid) {
          totalClasses += carga.quantidadeAulas || 0;
        }
      }

      const isOverloaded = totalClasses > maxCapacity;
      const excessClasses = isOverloaded ? totalClasses - maxCapacity : 0;

      turmasSummary[turma.id] = {
        turmaId: turma.id,
        turmaName: turma.name,
        shiftId: turma.shiftId || "default",
        totalClasses,
        maxCapacity,
        isOverloaded,
        excessClasses,
      };

      if (isOverloaded) {
        alerts.push({
          id: `overload_${turma.id}`,
          severity: "error",
          category: "turma_overload",
          title: `Turma com excesso de aulas: ${turma.name}`,
          description: `A turma possui ${totalClasses} aulas semanais cadastradas, mas o turno comporta no máximo ${maxCapacity} aulas (${excessClasses} aula${excessClasses > 1 ? "s" : ""} a mais).`,
          linkUrl: "/grade-horaria/cargas",
          linkLabel: "Ajustar Cargas",
          details: {
            turmaId: turma.id,
            totalClasses,
            maxCapacity,
            excessClasses,
          },
        });
      }
    }

    // Identificar quais professores lecionam quais disciplinas (cruzando as relações)
    const discProfIdsMap = new Map<string, Set<string>>();
    for (const d of disciplinas) {
      discProfIdsMap.set(d.id, new Set());
      if (d.professores && Array.isArray(d.professores)) {
        for (const p of d.professores) {
          discProfIdsMap.get(d.id)!.add(p.id);
        }
      }
    }

    const profDiscIdsMap = new Map<string, Set<string>>();
    for (const p of professores) {
      profDiscIdsMap.set(p.id, new Set());
      if (p.disciplinas && Array.isArray(p.disciplinas)) {
        for (const d of p.disciplinas) {
          profDiscIdsMap.get(p.id)!.add(d.id);
          if (discProfIdsMap.has(d.id)) {
            discProfIdsMap.get(d.id)!.add(p.id);
          }
        }
      }
    }

    // Considerar também quem já foi fixado manualmente em Cargas
    for (const carga of cargas) {
      if (carga.professorId) {
        if (discProfIdsMap.has(carga.disciplinaId)) {
          discProfIdsMap.get(carga.disciplinaId)!.add(carga.professorId);
        }
        if (profDiscIdsMap.has(carga.professorId)) {
          profDiscIdsMap.get(carga.professorId)!.add(carga.disciplinaId);
        }
      }
    }

    // 2. Diagnóstico de Disciplinas sem nenhum professor
    for (const d of disciplinas) {
      if (d.isOffGrid) continue; // Ignora EaD

      const associatedProfs = discProfIdsMap.get(d.id);
      if (!associatedProfs || associatedProfs.size === 0) {
        alerts.push({
          id: `no_prof_${d.id}`,
          severity: "warning",
          category: "discipline_no_teacher",
          title: `Disciplina sem professor: ${d.name}`,
          description: `Nenhum professor está vinculado ou atribuído para lecionar esta disciplina na organização.`,
          linkUrl: "/grade-horaria/disciplinas",
          linkLabel: "Vincular Professor",
          details: { disciplinaId: d.id, disciplinaName: d.name },
        });
      }
    }

    // 3. Diagnóstico de Professores sem nenhuma disciplina
    for (const p of professores) {
      const associatedDiscs = profDiscIdsMap.get(p.id);
      if (!associatedDiscs || associatedDiscs.size === 0) {
        alerts.push({
          id: `no_disc_${p.id}`,
          severity: "warning",
          category: "teacher_no_discipline",
          title: `Professor sem disciplina: ${p.name}`,
          description: `Este professor não possui nenhuma disciplina vinculada à sua atuação.`,
          linkUrl: "/grade-horaria/professores",
          linkLabel: "Atribuir Disciplinas",
          details: { professorId: p.id, professorName: p.name },
        });
      }
    }

    return {
      hasIssues: alerts.length > 0,
      alerts,
      turmasSummary,
    };
  }
}
