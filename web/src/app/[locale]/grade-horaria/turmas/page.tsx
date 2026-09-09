"use client";

import { Users, Plus, Trash2, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";

import { OrgAdminGuard } from "@/components/auth/OrgAdminGuard";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useApp } from "@/lib/hooks/useApp";
import { useNavigation } from "@/lib/hooks/useNavigation";

import {
  getTurmas,
  createTurma,
  updateTurma,
  deleteTurma,
  getGradeSettings,
  getSectors,
} from "../actions";

const TurmasPage: React.FC = () => {
  const t = useTranslations("GradeHoraria.classes");
  const tCommon = useTranslations("GradeHoraria.common");
  const [currentPage, setCurrentPage] = useState("grade-horaria");
  const { navigate, isNavigating } = useNavigation({
    currentPage,
    onPageChange: setCurrentPage,
  });
  const { showSuccess, showError } = useApp();

  const [turmas, setTurmas] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTurmaName, setNewTurmaName] = useState("");
  const [newTurmaShift, setNewTurmaShift] = useState("");
  const [newSectorId, setNewSectorId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingTurma, setEditingTurma] = useState<any | null>(null);
  const [editTurmaName, setEditTurmaName] = useState("");
  const [editTurmaShift, setEditTurmaShift] = useState("");
  const [editSectorId, setEditSectorId] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tData, settings, sData] = await Promise.all([
        getTurmas(),
        getGradeSettings(),
        getSectors(),
      ]);
      setTurmas(tData);
      setSectors(sData);

      const loadedShifts = settings.timetabling.shifts || [];
      setShifts(loadedShifts);
      if (loadedShifts.length > 0) {
        setNewTurmaShift(loadedShifts[0].id);
      }
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
    if (!newTurmaName.trim() || !newTurmaShift) return;

    try {
      setIsSubmitting(true);
      const newTurma = await createTurma(newTurmaName, newTurmaShift, newSectorId || undefined);
      showSuccess(t("toastCreateSuccess"));
      setNewTurmaName("");
      setNewSectorId("");
      fetchData(); // to get relations
    } catch (err: any) {
      showError(err.message || t("toastCreateError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTurma || !editTurmaName.trim() || !editTurmaShift) return;

    try {
      setIsSubmitting(true);
      const updatedTurma = await updateTurma(
        editingTurma.id,
        editTurmaName,
        editTurmaShift,
        editSectorId || undefined
      );
      showSuccess("Turma atualizada com sucesso");
      setEditingTurma(null);
      setEditTurmaName("");
      setEditTurmaShift("");
      setEditSectorId("");
      fetchData(); // update list
    } catch (err: any) {
      showError(err.message || "Erro ao atualizar turma");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (turma: any) => {
    setEditingTurma(turma);
    setEditTurmaName(turma.name);
    setEditTurmaShift(turma.shiftId || (shifts.length > 0 ? shifts[0].id : ""));
    setEditSectorId(turma.sectorId || "");
  };

  const cancelEdit = () => {
    setEditingTurma(null);
    setEditTurmaName("");
    setEditTurmaShift("");
    setEditSectorId("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;
    try {
      await deleteTurma(id);
      showSuccess(t("toastDeleteSuccess"));
      setTurmas(prev => prev.filter(t => t.id !== id));
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
            <Users className="w-8 h-8 text-blue-500" />
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
                  value={newTurmaName}
                  onChange={e => setNewTurmaName(e.target.value)}
                  disabled={isSubmitting}
                />
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    {t("shiftLabel")}
                  </label>
                  <select
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900"
                    value={newTurmaShift}
                    onChange={e => setNewTurmaShift(e.target.value)}
                    disabled={isSubmitting || shifts.length === 0}
                  >
                    {shifts.length === 0 && (
                      <option value="">{t("noShifts")}</option>
                    )}
                    {shifts.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Curso / Setor
                  </label>
                  <select
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900"
                    value={newSectorId}
                    onChange={e => setNewSectorId(e.target.value)}
                    disabled={isSubmitting || sectors.length === 0}
                  >
                    <option value="">-- Nenhum Setor Vinculado --</option>
                    {sectors.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    isSubmitting || !newTurmaName.trim() || !newTurmaShift
                  }
                >
                  <Plus className="w-4 h-4 mr-2" /> {t("addButton")}
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
              ) : turmas.length === 0 ? (
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
                        placeholder="Pesquisar turmas..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {turmas
                      .filter(turma => turma.name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map(turma => (
                    <div
                      key={turma.id}
                      className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                        {turma.name}
                        {turma.shiftId && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300">
                            {shifts.find(s => s.id === turma.shiftId)?.name ||
                              turma.shiftId}
                          </span>
                        )}
                        {turma.sector && (
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full dark:bg-indigo-900 dark:text-indigo-300">
                            {turma.sector.name}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                          onClick={() => startEdit(turma)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                          onClick={() => handleDelete(turma.id)}
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
        {editingTurma && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-md shadow-xl">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Editar Turma</h2>
                <form onSubmit={handleUpdate} className="space-y-4">
                  <Input
                    label={t("nameLabel")}
                    placeholder={t("namePlaceholder")}
                    value={editTurmaName}
                    onChange={e => setEditTurmaName(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">
                      {t("shiftLabel")}
                    </label>
                    <select
                      className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900"
                      value={editTurmaShift}
                      onChange={e => setEditTurmaShift(e.target.value)}
                      disabled={isSubmitting || shifts.length === 0}
                    >
                      {shifts.length === 0 && (
                        <option value="">{t("noShifts")}</option>
                      )}
                      {shifts.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">
                      Curso / Setor
                    </label>
                    <select
                      className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900"
                      value={editSectorId}
                      onChange={e => setEditSectorId(e.target.value)}
                      disabled={isSubmitting || sectors.length === 0}
                    >
                      <option value="">-- Nenhum Setor Vinculado --</option>
                      {sectors.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
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
                      disabled={
                        isSubmitting || !editTurmaName.trim() || !editTurmaShift
                      }
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

export default TurmasPage;
