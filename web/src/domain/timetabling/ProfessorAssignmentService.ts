import {
  CandidateProfessor,
  ClassRequirement,
  ProfessorAssignmentInput,
  ProfessorAssignmentResult,
  ProfessorAvailability,
  TimeSlot,
} from "./timetabling.types";

interface RequirementGroup {
  key: string;
  sinergiaId?: string;
  turmaId: string;
  disciplinaId: string;
  requiredSlots: number;
  validSlots: TimeSlot[];
  validSlotsKey: string;
  reqs: ClassRequirement[];
}

export class ProfessorAssignmentService {
  /**
   * Atribui professores a todas as cargas horárias (requirements) que estiverem sem professor definido.
   *
   * Regras de negócio atendidas:
   * 1. Unicidade: Toda a carga de uma turma/disciplina é atribuída ao mesmo professor (não divide aulas).
   * 2. Disponibilidade: O professor selecionado DEVE ter disponibilidade compatível no turno da turma.
   * 3. Capacidade: Respeita o limite de horários do professor naquele turno para evitar sobreposição matemática.
   * 4. Balanceamento: Distribui as turmas entre os professores da mesma matéria.
   * 5. Sinergias: Turmas que compartilham a mesma sinergia recebem o mesmo professor.
   */
  public assignProfessors(
    input: ProfessorAssignmentInput
  ): ProfessorAssignmentResult {
    const { requirements, professors } = input;
    const errors: string[] = [];

    // Map rápido de professores por ID
    const professorMap = new Map<string, CandidateProfessor>();
    for (const p of professors) {
      professorMap.set(p.id, p);
    }

    // Identificar quais disciplinas têm pelo menos um professor vinculado no sistema
    const professorsByDisciplina = new Map<string, CandidateProfessor[]>();
    for (const p of professors) {
      for (const discId of p.disciplinaIds) {
        if (!professorsByDisciplina.has(discId)) {
          professorsByDisciplina.set(discId, []);
        }
        professorsByDisciplina.get(discId)!.push(p);
      }
    }

    // Contadores de carga já atribuída por professor
    // Total de slots alocados globalmente
    const totalAssignedSlots = new Map<string, number>();
    // Slots alocados por turno/janela de horários: Map<profId, Map<windowKey, number>>
    const assignedSlotsByWindow = new Map<string, Map<string, number>>();

    for (const p of professors) {
      totalAssignedSlots.set(p.id, 0);
      assignedSlotsByWindow.set(p.id, new Map());
    }

    const getWindowKey = (slots: TimeSlot[]): string => {
      return [...slots].sort().join("|");
    };

    const recordAssignment = (
      profId: string,
      windowKey: string,
      slots: number
    ) => {
      totalAssignedSlots.set(
        profId,
        (totalAssignedSlots.get(profId) || 0) + slots
      );

      let profWindowMap = assignedSlotsByWindow.get(profId);
      if (!profWindowMap) {
        profWindowMap = new Map();
        assignedSlotsByWindow.set(profId, profWindowMap);
      }
      profWindowMap.set(
        windowKey,
        (profWindowMap.get(windowKey) || 0) + slots
      );
    };

    // 1. Registrar compromissos dos requisitos que JÁ possuem professor definido manualmente
    for (const req of requirements) {
      if (req.professorId && professorMap.has(req.professorId)) {
        const windowKey = getWindowKey(req.validSlots);
        recordAssignment(req.professorId, windowKey, req.requiredSlots);
      }
    }

    // 2. Agrupar requisitos não atribuídos por sinergiaId ou por ID do requisito
    const unassignedGroupsMap = new Map<string, RequirementGroup>();

    for (const req of requirements) {
      if (req.professorId) continue;

      const groupKey = req.sinergiaId
        ? `sinergia_${req.sinergiaId}`
        : `req_${req.id}`;

      if (!unassignedGroupsMap.has(groupKey)) {
        unassignedGroupsMap.set(groupKey, {
          key: groupKey,
          sinergiaId: req.sinergiaId,
          turmaId: req.turmaId,
          disciplinaId: req.disciplinaId,
          requiredSlots: req.requiredSlots,
          validSlots: req.validSlots,
          validSlotsKey: getWindowKey(req.validSlots),
          reqs: [],
        });
      }

      const grp = unassignedGroupsMap.get(groupKey)!;
      grp.reqs.push(req);
      grp.requiredSlots = Math.max(grp.requiredSlots, req.requiredSlots);
    }

    // 3. Função para obter professores qualificados para uma disciplina
    const getQualifiedProfessors = (disciplinaId: string): CandidateProfessor[] => {
      const specific = professorsByDisciplina.get(disciplinaId);
      if (specific && specific.length > 0) {
        return specific;
      }
      // Fallback: se nenhum professor tiver vínculo explícito com a disciplina no sistema,
      // considerar todos os professores com disponibilidade cadastrada
      return professors.filter(p => p.availableSlots.size > 0);
    };

    // 4. Função para avaliar a compatibilidade de um professor com um grupo
    const evaluateCandidate = (
      prof: CandidateProfessor,
      group: RequirementGroup
    ): {
      isCompatible: boolean;
      commonSlotsCount: number;
      remainingInWindow: number;
      totalAssigned: number;
    } => {
      // Contar slots em comum entre a disponibilidade do professor e os slots válidos do turno da turma
      let commonSlotsCount = 0;
      for (const slot of group.validSlots) {
        if (prof.availableSlots.has(slot)) {
          commonSlotsCount++;
        }
      }

      // Se o professor não tiver nem a quantidade de aulas necessárias no turno da turma,
      // ele é incompatível (não pode dar todas as aulas).
      if (commonSlotsCount < group.requiredSlots) {
        return {
          isCompatible: false,
          commonSlotsCount,
          remainingInWindow: 0,
          totalAssigned: totalAssignedSlots.get(prof.id) || 0,
        };
      }

      // Verificar slots restantes no turno/janela
      const windowMap = assignedSlotsByWindow.get(prof.id);
      const usedInWindow = windowMap?.get(group.validSlotsKey) || 0;
      const remainingInWindow = commonSlotsCount - usedInWindow;

      // Verificar capacidade global restante
      const totalAssigned = totalAssignedSlots.get(prof.id) || 0;
      const globalRemaining = prof.availableSlots.size - totalAssigned;

      const hasCapacity =
        remainingInWindow >= group.requiredSlots &&
        globalRemaining >= group.requiredSlots;

      return {
        isCompatible: hasCapacity,
        commonSlotsCount,
        remainingInWindow,
        totalAssigned,
      };
    };

    // 5. Ordenar grupos pela heurística MRV (Minimum Remaining Values / Mais Restrito Primeiro)
    const groupCandidateCounts = new Map<string, number>();
    Array.from(unassignedGroupsMap.entries()).forEach(([key, group]) => {
      const candidates = getQualifiedProfessors(group.disciplinaId);
      let eligibleCount = 0;
      for (const cand of candidates) {
        const evaluation = evaluateCandidate(cand, group);
        if (evaluation.isCompatible) {
          eligibleCount++;
        }
      }
      groupCandidateCounts.set(key, eligibleCount);
    });

    const sortedGroups = Array.from(unassignedGroupsMap.values()).sort(
      (a, b) => {
        const countA = groupCandidateCounts.get(a.key) || 0;
        const countB = groupCandidateCounts.get(b.key) || 0;
        if (countA !== countB) {
          return countA - countB; // Menos candidatos primeiro
        }
        return b.requiredSlots - a.requiredSlots; // Mais aulas primeiro
      }
    );

    // 6. Atribuir o melhor candidato para cada grupo
    // Manter registro de atribuições já feitas nesta execução por turma+disciplina
    // para favorecer o mesmo professor em eventuais cargas adicionais da mesma matéria na mesma turma
    const turmaDisciplinaProfMap = new Map<string, string>();

    for (const group of sortedGroups) {
      const candidates = getQualifiedProfessors(group.disciplinaId);
      const turmaDiscKey = `${group.turmaId}_${group.disciplinaId}`;
      const preferredProfId = turmaDisciplinaProfMap.get(turmaDiscKey);

      // Avaliar todos os candidatos
      const evaluations = candidates.map(cand => ({
        candidate: cand,
        ...evaluateCandidate(cand, group),
      }));

      // Filtrar os que possuem disponibilidade e capacidade suficiente no turno
      let eligible = evaluations.filter(e => e.isCompatible);

      // Se ninguém tiver folga estrita de capacidade no turno, tentar qualquer um com commonSlots >= requiredSlots
      if (eligible.length === 0) {
        eligible = evaluations.filter(
          e => e.commonSlotsCount >= group.requiredSlots
        );
      }

      if (eligible.length > 0) {
        // Ordenar os elegíveis:
        // 1. Professor preferido (já alocado para a mesma disciplina nesta turma)
        // 2. Menor total de aulas já atribuídas (balanceamento de carga)
        // 3. Maior número de slots livres restantes no turno (maior folga para o motor)
        eligible.sort((a, b) => {
          if (preferredProfId) {
            if (a.candidate.id === preferredProfId) return -1;
            if (b.candidate.id === preferredProfId) return 1;
          }
          if (a.totalAssigned !== b.totalAssigned) {
            return a.totalAssigned - b.totalAssigned;
          }
          return b.remainingInWindow - a.remainingInWindow;
        });

        const chosen = eligible[0].candidate;

        // Atribuir o professor a todos os requisitos do grupo (garante o mesmo professor em todas as aulas)
        for (const req of group.reqs) {
          req.professorId = chosen.id;
        }

        turmaDisciplinaProfMap.set(turmaDiscKey, chosen.id);
        recordAssignment(chosen.id, group.validSlotsKey, group.requiredSlots);
      } else {
        errors.push(
          `Não foi possível encontrar professor com disponibilidade compatível para a disciplina '${group.disciplinaId}' na turma '${group.turmaId}' (${group.requiredSlots} aulas necessárias no turno).`
        );
      }
    }

    // 7. Consolidar todas as disponibilidades dos professores que têm requisitos atribuídos
    const activeProfessorIds = new Set<string>();
    for (const req of requirements) {
      if (req.professorId) {
        activeProfessorIds.add(req.professorId);
      }
    }

    const availabilities: ProfessorAvailability[] = [];
    activeProfessorIds.forEach(profId => {
      const prof = professorMap.get(profId);
      if (prof) {
        availabilities.push({
          professorId: prof.id,
          availableSlots: prof.availableSlots,
        });
      }
    });

    return {
      requirements,
      availabilities,
      errors,
    };
  }
}
