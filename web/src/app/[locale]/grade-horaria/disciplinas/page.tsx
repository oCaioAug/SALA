"use client";

import React, { useEffect, useState } from "react";
import { BookOpen, Plus, Trash2 } from "lucide-react";

import { OrgAdminGuard } from "@/components/auth/OrgAdminGuard";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useNavigation } from "@/lib/hooks/useNavigation";
import { useApp } from "@/lib/hooks/useApp";

import { getDisciplinas, createDisciplina, deleteDisciplina } from "../actions";

const DisciplinasPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState("grade-horaria");
  const { navigate, isNavigating } = useNavigation({
    currentPage,
    onPageChange: setCurrentPage,
  });
  const { showSuccess, showError } = useApp();

  const [disciplinas, setDisciplinas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNome, setNewNome] = useState("");
  const [newCodigo, setNewCodigo] = useState("");
  const [isOffGrid, setIsOffGrid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDisciplinas = async () => {
    try {
      setLoading(true);
      const data = await getDisciplinas();
      setDisciplinas(data);
    } catch (err: any) {
      showError(err.message || "Erro ao carregar disciplinas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisciplinas();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNome.trim()) return;

    try {
      setIsSubmitting(true);
      const newDisc = await createDisciplina(newNome, newCodigo || undefined, isOffGrid);
      showSuccess("Disciplina criada com sucesso!");
      setNewNome("");
      setNewCodigo("");
      setIsOffGrid(false);
      setDisciplinas(prev => [...prev, newDisc].sort((a,b) => a.name.localeCompare(b.name)));
    } catch (err: any) {
      showError(err.message || "Erro ao criar disciplina");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta disciplina?")) return;
    try {
      await deleteDisciplina(id);
      showSuccess("Disciplina excluída com sucesso!");
      setDisciplinas(prev => prev.filter(d => d.id !== id));
    } catch (err: any) {
      showError(err.message || "Erro ao excluir disciplina");
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
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Disciplinas
              </h1>
              <p className="text-slate-600 dark:text-gray-400">
                Gerencie as matérias e disciplinas ofertadas pela instituição.
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
              <h2 className="text-xl font-semibold mb-4">Nova Disciplina</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <Input
                  label="Nome da Disciplina"
                  placeholder="Ex: Matemática"
                  value={newNome}
                  onChange={(e) => setNewNome(e.target.value)}
                  disabled={isSubmitting}
                />
                <Input
                  label="Código (Opcional)"
                  placeholder="Ex: MAT01"
                  value={newCodigo}
                  onChange={(e) => setNewCodigo(e.target.value)}
                  disabled={isSubmitting}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isOffGrid"
                    checked={isOffGrid}
                    onChange={(e) => setIsOffGrid(e.target.checked)}
                    disabled={isSubmitting}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor="isOffGrid" className="text-sm text-slate-700 dark:text-slate-300">
                    Matéria EaD / Estágio (Fora da grade presencial)
                  </label>
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting || !newNome.trim()}>
                  <Plus className="w-4 h-4 mr-2" /> Adicionar
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* List */}
          <Card className="md:col-span-2">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-slate-500">Carregando...</div>
              ) : disciplinas.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  Nenhuma disciplina cadastrada.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {disciplinas.map((d) => (
                    <div key={d.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {d.name}
                        </div>
                        {d.code && (
                          <div className="text-sm text-slate-500">Código: {d.code}</div>
                        )}
                        {d.isOffGrid && (
                          <div className="text-xs font-semibold text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30 px-2 py-0.5 mt-1 rounded inline-block">
                            EaD / Extra
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={() => handleDelete(d.id)}
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

export default DisciplinasPage;
