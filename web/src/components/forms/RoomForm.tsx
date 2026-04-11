"use client";

import { useTranslations } from "next-intl";
import React, { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Room, RoomStatus } from "@/lib/types";

interface RoomFormProps {
  room?: Room;
  onSubmit: (room: Omit<Room, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}

const RoomForm: React.FC<RoomFormProps> = ({ room, onSubmit, onCancel }) => {
  const t = useTranslations("Dashboard");
  const tf = useTranslations("Dashboard.form");

  const [formData, setFormData] = useState({
    name: room?.name || "",
    description: room?.description || "",
    capacity: room?.capacity?.toString() || "",
    status: (room?.status || "LIVRE") as RoomStatus,
    locationDescription: room?.locationDescription || "",
    outletCount:
      room?.outletCount !== undefined && room?.outletCount !== null
        ? String(room.outletCount)
        : "",
    climateControlled: room?.climateControlled ?? false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = tf("nameRequired");

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      capacity: formData.capacity ? parseInt(formData.capacity, 10) : null,
      status: formData.status,
      locationDescription: formData.locationDescription.trim() || null,
      outletCount: formData.outletCount.trim()
        ? parseInt(formData.outletCount, 10)
        : null,
      climateControlled: formData.climateControlled,
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleClimateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, climateControlled: e.target.checked }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label={tf("nameLabel")}
        name="name"
        value={formData.name}
        onChange={handleInputChange}
        placeholder={tf("namePlaceholder")}
        error={errors.name}
        required
      />

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {tf("descriptionLabel")}
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder={tf("descriptionPlaceholder")}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400"
          rows={3}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {tf("locationLabel")}
        </label>
        <textarea
          name="locationDescription"
          value={formData.locationDescription}
          onChange={handleInputChange}
          placeholder={tf("locationPlaceholder")}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400"
          rows={2}
        />
      </div>

      <Input
        label={tf("capacityLabel")}
        name="capacity"
        type="number"
        value={formData.capacity}
        onChange={handleInputChange}
        placeholder={tf("capacityPlaceholder")}
        min="1"
      />

      <Input
        label={tf("outletsLabel")}
        name="outletCount"
        type="number"
        value={formData.outletCount}
        onChange={handleInputChange}
        placeholder={tf("outletsPlaceholder")}
        min="0"
      />

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="climateControlled"
          checked={formData.climateControlled}
          onChange={handleClimateChange}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700"
        />
        <label
          htmlFor="climateControlled"
          className="text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {tf("climateLabel")}
        </label>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {tf("statusLabel")}
        </label>
        <select
          name="status"
          value={formData.status}
          onChange={handleInputChange}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        >
          <option value="LIVRE">{t("filters.statusFree")}</option>
          <option value="EM_USO">{t("filters.statusInUse")}</option>
          <option value="RESERVADO">{t("filters.statusReserved")}</option>
        </select>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1">
          {room ? tf("submitUpdate") : tf("submitCreate")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          {tf("cancel")}
        </Button>
      </div>
    </form>
  );
};

export { RoomForm };
