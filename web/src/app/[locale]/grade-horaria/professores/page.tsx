"use client";

import { GraduationCap, Plus, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";

import { OrgAdminGuard } from "@/components/auth/OrgAdminGuard";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useApp } from "@/lib/hooks/useApp";
import { useNavigation } from "@/lib/hooks/useNavigation";

import {
  createProfessor,
  deleteProfessor,
  getOrgUsers,
  getProfessores,
} from "../actions";

const ProfessoresPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState("grade-horaria");
  const { navigate, isNavigating } = useNavigation({
    currentPage,
    onPageChange: setCurrentPage,
  });
  const { showSuccess, showError } = useApp();

  const [professores, setProfessores] = useState<any[]>([]);
  const [orgUsers, setOrgUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNome, setNewNome] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newUserId, setNewUserId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProfessores = async () => {
    try {
      setLoading(true);
      const [profs, users] = await Promise.all([
        getProfessores(),
        getOrgUsers(),
      ]);
      setProfessores(profs);
      setOrgUsers(users);
    } catch (err: any) {
      showError(err.message || "Erro ao carregar professores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessores();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNome.trim()) return;

    try {
      setIsSubmitting(true);
      const newProf = await createProfessor(
        newNome,
        newEmail || undefined,
        newUserId || undefined
      );
      showSuccess("Professor adicionado com sucesso!");
      setNewNome("");
      setNewEmail("");
      setNewUserId("");
      setProfessores(prev =>
        [...prev, newProf].sort((a, b) => a.name.localeCompare(b.name))
      );
    } catch (err: any) {
      showError(err.message || "Erro ao adicionar professor");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Tem certeza que deseja excluir este professor? Todas as cargas horárias e disponibilidades associadas serão perdidas."
      )
    )
      return;
    try {
      await deleteProfessor(id);
      showSuccess("Professor excluído com sucesso!");
      setProfessores(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      showError(err.message || "Erro ao excluir professor");
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
                Professores
              </h1>
              <p className="text-slate-600 dark:text-gray-400">
                Cadastre os professores que serão alocados na grade horária.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/grade-horaria")}>
            Voltar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Form */}
          <Card className="md:col-span-1">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Novo Professor</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <Input
                  label="Nome do Professor"
                  placeholder="Ex: João da Silva"
                  value={newNome}
                  onChange={e => setNewNome(e.target.value)}
                  disabled={isSubmitting}
                />
                <Input
                  label="E-mail (Opcional)"
                  type="email"
                  placeholder="Ex: joao@escola.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  disabled={isSubmitting}
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Vincular a Usuário (Opcional)
                  </label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    value={newUserId}
                    onChange={e => setNewUserId(e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="">Não vincular...</option>
                    {orgUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name || u.email}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500">
                    Se vinculado, o professor poderá fazer login no sistema no
                    futuro.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || !newNome.trim()}
                >
                  <Plus className="w-4 h-4 mr-2" /> Adicionar
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* List */}
          <Card className="md:col-span-2">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-slate-500">
                  Carregando...
                </div>
              ) : professores.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  Nenhum professor cadastrado.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {professores.map(p => (
                    <div
                      key={p.id}
                      className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                          {p.name}
                          {p.user && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                              Vinculado
                            </span>
                          )}
                        </div>
                        {p.email && (
                          <div className="text-sm text-slate-500">
                            {p.email}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={() => handleDelete(p.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    </OrgAdminGuard>
  );
};

export default ProfessoresPage;
