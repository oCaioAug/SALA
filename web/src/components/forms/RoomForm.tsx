"use client";

import { useTranslations } from "next-intl";
import React, { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Room, RoomStatus, RoomWithItems } from "@/lib/types";

interface RoomFormProps {
  room?: Room | RoomWithItems;
  onSubmit: (
    room: Omit<
      Room,
      "id" | "createdAt" | "updatedAt" | "organizationId" | "deletedAt"
    >
  ) => void;
  onCancel: () => void;
  /** When false, sector select is hidden and sectorId is not sent on submit. */
  allowSectorChange?: boolean;
  loading?: boolean;
}

type SectorOption = { id: string; name: string };

function getRoomSector(
  room?: Room | RoomWithItems
): SectorOption | null {
  if (!room || !("sector" in room) || !room.sector) return null;
  return { id: room.sector.id, name: room.sector.name };
}

const RoomForm: React.FC<RoomFormProps> = ({
  room,
  onSubmit,
  onCancel,
  allowSectorChange = true,
  loading = false,
}) => {
  const t = useTranslations("Dashboard");
  const tf = useTranslations("Dashboard.form");
  const tCommon = useTranslations("Common.searchSelect");

  const roomSector = getRoomSector(room);
  const initialSectorId = room?.sectorId ?? roomSector?.id ?? "";

  const [sectors, setSectors] = useState<SectorOption[]>(() =>
    roomSector ? [roomSector] : []
  );
  const [sectorsError, setSectorsError] = useState<string | null>(null);
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
    sectorId: initialSectorId,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!room) return;
    const sector = getRoomSector(room);
    setFormData({
      name: room.name || "",
      description: room.description || "",
      capacity: room.capacity?.toString() || "",
      status: (room.status || "LIVRE") as RoomStatus,
      locationDescription: room.locationDescription || "",
      outletCount:
        room.outletCount !== undefined && room.outletCount !== null
          ? String(room.outletCount)
          : "",
      climateControlled: room.climateControlled ?? false,
      sectorId: room.sectorId ?? sector?.id ?? "",
    });
    if (sector) {
      setSectors(prev => {
        if (prev.some(s => s.id === sector.id)) return prev;
        return [sector, ...prev];
      });
    }
  }, [room]);

  useEffect(() => {
    if (!allowSectorChange) return;
    let cancelled = false;
    (async () => {
      try {
        setSectorsError(null);
        const res = await fetch("/api/sectors");
        if (!res.ok) {
          if (!cancelled) {
            setSectorsError(tf("sectorLoadError"));
          }
          return;
        }
        const data = await res.json();
        if (cancelled || !Array.isArray(data)) return;

        const loaded: SectorOption[] = data.map(
          (s: { id: string; name: string }) => ({
            id: s.id,
            name: s.name,
          })
        );

        // Keep current room sector visible even if not in the list response.
        const currentSector = getRoomSector(room);
        if (
          currentSector &&
          !loaded.some(s => s.id === currentSector.id)
        ) {
          loaded.unshift(currentSector);
        }

        setSectors(loaded);
      } catch {
        if (!cancelled) {
          setSectorsError(tf("sectorLoadError"));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [allowSectorChange, room, tf]);

  const sectorOptions = useMemo(() => {
    const map = new Map(sectors.map(s => [s.id, s]));
    if (roomSector) {
      map.set(roomSector.id, roomSector);
    }
    return Array.from(map.values());
  }, [sectors, roomSector]);

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
      sectorId: allowSectorChange
        ? formData.sectorId || null
        : (room?.sectorId ?? roomSector?.id ?? null),
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
    e.stopPropagation();
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

      <div
        className="flex items-center gap-3"
        onClick={e => e.stopPropagation()}
      >
        <input
          type="checkbox"
          id="climateControlled"
          name="climateControlled"
          checked={formData.climateControlled}
          onChange={handleClimateChange}
          onClick={e => e.stopPropagation()}
          onKeyDown={e => {
            // Enter on a focused checkbox submits the form in many browsers.
            if (e.key === "Enter") e.preventDefault();
          }}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700"
        />
        <label
          htmlFor="climateControlled"
          className="text-sm font-medium text-slate-700 dark:text-slate-300"
          onClick={e => e.stopPropagation()}
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

      {allowSectorChange && (
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {tf("sectorLabel")}
          </label>
          <SearchableSelect
            name="sectorId"
            value={formData.sectorId}
            onChange={v => {
              setFormData(prev => ({ ...prev, sectorId: v }));
            }}
            options={sectorOptions.map(sector => ({
              value: sector.id,
              label: sector.name,
            }))}
            placeholder={tf("sectorNone")}
            searchPlaceholder={tCommon("searchPlaceholder")}
            emptyMessage={tCommon("empty")}
            allowEmpty
          />
          {sectorsError ? (
            <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-300">
              {sectorsError}
            </p>
          ) : (
            <p
              className={`mt-1.5 text-xs ${
                formData.sectorId
                  ? "text-slate-500 dark:text-slate-400"
                  : "text-amber-700 dark:text-amber-300"
              }`}
            >
              {formData.sectorId ? tf("sectorHelp") : tf("sectorHelpNone")}
            </p>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1" loading={loading}>
          {room ? tf("submitUpdate") : tf("submitCreate")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={loading}
        >
          {tf("cancel")}
        </Button>
      </div>
    </form>
  );
};

export { RoomForm };
