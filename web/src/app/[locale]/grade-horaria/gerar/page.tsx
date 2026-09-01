"use client";

import { AlertTriangle, CalendarCheck, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";

import { OrgAdminGuard } from "@/components/auth/OrgAdminGuard";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { useApp } from "@/lib/hooks/useApp";
import { useNavigation } from "@/lib/hooks/useNavigation";

import {
  getDisciplinas,
  getGradeSettings,
  getProfessores,
  getTurmas,
  runTimetablingEngine,
} from "../actions";

const DAY_IDS = [1, 2, 3, 4, 5] as const;

const GerarGradePage: React.FC = () => {
  const t = useTranslations("GradeHoraria.generate");
  const tCommon = useTranslations("GradeHoraria.common");
  const [currentPage, setCurrentPage] = useState("grade-horaria");
  const { navigate, isNavigating } = useNavigation({
    currentPage,
    onPageChange: setCurrentPage,
  });
  const { showSuccess, showError } = useApp();

  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [turmasMap, setTurmasMap] = useState<Record<string, string>>({});
  const [turmaShiftsMap, setTurmaShiftsMap] = useState<Record<string, string>>(
    {}
  );
  const [discMap, setDiscMap] = useState<Record<string, string>>({});
  const [profMap, setProfMap] = useState<Record<string, string>>({});
  const [shifts, setShifts] = useState<any[]>([]);

  useEffect(() => {
    const fetchDictionaries = async () => {
      try {
        const [turmas, disc, profs, settings] = await Promise.all([
          getTurmas(),
          getDisciplinas(),
          getProfessores(),
          getGradeSettings(),
        ]);

        const tMap: Record<string, string> = {};
        const tsMap: Record<string, string> = {};
        turmas.forEach(turma => {
          tMap[turma.id] = turma.name;
          if (turma.shiftId) tsMap[turma.id] = turma.shiftId;
        });
        setTurmasMap(tMap);
        setTurmaShiftsMap(tsMap);

        const dMap: Record<string, string> = {};
        disc.forEach(d => (dMap[d.id] = d.name));
        setDiscMap(dMap);

        const pMap: Record<string, string> = {};
        profs.forEach(p => (pMap[p.id] = p.name));
        setProfMap(pMap);

        setShifts(settings.timetabling?.shifts || []);
      } catch (err) {
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
        showSuccess(t("toastSuccess"));
      } else {
        showError(t("toastPartial"));
      }
    } catch (err: any) {
      showError(err.message || t("toastError"));
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
  const sortedTurmaIds = Object.keys(grouped).sort((a, b) =>
    (turmasMap[a] || "").localeCompare(turmasMap[b] || "")
  );

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

        <Card className="mb-8 text-center bg-card border-2">
          <CardContent className="p-12">
            <div className="max-w-xl mx-auto space-y-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full inline-block">
                <Play className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-semibold">{t("readyTitle")}</h2>
              <p className="text-slate-500">{t("readyDescription")}</p>
              <Button
                size="lg"
                className="w-full text-lg h-14"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? t("processing") : t("runButton")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Resumo */}
            <Card
              className={
                result.success
                  ? "border-green-200 bg-green-50 dark:bg-green-900/10"
                  : "border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10"
              }
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {result.success ? (
                    <CalendarCheck className="w-8 h-8 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-8 h-8 text-yellow-600" />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {result.success ? t("perfectTitle") : t("partialTitle")}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                      {t("fitnessScore", {
                        score: result.fitness.toFixed(1),
                      })}
                    </p>
                    {result.unallocatedRequirements && (
                      <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded border border-yellow-200">
                        <p className="font-semibold text-yellow-700 dark:text-yellow-500 mb-2">
                          {t("unallocatedTitle")}
                        </p>
                        <ul className="list-disc list-inside text-sm text-slate-700 dark:text-slate-300">
                          {result.unallocatedRequirements.map(
                            (req: any, i: number) => (
                              <li key={i}>
                                {t("unallocatedItem", {
                                  className: turmasMap[req.turmaId],
                                  subjectName: discMap[req.disciplinaId],
                                  teacherName: profMap[req.professorId],
                                  count: req.requiredSlots,
                                })}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                    {result.errors && (
                      <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded border border-red-200">
                        <p className="font-semibold text-red-700 dark:text-red-500 mb-2">
                          {t("errorsTitle")}
                        </p>
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
            <h3 className="text-2xl font-bold mt-8 mb-4">
              {t("schedulesByClass")}
            </h3>
            {sortedTurmaIds.map(turmaId => {
              const shiftId = turmaShiftsMap[turmaId];
              const shift = shifts.find(s => s.id === shiftId) || shifts[0];
              const shiftSlots = shift?.slots || [];
              const days = DAY_IDS.slice(0, shift?.daysPerWeek || 5);

              return (
                <Card key={turmaId} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 border-b dark:border-slate-800 flex items-center gap-2">
                      <CardTitle className="text-lg">
                        {turmasMap[turmaId]}
                      </CardTitle>
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
                            <th className="py-3 px-4 font-semibold text-slate-500">
                              {t("timeColumn")}
                            </th>
                            {days.map(diaId => (
                              <th
                                key={diaId}
                                className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 border-l dark:border-slate-800"
                              >
                                {tCommon(`days.${diaId}`)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-slate-800">
                          {shiftSlots.map((slot: any) => (
                            <tr
                              key={slot.id}
                              className="bg-white dark:bg-slate-900"
                            >
                              <td className="py-4 px-4 text-slate-500 font-medium whitespace-nowrap">
                                {slot.label}
                              </td>
                              {days.map(diaId => {
                                const timeSlotStr = `${diaId}_${slot.id}`;
                                const classInfo = grouped[turmaId][timeSlotStr];
                                return (
                                  <td
                                    key={diaId}
                                    className="p-2 border-l dark:border-slate-800"
                                  >
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
                                      <div className="text-slate-300 dark:text-slate-700 italic">
                                        -
                                      </div>
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
