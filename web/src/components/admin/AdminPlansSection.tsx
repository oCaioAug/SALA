"use client";

import {
  Building2,
  CalendarDays,
  CheckCircle2,
  DoorOpen,
  HelpCircle,
  Plus,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";

import {
  adminCardClass,
  adminInputClass,
  adminModalClass,
  adminModalHeaderClass,
} from "@/components/admin/admin-styles";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { cn } from "@/lib/utils";

export interface AdminPlan {
  id: string;
  name: string;
  slug: string;
  maxRooms: number;
  maxUsers: number;
  maxReservationsPerMonth: number | null;
  isActive: boolean;
  _count: { organizations: number; subscriptions: number };
}

type PlanFormState = {
  name: string;
  slug: string;
  maxRooms: string;
  maxUsers: string;
  maxReservationsPerMonth: string;
  isActive: boolean;
};

const emptyForm: PlanFormState = {
  name: "",
  slug: "",
  maxRooms: "10",
  maxUsers: "50",
  maxReservationsPerMonth: "",
  isActive: true,
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function FieldLabel({
  id,
  label,
  tip,
}: {
  id: string;
  label: string;
  tip?: string;
}) {
  return (
    <div className="mb-1.5 flex items-center gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {tip && (
        <span
          title={tip}
          className="inline-flex cursor-help text-muted-foreground"
        >
          <HelpCircle className="h-3.5 w-3.5" aria-hidden />
          <span className="sr-only">{tip}</span>
        </span>
      )}
    </div>
  );
}

function PlanDetail({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary dark:text-primary" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function AdminPlanCard({
  plan,
  onToggleActive,
  onEdit,
  toggling,
}: {
  plan: AdminPlan;
  onToggleActive: (plan: AdminPlan) => void;
  onEdit: (plan: AdminPlan) => void;
  toggling: boolean;
}) {
  const t = useTranslations("Admin.plans.card");

  return (
    <article
      className={cn(
        adminCardClass,
        "flex flex-col p-6 transition-all duration-200 hover:border-primary/30 hover:shadow-md"
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold text-foreground">
            {plan.name}
          </h3>
        </div>
        <span className="shrink-0 rounded-lg bg-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {plan.slug}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-border py-4">
        <PlanDetail icon={DoorOpen} label={t("spaces")} value={plan.maxRooms} />
        <PlanDetail icon={Users} label={t("users")} value={plan.maxUsers} />
        <PlanDetail
          icon={CalendarDays}
          label={t("reservations")}
          value={
            plan.maxReservationsPerMonth != null
              ? plan.maxReservationsPerMonth
              : t("unlimited")
          }
        />
        <PlanDetail
          icon={Building2}
          label={t("organizations")}
          value={plan._count.organizations}
        />
      </div>

      <div className="mt-auto space-y-3 border-t border-border pt-4">
        <div
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold",
            plan.isActive
              ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
              : "bg-red-500/15 text-red-800 dark:text-red-300"
          )}
        >
          {plan.isActive ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0" />
          )}
          {plan.isActive ? t("active") : t("inactive")}
          <span className="text-xs font-normal text-muted-foreground">
            · {plan._count.subscriptions} {t("subscriptions")}
          </span>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(plan)}
          >
            {t("edit")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={toggling}
            onClick={() => onToggleActive(plan)}
          >
            {plan.isActive ? t("deactivate") : t("activate")}
          </Button>
        </div>
      </div>
    </article>
  );
}

function PlanFormModal({
  open,
  mode,
  saving,
  form,
  slugTouched,
  error,
  onClose,
  onChange,
  onSlugChange,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  saving: boolean;
  form: PlanFormState;
  slugTouched: boolean;
  error: string | null;
  onClose: () => void;
  onChange: (patch: Partial<PlanFormState>) => void;
  onSlugChange: (slug: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const t = useTranslations("Admin.plans");
  const [showSlugField, setShowSlugField] = useState(false);

  useEffect(() => {
    if (open) {
      setShowSlugField(slugTouched || mode === "edit");
    }
  }, [open, slugTouched, mode]);

  if (!open) return null;

  const showSlugEditor = showSlugField || slugTouched || mode === "edit";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label={t("actions.cancel")}
      />
      <div
        className={cn(
          adminModalClass,
          "relative z-10 flex max-h-[90vh] w-full max-w-md flex-col"
        )}
      >
        <div className={cn(adminModalHeaderClass, "items-center")}>
          <h2 className="text-lg font-bold text-foreground">
            {mode === "edit" ? t("editTitle") : t("createTitle")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="overflow-y-auto px-6 py-5">
          <div className="space-y-4">
            <div>
              <FieldLabel id="plan-name" label={t("fields.name")} />
              <input
                id="plan-name"
                required
                autoFocus
                value={form.name}
                onChange={e => {
                  const name = e.target.value;
                  onChange({
                    name,
                    ...(!slugTouched && mode === "create"
                      ? { slug: slugify(name) }
                      : {}),
                  });
                }}
                className={cn(adminInputClass, "w-full")}
                placeholder={t("fields.namePlaceholder")}
              />
              {!showSlugEditor && form.slug && (
                <button
                  type="button"
                  onClick={() => setShowSlugField(true)}
                  className="mt-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  slug:{" "}
                  <span className="font-mono text-foreground/90">
                    {form.slug}
                  </span>
                  {" · "}
                  {t("actions.editSlug")}
                </button>
              )}
            </div>

            {showSlugEditor && (
              <div>
                <FieldLabel
                  id="plan-slug"
                  label={t("fields.slug")}
                  tip={t("fields.slugHint")}
                />
                <input
                  id="plan-slug"
                  required
                  value={form.slug}
                  onChange={e => onSlugChange(e.target.value)}
                  className={cn(adminInputClass, "w-full font-mono text-sm")}
                  placeholder={t("fields.slugPlaceholder")}
                  pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                />
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div>
                <FieldLabel id="plan-max-rooms" label={t("card.spaces")} />
                <input
                  id="plan-max-rooms"
                  type="number"
                  min={1}
                  required
                  value={form.maxRooms}
                  onChange={e => onChange({ maxRooms: e.target.value })}
                  className={cn(adminInputClass, "w-full tabular-nums")}
                />
              </div>
              <div>
                <FieldLabel id="plan-max-users" label={t("card.users")} />
                <input
                  id="plan-max-users"
                  type="number"
                  min={1}
                  required
                  value={form.maxUsers}
                  onChange={e => onChange({ maxUsers: e.target.value })}
                  className={cn(adminInputClass, "w-full tabular-nums")}
                />
              </div>
              <div>
                <FieldLabel
                  id="plan-max-reservations"
                  label={t("card.reservations")}
                  tip={t("fields.maxReservationsHint")}
                />
                <input
                  id="plan-max-reservations"
                  type="number"
                  min={1}
                  value={form.maxReservationsPerMonth}
                  onChange={e =>
                    onChange({ maxReservationsPerMonth: e.target.value })
                  }
                  className={cn(adminInputClass, "w-full tabular-nums")}
                  placeholder="—"
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border px-4 py-3">
              <span className="text-sm font-medium text-foreground">
                {t("fields.isActive")}
              </span>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={e => onChange({ isActive: e.target.checked })}
                className="h-4 w-4 rounded border-border text-primary focus:ring-ring/40"
              />
            </label>
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("actions.cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving
                ? t("actions.saving")
                : mode === "edit"
                  ? t("actions.save")
                  : t("actions.create")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AdminPlansSection() {
  const t = useTranslations("Admin.plans");
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<PlanFormState>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/admin/plans");
      if (res.ok) setPlans(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setSlugTouched(false);
    setError(null);
    setEditingPlanId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalMode("create");
  };

  const openEditModal = (plan: AdminPlan) => {
    setForm({
      name: plan.name,
      slug: plan.slug,
      maxRooms: String(plan.maxRooms),
      maxUsers: String(plan.maxUsers),
      maxReservationsPerMonth:
        plan.maxReservationsPerMonth != null
          ? String(plan.maxReservationsPerMonth)
          : "",
      isActive: plan.isActive,
    });
    setSlugTouched(true);
    setEditingPlanId(plan.id);
    setError(null);
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    resetForm();
  };

  const savePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      maxRooms: Number(form.maxRooms),
      maxUsers: Number(form.maxUsers),
      maxReservationsPerMonth: form.maxReservationsPerMonth
        ? Number(form.maxReservationsPerMonth)
        : null,
      isActive: form.isActive,
    };
    try {
      const res =
        modalMode === "edit" && editingPlanId
          ? await fetch(`/api/admin/plans/${editingPlanId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
          : await fetch("/api/admin/plans", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
      if (!res.ok) {
        setError(
          modalMode === "edit"
            ? t("errors.updateFailed")
            : t("errors.createFailed")
        );
        return;
      }
      closeModal();
      setLoading(true);
      await fetchPlans();
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (plan: AdminPlan) => {
    setTogglingId(plan.id);
    setListError(null);
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !plan.isActive }),
      });
      if (!res.ok) {
        setListError(t("errors.updateFailed"));
        return;
      }
      await fetchPlans();
    } finally {
      setTogglingId(null);
    }
  };

  const activeCount = plans.filter(p => p.isActive).length;
  const plansLabel =
    plans.length === 1 ? t("summaryPlanOne") : t("summaryPlanMany");
  const activeLabel =
    activeCount === 1 ? t("summaryActiveOne") : t("summaryActiveMany");

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {plans.length} {plansLabel} · {activeCount} {activeLabel}
        </p>
        <Button onClick={openCreateModal} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          {t("createButton")}
        </Button>
      </div>

      {listError && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">{listError}</p>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : plans.length === 0 ? (
        <EmptyState
          icon={<DoorOpen className="h-12 w-12 text-muted-foreground" />}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          action={{ label: t("createButton"), onClick: openCreateModal }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {plans.map(plan => (
            <AdminPlanCard
              key={plan.id}
              plan={plan}
              onToggleActive={toggleActive}
              onEdit={openEditModal}
              toggling={togglingId === plan.id}
            />
          ))}
        </div>
      )}

      <PlanFormModal
        open={modalMode !== null}
        mode={modalMode === "edit" ? "edit" : "create"}
        saving={saving}
        form={form}
        slugTouched={slugTouched}
        error={error}
        onClose={closeModal}
        onChange={patch => setForm(prev => ({ ...prev, ...patch }))}
        onSlugChange={slug => {
          setSlugTouched(true);
          setForm(prev => ({ ...prev, slug: slugify(slug) }));
        }}
        onSubmit={savePlan}
      />
    </>
  );
}
