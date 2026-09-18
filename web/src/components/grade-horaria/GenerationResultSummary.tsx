"use client";

import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useMemo } from "react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

type UnallocatedRequirement = {
  id?: string;
  turmaId: string;
  disciplinaId: string;
  professorId?: string | null;
  requiredSlots: number;
};

type GenerationResultSummaryProps = {
  success: boolean;
  fitness?: number;
  unallocatedRequirements?: UnallocatedRequirement[];
  errors?: string[];
  turmasMap: Record<string, string>;
  discMap: Record<string, string>;
  profMap: Record<string, string>;
  onNavigate: (url: string) => void;
};

export const GenerationResultSummary: React.FC<
  GenerationResultSummaryProps
> = ({
  success,
  fitness = 0,
  unallocatedRequirements,
  errors,
  turmasMap,
  discMap,
  profMap,
  onNavigate,
}) => {
  const t = useTranslations("GradeHoraria.generate");
  const tMenu = useTranslations("GradeHoraria.hub.menu");

  const unallocated = useMemo(
    () =>
      Array.isArray(unallocatedRequirements) ? unallocatedRequirements : [],
    [unallocatedRequirements]
  );
  const errorList = useMemo(
    () => (Array.isArray(errors) ? errors : []),
    [errors]
  );

  if (success) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/50 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/20">
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3">
            <div className="shrink-0 rounded-full bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                {t("perfectTitle")}
              </h3>
              <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-400">
                {t("fitnessScore", { score: fitness.toFixed(1) })}
              </p>
            </div>
          </div>
          <CalendarCheck className="hidden h-6 w-6 text-emerald-600 sm:block dark:text-emerald-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-300 bg-amber-50/40 shadow-sm dark:border-amber-800/60 dark:bg-amber-950/15">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3.5">
            <div className="mt-0.5 shrink-0 rounded-xl bg-amber-100 p-2.5 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                {t("partialTitle")}
              </h4>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                {t("toastPartial")}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 gap-2 sm:pt-0.5">
            <div className="min-w-[7.5rem] rounded-lg border border-amber-200/80 bg-white/70 px-3 py-2 text-center dark:border-amber-800/50 dark:bg-slate-950/40">
              <p className="text-[10px] font-medium uppercase tracking-wider text-amber-700/80 dark:text-amber-400/80">
                Fitness
              </p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-amber-900 dark:text-amber-200">
                {fitness.toFixed(1)}%
              </p>
            </div>
            {unallocated.length > 0 && (
              <div className="min-w-[7.5rem] rounded-lg border border-red-200/80 bg-white/70 px-3 py-2 text-center dark:border-red-900/50 dark:bg-slate-950/40">
                <p className="text-[10px] font-medium uppercase tracking-wider text-red-700/80 dark:text-red-400/80">
                  {t("unallocatedTitle").replace(/:$/, "")}
                </p>
                <p className="mt-0.5 text-lg font-semibold tabular-nums text-red-700 dark:text-red-300">
                  {unallocated.length}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-2 border-t border-amber-200/60 pt-4 dark:border-amber-900/40">
          {unallocated.map((req, i) => {
            const className = turmasMap[req.turmaId] || req.turmaId;
            const subjectName = discMap[req.disciplinaId] || req.disciplinaId;
            const teacherName = req.professorId
              ? profMap[req.professorId] || "—"
              : "—";

            return (
              <div
                key={req.id || `${req.turmaId}-${req.disciplinaId}-${i}`}
                className="flex flex-col gap-3 rounded-lg border border-border/70 bg-card/90 p-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {className}
                        <span className="mx-1.5 font-normal text-muted-foreground">
                          ·
                        </span>
                        {subjectName}
                      </p>
                      <span className="inline-flex items-center rounded-md bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-900 dark:bg-amber-900/50 dark:text-amber-200">
                        {t("unallocatedItem", {
                          className: "",
                          subjectName: "",
                          teacherName: "",
                          count: req.requiredSlots,
                        })
                          .split(":")
                          .pop()
                          ?.trim() || `${req.requiredSlots}`}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{teacherName}</p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2 self-end sm:self-center">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 border-border bg-background text-xs font-medium shadow-xs hover:bg-accent hover:text-accent-foreground"
                    onClick={() => onNavigate("/grade-horaria/cargas")}
                  >
                    {tMenu("loads.title")}
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 border-border bg-background text-xs font-medium shadow-xs hover:bg-accent hover:text-accent-foreground"
                    onClick={() =>
                      onNavigate("/grade-horaria/disponibilidades")
                    }
                  >
                    {tMenu("availability.title")}
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}

          {errorList.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                {t("errorsTitle")}
              </p>
              {errorList.map((err, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-red-200 bg-red-50/70 p-3 text-xs text-slate-700 dark:border-red-900/50 dark:bg-red-950/25 dark:text-slate-300"
                >
                  {err}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
