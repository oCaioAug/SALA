import { ProfessorAssignmentService } from "../ProfessorAssignmentService";
import { TimetablingEngine } from "../TimetablingEngine";
import {
  CandidateProfessor,
  ClassRequirement,
  TimeSlot,
} from "../timetabling.types";

describe("ProfessorAssignmentService", () => {
  let service: ProfessorAssignmentService;

  beforeEach(() => {
    service = new ProfessorAssignmentService();
  });

  const morningSlots: TimeSlot[] = [
    "1_0", "1_1", "1_2", "1_3", "1_4",
    "2_0", "2_1", "2_2", "2_3", "2_4",
    "3_0", "3_1", "3_2", "3_3", "3_4",
    "4_0", "4_1", "4_2", "4_3", "4_4",
    "5_0", "5_1", "5_2", "5_3", "5_4",
  ];

  it("deve atribuir um professor elegível a uma carga horária sem professor definido", () => {
    const requirements: ClassRequirement[] = [
      {
        id: "req-1",
        turmaId: "turma-601",
        disciplinaId: "disc-mat",
        requiredSlots: 4,
        validSlots: morningSlots,
        professorId: null,
      },
    ];

    const professors: CandidateProfessor[] = [
      {
        id: "prof-mat-1",
        name: "Professor Carlos",
        disciplinaIds: ["disc-mat"],
        availableSlots: new Set(["1_0", "1_1", "2_0", "2_1", "3_0"]),
      },
    ];

    const result = service.assignProfessors({ requirements, professors });

    expect(result.errors).toHaveLength(0);
    expect(result.requirements[0].professorId).toBe("prof-mat-1");
    expect(result.availabilities).toHaveLength(1);
    expect(result.availabilities[0].professorId).toBe("prof-mat-1");
  });

  it("deve garantir que todas as aulas da mesma carga horária fiquem com o mesmo professor (unicidade)", () => {
    // Requisito com 4 aulas de Matemática
    const requirements: ClassRequirement[] = [
      {
        id: "req-mat-4aulas",
        turmaId: "turma-601",
        disciplinaId: "disc-mat",
        requiredSlots: 4,
        validSlots: morningSlots,
        professorId: null,
      },
    ];

    const professors: CandidateProfessor[] = [
      {
        id: "prof-mat-1",
        name: "Professor Carlos",
        disciplinaIds: ["disc-mat"],
        availableSlots: new Set(["1_0", "1_1", "2_0", "2_1", "3_0"]),
      },
      {
        id: "prof-mat-2",
        name: "Professora Ana",
        disciplinaIds: ["disc-mat"],
        availableSlots: new Set(["1_0", "1_1", "2_0", "2_1", "3_0"]),
      },
    ];

    const result = service.assignProfessors({ requirements, professors });

    // A carga horária inteira (as 4 aulas) é vinculada a um único professor
    expect(result.requirements[0].professorId).toBeDefined();
    expect(["prof-mat-1", "prof-mat-2"]).toContain(
      result.requirements[0].professorId
    );
  });

  it("deve respeitar estritamente a disponibilidade do professor (não atribuir quem não tem horários suficientes no turno)", () => {
    const requirements: ClassRequirement[] = [
      {
        id: "req-hist",
        turmaId: "turma-601",
        disciplinaId: "disc-hist",
        requiredSlots: 4,
        validSlots: morningSlots,
        professorId: null,
      },
    ];

    const professors: CandidateProfessor[] = [
      {
        id: "prof-hist-insuficiente",
        name: "Professor com apenas 2 aulas disponíveis",
        disciplinaIds: ["disc-hist"],
        availableSlots: new Set(["1_0", "1_1"]), // Apenas 2 horários, mas o requisito precisa de 4
      },
      {
        id: "prof-hist-suficiente",
        name: "Professor com 10 aulas disponíveis",
        disciplinaIds: ["disc-hist"],
        availableSlots: new Set([
          "1_0", "1_1", "2_0", "2_1", "3_0", "3_1", "4_0", "4_1",
        ]),
      },
    ];

    const result = service.assignProfessors({ requirements, professors });

    expect(result.errors).toHaveLength(0);
    // Deve ignorar o professor com apenas 2 horários e escolher quem tem disponibilidade suficiente
    expect(result.requirements[0].professorId).toBe("prof-hist-suficiente");
  });

  it("não deve sobrecarregar professor no mesmo turno além de sua disponibilidade (evita colisão de turmas)", () => {
    // 2 turmas precisam de 4 aulas de Matemática cada no turno da manhã (total 8 aulas necessárias)
    const requirements: ClassRequirement[] = [
      {
        id: "req-turma-a",
        turmaId: "turma-601",
        disciplinaId: "disc-mat",
        requiredSlots: 4,
        validSlots: morningSlots,
        professorId: null,
      },
      {
        id: "req-turma-b",
        turmaId: "turma-602",
        disciplinaId: "disc-mat",
        requiredSlots: 4,
        validSlots: morningSlots,
        professorId: null,
      },
    ];

    const professors: CandidateProfessor[] = [
      {
        id: "prof-mat-apenas-5-slots",
        name: "Professor com 5 horários no turno",
        disciplinaIds: ["disc-mat"],
        availableSlots: new Set(["1_0", "1_1", "1_2", "1_3", "1_4"]), // Tem 5 slots: comporta 4 aulas, mas NÃO comporta 4 + 4 = 8
      },
      {
        id: "prof-mat-15-slots",
        name: "Professor com 15 horários no turno",
        disciplinaIds: ["disc-mat"],
        availableSlots: new Set([
          "2_0", "2_1", "2_2", "2_3", "2_4",
          "3_0", "3_1", "3_2", "3_3", "3_4",
          "4_0", "4_1", "4_2", "4_3", "4_4",
        ]),
      },
    ];

    const result = service.assignProfessors({ requirements, professors });

    const profTurmaA = result.requirements.find(r => r.id === "req-turma-a")?.professorId;
    const profTurmaB = result.requirements.find(r => r.id === "req-turma-b")?.professorId;

    // Não pode ter atribuído ambas as turmas ao professor de 5 slots
    expect(
      profTurmaA === "prof-mat-apenas-5-slots" &&
      profTurmaB === "prof-mat-apenas-5-slots"
    ).toBe(false);

    // Ambas as turmas devem ter professores válidos
    expect(profTurmaA).toBeDefined();
    expect(profTurmaB).toBeDefined();
  });

  it("deve preservar requisitos que já possuíam professor definido manualmente", () => {
    const requirements: ClassRequirement[] = [
      {
        id: "req-manual",
        turmaId: "turma-601",
        disciplinaId: "disc-geo",
        requiredSlots: 3,
        validSlots: morningSlots,
        professorId: "prof-geo-manual",
      },
      {
        id: "req-sem-prof",
        turmaId: "turma-602",
        disciplinaId: "disc-geo",
        requiredSlots: 3,
        validSlots: morningSlots,
        professorId: null,
      },
    ];

    const professors: CandidateProfessor[] = [
      {
        id: "prof-geo-manual",
        name: "Professor Manual",
        disciplinaIds: ["disc-geo"],
        availableSlots: new Set(["1_0", "1_1", "1_2", "2_0", "2_1", "2_2"]),
      },
      {
        id: "prof-geo-outro",
        name: "Outro Professor",
        disciplinaIds: ["disc-geo"],
        availableSlots: new Set(["3_0", "3_1", "3_2", "4_0", "4_1", "4_2"]),
      },
    ];

    const result = service.assignProfessors({ requirements, professors });

    expect(result.requirements[0].professorId).toBe("prof-geo-manual");
    expect(result.requirements[1].professorId).toBeDefined();
  });

  it("deve atribuir o mesmo professor a todas as turmas que compartilham uma sinergia", () => {
    const requirements: ClassRequirement[] = [
      {
        id: "req-sin-1",
        turmaId: "turma-601",
        disciplinaId: "disc-art",
        requiredSlots: 2,
        validSlots: morningSlots,
        professorId: null,
        sinergiaId: "sinergia-artes",
      },
      {
        id: "req-sin-2",
        turmaId: "turma-602",
        disciplinaId: "disc-art",
        requiredSlots: 2,
        validSlots: morningSlots,
        professorId: null,
        sinergiaId: "sinergia-artes",
      },
    ];

    const professors: CandidateProfessor[] = [
      {
        id: "prof-arte",
        name: "Professora de Artes",
        disciplinaIds: ["disc-art"],
        availableSlots: new Set(["1_0", "1_1", "2_0", "2_1"]),
      },
    ];

    const result = service.assignProfessors({ requirements, professors });

    expect(result.requirements[0].professorId).toBe("prof-arte");
    expect(result.requirements[1].professorId).toBe("prof-arte");
    expect(result.requirements[0].professorId).toBe(
      result.requirements[1].professorId
    );
  });

  it("deve gerar erro descritivo quando nenhum professor tiver disponibilidade compatível", () => {
    const requirements: ClassRequirement[] = [
      {
        id: "req-impossivel",
        turmaId: "turma-601",
        disciplinaId: "disc-fisica",
        requiredSlots: 5,
        validSlots: morningSlots,
        professorId: null,
      },
    ];

    const professors: CandidateProfessor[] = [
      {
        id: "prof-fisica",
        name: "Professor Física",
        disciplinaIds: ["disc-fisica"],
        availableSlots: new Set(["1_0", "1_1"]), // Apenas 2 horários para 5 aulas
      },
    ];

    const result = service.assignProfessors({ requirements, professors });

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain("Não foi possível encontrar professor com disponibilidade compatível");
  });

  it("integração com TimetablingEngine: deve gerar grade com professor atribuído em todas as aulas", () => {
    const requirements: ClassRequirement[] = [
      {
        id: "req-mat-601",
        turmaId: "turma-601",
        disciplinaId: "disc-mat",
        requiredSlots: 3,
        validSlots: morningSlots,
        professorId: null, // Sem professor definido inicialmente
      },
    ];

    const professors: CandidateProfessor[] = [
      {
        id: "prof-carlos",
        name: "Carlos Silva",
        disciplinaIds: ["disc-mat"],
        availableSlots: new Set(["1_0", "1_1", "1_2", "2_0", "2_1", "2_2"]),
      },
    ];

    // 1. Executa a atribuição
    const assignmentResult = service.assignProfessors({
      requirements,
      professors,
    });

    expect(assignmentResult.requirements[0].professorId).toBe("prof-carlos");

    // 2. Alimenta o motor TimetablingEngine
    const engine = new TimetablingEngine({
      requirements: assignmentResult.requirements,
      availabilities: assignmentResult.availabilities,
    });

    const output = engine.generateSchedule();

    expect(output.success).toBe(true);
    expect(output.schedule).toBeDefined();
    expect(output.schedule).toHaveLength(3);

    // Todas as 3 aulas geradas devem ter o professor atribuído Carlos Silva
    for (const aula of output.schedule!) {
      expect(aula.professorId).toBe("prof-carlos");
      expect(aula.disciplinaId).toBe("disc-mat");
      expect(aula.turmaId).toBe("turma-601");
      // O horário alocado deve estar estritamente dentro da disponibilidade do professor
      expect(professors[0].availableSlots.has(aula.timeSlot)).toBe(true);
    }
  });
});
