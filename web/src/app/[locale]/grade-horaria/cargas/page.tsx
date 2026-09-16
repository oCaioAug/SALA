"use client";

import { AlertTriangle, Clock, Plus, Search, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useEffect, useMemo, useState } from "react";

import { OrgAdminGuard } from "@/components/auth/OrgAdminGuard";
import { PageLayout } from "@/components/layout/PageLayout";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { SearchableMultiSelect } from "@/components/ui/SearchableMultiSelect";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { GradeHorariaDiagnosticsService } from "@/domain/timetabling/GradeHorariaDiagnosticsService";
import { useApp } from "@/lib/hooks/useApp";
import { useNavigation } from "@/lib/hooks/useNavigation";

import {
  createBatchCargasHorarias,
  createCargaSinergia,
  deleteCargaHoraria,
  getCargasHorarias,
  getDisciplinas,
  getGradeSettings,
  getProfessores,
  getTurmas,
  updateCargaHoraria,
} from "../actions";

const CargasHorariasPage: React.FC = () => {
  const t = useTranslations("GradeHoraria.loads");
  const tCommon = useTranslations("GradeHoraria.common");
  const [currentPage, setCurrentPage] = useState("grade-horaria-cargas");
  const { navigate, isNavigating } = useNavigation({
    currentPage,
    onPageChange: setCurrentPage,
  });
  const { showSuccess, showError } = useApp();

  const [cargas, setCargas] = useState<any[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [disciplinas, setDisciplinas] = useState<any[]>([]);
  const [professores, setProfessores] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Bulk Form state
  const [selectedTurmaId, setSelectedTurmaId] = useState("");
  const [selectedDisciplinaIds, setSelectedDisciplinaIds] = useState<string[]>([]);
  const [disciplinaConfigs, setDisciplinaConfigs] = useState<
    Record<string, { professorId: string; quantidadeAulas: number }>
  >({});
  const [defaultAulas, setDefaultAulas] = useState(2);
  const [disciplinaId, setDisciplinaId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sinergia State
  const [isSinergia, setIsSinergia] = useState(false);
  const [sinergiaName, setSinergiaName] = useState("");
  const [turmaIds, setTurmaIds] = useState<string[]>([]);
  const [sameProfessor, setSameProfessor] = useState(true);
  const [sinergiaProfessorId, setSinergiaProfessorId] = useState("");
  const [turmaProfessores, setTurmaProfessores] = useState<Record<string, string>>({});

  const [editingCarga, setEditingCarga] = useState<any | null>(null);
  const [editTurmaId, setEditTurmaId] = useState("");
  const [editDisciplinaId, setEditDisciplinaId] = useState("");
  const [editProfessorId, setEditProfessorId] = useState("");
  const [editQuantidadeAulas, setEditQuantidadeAulas] = useState(1);

  // Filter and pagination states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTurmaId, setFilterTurmaId] = useState("");
  const [filterDisciplinaId, setFilterDisciplinaId] = useState("");
  const [filterProfessorId, setFilterProfessorId] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleSelectDisciplinas = (newIds: string[]) => {
    const safeIds = Array.isArray(newIds) ? newIds : [];
    setSelectedDisciplinaIds(safeIds);
    setDisciplinaConfigs(prev => {
      const next = { ...prev };
      safeIds.forEach(id => {
        if (!next[id]) {
          next[id] = { professorId: "", quantidadeAulas: defaultAulas };
        }
      });
      return next;
    });
  };

  const updateDisciplinaConfig = (
    dId: string,
    field: "professorId" | "quantidadeAulas",
    val: any
  ) => {
    setDisciplinaConfigs(prev => ({
      ...prev,
      [dId]: {
        ...(prev[dId] || { professorId: "", quantidadeAulas: defaultAulas }),
        [field]: val,
      },
    }));
  };

  const applyDefaultAulasToAll = (aulas: number) => {
    setDefaultAulas(aulas);
    setDisciplinaConfigs(prev => {
      const next = { ...prev };
      selectedDisciplinaIds.forEach(id => {
        next[id] = {
          ...(next[id] || { professorId: "" }),
          quantidadeAulas: aulas,
        };
      });
      return next;
    });
  };

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterTurmaId, filterDisciplinaId, filterProfessorId]);

  const filteredCargas = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return (cargas || []).filter(c => {
      if (!c) return false;
      const turmaName = c.turma?.name?.toLowerCase() || "";
      const discName = c.disciplina?.name?.toLowerCase() || "";
      const profName = c.professor?.name?.toLowerCase() || "";

      const matchesText =
        !q ||
        turmaName.includes(q) ||
        discName.includes(q) ||
        profName.includes(q) ||
        (!c.professor && "a definir".includes(q));

      const matchesTurma = !filterTurmaId || c.turmaId === filterTurmaId;
      const matchesDisciplina =
        !filterDisciplinaId || c.disciplinaId === filterDisciplinaId;
      const matchesProf =
        !filterProfessorId ||
        (filterProfessorId === "none"
          ? !c.professorId
          : c.professorId === filterProfessorId);

      return matchesText && matchesTurma && matchesDisciplina && matchesProf;
    });
  }, [cargas, searchTerm, filterTurmaId, filterDisciplinaId, filterProfessorId]);

  const paginatedCargas = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCargas.slice(start, start + pageSize);
  }, [filteredCargas, page, pageSize]);

  const diagnostics = useMemo(() => {
    const diagService = new GradeHorariaDiagnosticsService();
    return diagService.runDiagnostics({
      turmas,
      disciplinas,
      professores,
      cargas,
      shiftsConfig: shifts,
    });
  }, [turmas, disciplinas, professores, cargas, shifts]);

  const selectedTurmaSummary = useMemo(() => {
    if (!selectedTurmaId) return null;
    return diagnostics.turmasSummary[selectedTurmaId] || null;
  }, [diagnostics, selectedTurmaId]);

  const projectedAddition = useMemo(() => {
    return selectedDisciplinaIds.reduce((sum, dId) => {
      const aulas = disciplinaConfigs[dId]?.quantidadeAulas ?? defaultAulas;
      return sum + Number(aulas || 0);
    }, 0);
  }, [selectedDisciplinaIds, disciplinaConfigs, defaultAulas]);

  const projectedTotal = (selectedTurmaSummary?.totalClasses || 0) + projectedAddition;
  const isProjectedOverloaded = selectedTurmaSummary
    ? projectedTotal > selectedTurmaSummary.maxCapacity
    : false;

  const filterTurmaSummary = useMemo(() => {
    if (!filterTurmaId) return null;
    return diagnostics.turmasSummary[filterTurmaId] || null;
  }, [diagnostics, filterTurmaId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cargasData, turmasData, disciplinasData, professoresData, settingsData] =
        await Promise.all([
          getCargasHorarias(),
          getTurmas(),
          getDisciplinas(),
          getProfessores(),
          getGradeSettings(),
        ]);
      setCargas(cargasData);
      setTurmas(turmasData);
      setDisciplinas(disciplinasData);
      setProfessores(professoresData);
      setShifts(settingsData?.timetabling?.shifts || []);
    } catch (err: any) {
      showError(err.message || t("toastLoadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSinergia) {
      if (!sinergiaName.trim() || !disciplinaId || turmaIds.length === 0) return;
      if (sameProfessor && !sinergiaProfessorId) return;
      if (!sameProfessor && turmaIds.some(tId => !turmaProfessores[tId])) return;

      try {
        setIsSubmitting(true);
        const tpArray = turmaIds.map(tId => ({
          turmaId: tId,
          professorId: sameProfessor ? sinergiaProfessorId : turmaProfessores[tId],
        }));
        await createCargaSinergia(
          sinergiaName,
          disciplinaId,
          Number(defaultAulas),
          tpArray
        );
        showSuccess(t("toastCreateSuccess"));

        setSinergiaName("");
        fetchData();
      } catch (err: any) {
        showError(err.message || t("toastCreateError"));
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!selectedTurmaId) {
        showError("Selecione uma turma.");
        return;
      }
      if (selectedDisciplinaIds.length === 0) {
        showError("Selecione pelo menos uma disciplina.");
        return;
      }

      const payload = selectedDisciplinaIds.map(dId => ({
        disciplinaId: dId,
        professorId: disciplinaConfigs[dId]?.professorId || null,
        quantidadeAulas: Math.max(
          1,
          Number(disciplinaConfigs[dId]?.quantidadeAulas) || defaultAulas
        ),
      }));

      try {
        setIsSubmitting(true);
        await createBatchCargasHorarias(selectedTurmaId, payload);
        showSuccess(`${payload.length} carga(s) horária(s) vinculada(s) à turma com sucesso!`);

        setSelectedDisciplinaIds([]);
        setDisciplinaConfigs({});
        fetchData();
      } catch (err: any) {
        showError(err.message || t("toastCreateError"));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCarga || editQuantidadeAulas <= 0) return;

    try {
      setIsSubmitting(true);
      await updateCargaHoraria(
        editingCarga.id,
        Number(editQuantidadeAulas),
        editProfessorId || null
      );
      showSuccess("Carga horária atualizada com sucesso");

      fetchData();
      cancelEdit();
    } catch (err: any) {
      showError(err.message || "Erro ao atualizar carga horária");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (carga: any) => {
    setEditingCarga(carga);
    setEditTurmaId(carga.turmaId);
    setEditDisciplinaId(carga.disciplinaId);
    setEditProfessorId(carga.professorId || "");
    setEditQuantidadeAulas(carga.quantidadeAulas);
  };

  const cancelEdit = () => {
    setEditingCarga(null);
    setEditTurmaId("");
    setEditDisciplinaId("");
    setEditProfessorId("");
    setEditQuantidadeAulas(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;
    try {
      await deleteCargaHoraria(id);
      showSuccess(t("toastDeleteSuccess"));
      setCargas(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      showError(err.message || t("toastDeleteError"));
    }
  };

  return (
    <OrgAdminGuard>
      <PageLayout
        currentPage={currentPage}
        onNavigate={navigate}
        isNavigating={isNavigating}
      >
        <div className="mb-8 flex justify-between items-end">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
                {t("title")}
              </h1>
              <p className="text-slate-600 dark:text-gray-400">
                {t("description")}
              </p>
            </div>
          </div>
          <BackButton />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form */}
          <Card className="lg:col-span-5">
            <CardContent className="p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-foreground">
                  {t("formTitle")} por Turma
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Vincule múltiplas disciplinas e professores a uma turma de uma só vez.
                </p>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="flex items-center gap-2 mb-2 bg-indigo-50 dark:bg-indigo-950/30 p-2.5 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                  <input
                    type="checkbox"
                    id="isSinergia"
                    checked={isSinergia}
                    onChange={e => setIsSinergia(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <label
                    htmlFor="isSinergia"
                    className="text-xs font-semibold text-indigo-900 dark:text-indigo-200 cursor-pointer"
                  >
                    Agrupar como Sinergia (Múltiplas turmas no mesmo horário)
                  </label>
                </div>

                {isSinergia ? (
                  <>
                    <Input
                      label="Nome da Sinergia"
                      placeholder="Ex: Cálculo 1 - Engenharias"
                      value={sinergiaName}
                      onChange={e => setSinergiaName(e.target.value)}
                      disabled={isSubmitting}
                    />

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t("subjectLabel")}
                      </label>
                      <SearchableSelect
                        value={disciplinaId}
                        onChange={setDisciplinaId}
                        options={disciplinas.map(item => ({
                          value: item.id,
                          label: item.name,
                        }))}
                        placeholder={t("subjectPlaceholder")}
                        allowEmpty
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="space-y-2 max-h-40 overflow-y-auto p-2 border border-slate-200 dark:border-slate-700 rounded-md">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
                        Selecione as Turmas
                      </label>
                      {turmas.map(tItem => (
                        <div key={tItem.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`sinergia-turma-${tItem.id}`}
                            checked={turmaIds.includes(tItem.id)}
                            onChange={e => {
                              if (e.target.checked) {
                                setTurmaIds(prev => [...prev, tItem.id]);
                              } else {
                                setTurmaIds(prev => prev.filter(id => id !== tItem.id));
                              }
                            }}
                            className="w-4 h-4 text-indigo-600 rounded"
                          />
                          <label htmlFor={`sinergia-turma-${tItem.id}`} className="text-sm">
                            {tItem.name}
                          </label>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        id="sameProf"
                        checked={sameProfessor}
                        onChange={e => setSameProfessor(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <label htmlFor="sameProf" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Mesmo professor para todas as turmas
                      </label>
                    </div>

                    {sameProfessor ? (
                      <div className="space-y-2 mt-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Professor da Sinergia
                        </label>
                        <SearchableSelect
                          value={sinergiaProfessorId}
                          onChange={setSinergiaProfessorId}
                          options={professores.map(item => ({
                            value: item.id,
                            label: item.name,
                          }))}
                          placeholder="Selecione o professor"
                          allowEmpty
                          disabled={isSubmitting}
                        />
                      </div>
                    ) : (
                      <div className="space-y-3 mt-3 border-t border-slate-200 dark:border-slate-700 pt-3">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Selecione um professor para cada turma:
                        </label>
                        {turmaIds.map(tId => {
                          const turma = turmas.find(tItem => tItem.id === tId);
                          return (
                            <div key={tId} className="pl-2 border-l-2 border-indigo-200 dark:border-indigo-800">
                              <p className="text-xs font-semibold mb-1">{turma?.name}</p>
                              <SearchableSelect
                                value={turmaProfessores[tId] || ""}
                                onChange={val => setTurmaProfessores(prev => ({ ...prev, [tId]: val }))}
                                options={professores.map(item => ({
                                  value: item.id,
                                  label: item.name,
                                }))}
                                placeholder="Professor para esta turma"
                                allowEmpty
                                disabled={isSubmitting}
                                triggerClassName="h-8 text-xs"
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <Input
                      label={t("lessonsPerWeek")}
                      type="number"
                      min="1"
                      max="40"
                      value={defaultAulas}
                      onChange={e => setDefaultAulas(Number(e.target.value))}
                      disabled={isSubmitting}
                    />

                    <Button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                      disabled={isSubmitting}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Adicionar Sinergia
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Select Turma */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t("classLabel")}
                      </label>
                      <SearchableSelect
                        value={selectedTurmaId}
                        onChange={setSelectedTurmaId}
                        options={turmas.map(item => ({
                          value: item.id,
                          label: item.name,
                        }))}
                        placeholder={t("classPlaceholder")}
                        allowEmpty
                        disabled={isSubmitting}
                      />

                      {selectedTurmaSummary && (
                        <div
                          className={`p-2.5 rounded-lg border text-xs flex flex-col gap-1.5 transition-colors mt-2 ${
                            selectedTurmaSummary.isOverloaded || isProjectedOverloaded
                              ? "bg-red-50 dark:bg-red-950/25 border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300"
                              : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              Capacidade do turno:
                            </span>
                            <span className="font-bold">
                              {selectedTurmaSummary.totalClasses} / {selectedTurmaSummary.maxCapacity} aulas cadastradas
                            </span>
                          </div>
                          {projectedAddition > 0 && (
                            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800">
                              <span>Após adicionar selecionadas:</span>
                              <span
                                className={`font-bold ${
                                  isProjectedOverloaded
                                    ? "text-red-600 dark:text-red-400 font-extrabold"
                                    : "text-blue-600 dark:text-blue-400"
                                }`}
                              >
                                {projectedTotal} / {selectedTurmaSummary.maxCapacity} aulas
                              </span>
                            </div>
                          )}
                          {(selectedTurmaSummary.isOverloaded || isProjectedOverloaded) && (
                            <div className="text-[11px] font-semibold text-red-600 dark:text-red-400 flex items-center gap-1 mt-0.5">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>
                                Excesso de{" "}
                                {isProjectedOverloaded
                                  ? projectedTotal - selectedTurmaSummary.maxCapacity
                                  : selectedTurmaSummary.excessClasses}{" "}
                                aula(s) além da capacidade máxima do turno!
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* MultiSelect Disciplinas */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Disciplinas da Turma
                        </label>
                        <div className="flex items-center gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => handleSelectDisciplinas(disciplinas.map(d => d.id))}
                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                            disabled={isSubmitting}
                          >
                            Todas
                          </button>
                          {selectedDisciplinaIds.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleSelectDisciplinas([])}
                              className="text-red-500 hover:underline"
                              disabled={isSubmitting}
                            >
                              Limpar
                            </button>
                          )}
                        </div>
                      </div>

                      <SearchableMultiSelect
                        options={disciplinas.map(d => ({
                          value: d.id,
                          label: d.name + (d.code ? ` (${d.code})` : ""),
                        }))}
                        value={selectedDisciplinaIds}
                        onChange={handleSelectDisciplinas}
                        placeholder="Selecione uma ou mais disciplinas..."
                        searchPlaceholder="Buscar disciplina..."
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Selected Disciplines Config List */}
                    {selectedDisciplinaIds.length > 0 && (
                      <div className="space-y-2.5 pt-1">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Configuração por Disciplina ({selectedDisciplinaIds.length})
                          </label>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <span>Aulas padrão:</span>
                            <input
                              type="number"
                              min="1"
                              max="40"
                              value={defaultAulas}
                              onChange={e => {
                                const val = Number(e.target.value);
                                applyDefaultAulasToAll(val);
                              }}
                              className="w-12 h-6 text-center text-xs border rounded bg-background"
                              disabled={isSubmitting}
                            />
                          </div>
                        </div>

                        <div className="max-h-72 overflow-y-auto space-y-2 pr-1 border border-border/60 rounded-lg p-2 bg-slate-50/50 dark:bg-slate-900/30">
                          {selectedDisciplinaIds.map(dId => {
                            const disc = disciplinas.find(d => d.id === dId);
                            const config = disciplinaConfigs[dId] || {
                              professorId: "",
                              quantidadeAulas: defaultAulas,
                            };

                            return (
                              <div
                                key={dId}
                                className="p-2.5 bg-background border border-border rounded-md shadow-xs space-y-2"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-medium text-sm text-foreground truncate">
                                    {disc?.name || "Disciplina"}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSelectDisciplinas(
                                        selectedDisciplinaIds.filter(id => id !== dId)
                                      )
                                    }
                                    className="text-slate-400 hover:text-red-500 p-0.5 rounded transition-colors"
                                    title="Remover disciplina"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  <div className="sm:col-span-2">
                                    <SearchableSelect
                                      options={(professores || []).map(p => ({
                                        value: p.id,
                                        label: p.name || "Sem nome",
                                      }))}
                                      value={config.professorId || ""}
                                      onChange={val =>
                                        updateDisciplinaConfig(dId, "professorId", val)
                                      }
                                      placeholder="Sem professor (a definir)"
                                      allowEmpty
                                      disabled={isSubmitting}
                                      triggerClassName="h-8 text-xs"
                                    />
                                  </div>
                                  <div>
                                    <input
                                      type="number"
                                      min="1"
                                      max="40"
                                      value={config.quantidadeAulas ?? defaultAulas}
                                      onChange={e =>
                                        updateDisciplinaConfig(
                                          dId,
                                          "quantidadeAulas",
                                          Math.max(1, Number(e.target.value) || 1)
                                        )
                                      }
                                      placeholder="Aulas"
                                      className="w-full h-8 text-xs border border-input bg-background rounded px-2 text-center"
                                      disabled={isSubmitting}
                                      title="Aulas por semana"
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                      disabled={
                        isSubmitting ||
                        !selectedTurmaId ||
                        selectedDisciplinaIds.length === 0
                      }
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {selectedDisciplinaIds.length > 0
                        ? `Vincular ${selectedDisciplinaIds.length} Disciplina${
                            selectedDisciplinaIds.length > 1 ? "s" : ""
                          } à Turma`
                        : "Selecione a turma e as disciplinas"}
                    </Button>
                  </>
                )}
              </form>
            </CardContent>
          </Card>

          {/* List */}
          <Card className="lg:col-span-7">
            <CardContent className="p-0 flex flex-col">
              {/* Filters Bar - ALWAYS VISIBLE */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Pesquisar por turma, disciplina ou professor..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <SearchableSelect
                    options={turmas.map(t => ({ value: t.id, label: t.name }))}
                    value={filterTurmaId}
                    onChange={setFilterTurmaId}
                    placeholder="Todas as turmas"
                    allowEmpty
                  />
                  <SearchableSelect
                    options={disciplinas.map(d => ({
                      value: d.id,
                      label: d.name,
                    }))}
                    value={filterDisciplinaId}
                    onChange={setFilterDisciplinaId}
                    placeholder="Todas as disciplinas"
                    allowEmpty
                  />
                  <SearchableSelect
                    options={[
                      { value: "none", label: "Sem professor (A definir)" },
                      ...professores.map(p => ({
                        value: p.id,
                        label: p.name || "Sem nome",
                      })),
                    ]}
                    value={filterProfessorId}
                    onChange={setFilterProfessorId}
                    placeholder="Todos os professores"
                    allowEmpty
                  />
                </div>
              </div>

              {/* Alerta de sobrecarga da turma filtrada */}
              {filterTurmaSummary && filterTurmaSummary.isOverloaded && (
                <div className="mx-4 mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>
                    <strong>Atenção:</strong> Esta turma possui {filterTurmaSummary.totalClasses} aulas cadastradas para um turno de capacidade máxima de {filterTurmaSummary.maxCapacity} horários ({filterTurmaSummary.excessClasses} aulas em excesso).
                  </span>
                </div>
              )}

              {/* List Content */}
              {loading ? (
                <div className="p-8 text-center text-slate-500">
                  {tCommon("loading")}
                </div>
              ) : filteredCargas.length === 0 ? (
                <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                  <p className="text-slate-600 dark:text-slate-400 font-medium">
                    {cargas.length === 0
                      ? t("empty")
                      : "Nenhuma carga horária encontrada para os filtros selecionados."}
                  </p>
                  {(searchTerm || filterTurmaId || filterDisciplinaId || filterProfessorId) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTerm("");
                        setFilterTurmaId("");
                        setFilterDisciplinaId("");
                        setFilterProfessorId("");
                      }}
                    >
                      Limpar filtros
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col">
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedCargas.map(c => (
                      <div
                        key={c.id}
                        className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                            <span>{c.turma?.name} - {c.disciplina?.name}</span>
                            {diagnostics.turmasSummary[c.turmaId]?.isOverloaded && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800">
                                Turma com excesso de aulas
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-slate-500 flex flex-wrap gap-4 mt-1">
                            <span>
                              {c.professor?.name ? (
                                t("teacherPrefix", { name: c.professor.name })
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                                  Sem professor definido
                                </span>
                              )}
                            </span>
                            <span>
                              {t("lessonsCount", { count: c.quantidadeAulas || 1 })}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                            onClick={() => startEdit(c)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                            onClick={() => handleDelete(c.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                    <Pagination
                      page={page}
                      pageSize={pageSize}
                      total={filteredCargas.length}
                      onPageChange={setPage}
                      onPageSizeChange={setPageSize}
                      pageSizeOptions={[10, 20, 50]}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modal de Edição */}
        {editingCarga && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-md shadow-xl">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Editar Carga Horária</h2>
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Turma e Disciplina (Apenas Visualização)
                    </label>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm border border-slate-200 dark:border-slate-700">
                      <strong>Turma:</strong> {turmas.find(t => t.id === editTurmaId)?.name} <br/>
                      <strong>Disciplina:</strong> {disciplinas.find(d => d.id === editDisciplinaId)?.name}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Professor (Opcional)
                    </label>
                    <SearchableSelect
                      options={professores.map(p => ({
                        value: p.id,
                        label: p.name,
                      }))}
                      value={editProfessorId}
                      onChange={setEditProfessorId}
                      placeholder="Sem professor (a definir)"
                      allowEmpty
                      disabled={isSubmitting}
                    />
                  </div>

                  <Input
                    label={t("lessonsPerWeek")}
                    type="number"
                    min="1"
                    max="40"
                    value={editQuantidadeAulas}
                    onChange={e => setEditQuantidadeAulas(Number(e.target.value))}
                    disabled={isSubmitting}
                  />

                  <div className="flex gap-2 justify-end mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={cancelEdit}
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || editQuantidadeAulas <= 0}
                    >
                      Salvar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </PageLayout>
    </OrgAdminGuard>
  );
};

export default CargasHorariasPage;
