/**
 * Representa um período absoluto no tempo (ex: Slot 0 = Seg, 1º horário. Slot 5 = Ter, 1º horário).
 * Reduzir a grade a um array 1D facilita imensamente a manipulação no algoritmo de otimização.
 */
export type TimeSlot = string; 

export interface ProfessorAvailability {
  professorId: string;
  // Usamos Set para validação de Hard Constraints com complexidade O(1)
  availableSlots: Set<TimeSlot>; 
}

export interface ClassRequirement {
  id: string;            // Relativo à entidade CargaHoraria (Requirement)
  turmaId: string;
  disciplinaId: string;
  professorId: string;
  requiredSlots: number; // Quantas vezes esse slot precisa acontecer (ex: 4 aulas na semana)
  validSlots: TimeSlot[]; // Array de slots válidos onde esta aula pode ocorrer (ex: ["1_M1", "1_M2"])
}

/**
 * Representa uma aula única alocada em um slot de tempo.
 */
export interface ScheduledClass {
  requirementId: string;
  turmaId: string;
  disciplinaId: string;
  professorId: string;
  timeSlot: TimeSlot;
}

/**
 * Estado completo de uma grade (útil caso usemos Simulated Annealing ou Genetic Algorithm 
 * para carregar o estado e o "fitness" de uma solução).
 */
export interface ScheduleState {
  scheduledClasses: ScheduledClass[];
  
  // --- Auxiliares O(1) para validação rápida de Hard Constraints ---
  
  // Formato da string: `${professorId}_${timeSlot}`
  // Verifica se o professor já está dando aula naquele exato momento
  professorTimeAllocations: Set<string>; 
  
  // Formato da string: `${turmaId}_${timeSlot}`
  // Verifica se a turma já tem aula naquele exato momento
  classTimeAllocations: Set<string>;
  
  fitnessScore: number;
}

// ==========================================
// DTOs de Comunicação (Input / Output)
// ==========================================

export interface TimetablingInputDTO {
  requirements: ClassRequirement[];
  availabilities: ProfessorAvailability[];
}

export interface TimetablingOutputDTO {
  success: boolean;
  schedule?: ScheduledClass[];
  unallocatedRequirements?: ClassRequirement[];
  fitness?: number;
  errors?: string[];
}
