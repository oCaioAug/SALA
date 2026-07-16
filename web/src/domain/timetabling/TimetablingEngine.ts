import {
  ClassRequirement,
  ProfessorAvailability,
  ScheduledClass,
  ScheduleState,
  TimeSlot,
  TimetablingInputDTO,
  TimetablingOutputDTO,
} from "./timetabling.types";

export class TimetablingEngine {
  private input: TimetablingInputDTO;

  constructor(input: TimetablingInputDTO) {
    this.input = input;
  }

  public generateSchedule(): TimetablingOutputDTO {
    const { requirements, availabilities } = this.input;

    const state: ScheduleState = {
      scheduledClasses: [],
      professorTimeAllocations: new Set<string>(),
      classTimeAllocations: new Set<string>(),
      fitnessScore: 0,
    };

    const unallocatedRequirements: ClassRequirement[] = [];
    const errors: string[] = [];

    // Map professor availability for O(1) lookup
    const availabilityMap = new Map<string, Set<TimeSlot>>();
    for (const avail of availabilities) {
      availabilityMap.set(avail.professorId, avail.availableSlots);
    }

    // Sort requirements to optimize greedy insertion (e.g., most constrained first)
    const sortedRequirements = [...requirements].sort(
      (a, b) => b.requiredSlots - a.requiredSlots
    );

    for (const req of sortedRequirements) {
      let allocatedCount = 0;

      const profAvailability = availabilityMap.get(req.professorId);
      if (!profAvailability) {
        errors.push(
          `Professor ${req.professorId} tem carga horária mas não tem disponibilidade definida.`
        );
        unallocatedRequirements.push(req);
        continue;
      }

      // Try to find slots for the required amount
      for (const slot of req.validSlots) {
        if (allocatedCount >= req.requiredSlots) break; // Finished allocating this requirement

        // 1. Is professor available in this slot?
        if (!profAvailability.has(slot)) continue;

        const profAllocKey = `${req.professorId}_${slot}`;
        const classAllocKey = `${req.turmaId}_${slot}`;

        // 2. Is professor already teaching at this slot?
        if (state.professorTimeAllocations.has(profAllocKey)) continue;

        // 3. Does the class already have a lesson at this slot?
        if (state.classTimeAllocations.has(classAllocKey)) continue;

        // Passed all Hard Constraints. Allocate!
        state.scheduledClasses.push({
          requirementId: req.id,
          turmaId: req.turmaId,
          disciplinaId: req.disciplinaId,
          professorId: req.professorId,
          timeSlot: slot,
        });

        state.professorTimeAllocations.add(profAllocKey);
        state.classTimeAllocations.add(classAllocKey);

        allocatedCount++;
      }

      if (allocatedCount < req.requiredSlots) {
        unallocatedRequirements.push({
          ...req,
          requiredSlots: req.requiredSlots - allocatedCount,
        });
      }
    }

    // Calculate basic fitness:
    // Here we can penalize gaps, but for now fitness is % of successfully allocated requirements
    const totalRequired = requirements.reduce(
      (acc, r) => acc + r.requiredSlots,
      0
    );
    const totalAllocated = state.scheduledClasses.length;
    state.fitnessScore =
      totalRequired > 0 ? (totalAllocated / totalRequired) * 100 : 100;

    return {
      success: unallocatedRequirements.length === 0,
      schedule: state.scheduledClasses,
      unallocatedRequirements:
        unallocatedRequirements.length > 0
          ? unallocatedRequirements
          : undefined,
      fitness: state.fitnessScore,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
