"use client";

import React, { useEffect, useState } from "react";
import { Clock, Plus, Trash2 } from "lucide-react";

import { OrgAdminGuard } from "@/components/auth/OrgAdminGuard";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useNavigation } from "@/lib/hooks/useNavigation";
import { useApp } from "@/lib/hooks/useApp";

import {
  getCargasHorarias,
  createCargaHoraria,
  deleteCargaHoraria,
  getTurmas,
  getDisciplinas,
  getProfessores,
} from "../actions";

const CargasHorariasPage: React.FC = () => {
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
      showError(err.message || "Erro ao carregar os dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turmaId || !disciplinaId || !professorId || quantidadeAulas <= 0)
      return;

    try {
      setIsSubmitting(true);
      const newCarga = await createCargaHoraria(
        turmaId,
        disciplinaId,
        professorId,
        Number(quantidadeAulas)
      );
      showSuccess("Carga horária vinculada com sucesso!");

      // Reset form (keep turma/disciplina to make multiple entries easier)
      setQuantidadeAulas(1);

      // Update with all relations for the UI
      const turma = turmas.find(t => t.id === turmaId);
      const disciplina = disciplinas.find(d => d.id === disciplinaId);
      const professor = professores.find(p => p.id === professorId);
      setCargas(prev => [
        ...prev,
        { ...newCarga, turma, disciplina, professor },
      ]);
    } catch (err: any) {
      showError(err.message || "Erro ao vincular carga horária");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta carga horária?")) return;
    try {
      await deleteCargaHoraria(id);
      showSuccess("Carga horária excluída com sucesso!");
      setCargas(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      showError(err.message || "Erro ao excluir carga horária");
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
                Cargas Horárias
              </h1>
              <p className="text-slate-600 dark:text-gray-400">
                Associe Turmas, Disciplinas e Professores com suas respectivas
                aulas por semana.
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
              <h2 className="text-xl font-semibold mb-4">Nova Carga Horária</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Turma
                  </label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    value={turmaId}
                    onChange={e => setTurmaId(e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="">Selecione a turma...</option>
                    {turmas.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Disciplina
                  </label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    value={disciplinaId}
                    onChange={e => setDisciplinaId(e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="">Selecione a disciplina...</option>
                    {disciplinas.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Professor
                  </label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    value={professorId}
                    onChange={e => setProfessorId(e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="">Selecione o professor...</option>
                    {professores.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Aulas por Semana"
                  type="number"
                  min="1"
                  max="40"
                  value={quantidadeAulas}
                  onChange={e => setQuantidadeAulas(Number(e.target.value))}
                  disabled={isSubmitting}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    isSubmitting ||
                    !turmaId ||
                    !disciplinaId ||
                    !professorId ||
                    quantidadeAulas <= 0
                  }
                >
                  <Plus className="w-4 h-4 mr-2" /> Vincular Carga
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
              ) : cargas.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  Nenhuma carga horária vinculada.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {cargas.map(c => (
                    <div
                      key={c.id}
                      className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {c.turma.name} - {c.disciplina.name}
                        </div>
                        <div className="text-sm text-slate-500 flex gap-4 mt-1">
                          <span>Professor: {c.professor.name}</span>
                          <span>
                            {c.quantidadeAulas}{" "}
                            {c.quantidadeAulas > 1 ? "aulas" : "aula"}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={() => handleDelete(c.id)}
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

export default CargasHorariasPage;
