import { GradeHorariaDiagnosticsService } from "../GradeHorariaDiagnosticsService";

describe("GradeHorariaDiagnosticsService", () => {
  let service: GradeHorariaDiagnosticsService;

  beforeEach(() => {
    service = new GradeHorariaDiagnosticsService();
  });

  it("deve detectar turma com aulas alocadas além da capacidade do turno (turma_overload)", () => {
    const result = service.runDiagnostics({
      turmas: [{ id: "t1", name: "Turma 601", shiftId: "manha" }],
      disciplinas: [
        { id: "d1", name: "Matemática", isOffGrid: false },
        { id: "d2", name: "Português", isOffGrid: false },
        { id: "d3", name: "EaD Cidadania", isOffGrid: true },
      ],
      professores: [
        { id: "p1", name: "Prof A", disciplinas: [{ id: "d1" }, { id: "d2" }] },
      ],
      cargas: [
        { id: "c1", turmaId: "t1", disciplinaId: "d1", quantidadeAulas: 15 },
        { id: "c2", turmaId: "t1", disciplinaId: "d2", quantidadeAulas: 13 }, // Total presencial = 28
        { id: "c3", turmaId: "t1", disciplinaId: "d3", quantidadeAulas: 5 },  // EaD: não conta
      ],
      shiftsConfig: [
        {
          id: "manha",
          name: "Manhã",
          daysPerWeek: 5,
          slots: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }], // 5x5 = 25
        },
      ],
    });

    expect(result.hasIssues).toBe(true);
    const overloadAlert = result.alerts.find(a => a.category === "turma_overload");
    expect(overloadAlert).toBeDefined();
    expect(overloadAlert?.severity).toBe("error");
    expect(overloadAlert?.description).toContain("28 aulas");
    expect(overloadAlert?.description).toContain("25 aulas");
    expect(overloadAlert?.description).toContain("3 aulas a mais");

    expect(result.turmasSummary["t1"]).toEqual({
      turmaId: "t1",
      turmaName: "Turma 601",
      shiftId: "manha",
      totalClasses: 28,
      maxCapacity: 25,
      isOverloaded: true,
      excessClasses: 3,
    });
  });

  it("deve detectar disciplinas presenciais sem nenhum professor alocado (discipline_no_teacher)", () => {
    const result = service.runDiagnostics({
      turmas: [{ id: "t1", name: "Turma 601" }],
      disciplinas: [
        { id: "d1", name: "Física", isOffGrid: false, professores: [] },
        { id: "d2", name: "Química Online", isOffGrid: true, professores: [] }, // EaD: ignorada
      ],
      professores: [],
      cargas: [],
    });

    expect(result.hasIssues).toBe(true);
    const discAlert = result.alerts.find(a => a.category === "discipline_no_teacher");
    expect(discAlert).toBeDefined();
    expect(discAlert?.title).toContain("Física");
    // EaD não deve gerar alerta
    expect(result.alerts.some(a => a.title.includes("Química Online"))).toBe(false);
  });

  it("deve detectar professores sem nenhuma disciplina alocada (teacher_no_discipline)", () => {
    const result = service.runDiagnostics({
      turmas: [],
      disciplinas: [{ id: "d1", name: "História", professores: [] }],
      professores: [
        { id: "p1", name: "Prof Sem Matéria", disciplinas: [] },
      ],
      cargas: [],
    });

    expect(result.hasIssues).toBe(true);
    const profAlert = result.alerts.find(a => a.category === "teacher_no_discipline");
    expect(profAlert).toBeDefined();
    expect(profAlert?.title).toContain("Prof Sem Matéria");
  });

  it("deve retornar hasIssues = false quando todos os dados estão consistentes", () => {
    const result = service.runDiagnostics({
      turmas: [{ id: "t1", name: "Turma 601", shiftId: "default" }],
      disciplinas: [{ id: "d1", name: "História", isOffGrid: false, professores: [{ id: "p1" }] }],
      professores: [{ id: "p1", name: "Prof História", disciplinas: [{ id: "d1" }] }],
      cargas: [{ id: "c1", turmaId: "t1", disciplinaId: "d1", quantidadeAulas: 20 }],
      shiftsConfig: [
        {
          id: "default",
          name: "Turno Padrão",
          daysPerWeek: 5,
          slots: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
        },
      ],
    });

    expect(result.hasIssues).toBe(false);
    expect(result.alerts).toHaveLength(0);
    expect(result.turmasSummary["t1"].isOverloaded).toBe(false);
  });
});
