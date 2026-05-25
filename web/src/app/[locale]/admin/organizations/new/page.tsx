"use client";

import { OrganizationStatus } from "@prisma/client";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { AdminLayout } from "@/components/admin/AdminLayout";
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
  const [form, setForm] = useState({
    name: "",
    slug: "",
    ownerEmail: "",
    ownerName: "",
    status: OrganizationStatus.ACTIVE as OrganizationStatus,
  });

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

      router.push(`/admin/organizations/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title={t("newTitle")} description={t("newDesc")}>
      <Card className="mx-auto max-w-xl border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">Dados da organização</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}

            <Input
              label="Nome da organização"
              value={form.name}
              onChange={e => handleNameChange(e.target.value)}
              required
            />

            <Input
              label="Slug (URL)"
              value={form.slug}
              onChange={e =>
                setForm(prev => ({ ...prev, slug: e.target.value }))
              }
              required
            />

            <div>
              <label className="mb-1 block text-sm text-gray-400">Status</label>
              <select
                value={form.status}
                onChange={e =>
                  setForm(prev => ({
                    ...prev,
                    status: e.target.value as OrganizationStatus,
                  }))
                }
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
              >
                <option value="ACTIVE">Ativa</option>
                <option value="TRIAL">Trial</option>
                <option value="SUSPENDED">Suspensa</option>
              </select>
            </div>

            <Input
              label="E-mail do owner"
              type="email"
              value={form.ownerEmail}
              onChange={e =>
                setForm(prev => ({ ...prev, ownerEmail: e.target.value }))
              }
              required
            />

            <Input
              label="Nome do owner (opcional)"
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
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-violet-600 hover:bg-violet-500"
              >
                {loading ? "Criando..." : "Criar organização"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
