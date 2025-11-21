"use client";

import {
  AlertCircle,
  Building2,
  Calendar,
  Clock,
  User as UserIcon,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Room, User } from "@/lib/types";
import { getIntlLocale } from "@/lib/utils";

interface ReservationFormProps {
  rooms?: Room[];
  users?: User[];
  selectedDate?: Date;
  selectedRoomId?: string;
  onSubmit: (reservation: {
    userId: string;
    roomId: string;
    startTime: string;
    endTime: string;
    purpose?: string;
    isRecurring?: boolean;
    recurringPattern?: "DAILY" | "WEEKLY" | "MONTHLY";
    recurringDaysOfWeek?: number[];
    recurringEndDate?: string;
  }) => void;
  onCancel: () => void;
  loading?: boolean;
}

const ReservationForm: React.FC<ReservationFormProps> = ({
  rooms = [],
  users = [],
  selectedDate,
  selectedRoomId,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const t = useTranslations("ReservationForm");
  const locale = useLocale();
  const [formData, setFormData] = useState({
    userId: "",
    roomId: selectedRoomId || "",
    startTime: "",
    endTime: "",
    purpose: "",
    isRecurring: false,
    recurringPattern: "WEEKLY" as "DAILY" | "WEEKLY" | "MONTHLY",
    recurringDaysOfWeek: [] as number[],
    recurringEndDate: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preencher horários baseado na data selecionada
  useEffect(() => {
    if (selectedDate) {
      const today = new Date();
      const isToday = selectedDate.toDateString() === today.toDateString();

      if (isToday) {
        // Se for hoje, sugerir horário atual + 1 hora
        const now = new Date();
        const startTime = new Date(now.getTime() + 60 * 60 * 1000); // +1 hora
        const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // +2 horas

        setFormData(prev => ({
          ...prev,
          startTime: startTime.toISOString().slice(0, 16),
          endTime: endTime.toISOString().slice(0, 16),
        }));
      } else {
        // Se for outro dia, sugerir horário padrão
        const dateStr = selectedDate.toISOString().slice(0, 10);
        setFormData(prev => ({
          ...prev,
          startTime: `${dateStr}T09:00`,
          endTime: `${dateStr}T11:00`,
        }));
      }
    }
  }, [selectedDate]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.userId) {
      newErrors.userId = t("errors.userRequired");
    }

    if (!formData.roomId) {
      newErrors.roomId = t("errors.roomRequired");
    }

    if (!formData.startTime) {
      newErrors.startTime = t("errors.startRequired");
    }

    if (!formData.endTime) {
      newErrors.endTime = t("errors.endRequired");
    }

    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);

      if (start >= end) {
        newErrors.endTime = t("errors.endAfterStart");
      }

      if (start < new Date()) {
        newErrors.startTime = t("errors.startNotPast");
      }

      // Verificar se a duração não é muito longa (máximo 30 dias)
      const duration =
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      if (duration > 30) {
        newErrors.endTime = t("errors.maxDuration");
      }
    }

    // Validação para recorrência
    if (formData.isRecurring) {
      if (!formData.recurringEndDate) {
        newErrors.recurringEndDate = t("errors.recurringEndDateRequired");
      } else {
        const endDate = new Date(formData.recurringEndDate);
        const startDate = new Date(formData.startTime);
        if (endDate <= startDate) {
          newErrors.recurringEndDate = t("errors.recurringEndDateAfterStart");
        }
      }

      if (formData.recurringPattern === "WEEKLY" && formData.recurringDaysOfWeek.length === 0) {
        newErrors.recurringDaysOfWeek = t("errors.recurringDaysRequired");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const reservationData: any = {
        userId: formData.userId,
        roomId: formData.roomId,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        purpose: formData.purpose || undefined,
      };

      if (formData.isRecurring) {
        reservationData.isRecurring = true;
        reservationData.recurringPattern = formData.recurringPattern;
        reservationData.recurringDaysOfWeek = formData.recurringDaysOfWeek;
        reservationData.recurringEndDate = new Date(formData.recurringEndDate).toISOString();
      }

      await onSubmit(reservationData);
    } catch (error) {
      console.error("Erro ao criar reserva:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Limpar erro quando usuário começar a digitar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  // Calcular duração da reserva
  const calculateDuration = () => {
    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      const diffMs = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

      if (diffDays > 1) {
        return t("duration.days", { count: diffDays });
      } else {
        return t("duration.hours", { count: diffHours });
      }
    }
    return "";
  };

  const getAvailableRooms = () => {
    return rooms.filter(
      room => room.status === "LIVRE" || room.status === "RESERVADO"
    );
  };

  const formatSelectedDate = () => {
    if (!selectedDate) return "";
    const intlLocale = getIntlLocale(locale);
    return selectedDate.toLocaleDateString(intlLocale, {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Data selecionada */}
      {selectedDate && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-blue-400">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">
              {t("schedulingFor")} {formatSelectedDate()}
            </span>
          </div>
        </div>
      )}

      {/* Usuário */}
      <div>
        <label className="text-sm font-medium text-gray-300 mb-2 block">
          {t("user")} *
        </label>
        <div className="relative">
          <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <select
            name="userId"
            value={formData.userId}
            onChange={handleInputChange}
            className={`w-full pl-10 pr-4 py-3 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.userId ? "border-red-500" : "border-gray-600"
            }`}
            required
          >
            <option value="">{t("selectUser")}</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </div>
        {errors.userId && (
          <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.userId}
          </p>
        )}
      </div>

      {/* Sala */}
      <div>
        <label className="text-sm font-medium text-gray-300 mb-2 block">
          {t("room")} *
        </label>
        <div className="relative">
          <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <select
            name="roomId"
            value={formData.roomId}
            onChange={handleInputChange}
            className={`w-full pl-10 pr-4 py-3 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.roomId ? "border-red-500" : "border-gray-600"
            }`}
            required
          >
            <option value="">{t("selectRoom")}</option>
            {getAvailableRooms().map(room => (
              <option key={room.id} value={room.id}>
                {room.name} {room.capacity && `(${room.capacity} pessoas)`}
              </option>
            ))}
          </select>
        </div>
        {errors.roomId && (
          <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.roomId}
          </p>
        )}
      </div>

      {/* Horários */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-300 mb-2 block">
            {t("start")} *
          </label>
          <div className="relative">
            <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="datetime-local"
              name="startTime"
              value={formData.startTime}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-4 py-3 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.startTime ? "border-red-500" : "border-gray-600"
              }`}
              required
            />
          </div>
          {errors.startTime && (
            <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.startTime}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-300 mb-2 block">
            {t("end")} *
          </label>
          <div className="relative">
            <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="datetime-local"
              name="endTime"
              value={formData.endTime}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-4 py-3 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.endTime ? "border-red-500" : "border-gray-600"
              }`}
              required
            />
          </div>
          {errors.endTime && (
            <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.endTime}
            </p>
          )}
        </div>
      </div>

      {/* Indicador de duração */}
      {formData.startTime && formData.endTime && calculateDuration() && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-blue-400">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">
              {t("durationLabel")} {calculateDuration()}
            </span>
          </div>
        </div>
      )}

      {/* Propósito */}
      <div>
        <label className="text-sm font-medium text-gray-300 mb-2 block">
          {t("purpose")}
        </label>
        <textarea
          name="purpose"
          value={formData.purpose}
          onChange={handleInputChange}
          placeholder={t("purposePlaceholder")}
          className="w-full px-3 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
        />
      </div>

      {/* Recorrência */}
      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <input
            type="checkbox"
            id="isRecurring"
            checked={formData.isRecurring}
            onChange={(e) => {
              setFormData(prev => ({
                ...prev,
                isRecurring: e.target.checked,
                recurringDaysOfWeek: e.target.checked ? [new Date(formData.startTime || new Date()).getDay()] : [],
              }));
            }}
            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
          />
          <label htmlFor="isRecurring" className="text-sm font-medium text-gray-300 cursor-pointer">
            {t("recurring") || "Reserva Recorrente"}
          </label>
        </div>

        {formData.isRecurring && (
          <div className="space-y-4 mt-4">
            {/* Padrão de recorrência */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                {t("recurringPattern") || "Padrão de Recorrência"} *
              </label>
              <select
                name="recurringPattern"
                value={formData.recurringPattern}
                onChange={handleInputChange}
                className="w-full px-3 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="DAILY">{t("daily") || "Diário"}</option>
                <option value="WEEKLY">{t("weekly") || "Semanal"}</option>
                <option value="MONTHLY">{t("monthly") || "Mensal"}</option>
              </select>
            </div>

            {/* Dias da semana (apenas para padrão semanal) */}
            {formData.recurringPattern === "WEEKLY" && (
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  {t("recurringDays") || "Dias da Semana"} *
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {[
                    { value: 0, label: t("sunday") || "Dom" },
                    { value: 1, label: t("monday") || "Seg" },
                    { value: 2, label: t("tuesday") || "Ter" },
                    { value: 3, label: t("wednesday") || "Qua" },
                    { value: 4, label: t("thursday") || "Qui" },
                    { value: 5, label: t("friday") || "Sex" },
                    { value: 6, label: t("saturday") || "Sáb" },
                  ].map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => {
                        const newDays = formData.recurringDaysOfWeek.includes(day.value)
                          ? formData.recurringDaysOfWeek.filter(d => d !== day.value)
                          : [...formData.recurringDaysOfWeek, day.value];
                        setFormData(prev => ({ ...prev, recurringDaysOfWeek: newDays }));
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.recurringDaysOfWeek.includes(day.value)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
                {errors.recurringDaysOfWeek && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.recurringDaysOfWeek}
                  </p>
                )}
              </div>
            )}

            {/* Data final */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                {t("recurringEndDate") || "Data Final"} *
              </label>
              <input
                type="date"
                name="recurringEndDate"
                value={formData.recurringEndDate}
                onChange={handleInputChange}
                min={formData.startTime ? formData.startTime.split("T")[0] : undefined}
                className={`w-full px-3 py-3 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.recurringEndDate ? "border-red-500" : "border-gray-600"
                }`}
                required={formData.isRecurring}
              />
              {errors.recurringEndDate && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.recurringEndDate}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Informações adicionais */}
      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <h4 className="text-sm font-medium text-gray-300 mb-2">
          {t("importantInfo")}
        </h4>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• {t("info1")}</li>
          <li>• {t("info2")}</li>
          <li>• {t("info3")}</li>
          <li>• {t("info4")}</li>
          <li>• {t("info5")}</li>
        </ul>
      </div>

      {/* Botões */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          className="flex-1"
          disabled={isSubmitting || loading}
        >
          {isSubmitting ? t("creating") : t("create")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={isSubmitting}
        >
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
};

export { ReservationForm };
