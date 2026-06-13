"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { AdminPageContent, AdminPageHeader } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface Plan {
  id: string;
  name: string;
  slug: string;
  maxRooms: number;
  maxUsers: number;
  maxReservationsPerMonth: number | null;
  isActive: boolean;
  _count: { organizations: number; subscriptions: number };
}

const emptyForm = {
  name: "",
  slug: "",
  maxRooms: 10,
  maxUsers: 50,
  maxReservationsPerMonth: "",
  isActive: true,
};

export default function AdminPlansPage() {
  const t = useTranslations("Admin.plans");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

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

  const createPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          maxRooms: Number(form.maxRooms),
          maxUsers: Number(form.maxUsers),
          maxReservationsPerMonth: form.maxReservationsPerMonth
            ? Number(form.maxReservationsPerMonth)
            : null,
          isActive: form.isActive,
        }),
      });
      if (res.ok) {
        setForm(emptyForm);
        await fetchPlans();
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (plan: Plan) => {
    await fetch(`/api/admin/plans/${plan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !plan.isActive }),
    });
    await fetchPlans();
  };

  return (
    <>
      <AdminPageHeader title={t("title")} description={t("description")} />
      <AdminPageContent>
      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Novo plano</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createPlan} className="space-y-4">
              <input
                required
                placeholder="Nome"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
              />
              <input
                required
                placeholder="slug-do-plano"
                value={form.slug}
                onChange={e => setForm({ ...form, slug: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min={1}
                  placeholder="Max salas"
                  value={form.maxRooms}
                  onChange={e =>
                    setForm({ ...form, maxRooms: Number(e.target.value) })
                  }
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
                />
                <input
                  type="number"
                  min={1}
                  placeholder="Max usuários"
                  value={form.maxUsers}
                  onChange={e =>
                    setForm({ ...form, maxUsers: Number(e.target.value) })
                  }
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
                />
              </div>
              <input
                type="number"
                min={1}
                placeholder="Max reservas/mês (opcional)"
                value={form.maxReservationsPerMonth}
                onChange={e =>
                  setForm({
                    ...form,
                    maxReservationsPerMonth: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
              />
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Criar plano"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            plans.map(plan => (
              <Card key={plan.id} className="border-white/10 bg-white/5">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-white">
                      {plan.name}
                      {!plan.isActive && (
                        <span className="ml-2 text-xs text-gray-500">
                          (inativo)
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-400">
                      {plan.maxRooms} salas · {plan.maxUsers} usuários ·{" "}
                      {plan._count.organizations} orgs
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(plan)}
                  >
                    {plan.isActive ? "Desativar" : "Ativar"}
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      </AdminPageContent>
    </>
  );
}
