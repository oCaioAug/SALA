"use client";

import React, { useEffect, useState } from "react";
import { Settings as SettingsIcon, Plus, Trash2, Save } from "lucide-react";

import { OrgAdminGuard } from "@/components/auth/OrgAdminGuard";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useNavigation } from "@/lib/hooks/useNavigation";
import { useApp } from "@/lib/hooks/useApp";

import { getGradeSettings, updateGradeSettings } from "../actions";

export default function ConfiguracoesGradePage() {
  const [currentPage, setCurrentPage] = useState("grade-horaria");
  const { navigate, isNavigating } = useNavigation({
    currentPage,
    onPageChange: setCurrentPage,
  });
  const { showSuccess, showError } = useApp();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shifts, setShifts] = useState<any[]>([]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getGradeSettings();
        setShifts(settings.timetabling.shifts || []);
      } catch (err: any) {
        showError(err.message || "Erro ao carregar configurações");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleAddShift = () => {
    const newShift = {
      id: `shift_${Date.now()}`,
      name: "Novo Turno",
      daysPerWeek: 5,
      slots: []
    };
    setShifts([...shifts, newShift]);
  };

  const handleRemoveShift = (shiftId: string) => {
    if (!confirm("Tem certeza que deseja remover este turno?")) return;
    setShifts(shifts.filter(s => s.id !== shiftId));
  };

  const handleUpdateShiftName = (shiftId: string, newName: string) => {
    setShifts(shifts.map(s => s.id === shiftId ? { ...s, name: newName } : s));
  };

  const handleAddSlot = (shiftId: string) => {
    setShifts(shifts.map(s => {
      if (s.id === shiftId) {
        const newSlot = {
          id: `slot_${Date.now()}`,
          label: `Aula ${s.slots.length + 1}`,
          startTime: "00:00",
          endTime: "00:00"
        };
        return { ...s, slots: [...s.slots, newSlot] };
      }
      return s;
    }));
  };

  const handleRemoveSlot = (shiftId: string, slotId: string) => {
    setShifts(shifts.map(s => {
      if (s.id === shiftId) {
        return { ...s, slots: s.slots.filter((slot: any) => slot.id !== slotId) };
      }
      return s;
    }));
  };

  const handleUpdateSlot = (shiftId: string, slotId: string, field: string, value: string) => {
    setShifts(shifts.map(s => {
      if (s.id === shiftId) {
        return {
          ...s,
          slots: s.slots.map((slot: any) => slot.id === slotId ? { ...slot, [field]: value } : slot)
        };
      }
      return s;
    }));
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      await updateGradeSettings({ shifts });
      showSuccess("Configurações salvas com sucesso!");
    } catch (err: any) {
      showError(err.message || "Erro ao salvar configurações");
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
            <SettingsIcon className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Configurações da Grade
              </h1>
              <p className="text-slate-600 dark:text-gray-400">
                Gerencie os turnos e os horários das aulas da instituição.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/grade-horaria")}>
              Voltar
            </Button>
            <Button variant="secondary" onClick={async () => {
              try {
                setIsSubmitting(true);
                const { injectMockData } = await import("../seed");
                await injectMockData();
                showSuccess("Mocks injetados com sucesso! Pressione F5 para recarregar.");
              } catch(e: any) {
                showError(e.message || "Erro ao injetar mocks");
              } finally {
                setIsSubmitting(false);
              }
            }} disabled={loading || isSubmitting}>
              Injetar Dados de Teste
            </Button>
            <Button onClick={handleSave} disabled={loading || isSubmitting}>
              <Save className="w-4 h-4 mr-2" /> Salvar Alterações
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="space-y-6">
            {shifts.map(shift => (
              <Card key={shift.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-6 border-b pb-4 dark:border-slate-700">
                    <div className="flex items-center gap-4">
                      <Input 
                        value={shift.name} 
                        onChange={e => handleUpdateShiftName(shift.id, e.target.value)}
                        className="text-lg font-bold w-64 border-none hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 p-2 h-auto"
                        placeholder="Nome do Turno (ex: Manhã)"
                      />
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => handleRemoveShift(shift.id)}>
                      <Trash2 className="w-4 h-4 mr-2" /> Remover Turno
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-slate-700 dark:text-slate-300">Horários das Aulas</h3>
                      <Button variant="outline" size="sm" onClick={() => handleAddSlot(shift.id)}>
                        <Plus className="w-4 h-4 mr-2" /> Adicionar Aula
                      </Button>
                    </div>
                    
                    {shift.slots.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                        Nenhum horário cadastrado neste turno.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {shift.slots.map((slot: any) => (
                          <div key={slot.id} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="flex-1">
                              <label className="text-xs text-slate-500 mb-1 block">Rótulo da Aula</label>
                              <Input 
                                value={slot.label} 
                                onChange={e => handleUpdateSlot(shift.id, slot.id, "label", e.target.value)}
                                placeholder="ex: 1ª Aula"
                              />
                            </div>
                            <div className="w-32">
                              <label className="text-xs text-slate-500 mb-1 block">Início</label>
                              <Input 
                                type="time"
                                value={slot.startTime} 
                                onChange={e => handleUpdateSlot(shift.id, slot.id, "startTime", e.target.value)}
                              />
                            </div>
                            <div className="w-32">
                              <label className="text-xs text-slate-500 mb-1 block">Fim</label>
                              <Input 
                                type="time"
                                value={slot.endTime} 
                                onChange={e => handleUpdateSlot(shift.id, slot.id, "endTime", e.target.value)}
                              />
                            </div>
                            <div className="pt-5">
                              <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => handleRemoveSlot(shift.id, slot.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button variant="outline" className="w-full border-dashed border-2 text-slate-600 hover:text-slate-900 h-16" onClick={handleAddShift}>
              <Plus className="w-5 h-5 mr-2" /> Adicionar Novo Turno
            </Button>
          </div>
        )}
      </PageLayout>
    </OrgAdminGuard>
  );
}
