"use client";

import React, { useEffect, useState } from "react";
import { CalendarDays, Save } from "lucide-react";

import { OrgAdminGuard } from "@/components/auth/OrgAdminGuard";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { useNavigation } from "@/lib/hooks/useNavigation";
import { useApp } from "@/lib/hooks/useApp";

import { getProfessores, getDisponibilidades, setDisponibilidade, getGradeSettings } from "../actions";

const DIAS_SEMANA = [
  { id: 1, nome: "Segunda" },
  { id: 2, nome: "Terça" },
  { id: 3, nome: "Quarta" },
  { id: 4, nome: "Quinta" },
  { id: 5, nome: "Sexta" },
  { id: 6, nome: "Sábado" },
];

const DisponibilidadesPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState("grade-horaria");
  const { navigate, isNavigating } = useNavigation({
    currentPage,
    onPageChange: setCurrentPage,
  });
  const { showSuccess, showError } = useApp();

  const [professores, setProfessores] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfId, setSelectedProfId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Matrix state [diaSemana][slotId] = boolean
  const [grid, setGrid] = useState<Record<number, Set<string>>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profs, settings] = await Promise.all([
          getProfessores(),
          getGradeSettings()
        ]);
        setProfessores(profs);
        setShifts(settings.timetabling.shifts || []);
      } catch (err: any) {
        showError(err.message || "Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedProfId) {
      setGrid({});
      return;
    }
    
    const fetchDisp = async () => {
      try {
        setLoading(true);
        const disp = await getDisponibilidades(selectedProfId);
        
        const newGrid: Record<number, Set<string>> = {};
        DIAS_SEMANA.forEach(d => {
          newGrid[d.id] = new Set();
        });

        disp.forEach(d => {
          if (newGrid[d.diaSemana] && d.slotId) {
            newGrid[d.diaSemana].add(d.slotId);
          }
        });

        setGrid(newGrid);
      } catch (err: any) {
        showError(err.message || "Erro ao carregar disponibilidades");
      } finally {
        setLoading(false);
      }
    };

    fetchDisp();
  }, [selectedProfId]);

  const toggleSlot = (dia: number, slotId: string) => {
    setGrid(prev => {
      const newGrid = { ...prev };
      const daySet = new Set(prev[dia] || []);
      if (daySet.has(slotId)) {
        daySet.delete(slotId);
      } else {
        daySet.add(slotId);
      }
      newGrid[dia] = daySet;
      return newGrid;
    });
  };

  const handleSave = async () => {
    if (!selectedProfId) return;

    try {
      setIsSubmitting(true);
      const promises = DIAS_SEMANA.map(dia => {
        const slots = Array.from(grid[dia.id] || []);
        return setDisponibilidade(selectedProfId, dia.id, slots);
      });
      await Promise.all(promises);
      showSuccess("Disponibilidades salvas com sucesso!");
    } catch (err: any) {
      showError(err.message || "Erro ao salvar disponibilidades");
    } finally {
      setIsSubmitting(false);
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
            <CalendarDays className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Disponibilidade dos Professores
              </h1>
              <p className="text-slate-600 dark:text-gray-400">
                Selecione um professor e marque os horários em que ele pode lecionar.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/grade-horaria")}>
            Voltar
          </Button>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="max-w-md">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
                  Selecione o Professor
                </label>
                <select 
                  className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  value={selectedProfId} 
                  onChange={(e) => setSelectedProfId(e.target.value)} 
                  disabled={loading || isSubmitting}
                >
                  <option value="">Selecione...</option>
                  {professores.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </CardContent>
          </Card>

          {selectedProfId && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <CardTitle>Grade de Horários</CardTitle>
                  <Button onClick={handleSave} disabled={isSubmitting || loading}>
                    <Save className="w-4 h-4 mr-2" /> Salvar Disponibilidade
                  </Button>
                </div>

                <div className="overflow-x-auto space-y-8">
                  {shifts.map(shift => (
                    <div key={shift.id} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                      <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200">{shift.name}</h4>
                      </div>
                      <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800/50 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="px-6 py-3 w-48">Aula</th>
                            {DIAS_SEMANA.map(dia => (
                              <th key={dia.id} className="px-6 py-3 text-center">{dia.nome}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {shift.slots.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-4">Nenhuma aula configurada para este turno.</td></tr>
                          ) : (
                            shift.slots.map((slot: any) => (
                              <tr key={slot.id} className="bg-white border-b last:border-0 dark:bg-slate-900 dark:border-slate-700">
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                                  {slot.label} <span className="text-xs text-slate-400 block">{slot.startTime} - {slot.endTime}</span>
                                </td>
                                {DIAS_SEMANA.map(dia => {
                                  const isSelected = grid[dia.id]?.has(slot.id);
                                  return (
                                    <td key={dia.id} className="px-6 py-4 text-center">
                                      <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                          type="checkbox" 
                                          className="sr-only peer"
                                          checked={isSelected || false}
                                          onChange={() => toggleSlot(dia.id, slot.id)}
                                          disabled={isSubmitting}
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                                      </label>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </PageLayout>
    </OrgAdminGuard>
  );
};

export default DisponibilidadesPage;
