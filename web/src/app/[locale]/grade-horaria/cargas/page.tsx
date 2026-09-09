"use client";

import { Clock, Plus, Trash2, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";

import { OrgAdminGuard } from "@/components/auth/OrgAdminGuard";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { useApp } from "@/lib/hooks/useApp";
import { useNavigation } from "@/lib/hooks/useNavigation";

import {
  getCargasHorarias,
  createCargaHoraria,
  updateCargaHoraria,
  deleteCargaHoraria,
  getTurmas,
  getDisciplinas,
  getProfessores,
  createCargaSinergia,
} from "../actions";

const CargasHorariasPage: React.FC = () => {
  const t = useTranslations("GradeHoraria.loads");
  const tCommon = useTranslations("GradeHoraria.common");
  const [currentPage, setCurrentPage] = useState("grade-horaria");
  const { navigate, isNavigating } = useNavigation({
    currentPage,
    onPageChange: setCurrentPage,
  });
  const { showSuccess, showError } = useApp();

  const [cargas, setCargas] = useState<any[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [disciplinas, setDisciplinas] = useState<any[]>([]);
  const [professores, setProfessores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [turmaId, setTurmaId] = useState("");
  const [disciplinaId, setDisciplinaId] = useState("");
  const [professorId, setProfessorId] = useState("");
  const [quantidadeAulas, setQuantidadeAulas] = useState(1);
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

  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cargasData, turmasData, disciplinasData, professoresData] =
        await Promise.all([
          getCargasHorarias(),
          getTurmas(),
          getDisciplinas(),
          getProfessores(),
        ]);
      setCargas(cargasData);
      setTurmas(turmasData);
      setDisciplinas(disciplinasData);
      setProfessores(professoresData);
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
      if (!sinergiaName.trim() || !disciplinaId || turmaIds.length === 0 || quantidadeAulas <= 0) return;
      if (sameProfessor && !sinergiaProfessorId) return;
      if (!sameProfessor && turmaIds.some(tId => !turmaProfessores[tId])) return;

      try {
        setIsSubmitting(true);
        const tpArray = turmaIds.map(tId => ({
          turmaId: tId,
          professorId: sameProfessor ? sinergiaProfessorId : turmaProfessores[tId]
        }));
        await createCargaSinergia(sinergiaName, disciplinaId, Number(quantidadeAulas), tpArray);
        showSuccess(t("toastCreateSuccess"));
        
        // Reset form partially
        setQuantidadeAulas(1);
        setSinergiaName("");
        fetchData();
      } catch (err: any) {
        showError(err.message || t("toastCreateError"));
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!turmaId || !disciplinaId || !professorId || quantidadeAulas <= 0) return;

      try {
        setIsSubmitting(true);
        const newCarga = await createCargaHoraria(
          turmaId,
          disciplinaId,
          professorId,
          Number(quantidadeAulas)
        );
        showSuccess(t("toastCreateSuccess"));

        setQuantidadeAulas(1);
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
      const updatedCarga = await updateCargaHoraria(
        editingCarga.id,
        Number(editQuantidadeAulas)
      );
      showSuccess("Carga horária atualizada com sucesso");
      
      setCargas(prev =>
        prev.map(c => 
          c.id === updatedCarga.id 
            ? { ...c, quantidadeAulas: updatedCarga.quantidadeAulas } 
            : c
        )
      );
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
    setEditProfessorId(carga.professorId);
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
          <Button variant="outline" onClick={() => navigate("/grade-horaria")}>
            {tCommon("back")}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Form */}
          <Card className="md:col-span-1">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">{t("formTitle")}</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="flex items-center gap-2 mb-4 bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                  <input
                    type="checkbox"
                    id="isSinergia"
                    checked={isSinergia}
                    onChange={(e) => setIsSinergia(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <label htmlFor="isSinergia" className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
                    Agrupar como Sinergia (Múltiplas turmas no mesmo horário)
                  </label>
                </div>

                {isSinergia && (
                  <Input
                    label="Nome da Sinergia"
                    placeholder="Ex: Cálculo 1 - Engenharias"
                    value={sinergiaName}
                    onChange={e => setSinergiaName(e.target.value)}
                    disabled={isSubmitting}
                  />
                )}

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
                    triggerClassName="h-10 rounded-lg border-slate-300 bg-white text-slate-900 focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {!isSinergia ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t("classLabel")}
                      </label>
                      <SearchableSelect
                        value={turmaId}
                        onChange={setTurmaId}
                        options={turmas.map(item => ({
                          value: item.id,
                          label: item.name,
                        }))}
                        placeholder={t("classPlaceholder")}
                        allowEmpty
                        disabled={isSubmitting}
                        triggerClassName="h-10 rounded-lg border-slate-300 bg-white text-slate-900 focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t("teacherLabel")}
                      </label>
                      <SearchableSelect
                        value={professorId}
                        onChange={setProfessorId}
                        options={professores.map(item => ({
                          value: item.id,
                          label: item.name,
                        }))}
                        placeholder={t("teacherPlaceholder")}
                        allowEmpty
                        disabled={isSubmitting}
                        triggerClassName="h-10 rounded-lg border-slate-300 bg-white text-slate-900 focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </>
                ) : (
                  <>
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
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTurmaIds(prev => [...prev, tItem.id]);
                              } else {
                                setTurmaIds(prev => prev.filter(id => id !== tItem.id));
                              }
                            }}
                            className="w-4 h-4 text-indigo-600 rounded"
                          />
                          <label htmlFor={`sinergia-turma-${tItem.id}`} className="text-sm">{tItem.name}</label>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        id="sameProf"
                        checked={sameProfessor}
                        onChange={(e) => setSameProfessor(e.target.checked)}
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
                          triggerClassName="h-10 rounded-lg border-slate-300 bg-white text-slate-900 focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
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
                                onChange={(val) => setTurmaProfessores(prev => ({ ...prev, [tId]: val }))}
                                options={professores.map(item => ({
                                  value: item.id,
                                  label: item.name,
                                }))}
                                placeholder="Professor para esta turma"
                                allowEmpty
                                disabled={isSubmitting}
                                triggerClassName="h-8 text-xs rounded border-slate-300 bg-white text-slate-900 focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                <Input
                  label={t("lessonsPerWeek")}
                  type="number"
                  min="1"
                  max="40"
                  value={quantidadeAulas}
                  onChange={e => setQuantidadeAulas(Number(e.target.value))}
                  disabled={isSubmitting}
                />

                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  disabled={isSubmitting}
                >
                  <Plus className="w-4 h-4 mr-2" /> {isSinergia ? "Adicionar Sinergia" : t("linkButton")}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* List */}
          <Card className="md:col-span-2">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-slate-500">
                  {tCommon("loading")}
                </div>
              ) : cargas.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  {t("empty")}
                </div>
              ) : (
                <div className="flex flex-col">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800">
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
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {cargas
                      .filter(c => 
                        c.turma.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        c.disciplina.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        c.professor.name.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map(c => (
                    <div
                      key={c.id}
                      className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {c.turma.name} - {c.disciplina.name}
                        </div>
                        <div className="text-sm text-slate-500 flex gap-4 mt-1">
                          <span>
                            {t("teacherPrefix", { name: c.professor.name })}
                          </span>
                          <span>
                            {t("lessonsCount", { count: c.quantidadeAulas })}
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
                      <strong>Disciplina:</strong> {disciplinas.find(d => d.id === editDisciplinaId)?.name} <br/>
                      <strong>Professor:</strong> {professores.find(p => p.id === editProfessorId)?.name}
                    </div>
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
