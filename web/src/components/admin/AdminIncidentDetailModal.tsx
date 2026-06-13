"use client";

import {
  IncidentPriority,
  IncidentStatus,
} from "@prisma/client";
import { Building2, Calendar, User, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Link } from "@/navigation";

export interface AdminIncidentListItem {
  id: string;
  title: string;
  description: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  category: string;
  createdAt: string;
  resolutionNotes: string | null;
  organization: { id: string; name: string; slug: string };
  reportedBy: { id: string; name: string | null; email: string };
  assignedTo: { id: string; name: string | null; email: string } | null;
  room: { id: string; name: string } | null;
  item: { id: string; name: string } | null;
}

interface AdminIncidentDetail extends AdminIncidentListItem {
  statusHistory: {
    id: string;
    fromStatus: IncidentStatus | null;
    toStatus: IncidentStatus;
    notes: string | null;
    createdAt: string;
    changedBy: { id: string; name: string | null; email: string };
  }[];
}

interface AdminIncidentDetailModalProps {
  incidentId: string | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function AdminIncidentDetailModal({
  incidentId,
  open,
  onClose,
  onUpdated,
}: AdminIncidentDetailModalProps) {
  const t = useTranslations("Admin.incidents");
  const [incident, setIncident] = useState<AdminIncidentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusDraft, setStatusDraft] = useState<IncidentStatus>(
    IncidentStatus.REPORTED
  );
  const [priorityDraft, setPriorityDraft] = useState<IncidentPriority>(
    IncidentPriority.MEDIUM
  );
  const [notesDraft, setNotesDraft] = useState("");

  const fetchIncident = useCallback(async () => {
    if (!incidentId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/incidents/${incidentId}`);
      if (!res.ok) throw new Error("not found");
      const data: AdminIncidentDetail = await res.json();
      setIncident(data);
      setStatusDraft(data.status);
      setPriorityDraft(data.priority);
      setNotesDraft(data.resolutionNotes ?? "");
    } catch {
      setIncident(null);
    } finally {
      setLoading(false);
    }
  }, [incidentId]);

  useEffect(() => {
    if (open && incidentId) fetchIncident();
  }, [open, incidentId, fetchIncident]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const saveChanges = async () => {
    if (!incident) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/incidents/${incident.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: statusDraft,
          priority: priorityDraft,
          resolutionNotes: notesDraft.trim() || null,
        }),
      });
      if (res.ok) {
        await fetchIncident();
        onUpdated();
      }
    } finally {
      setSaving(false);
    }
  };

  const resolveIncident = async () => {
    if (!incident) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/incidents/${incident.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: IncidentStatus.RESOLVED,
          resolutionNotes: notesDraft.trim() || "Resolvido pelo super admin",
        }),
      });
      if (res.ok) {
        await fetchIncident();
        onUpdated();
      }
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label={t("closeModal")}
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-gray-950 shadow-2xl">
        <div className="flex items-start justify-between border-b border-white/10 px-6 py-5">
          <div className="min-w-0 pr-4">
            <p className="text-lg font-bold text-white">
              {loading ? t("loading") : (incident?.title ?? t("notFound"))}
            </p>
            {incident && (
              <div className="mt-2 flex flex-wrap gap-2">
                <AdminStatusBadge
                  status={incident.status}
                  kind="incident"
                />
                <AdminStatusBadge
                  status={incident.priority}
                  kind="incidentPriority"
                />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : !incident ? (
            <p className="text-sm text-gray-500">{t("notFound")}</p>
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-gray-300">{incident.description}</p>

              <div className="grid gap-3 sm:grid-cols-2">
                <MetaField
                  icon={Building2}
                  label={t("organization")}
                  value={
                    <Link
                      href={`/admin/organizations/${incident.organization.id}`}
                      className="text-violet-300 hover:text-violet-200"
                      onClick={onClose}
                    >
                      {incident.organization.name}
                    </Link>
                  }
                />
                <MetaField
                  icon={User}
                  label={t("reportedBy")}
                  value={incident.reportedBy.name ?? incident.reportedBy.email}
                />
                <MetaField
                  icon={Calendar}
                  label={t("createdAt")}
                  value={new Date(incident.createdAt).toLocaleString("pt-BR")}
                />
                <MetaField
                  icon={Building2}
                  label={t("target")}
                  value={
                    incident.room?.name ??
                    incident.item?.name ??
                    t("noTarget")
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-gray-400">
                    {t("status")}
                  </label>
                  <select
                    value={statusDraft}
                    onChange={e =>
                      setStatusDraft(e.target.value as IncidentStatus)
                    }
                    className="w-full rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-sm text-white"
                  >
                    {Object.values(IncidentStatus).map(value => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-400">
                    {t("priority")}
                  </label>
                  <select
                    value={priorityDraft}
                    onChange={e =>
                      setPriorityDraft(e.target.value as IncidentPriority)
                    }
                    className="w-full rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-sm text-white"
                  >
                    {Object.values(IncidentPriority).map(value => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-400">
                  {t("resolutionNotes")}
                </label>
                <textarea
                  value={notesDraft}
                  onChange={e => setNotesDraft(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-sm text-white"
                />
              </div>

              {incident.statusHistory.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-300">
                    {t("history")}
                  </p>
                  <ul className="max-h-40 space-y-2 overflow-y-auto">
                    {incident.statusHistory.map(entry => (
                      <li
                        key={entry.id}
                        className="rounded-lg bg-white/5 px-3 py-2 text-xs text-gray-400"
                      >
                        <span className="text-gray-200">
                          {entry.fromStatus ?? "—"} → {entry.toStatus}
                        </span>
                        {" · "}
                        {entry.changedBy.name ?? entry.changedBy.email}
                        {" · "}
                        {new Date(entry.createdAt).toLocaleString("pt-BR")}
                        {entry.notes && (
                          <p className="mt-1 text-gray-500">{entry.notes}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {incident && (
          <div className="flex flex-col gap-2 border-t border-white/10 p-4 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              {t("closeModal")}
            </Button>
            {incident.status !== IncidentStatus.RESOLVED &&
              incident.status !== IncidentStatus.CANCELLED && (
                <Button
                  type="button"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500"
                  disabled={saving}
                  onClick={resolveIncident}
                >
                  {t("resolve")}
                </Button>
              )}
            <Button
              type="button"
              className="flex-1 bg-violet-600 hover:bg-violet-500"
              disabled={saving}
              onClick={saveChanges}
            >
              {saving ? t("saving") : t("saveChanges")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function MetaField({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-white/5 px-3 py-2">
      <p className="mb-1 flex items-center gap-1.5 text-xs text-gray-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <div className="text-sm text-gray-200">{value}</div>
    </div>
  );
}
