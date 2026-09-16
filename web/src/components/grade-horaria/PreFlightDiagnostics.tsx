"use client";

import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  GraduationCap,
  Users,
} from "lucide-react";
import React, { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { GradeHorariaDiagnosticsResult } from "@/domain/timetabling/GradeHorariaDiagnosticsService";

interface PreFlightDiagnosticsProps {
  diagnostics: GradeHorariaDiagnosticsResult | null;
  loading?: boolean;
  onNavigate: (url: string) => void;
}

export const PreFlightDiagnostics: React.FC<PreFlightDiagnosticsProps> = ({
  diagnostics,
  loading = false,
  onNavigate,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (loading) {
    return (
      <Card className="mb-6 border-dashed animate-pulse">
        <CardContent className="p-4 flex items-center gap-3 text-sm text-slate-500">
          <Clock className="w-4 h-4 animate-spin text-blue-500" />
          <span>Verificando integridade das turmas, professores e disciplinas...</span>
        </CardContent>
      </Card>
    );
  }

  if (!diagnostics) return null;

  if (!diagnostics.hasIssues) {
    return (
      <Card className="mb-6 border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm">
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                Diagnóstico Preventivo: Tudo pronto para gerar a grade!
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                Todas as turmas respeitam a capacidade do turno, as disciplinas possuem docentes habilitados e não há professores sem matéria.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
            100% Consistente
          </span>
        </CardContent>
      </Card>
    );
  }

  const errorsCount = diagnostics.alerts.filter(a => a.severity === "error").length;
  const warningsCount = diagnostics.alerts.filter(a => a.severity === "warning").length;

  return (
    <Card className="mb-6 border-amber-300 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/15 shadow-sm transition-all">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Diagnóstico Preventivo: Atenção antes de gerar a grade
                </h4>
                <div className="flex items-center gap-1.5">
                  {errorsCount > 0 && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                      {errorsCount} {errorsCount === 1 ? "crítico" : "críticos"}
                    </span>
                  )}
                  {warningsCount > 0 && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      {warningsCount} {warningsCount === 1 ? "alerta" : "alertas"}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Foram identificados pontos que podem causar horários incompletos ou impossibilidade de alocação no algoritmo:
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 shrink-0"
            aria-label={isExpanded ? "Recolher diagnósticos" : "Expandir diagnósticos"}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-amber-200/60 dark:border-amber-900/40 space-y-2.5">
            {diagnostics.alerts.map(alert => {
              const isError = alert.severity === "error";

              return (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-lg border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isError
                      ? "bg-red-50/70 dark:bg-red-950/25 border-red-200 dark:border-red-900/50"
                      : "bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {alert.category === "turma_overload" && (
                        <Users className="w-4 h-4 text-red-600 dark:text-red-400" />
                      )}
                      {alert.category === "discipline_no_teacher" && (
                        <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      )}
                      {alert.category === "teacher_no_discipline" && (
                        <GraduationCap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>{alert.title}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        {alert.description}
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={isError ? "destructive" : "outline"}
                    className="shrink-0 h-8 text-xs font-medium self-end sm:self-center"
                    onClick={() => onNavigate(alert.linkUrl)}
                  >
                    {alert.linkLabel}
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
