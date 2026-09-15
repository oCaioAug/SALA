"use client";

import { GraduationCap, Plus, Trash2, Search } from "lucide-react";
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
import { useApp } from "@/lib/hooks/useApp";
import { useNavigation } from "@/lib/hooks/useNavigation";

import {
  createProfessor,
  updateProfessor,
  deleteProfessor,
  getOrgUsers,
  getProfessores,
  getDisciplinas,
} from "../actions";

const ProfessoresPage: React.FC = () => {
  const t = useTranslations("GradeHoraria.teachers");
  const tCommon = useTranslations("GradeHoraria.common");
  const [currentPage, setCurrentPage] = useState("grade-horaria-professores");
  const { navigate, isNavigating } = useNavigation({
    currentPage,
    onPageChange: setCurrentPage,
  });
  const { showSuccess, showError } = useApp();

  const [professores, setProfessores] = useState<any[]>([]);
  const [orgUsers, setOrgUsers] = useState<any[]>([]);
  const [disciplinas, setDisciplinas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNome, setNewNome] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newUserId, setNewUserId] = useState("");
  const [newDisciplinaIds, setNewDisciplinaIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingProf, setEditingProf] = useState<any | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editUserId, setEditUserId] = useState("");
  const [editDisciplinaIds, setEditDisciplinaIds] = useState<string[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDisciplinaFilter, setSelectedDisciplinaFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedDisciplinaFilter]);

  const filteredProfessores = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return professores.filter(p => {
      const matchesText =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q);

      const matchesDisciplina =
        !selectedDisciplinaFilter ||
        p.disciplinas?.some((d: any) => d.id === selectedDisciplinaFilter);

      return matchesText && matchesDisciplina;
    });
  }, [professores, searchTerm, selectedDisciplinaFilter]);

  const paginatedProfessores = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProfessores.slice(start, start + pageSize);
  }, [filteredProfessores, page, pageSize]);

  const fetchProfessores = async () => {
    try {
      setLoading(true);
      const [profs, users, discs] = await Promise.all([
        getProfessores(),
        getOrgUsers(),
        getDisciplinas(),
      ]);
      setProfessores(profs);
      setOrgUsers(users);
      setDisciplinas(discs);
    } catch (err: any) {
      showError(err.message || t("toastLoadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNome.trim()) return;

    try {
      setIsSubmitting(true);
      const newProf = await createProfessor(
        newNome,
        newEmail || undefined,
        newUserId || undefined,
        newDisciplinaIds
      );
      showSuccess(t("toastCreateSuccess"));
      setNewNome("");
      setNewEmail("");
      setNewUserId("");
      setNewDisciplinaIds([]);
      
      // refetch to get joined relations easily
      fetchProfessores();
    } catch (err: any) {
      showError(err.message || t("toastCreateError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProf || !editNome.trim()) return;

    try {
      setIsSubmitting(true);
      const updatedProf = await updateProfessor(
        editingProf.id,
        editNome,
        editEmail || undefined,
        editUserId || undefined,
        editDisciplinaIds
      );
      showSuccess("Professor atualizado com sucesso");
      cancelEdit();
      // refetch to get relations
      fetchProfessores();
    } catch (err: any) {
      showError(err.message || "Erro ao atualizar professor");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (prof: any) => {
    setEditingProf(prof);
    setEditNome(prof.name);
    setEditEmail(prof.email || "");
    setEditUserId(prof.userId || "");
    setEditDisciplinaIds(prof.disciplinas?.map((d: any) => d.id) || []);
  };

  const cancelEdit = () => {
    setEditingProf(null);
    setEditNome("");
    setEditEmail("");
    setEditUserId("");
    setEditDisciplinaIds([]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;
    try {
      await deleteProfessor(id);
      showSuccess(t("toastDeleteSuccess"));
      setProfessores(prev => prev.filter(p => p.id !== id));
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
            <GraduationCap className="w-8 h-8 text-blue-500" />
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
                  label={t("emailLabel")}
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  disabled={isSubmitting}
                />

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t("linkUserLabel")}
                  </label>
                  <SearchableSelect
                    value={newUserId}
                    onChange={setNewUserId}
                    options={orgUsers.map(u => ({
                      value: u.id,
                      label: u.name || u.email,
                    }))}
                    placeholder={t("linkUserNone")}
                    allowEmpty
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-slate-500">{t("linkUserHint")}</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Disciplinas Lecionadas
                  </label>
                  <SearchableMultiSelect
                    options={disciplinas.map(d => ({
                      value: d.id,
                      label: d.name,
                    }))}
                    value={newDisciplinaIds}
                    onChange={setNewDisciplinaIds}
                    placeholder="Selecione as disciplinas..."
                    disabled={isSubmitting}
                  />
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
            <CardContent className="p-0 flex flex-col">
              {/* Filters Bar - ALWAYS VISIBLE */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Pesquisar professores..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="w-full sm:w-64">
                  <SearchableSelect
                    options={disciplinas.map(d => ({
                      value: d.id,
                      label: d.name,
                    }))}
                    value={selectedDisciplinaFilter}
                    onChange={setSelectedDisciplinaFilter}
                    placeholder="Todas as disciplinas"
                    allowEmpty
                  />
                </div>
              </div>

              {loading ? (
                <div className="p-8 text-center text-slate-500">
                  {tCommon("loading")}
                </div>
              ) : filteredProfessores.length === 0 ? (
                <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                  <p className="text-slate-600 dark:text-slate-400 font-medium">
                    {professores.length === 0
                      ? t("empty")
                      : "Nenhum professor encontrado para os filtros selecionados."}
                  </p>
                  {(searchTerm || selectedDisciplinaFilter) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedDisciplinaFilter("");
                      }}
                    >
                      Limpar filtros
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col">
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedProfessores.map(p => (
                      <div
                        key={p.id}
                        className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                            {p.name}
                            {p.user && (
                              <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                                {t("linkedBadge")}
                              </span>
                            )}
                          </div>
                          {p.email && (
                            <div className="text-sm text-slate-500">
                              {p.email}
                            </div>
                          )}
                          {p.disciplinas && p.disciplinas.length > 0 && (
                            <div className="text-xs text-slate-400 mt-1 line-clamp-1">
                              {p.disciplinas.map((d: any) => d.name).join(", ")}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                            onClick={() => startEdit(p)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                            onClick={() => handleDelete(p.id)}
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
                      total={filteredProfessores.length}
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
        {editingProf && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-md shadow-xl">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Editar Professor</h2>
                <form onSubmit={handleUpdate} className="space-y-4">
                  <Input
                    label={t("nameLabel")}
                    placeholder={t("namePlaceholder")}
                    value={editNome}
                    onChange={e => setEditNome(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <Input
                    label={t("emailLabel")}
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    disabled={isSubmitting}
                  />

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t("linkUserLabel")}
                    </label>
                    <SearchableSelect
                      value={editUserId}
                      onChange={setEditUserId}
                      options={orgUsers.map(u => ({
                        value: u.id,
                        label: u.name || u.email,
                      }))}
                      placeholder={t("linkUserNone")}
                      allowEmpty
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-slate-500">{t("linkUserHint")}</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Disciplinas Lecionadas
                    </label>
                    <SearchableMultiSelect
                      options={disciplinas.map(d => ({
                        value: d.id,
                        label: d.name,
                      }))}
                      value={editDisciplinaIds}
                      onChange={setEditDisciplinaIds}
                      placeholder="Selecione as disciplinas..."
                      disabled={isSubmitting}
                    />
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

export default ProfessoresPage;
