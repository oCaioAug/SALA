"use client";

import React, { useEffect, useState } from "react";
import { Play, CalendarCheck, AlertTriangle } from "lucide-react";

import { OrgAdminGuard } from "@/components/auth/OrgAdminGuard";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { useNavigation } from "@/lib/hooks/useNavigation";
import { useApp } from "@/lib/hooks/useApp";

import { runTimetablingEngine, getTurmas, getDisciplinas, getProfessores, getGradeSettings } from "../actions";

const DIAS_SEMANA = [
  { id: 1, nome: "Segunda" },
  { id: 2, nome: "Terça" },
  { id: 3, nome: "Quarta" },
  { id: 4, nome: "Quinta" },
  { id: 5, nome: "Sexta" },
];

const GerarGradePage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState("grade-horaria");
  const { navigate, isNavigating } = useNavigation({
    currentPage,
    onPageChange: setCurrentPage,
  });
  const { showSuccess, showError } = useApp();

  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [turmasMap, setTurmasMap] = useState<Record<string, string>>({});
  const [turmaShiftsMap, setTurmaShiftsMap] = useState<Record<string, string>>({});
  const [discMap, setDiscMap] = useState<Record<string, string>>({});
  const [profMap, setProfMap] = useState<Record<string, string>>({});
  const [shifts, setShifts] = useState<any[]>([]);

  useEffect(() => {
    const fetchDictionaries = async () => {
      try {
        const [turmas, disc, profs, settings] = await Promise.all([
          getTurmas(), getDisciplinas(), getProfessores(), getGradeSettings()
        ]);
        
        const tMap: Record<string, string> = {};
        const tsMap: Record<string, string> = {};
        turmas.forEach(t => {
          tMap[t.id] = t.name;
          if (t.shiftId) tsMap[t.id] = t.shiftId;
        });
        setTurmasMap(tMap);
        setTurmaShiftsMap(tsMap);

        const dMap: Record<string, string> = {};
        disc.forEach(d => dMap[d.id] = d.name);
        setDiscMap(dMap);

        const pMap: Record<string, string> = {};
        profs.forEach(p => pMap[p.id] = p.name);
        setProfMap(pMap);
        
        setShifts(settings.timetabling?.shifts || []);
      } catch(err) {
        console.error("Erro ao carregar dicionários", err);
      }
    };
    fetchDictionaries();
  }, []);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setResult(null);
      
      const res = await runTimetablingEngine();
      setResult(res);
      
      if (res.success) {
        showSuccess("Grade gerada com sucesso!");
      } else {
        showError("Grade gerada com restrições (algumas aulas não alocadas).");
      }
    } catch (err: any) {
      showError(err.message || "Erro ao gerar grade");
    } finally {
      setIsGenerating(false);
    }
  };

  // Agrupa os resultados por Turma
  // output: { [turmaId]: Record<string, ScheduledClass> }
  const groupByTurma = () => {
    if (!result?.schedule || !Array.isArray(result.schedule)) return {};
    
    const groups: Record<string, Record<string, any>> = {};
    result.schedule.forEach((c: any) => {
      if (!groups[c.turmaId]) groups[c.turmaId] = {};
      groups[c.turmaId][c.timeSlot] = c;
    });
    return groups;
  };

  const grouped = groupByTurma();
  const sortedTurmaIds = Object.keys(grouped).sort((a, b) => (turmasMap[a] || "").localeCompare(turmasMap[b] || ""));

  return (
    <OrgAdminGuard>
      <PageLayout
        currentPage={currentPage}
        onNavigate={navigate}
        isNavigating={isNavigating}
      >
        <div className="mb-8 flex justify-between items-end">
          <div className="flex items-center gap-3">
            <CalendarCheck className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Gerar Grade Horária
              </h1>
              <p className="text-slate-600 dark:text-gray-400">
                Execute o motor de alocação para distribuir as aulas baseadas nas disponibilidades.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/grade-horaria")}>
            Voltar
          </Button>
        </div>

        <Card className="mb-8 text-center bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-2">
          <CardContent className="p-12">
            <div className="max-w-xl mx-auto space-y-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full inline-block">
                <Play className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-semibold">Pronto para gerar?</h2>
              <p className="text-slate-500">
                O motor irá analisar todas as cargas horárias e disponibilidades para criar a melhor grade possível sem conflitos.
              </p>
              <Button 
                size="lg" 
                className="w-full text-lg h-14" 
                onClick={handleGenerate} 
                disabled={isGenerating}
              >
                {isGenerating ? "Processando Algoritmo..." : "Executar Motor de Alocação"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Resumo */}
            <Card className={result.success ? "border-green-200 bg-green-50 dark:bg-green-900/10" : "border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10"}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {result.success ? (
                    <CalendarCheck className="w-8 h-8 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-8 h-8 text-yellow-600" />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {result.success ? "Alocação Perfeita!" : "Alocação Parcial"}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                      Fitness Score: <strong>{result.fitness.toFixed(1)}%</strong>
                    </p>
                    {result.unallocatedRequirements && (
                      <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded border border-yellow-200">
                        <p className="font-semibold text-yellow-700 dark:text-yellow-500 mb-2">Cargas não alocadas:</p>
                        <ul className="list-disc list-inside text-sm text-slate-700 dark:text-slate-300">
                          {result.unallocatedRequirements.map((req: any, i: number) => (
                            <li key={i}>
                              {turmasMap[req.turmaId]} - {discMap[req.disciplinaId]} ({profMap[req.professorId]}): Faltam {req.requiredSlots} aulas
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.errors && (
                      <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded border border-red-200">
                        <p className="font-semibold text-red-700 dark:text-red-500 mb-2">Erros de Restrição:</p>
                        <ul className="list-disc list-inside text-sm text-slate-700 dark:text-slate-300">
                          {result.errors.map((err: string, i: number) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Visualização da Grade por Turma */}
            <h3 className="text-2xl font-bold mt-8 mb-4">Grades por Turma</h3>
            {sortedTurmaIds.map(turmaId => {
              const shiftId = turmaShiftsMap[turmaId];
              const shift = shifts.find(s => s.id === shiftId) || shifts[0];
              const shiftSlots = shift?.slots || [];
              const days = DIAS_SEMANA.slice(0, shift?.daysPerWeek || 5);

              return (
                <Card key={turmaId} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 border-b dark:border-slate-800 flex items-center gap-2">
                      <CardTitle className="text-lg">{turmasMap[turmaId]}</CardTitle>
                      {shift && (
                        <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full dark:bg-slate-800 dark:text-slate-300">
                          {shift.name}
                        </span>
                      )}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-center">
                        <thead className="bg-white dark:bg-slate-950 border-b dark:border-slate-800">
                          <tr>
                            <th className="py-3 px-4 font-semibold text-slate-500">Horário</th>
                            {days.map(dia => (
                              <th key={dia.id} className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 border-l dark:border-slate-800">
                                {dia.nome}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-slate-800">
                          {shiftSlots.map((slot: any) => (
                            <tr key={slot.id} className="bg-white dark:bg-slate-900">
                              <td className="py-4 px-4 text-slate-500 font-medium whitespace-nowrap">
                                {slot.label}
                              </td>
                              {days.map((dia) => {
                                const timeSlotStr = `${dia.id}_${slot.id}`;
                                const classInfo = grouped[turmaId][timeSlotStr];
                                return (
                                  <td key={dia.id} className="p-2 border-l dark:border-slate-800">
                                    {classInfo ? (
                                      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded p-2 shadow-sm min-h-[4rem] flex flex-col items-center justify-center">
                                        <span className="font-semibold text-blue-900 dark:text-blue-100">
                                          {discMap[classInfo.disciplinaId]}
                                        </span>
                                        <span className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                          {profMap[classInfo.professorId]}
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="text-slate-300 dark:text-slate-700 italic">-</div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </PageLayout>
    </OrgAdminGuard>
  );
};

export default GerarGradePage;
