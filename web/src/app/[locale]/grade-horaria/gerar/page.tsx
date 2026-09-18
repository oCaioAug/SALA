"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CalendarCheck, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";

import { OrgAdminGuard } from "@/components/auth/OrgAdminGuard";
import { ExportScheduleDropdown } from "@/components/grade-horaria/ExportScheduleDropdown";
import { GenerationResultSummary } from "@/components/grade-horaria/GenerationResultSummary";
import { PreFlightDiagnostics } from "@/components/grade-horaria/PreFlightDiagnostics";
import { PageLayout } from "@/components/layout/PageLayout";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  GradeHorariaDiagnosticsResult,
  GradeHorariaDiagnosticsService,
} from "@/domain/timetabling/GradeHorariaDiagnosticsService";
import { useApp } from "@/lib/hooks/useApp";
import { useNavigation } from "@/lib/hooks/useNavigation";

import {
  getCargasHorarias,
  getDisciplinas,
  getGradeSettings,
  getLatestGradeHoraria,
  getProfessores,
  getTurmas,
  runTimetablingEngine,
} from "../actions";

const DAY_IDS = [1, 2, 3, 4, 5] as const;

const GerarGradePage: React.FC = () => {
  const t = useTranslations("GradeHoraria.generate");
  const tCommon = useTranslations("GradeHoraria.common");
  const [currentPage, setCurrentPage] = useState("grade-horaria-gerar");
  const { navigate, isNavigating } = useNavigation({
    currentPage,
    onPageChange: setCurrentPage,
  });
  const { showSuccess, showError } = useApp();

  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [savedAt, setSavedAt] = useState<Date | string | null>(null);
  const [turmasMap, setTurmasMap] = useState<Record<string, string>>({});
  const [turmaShiftsMap, setTurmaShiftsMap] = useState<Record<string, string>>(
    {}
  );
  const [discMap, setDiscMap] = useState<Record<string, string>>({});
  const [profMap, setProfMap] = useState<Record<string, string>>({});
  const [shifts, setShifts] = useState<any[]>([]);
  const [diagnostics, setDiagnostics] =
    useState<GradeHorariaDiagnosticsResult | null>(null);
  const [loadingDiag, setLoadingDiag] = useState(true);

  useEffect(() => {
    const fetchDictionaries = async () => {
      try {
        setLoadingDiag(true);
        const [turmas, disc, profs, settings, latestGrade, cargas] =
          await Promise.all([
            getTurmas(),
            getDisciplinas(),
            getProfessores(),
            getGradeSettings(),
            getLatestGradeHoraria(),
            getCargasHorarias(),
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

        // Executar diagnóstico preventivo pré-grade
        const diagService = new GradeHorariaDiagnosticsService();
        const diagResult = diagService.runDiagnostics({
          turmas,
          disciplinas: disc,
          professores: profs,
          cargas,
          shiftsConfig: settings.timetabling?.shifts || [],
        });
        setDiagnostics(diagResult);

        if (latestGrade) {
          setResult(latestGrade);
          setSavedAt(latestGrade.createdAt);
        }
      } catch (err) {
        console.error("Erro ao carregar dados da grade", err);
      } finally {
        setLoadingDiag(false);
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
      setSavedAt(new Date());

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

  // Exportação CSV: Uma tabela por turma com eixo X = Dias da Semana e eixo Y = Horários / Disciplinas
  const handleExportCSV = () => {
    if (!result?.schedule || sortedTurmaIds.length === 0) return;

    const csvLines: string[] = [];

    sortedTurmaIds.forEach((turmaId, idx) => {
      const shiftId = turmaShiftsMap[turmaId];
      const shift = shifts.find(s => s.id === shiftId) || shifts[0];
      const shiftSlots = shift?.slots || [];
      const days = DAY_IDS.slice(0, shift?.daysPerWeek || 5);
      const turmaName = turmasMap[turmaId] || `Turma ${idx + 1}`;
      const shiftName = shift?.name ? ` (${shift.name})` : "";

      if (idx > 0) {
        csvLines.push(""); // Linha em branco separadora entre turmas
      }

      // Título da Turma
      csvLines.push(`"TURMA: ${turmaName}${shiftName}"`);

      // Cabeçalho (Eixo X: Dias da Semana)
      const headerCols = [
        t("timeColumn") || "Horário",
        ...days.map(diaId => tCommon(`days.${diaId}`) || `Dia ${diaId}`),
      ];
      csvLines.push(headerCols.map(c => `"${c}"`).join(","));

      // Linhas (Eixo Y: Horários e Disciplinas com Professores)
      shiftSlots.forEach((slot: any) => {
        const slotLabel =
          slot.label ||
          (slot.startTime && slot.endTime
            ? `${slot.startTime} - ${slot.endTime}`
            : `Horário ${slot.id}`);

        const rowCols = [slotLabel];
        days.forEach(diaId => {
          const classInfo = grouped[turmaId]?.[`${diaId}_${slot.id}`];
          if (classInfo) {
            const disc = discMap[classInfo.disciplinaId] || "";
            const prof = classInfo.professorId
              ? profMap[classInfo.professorId] || ""
              : (t("noTeacher") || "Sem professor");
            rowCols.push(`${disc} (${prof})`);
          } else {
            rowCols.push("-");
          }
        });

        csvLines.push(rowCols.map(c => `"${c.replace(/"/g, '""')}"`).join(","));
      });
    });

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" + csvLines.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "grade_horaria.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Exportação Excel (XLSX): Tabela matricial por turma (aba consolidada + abas individuais por turma)
  const handleExportXLSX = () => {
    if (!result?.schedule || sortedTurmaIds.length === 0) return;

    const wb = XLSX.utils.book_new();

    // 1. Aba Consolidada contendo todas as turmas
    const generalRows: any[][] = [];

    sortedTurmaIds.forEach((turmaId, idx) => {
      const shiftId = turmaShiftsMap[turmaId];
      const shift = shifts.find(s => s.id === shiftId) || shifts[0];
      const shiftSlots = shift?.slots || [];
      const days = DAY_IDS.slice(0, shift?.daysPerWeek || 5);
      const turmaName = turmasMap[turmaId] || `Turma ${idx + 1}`;
      const shiftName = shift?.name ? ` (${shift.name})` : "";

      if (idx > 0) {
        generalRows.push([]);
        generalRows.push([]);
      }

      generalRows.push([`TURMA: ${turmaName}${shiftName}`]);

      const headerRow = [
        t("timeColumn") || "Horário",
        ...days.map(diaId => tCommon(`days.${diaId}`) || `Dia ${diaId}`),
      ];
      generalRows.push(headerRow);

      shiftSlots.forEach((slot: any) => {
        const slotLabel =
          slot.label ||
          (slot.startTime && slot.endTime
            ? `${slot.startTime} - ${slot.endTime}`
            : `Horário ${slot.id}`);

        const rowData = [slotLabel];
        days.forEach(diaId => {
          const classInfo = grouped[turmaId]?.[`${diaId}_${slot.id}`];
          if (classInfo) {
            const disc = discMap[classInfo.disciplinaId] || "";
            const prof = classInfo.professorId
              ? profMap[classInfo.professorId] || ""
              : (t("noTeacher") || "Sem professor");
            rowData.push(`${disc} (${prof})`);
          } else {
            rowData.push("-");
          }
        });
        generalRows.push(rowData);
      });
    });

    const generalWs = XLSX.utils.aoa_to_sheet(generalRows);
    generalWs["!cols"] = [
      { wch: 22 },
      { wch: 28 },
      { wch: 28 },
      { wch: 28 },
      { wch: 28 },
      { wch: 28 },
      { wch: 28 },
    ];
    XLSX.utils.book_append_sheet(wb, generalWs, "Todas as Turmas");

    // 2. Abas individuais por Turma
    const usedNames = new Set<string>();
    sortedTurmaIds.forEach((turmaId, idx) => {
      const shiftId = turmaShiftsMap[turmaId];
      const shift = shifts.find(s => s.id === shiftId) || shifts[0];
      const shiftSlots = shift?.slots || [];
      const days = DAY_IDS.slice(0, shift?.daysPerWeek || 5);
      const rawName = turmasMap[turmaId] || `Turma ${idx + 1}`;
      const shiftName = shift?.name ? ` (${shift.name})` : "";

      const turmaRows: any[][] = [];
      turmaRows.push([`Grade Horária — ${rawName}${shiftName}`]);
      turmaRows.push([]);

      const headerRow = [
        t("timeColumn") || "Horário",
        ...days.map(diaId => tCommon(`days.${diaId}`) || `Dia ${diaId}`),
      ];
      turmaRows.push(headerRow);

      shiftSlots.forEach((slot: any) => {
        const slotLabel =
          slot.label ||
          (slot.startTime && slot.endTime
            ? `${slot.startTime} - ${slot.endTime}`
            : `Horário ${slot.id}`);

        const rowData = [slotLabel];
        days.forEach(diaId => {
          const classInfo = grouped[turmaId]?.[`${diaId}_${slot.id}`];
          if (classInfo) {
            const disc = discMap[classInfo.disciplinaId] || "";
            const prof = classInfo.professorId
              ? profMap[classInfo.professorId] || ""
              : (t("noTeacher") || "Sem professor");
            rowData.push(`${disc} (${prof})`);
          } else {
            rowData.push("-");
          }
        });
        turmaRows.push(rowData);
      });

      const ws = XLSX.utils.aoa_to_sheet(turmaRows);
      ws["!cols"] = [
        { wch: 22 },
        { wch: 28 },
        { wch: 28 },
        { wch: 28 },
        { wch: 28 },
        { wch: 28 },
        { wch: 28 },
      ];

      // Sanitiza nome da aba (limite de 31 caracteres do Excel)
      let sheetName = rawName.replace(/[:\\/?*\[\]]/g, "_").slice(0, 28);
      if (usedNames.has(sheetName.toLowerCase())) {
        sheetName = `${sheetName.slice(0, 25)}_${idx + 1}`;
      }
      usedNames.add(sheetName.toLowerCase());

      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    XLSX.writeFile(wb, "grade_horaria.xlsx");
  };

  // Exportação PDF: Uma página em orientação paisagem por turma, com layout matricial idêntico ao do sistema
  const handleExportPDF = () => {
    if (!result?.schedule || sortedTurmaIds.length === 0) return;

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    sortedTurmaIds.forEach((turmaId, index) => {
      if (index > 0) {
        doc.addPage("a4", "landscape");
      }

      const shiftId = turmaShiftsMap[turmaId];
      const shift = shifts.find(s => s.id === shiftId) || shifts[0];
      const shiftSlots = shift?.slots || [];
      const days = DAY_IDS.slice(0, shift?.daysPerWeek || 5);
      const turmaName = turmasMap[turmaId] || `Turma ${index + 1}`;
      const shiftName = shift?.name ? ` • Turno: ${shift.name}` : "";

      // Faixa decorativa de cabeçalho
      doc.setFillColor(248, 250, 252);
      doc.rect(40, 25, pageWidth - 80, 50, "F");
      doc.setDrawColor(226, 232, 240);
      doc.rect(40, 25, pageWidth - 80, 50, "S");

      // Título da Turma
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(30, 41, 59);
      doc.text(`Grade Horária — ${turmaName}`, 55, 48);

      // Subtítulo e data de emissão
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      const nowStr = new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      doc.text(
        `SALA — Sistema de Agendamento e Gestão de Ambientes${shiftName} | Emissão: ${nowStr}`,
        55,
        64
      );

      // Colunas (Eixo X: Horário + Dias da Semana)
      const headColumns = [
        t("timeColumn") || "Horário",
        ...days.map(diaId => tCommon(`days.${diaId}`) || `Dia ${diaId}`),
      ];

      // Linhas (Eixo Y: Horários e Disciplinas)
      const tableRows = shiftSlots.map((slot: any) => {
        const slotLabel =
          slot.label ||
          (slot.startTime && slot.endTime
            ? `${slot.startTime} - ${slot.endTime}`
            : `Horário ${slot.id}`);

        const row = [slotLabel];

        days.forEach(diaId => {
          const classInfo = grouped[turmaId]?.[`${diaId}_${slot.id}`];
          if (classInfo) {
            const disc = discMap[classInfo.disciplinaId] || "Disciplina";
            const prof = classInfo.professorId
              ? profMap[classInfo.professorId] || ""
              : (t("noTeacher") || "Sem professor");
            row.push(`${disc}\n(${prof})`);
          } else {
            row.push("-");
          }
        });

        return row;
      });

      // Cálculo de largura das colunas
      const timeColWidth = 100;
      const daysCount = days.length;
      const remainingWidth = pageWidth - 80 - timeColWidth;
      const dayColWidth = remainingWidth / (daysCount || 1);

      const colStyles: Record<number, any> = {
        0: {
          cellWidth: timeColWidth,
          fontStyle: "bold",
          fillColor: [248, 250, 252],
          textColor: [71, 85, 105],
          halign: "center",
          valign: "middle",
        },
      };

      for (let i = 1; i <= daysCount; i++) {
        colStyles[i] = {
          cellWidth: dayColWidth,
          halign: "center",
          valign: "middle",
        };
      }

      autoTable(doc, {
        head: [headColumns],
        body: tableRows,
        startY: 90,
        theme: "grid",
        headStyles: {
          fillColor: [37, 99, 235], // Azul primário SALA
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
          valign: "middle",
          fontSize: 10,
          cellPadding: 8,
        },
        bodyStyles: {
          fontSize: 9,
          cellPadding: 8,
          lineColor: [226, 232, 240],
          lineWidth: 0.5,
          textColor: [30, 41, 59],
        },
        columnStyles: colStyles,
        margin: { left: 40, right: 40, bottom: 40 },
        didParseCell: function (data: any) {
          if (data.section === "body" && data.column.index > 0) {
            if (data.cell.raw && data.cell.raw !== "-") {
              data.cell.styles.fillColor = [239, 246, 255]; // Azul claro de destaque
              data.cell.styles.fontStyle = "bold";
            } else {
              data.cell.styles.textColor = [148, 163, 184]; // Muted
            }
          }
        },
      });

      // Rodapé da página com numeração
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Página ${index + 1} de ${sortedTurmaIds.length}`,
        pageWidth - 40,
        pageHeight - 20,
        { align: "right" }
      );
    });

    doc.save("grade_horaria.pdf");
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
          <BackButton />
        </div>

        <PreFlightDiagnostics
          diagnostics={diagnostics}
          loading={loadingDiag}
          onNavigate={navigate}
        />

        <Card className="mb-8 text-center bg-card border-2">
          <CardContent className="p-12">
            {isGenerating ? (
              <div className="max-w-md mx-auto py-6 flex flex-col items-center justify-center space-y-4">
                <LoadingSpinner size="lg" />
                <div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {t("processing")}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                    Analisando disponibilidades, calculando combinações e
                    otimizando restrições...
                  </p>
                </div>
              </div>
            ) : (
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
                  {t("runButton")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Resumo */}
            <GenerationResultSummary
              success={!!result.success}
              fitness={result.fitness}
              unallocatedRequirements={result.unallocatedRequirements}
              errors={result.errors}
              turmasMap={turmasMap}
              discMap={discMap}
              profMap={profMap}
              onNavigate={navigate}
            />

            {/* Cabeçalho da Visualização da Grade com Dropdown de Exportação */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8 mb-4">
              <div>
                <h3 className="text-2xl font-bold">{t("schedulesByClass")}</h3>
                {savedAt && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Grade salva no banco de dados em{" "}
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {new Date(savedAt).toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </p>
                )}
              </div>
              <ExportScheduleDropdown
                onExportPDF={handleExportPDF}
                onExportXLSX={handleExportXLSX}
                onExportCSV={handleExportCSV}
                disabled={!result?.schedule || result.schedule.length === 0}
              />
            </div>

            {/* Visualização da Grade por Turma */}
            {sortedTurmaIds.length === 0 ? (
              <Card className="p-8 text-center border-dashed">
                <CardContent className="space-y-4 pt-6">
                  <p className="text-slate-600 dark:text-slate-400">
                    Nenhuma turma ou carga horária foi cadastrada na sua
                    organização.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/grade-horaria/configuracoes")}
                  >
                    Ir para Configurações (Inserir Dados de Teste)
                  </Button>
                </CardContent>
              </Card>
            ) : (
              sortedTurmaIds.map(turmaId => {
                const shiftId = turmaShiftsMap[turmaId];
                const shift = shifts.find(s => s.id === shiftId) || shifts[0];
                const shiftSlots = shift?.slots || [];
                const days = DAY_IDS.slice(0, shift?.daysPerWeek || 5);

                return (
                  <Card key={turmaId} className="overflow-hidden mb-6">
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
                                  const classInfo =
                                    grouped[turmaId]?.[timeSlotStr];
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
                                            {classInfo.professorId
                                              ? profMap[
                                                  classInfo.professorId
                                                ] || ""
                                              : "Sem professor"}
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
              })
            )}
          </div>
        )}
      </PageLayout>
    </OrgAdminGuard>
  );
};

export default GerarGradePage;
