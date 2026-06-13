"use client";

import { SubscriptionStatus } from "@prisma/client";
import { Building2, Calendar, CreditCard, User, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Link } from "@/navigation";

export interface AdminBillingSubscription {
  id: string;
  status: SubscriptionStatus;
  externalId: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
  plan: { id: string; name: string; slug: string };
  organization: {
    id: string;
    name: string;
    slug: string;
    status: string;
    owner: { id: string; name: string | null; email: string };
  };
}

interface AdminBillingSubscriptionModalProps {
  subscriptionId: string | null;
  plans: { id: string; name: string }[];
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

function toDateTimeLocalValue(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function AdminBillingSubscriptionModal({
  subscriptionId,
  plans,
  open,
  onClose,
  onUpdated,
}: AdminBillingSubscriptionModalProps) {
  const t = useTranslations("Admin.billing");
  const [subscription, setSubscription] =
    useState<AdminBillingSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusDraft, setStatusDraft] = useState<SubscriptionStatus>(
    SubscriptionStatus.ACTIVE
  );
  const [planDraft, setPlanDraft] = useState("");
  const [periodEndDraft, setPeriodEndDraft] = useState("");

  const fetchSubscription = useCallback(async () => {
    if (!subscriptionId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/billing/subscriptions/${subscriptionId}`
      );
      if (!res.ok) throw new Error("not found");
      const data: AdminBillingSubscription = await res.json();
      setSubscription(data);
      setStatusDraft(data.status);
      setPlanDraft(data.plan.id);
      setPeriodEndDraft(toDateTimeLocalValue(data.currentPeriodEnd));
    } catch {
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [subscriptionId]);

  useEffect(() => {
    if (open && subscriptionId) fetchSubscription();
  }, [open, subscriptionId, fetchSubscription]);

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
    if (!subscription) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/billing/subscriptions/${subscription.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: statusDraft,
            planId: planDraft,
            currentPeriodEnd: new Date(periodEndDraft).toISOString(),
          }),
        }
      );
      if (res.ok) {
        await fetchSubscription();
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
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-start justify-between border-b border-border px-6 py-5">
          <div>
            <p className="text-lg font-bold text-foreground">
              {loading
                ? t("loading")
                : (subscription?.organization.name ?? t("notFound"))}
            </p>
            {subscription && (
              <AdminStatusBadge
                status={subscription.status}
                kind="subscription"
                className="mt-2"
              />
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : !subscription ? (
            <p className="text-sm text-muted-foreground">{t("notFound")}</p>
          ) : (
            <div className="space-y-5">
              <MetaField
                icon={Building2}
                label={t("organization")}
                value={
                  <Link
                    href={`/admin/organizations/${subscription.organization.id}`}
                    className="text-violet-600 hover:text-violet-500 dark:text-violet-700 dark:text-violet-300 dark:hover:text-violet-200"
                    onClick={onClose}
                  >
                    {subscription.organization.name}
                  </Link>
                }
              />
              <MetaField
                icon={User}
                label={t("owner")}
                value={
                  subscription.organization.owner.name ??
                  subscription.organization.owner.email
                }
              />
              <MetaField
                icon={CreditCard}
                label={t("currentPlan")}
                value={subscription.plan.name}
              />
              <MetaField
                icon={Calendar}
                label={t("periodStart")}
                value={new Date(
                  subscription.currentPeriodStart
                ).toLocaleString("pt-BR")}
              />

              <div>
                <label className="mb-1 block text-sm text-muted-foreground">
                  {t("status")}
                </label>
                <select
                  value={statusDraft}
                  onChange={e =>
                    setStatusDraft(e.target.value as SubscriptionStatus)
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  {Object.values(SubscriptionStatus).map(value => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-muted-foreground">
                  {t("changePlan")}
                </label>
                <select
                  value={planDraft}
                  onChange={e => setPlanDraft(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-muted-foreground">
                  {t("periodEnd")}
                </label>
                <input
                  type="datetime-local"
                  value={periodEndDraft}
                  onChange={e => setPeriodEndDraft(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
              </div>

              {subscription.externalId && (
                <p className="text-xs text-muted-foreground">
                  {t("externalId")}: {subscription.externalId}
                </p>
              )}
            </div>
          )}
        </div>

        {subscription && (
          <div className="flex gap-2 border-t border-border p-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              {t("closeModal")}
            </Button>
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
    <div className="rounded-lg bg-muted/50 px-3 py-2">
      <p className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  );
}
