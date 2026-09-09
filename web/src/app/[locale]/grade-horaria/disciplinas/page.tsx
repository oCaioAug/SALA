"use client";

import { BookOpen, Plus, Trash2, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";

import { OrgAdminGuard } from "@/components/auth/OrgAdminGuard";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useApp } from "@/lib/hooks/useApp";
import { useNavigation } from "@/lib/hooks/useNavigation";

import { createDisciplina, updateDisciplina, deleteDisciplina, getDisciplinas, getProfessores } from "../actions";

const DisciplinasPage: React.FC = () => {
  const t = useTranslations("GradeHoraria.subjects");
  const tCommon = useTranslations("GradeHoraria.common");
  const [currentPage, setCurrentPage] = useState("grade-horaria");
  const { navigate, isNavigating } = useNavigation({
    currentPage,
    onPageChange: setCurrentPage,
  });
  const { showSuccess, showError } = useApp();

  const [disciplinas, setDisciplinas] = useState<any[]>([]);
  const [professores, setProfessores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNome, setNewNome] = useState("");
  const [newCodigo, setNewCodigo] = useState("");
  const [isOffGrid, setIsOffGrid] = useState(false);
  const [newProfessorIds, setNewProfessorIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingDisc, setEditingDisc] = useState<any | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editCodigo, setEditCodigo] = useState("");
  const [editIsOffGrid, setEditIsOffGrid] = useState(false);
  const [editProfessorIds, setEditProfessorIds] = useState<string[]>([]);

  const [searchTerm, setSearchTerm] = useState("");

  const fetchDisciplinas = async () => {
    try {
      setLoading(true);
      const [data, profs] = await Promise.all([
        getDisciplinas(),
        getProfessores(),
      ]);
      setDisciplinas(data);
      setProfessores(profs);
    } catch (err: any) {
      showError(err.message || t("toastLoadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisciplinas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNome.trim()) return;

    try {
      setIsSubmitting(true);
      const newDisc = await createDisciplina(newNome, newCodigo || undefined, isOffGrid, newProfessorIds);
      showSuccess(t("toastCreateSuccess"));
      setNewNome("");
      setNewCodigo("");
      setIsOffGrid(false);
      setNewProfessorIds([]);
      
      // refetch to update relations
      fetchDisciplinas();
    } catch (err: any) {
      showError(err.message || t("toastCreateError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDisc || !editNome.trim()) return;

    try {
      setIsSubmitting(true);
      const updatedDisc = await updateDisciplina(
        editingDisc.id,
        editNome,
        editCodigo || undefined,
        editIsOffGrid,
        editProfessorIds
      );
      showSuccess("Disciplina atualizada com sucesso");
      cancelEdit();
      // refetch to get relations
      fetchDisciplinas();
    } catch (err: any) {
      showError(err.message || "Erro ao atualizar disciplina");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (disc: any) => {
    setEditingDisc(disc);
    setEditNome(disc.name);
    setEditCodigo(disc.code || "");
    setEditIsOffGrid(disc.isOffGrid || false);
    setEditProfessorIds(disc.professores?.map((p: any) => p.id) || []);
  };

  const cancelEdit = () => {
    setEditingDisc(null);
    setEditNome("");
    setEditCodigo("");
    setEditIsOffGrid(false);
    setEditProfessorIds([]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;
    try {
      await deleteDisciplina(id);
      showSuccess(t("toastDeleteSuccess"));
      setDisciplinas(prev => prev.filter(d => d.id !== id));
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
            <BookOpen className="w-8 h-8 text-blue-500" />
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
                <Input
                  label={t("nameLabel")}
                  placeholder={t("namePlaceholder")}
                  value={newNome}
                  onChange={e => setNewNome(e.target.value)}
                  disabled={isSubmitting}
                />
                <Input
                  label={t("codeLabel")}
                  placeholder={t("codePlaceholder")}
                  value={newCodigo}
                  onChange={e => setNewCodigo(e.target.value)}
                  disabled={isSubmitting}
                />
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    id="isOffGrid"
                    checked={isOffGrid}
                    onChange={(e) => setIsOffGrid(e.target.checked)}
                    disabled={isSubmitting}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isOffGrid" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Disciplina EaD / Extra (Ignorar na grade)
                  </label>
                </div>
                
                <div className="space-y-2 max-h-40 overflow-y-auto p-2 border border-slate-200 dark:border-slate-700 rounded-md">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
                    Professores Associados
                  </label>
                  {professores.length === 0 ? (
                    <p className="text-xs text-slate-500">Nenhum professor cadastrado.</p>
                  ) : (
                    professores.map(p => (
                      <div key={p.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`new-prof-${p.id}`}
                          checked={newProfessorIds.includes(p.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewProfessorIds(prev => [...prev, p.id]);
                            } else {
                              setNewProfessorIds(prev => prev.filter(id => id !== p.id));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <label htmlFor={`new-prof-${p.id}`} className="text-sm">{p.name}</label>
                      </div>
                    ))
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || !newNome.trim()}
                >
                  <Plus className="w-4 h-4 mr-2" /> {tCommon("add")}
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
              ) : disciplinas.length === 0 ? (
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
                        placeholder="Pesquisar disciplinas..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {disciplinas
                      .filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.code?.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map(d => (
                    <div
                      key={d.id}
                      className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {d.name}
                        </div>
                        {d.code && (
                          <div className="text-sm text-slate-500">
                            {t("codeDisplay", { code: d.code })}
                          </div>
                        )}
                        {d.isOffGrid && (
                          <div className="text-xs font-semibold text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30 px-2 py-0.5 mt-1 rounded inline-block">
                            EaD / Extra
                          </div>
                        )}
                        {d.professores && d.professores.length > 0 && (
                          <div className="text-xs text-slate-400 mt-1 line-clamp-1">
                            {d.professores.map((p: any) => p.name).join(", ")}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                          onClick={() => startEdit(d)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                          onClick={() => handleDelete(d.id)}
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
        {editingDisc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-md shadow-xl">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Editar Disciplina</h2>
                <form onSubmit={handleUpdate} className="space-y-4">
                  <Input
                    label={t("nameLabel")}
                    placeholder={t("namePlaceholder")}
                    value={editNome}
                    onChange={e => setEditNome(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <Input
                    label={t("codeLabel")}
                    placeholder={t("codePlaceholder")}
                    value={editCodigo}
                    onChange={e => setEditCodigo(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      id="editIsOffGrid"
                      checked={editIsOffGrid}
                      onChange={(e) => setEditIsOffGrid(e.target.checked)}
                      disabled={isSubmitting}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="editIsOffGrid" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Disciplina EaD / Extra (Ignorar na grade)
                    </label>
                  </div>
                  
                  <div className="space-y-2 max-h-40 overflow-y-auto p-2 border border-slate-200 dark:border-slate-700 rounded-md">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
                      Professores Associados
                    </label>
                    {professores.length === 0 ? (
                      <p className="text-xs text-slate-500">Nenhum professor cadastrado.</p>
                    ) : (
                      professores.map(p => (
                        <div key={p.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`edit-prof-${p.id}`}
                            checked={editProfessorIds.includes(p.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditProfessorIds(prev => [...prev, p.id]);
                              } else {
                                setEditProfessorIds(prev => prev.filter(id => id !== p.id));
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <label htmlFor={`edit-prof-${p.id}`} className="text-sm">{p.name}</label>
                        </div>
                      ))
                    )}
                  </div>

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
                      disabled={isSubmitting || !editNome.trim()}
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

export default DisciplinasPage;
