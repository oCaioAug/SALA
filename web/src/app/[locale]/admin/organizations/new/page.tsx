"use client";

import { OrganizationStatus } from "@/lib/auth/roles";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { AdminActionError } from "@/components/admin/AdminActionError";
import {
  AdminPageContent,
  AdminPageHeader,
} from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useApiErrorMessage } from "@/lib/hooks/useApiErrorMessage";
import { slugifyOrganizationName } from "@/lib/validations/admin";
import { useRouter } from "@/navigation";

export default function NewOrganizationPage() {
  const t = useTranslations("Admin.organizations");
  const { fromPayload } = useApiErrorMessage();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [plans, setPlans] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    ownerEmail: "",
    ownerName: "",
    status: OrganizationStatus.ACTIVE as OrganizationStatus,
    planId: "plan-starter",
  });

  useEffect(() => {
    fetch("/api/admin/plans")
      .then(r => (r.ok ? r.json() : []))
      .then((list: { id: string; name: string; isActive?: boolean }[]) => {
        const active = list.filter(p => p.isActive !== false);
        setPlans(active);
        if (active.length > 0 && !active.some(p => p.id === form.planId)) {
          setForm(prev => ({ ...prev, planId: active[0].id }));
        }
      })
      .catch(() => setPlans([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount
  }, []);

  const handleNameChange = (name: string) => {
    setForm(prev => ({
      ...prev,
      name,
      slug: prev.slug || slugifyOrganizationName(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setWarning(null);

    try {
      const res = await fetch("/api/admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(fromPayload(data) || t("newTitle"));
      }

      if (data.ownerCreatedWithoutPassword) {
        sessionStorage.setItem(
          `admin-org-warning-${data.id}`,
          t("ownerWithoutPasswordWarning")
        );
      }

      router.push(`/admin/organizations/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("unknownError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AdminPageHeader title={t("newTitle")} description={t("newDesc")} />
      <AdminPageContent>
        <Card className="mx-auto max-w-xl border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">{t("formTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <AdminActionError message={error} onDismiss={() => setError(null)} />
              {warning && (
                <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
                  {warning}
                </p>
              )}

              <Input
                label={t("fields.name")}
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
                required
              />

              <Input
                label={t("fields.slug")}
                value={form.slug}
                onChange={e =>
                  setForm(prev => ({ ...prev, slug: e.target.value }))
                }
                required
              />

              <div>
                <label className="mb-1 block text-sm text-muted-foreground">
                  {t("fields.status")}
                </label>
                <select
                  value={form.status}
                  onChange={e =>
                    setForm(prev => ({
                      ...prev,
                      status: e.target.value as OrganizationStatus,
                    }))
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                >
                  <option value="ACTIVE">{t("statusActive")}</option>
                  <option value="TRIAL">{t("statusTrial")}</option>
                  <option value="SUSPENDED">{t("statusSuspended")}</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-muted-foreground">
                  {t("fields.plan")}
                </label>
                <select
                  value={form.planId}
                  onChange={e =>
                    setForm(prev => ({ ...prev, planId: e.target.value }))
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                  required
                >
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label={t("fields.ownerEmail")}
                type="email"
                value={form.ownerEmail}
                onChange={e =>
                  setForm(prev => ({ ...prev, ownerEmail: e.target.value }))
                }
                required
              />

              <Input
                label={t("fields.ownerName")}
                value={form.ownerName}
                onChange={e =>
                  setForm(prev => ({ ...prev, ownerName: e.target.value }))
                }
              />

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                >
                  {t("cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary hover:bg-primary"
                >
                  {loading ? t("creating") : t("create")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </AdminPageContent>
    </>
  );
}
