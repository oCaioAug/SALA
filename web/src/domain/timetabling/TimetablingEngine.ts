import {
  ClassRequirement,
  ProfessorAvailability,
  ScheduledClass,
  TimeSlot,
  TimetablingInputDTO,
  TimetablingOutputDTO,
} from "./timetabling.types";

interface Solution {
  state: (string | null)[];
  clone(): Solution;
}

interface SimulatedAnnealingParams {
  alpha: number;
  saMax: number;
  t0: number;
  saReheats: number;
  timeout: number;
  initialSolution: Solution;
}

type ObjectiveFunction = (s: Solution) => number;
type SelectNeighborhood = () => number;
type GenerateRandomNeighbor = (s: Solution, neighborhoodK: number) => Solution;
type GetElapsedTime = () => number;

function simulatedAnnealing(
  params: SimulatedAnnealingParams,
  evaluateCost: ObjectiveFunction,
  selectNeighborhood: SelectNeighborhood,
  generateRandomNeighbor: GenerateRandomNeighbor,
  getElapsedTime: GetElapsedTime
): Solution {
  let bestSolution: Solution = params.initialSolution.clone();
  let currentSolution: Solution = params.initialSolution.clone();

  let iterT = 0;
  let t = params.t0;
  let reheats = 0;

  while (reheats < params.saReheats && getElapsedTime() < params.timeout) {
    while (iterT < params.saMax) {
      iterT++;

      const k = selectNeighborhood();
      const neighbor = generateRandomNeighbor(currentSolution, k);

      const delta = evaluateCost(neighbor) - evaluateCost(currentSolution);

      if (delta < 0) {
        currentSolution = neighbor;
        if (evaluateCost(neighbor) < evaluateCost(bestSolution)) {
          bestSolution = neighbor.clone();
        }
      } else {
        const x = Math.random();
        if (x < Math.exp(-delta / t)) {
          currentSolution = neighbor;
        }
      }
    }

    t = params.alpha * t;
    iterT = 0;

    if (t < 0.1) {
      reheats++;
      t = params.t0;
    }
  }

  return bestSolution;
}

export class TimetablingEngine {
  private input: TimetablingInputDTO;

  constructor(input: TimetablingInputDTO) {
    this.input = input;
  }

  public generateSchedule(): TimetablingOutputDTO {
    const { requirements, availabilities } = this.input;

    const availabilityMap = new Map<string, Set<TimeSlot>>();
    for (const avail of availabilities) {
      availabilityMap.set(avail.professorId, avail.availableSlots);
    }

    type Variable = {
      id: string;
      groupId: string;
      reqs: ClassRequirement[];
      domain: string[];
      value: string | null;
      turmaIds: string[];
      profIds: string[];
    };

    const variables: Variable[] = [];
    const errors: string[] = [];

    // Group requirements by sinergiaId or just their own id if no sinergia
    const groups = new Map<string, ClassRequirement[]>();
    for (const req of requirements) {
      const key = req.sinergiaId
        ? `sinergia_${req.sinergiaId}`
        : `req_${req.id}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(req);
    }

    for (const [key, groupReqs] of groups.entries()) {
      // Intersection of valid domains for all professors in this group
      let intersectedDomain: string[] | null = null;
      let requiredSlots = 0;
      const turmaIds = new Set<string>();
      const profIds = new Set<string>();

      for (const req of groupReqs) {
        turmaIds.add(req.turmaId);
        profIds.add(req.professorId);
        requiredSlots = Math.max(requiredSlots, req.requiredSlots); // Assume they are the same or take max

        const profAvail = availabilityMap.get(req.professorId);
        if (!profAvail) {
          errors.push(
            `Professor ${req.professorId} sem disponibilidade definida.`
          );
          intersectedDomain = [];
          continue;
        }

        const validForThisReq = req.validSlots.filter(s => profAvail.has(s));

        if (intersectedDomain === null) {
          intersectedDomain = validForThisReq;
        } else {
          intersectedDomain = intersectedDomain.filter(s =>
            validForThisReq.includes(s)
          );
        }
      }

      if (!intersectedDomain) intersectedDomain = [];

      if (intersectedDomain.length < requiredSlots) {
        errors.push(
          `Grupo ${key} possui apenas ${intersectedDomain.length} horários em comum para dar ${requiredSlots} aulas.`
        );
      }

      const toCreate = Math.min(intersectedDomain.length, requiredSlots);
      for (let i = 0; i < toCreate; i++) {
        variables.push({
          id: `${key}_${i}`,
          groupId: key,
          reqs: groupReqs,
          domain: [...intersectedDomain],
          value: null,
          turmaIds: Array.from(turmaIds),
          profIds: Array.from(profIds),
        });
      }
    }

    // Inicializar estado aleatório para o SA
    const initialState: (string | null)[] = [];
    for (const v of variables) {
      if (v.domain.length > 0) {
        initialState.push(
          v.domain[Math.floor(Math.random() * v.domain.length)]
        );
      } else {
        initialState.push(null);
      }
    }

    const initialSolution: Solution = {
      state: initialState,
      clone() {
        return { state: [...this.state], clone: this.clone };
      },
    };

    // Precompute conflict graph for O(1) checks
    const conflictGraph: boolean[][] = Array(variables.length)
      .fill(null)
      .map(() => Array(variables.length).fill(false));

    for (let i = 0; i < variables.length; i++) {
      for (let j = i + 1; j < variables.length; j++) {
        const sameTurma = variables[i].turmaIds.some(t =>
          variables[j].turmaIds.includes(t)
        );
        const sameProf = variables[i].profIds.some(p =>
          variables[j].profIds.includes(p)
        );
        if (sameTurma || sameProf) {
          conflictGraph[i][j] = true;
          conflictGraph[j][i] = true;
        }
      }
    }

    const countConflicts = (s: Solution) => {
      let conflicts = 0;
      for (let i = 0; i < variables.length; i++) {
        if (!s.state[i]) continue;
        for (let j = i + 1; j < variables.length; j++) {
          if (!s.state[j]) continue;
          if (s.state[i] === s.state[j] && conflictGraph[i][j]) {
            conflicts++;
          }
        }
      }
      return conflicts;
    };

    const getConflictedIndices = (s: Solution) => {
      const conflicted = new Set<number>();
      for (let i = 0; i < variables.length; i++) {
        if (!s.state[i]) continue;
        for (let j = i + 1; j < variables.length; j++) {
          if (!s.state[j]) continue;
          if (s.state[i] === s.state[j] && conflictGraph[i][j]) {
            conflicted.add(i);
            conflicted.add(j);
          }
        }
      }
      return Array.from(conflicted);
    };

    // Precompute variables by group for fast soft constraint evaluation
    const groupIndicesMap = new Map<string, number[]>();
    for (let i = 0; i < variables.length; i++) {
      const gId = variables[i].groupId;
      if (!groupIndicesMap.has(gId)) groupIndicesMap.set(gId, []);
      groupIndicesMap.get(gId)!.push(i);
    }
    const variablesByGroup = Array.from(groupIndicesMap.values());

    const evaluateGroupPenalties = (s: Solution, varsOfGroup: number[]) => {
      let penalty = 0;
      const dayCounts = new Map<number, number[]>();

      for (const vIdx of varsOfGroup) {
        const val = s.state[vIdx];
        if (!val) continue;

        const parts = val.split("_");
        const day = parseInt(parts[0], 10);
        const numMatch = parts[1].match(/\d+/);
        const sNum = numMatch ? parseInt(numMatch[0], 10) : 0;

        if (!dayCounts.has(day)) dayCounts.set(day, []);
        dayCounts.get(day)!.push(sNum);
      }

      for (const slots of dayCounts.values()) {
        if (slots.length > 2) {
          penalty += (slots.length - 2) * 2; // Limite de 2 aulas por dia da mesma matéria
        }
        if (slots.length === 2) {
          const diff = Math.abs(slots[0] - slots[1]);
          if (diff === 1) {
            penalty -= 1; // Bônus para aulas juntas (consecutivas)
          } else {
            penalty += 1; // Penalidade para buracos entre as 2 aulas
          }
        }
      }
      return penalty;
    };

    const countVarConflicts = (s: Solution, idx: number, val: string) => {
      let c = 0;
      for (let j = 0; j < variables.length; j++) {
        if (idx === j || !s.state[j]) continue;
        if (s.state[j] === val && conflictGraph[idx][j]) c += 1000;
      }

      // Adicionar a variação de custo das soft constraints (consecutividade)
      const oldVal = s.state[idx];
      s.state[idx] = val;
      c += evaluateGroupPenalties(
        s,
        groupIndicesMap.get(variables[idx].groupId)!
      );
      s.state[idx] = oldVal;

      return c;
    };

    const evaluateCost: ObjectiveFunction = s => {
      let cost = countConflicts(s) * 1000;
      for (const group of variablesByGroup) {
        cost += evaluateGroupPenalties(s, group);
      }
      return cost;
    };

    const selectNeighborhood: SelectNeighborhood = () => {
      // Retornar à proporção K=0 85%, K=1 15%
      // K=0 é essencial para criar caminhos no espaço de estados
      return Math.random() < 0.85 ? 0 : 1;
    };

    const generateRandomNeighbor: GenerateRandomNeighbor = (s, k) => {
      const neighbor = s.clone();
      if (variables.length === 0) return neighbor;

      if (k === 0) {
        const conf = getConflictedIndices(neighbor);
        let idx = -1;
        // Heurística Híbrida: 90% das vezes foca em resolver quem está em conflito
        if (conf.length > 0 && Math.random() < 0.9) {
          idx = conf[Math.floor(Math.random() * conf.length)];
        } else {
          idx = Math.floor(Math.random() * variables.length);
        }

        const v = variables[idx];
        if (v.domain.length > 1) {
          // 10% chance de fazer um random walk cego no valor da variável (Exploração pura)
          if (Math.random() < 0.1) {
            let newVal = v.domain[Math.floor(Math.random() * v.domain.length)];
            while (newVal === neighbor.state[idx] && v.domain.length > 1) {
              newVal = v.domain[Math.floor(Math.random() * v.domain.length)];
            }
            neighbor.state[idx] = newVal;
          } else {
            // 90% chance de agir de forma gulosa (Min-Conflicts behavior guiando o SA)
            let bestValues: string[] = [];
            let minC = Infinity;
            for (const val of v.domain) {
              const c = countVarConflicts(neighbor, idx, val);
              if (c < minC) {
                minC = c;
                bestValues = [val];
              } else if (c === minC) {
                bestValues.push(val);
              }
            }

            let chosen =
              bestValues[Math.floor(Math.random() * bestValues.length)];
            // Se o valor escolhido é o mesmo, e há outros igualmente bons, force a variação
            if (chosen === neighbor.state[idx] && bestValues.length > 1) {
              bestValues = bestValues.filter(x => x !== neighbor.state[idx]);
              chosen =
                bestValues[Math.floor(Math.random() * bestValues.length)];
            }
            neighbor.state[idx] = chosen;
          }
        }
      } else if (k === 1 && variables.length > 1) {
        const idx1 = Math.floor(Math.random() * variables.length);
        let idx2 = Math.floor(Math.random() * variables.length);
        while (idx1 === idx2)
          idx2 = Math.floor(Math.random() * variables.length);

        const v1 = variables[idx1];
        const v2 = variables[idx2];
        const val1 = neighbor.state[idx1];
        const val2 = neighbor.state[idx2];

        if (
          val2 &&
          val1 &&
          v1.domain.includes(val2) &&
          v2.domain.includes(val1)
        ) {
          neighbor.state[idx1] = val2;
          neighbor.state[idx2] = val1;
        }
      }
      return neighbor;
    };

    const startTime = Date.now();
    const getElapsedTime: GetElapsedTime = () => Date.now() - startTime;

    const saParams: SimulatedAnnealingParams = {
      alpha: 0.98,
      saMax: 10000,
      t0: 8000.0,
      saReheats: 30,
      timeout: 35000,
      initialSolution,
    };

    const finalSolution = simulatedAnnealing(
      saParams,
      evaluateCost,
      selectNeighborhood,
      generateRandomNeighbor,
      getElapsedTime
    );

    // Apply best state
    for (let i = 0; i < variables.length; i++) {
      variables[i].value = finalSolution.state[i];
    }

    // Convert variables to schedule (only those without conflicts!)
    const scheduledClasses: ScheduledClass[] = [];
    const unallocatedRequirementsMap = new Map<string, number>();

    // Computar IDs com conflitos persistentes para descartar na alocação final
    const conflictedIds = new Set<string>();
    for (let i = 0; i < variables.length; i++) {
      if (!variables[i].value) continue;
      for (let j = 0; j < variables.length; j++) {
        if (i === j) continue;
        if (variables[i].value === variables[j].value && conflictGraph[i][j]) {
          conflictedIds.add(variables[i].id);
        }
      }
    }

    for (const v of variables) {
      if (v.value && !conflictedIds.has(v.id)) {
        for (const req of v.reqs) {
          scheduledClasses.push({
            requirementId: req.id,
            turmaId: req.turmaId,
            disciplinaId: req.disciplinaId,
            professorId: req.professorId,
            timeSlot: v.value,
          });
        }
      } else {
        for (const req of v.reqs) {
          const count = unallocatedRequirementsMap.get(req.id) || 0;
          unallocatedRequirementsMap.set(req.id, count + 1);
        }
      }
    }

    // Calculate unallocated requirements accurately
    const unallocatedRequirements: ClassRequirement[] = [];
    for (const req of requirements) {
      const missing = unallocatedRequirementsMap.get(req.id);
      if (missing && missing > 0) {
        unallocatedRequirements.push({
          ...req,
          requiredSlots: missing,
        });
      }
    }

    const totalRequired = requirements.reduce(
      (acc, r) => acc + r.requiredSlots,
      0
    );
    const totalAllocated = scheduledClasses.length;
    const fitnessScore =
      totalRequired > 0 ? (totalAllocated / totalRequired) * 100 : 100;

    return {
      success: unallocatedRequirements.length === 0,
      schedule: scheduledClasses,
      unallocatedRequirements:
        unallocatedRequirements.length > 0
          ? unallocatedRequirements
          : undefined,
      fitness: fitnessScore,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
