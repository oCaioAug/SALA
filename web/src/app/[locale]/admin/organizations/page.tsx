"use client";

import { OrganizationStatus } from "@/lib/auth/roles";
import { Building2, Plus, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Pagination } from "@/components/ui/Pagination";
import { Link } from "@/navigation";

interface OrganizationListItem {
  id: string;
  name: string;
  slug: string;
  status: OrganizationStatus;
  createdAt: string;
  owner: { id: string; name: string | null; email: string };
  _count: { members: number; rooms: number };
}

const statusLabels: Record<OrganizationStatus, string> = {
  ACTIVE: "Ativa",
  SUSPENDED: "Suspensa",
  TRIAL: "Trial",
};

const statusColors: Record<OrganizationStatus, string> = {
  ACTIVE: "bg-emerald-500/20 text-emerald-300",
  SUSPENDED: "bg-red-500/20 text-red-300",
  TRIAL: "bg-amber-500/20 text-amber-300",
};

export default function OrganizationsPage() {
  const t = useTranslations("Admin.organizations");
  const [organizations, setOrganizations] = useState<OrganizationListItem[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchOrgs = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: "12",
        });
        if (search) params.set("search", search);
        if (statusFilter !== "all") params.set("status", statusFilter);

        const res = await fetch(`/api/admin/organizations?${params}`);
        if (!res.ok) throw new Error("Erro ao carregar");
        const json = await res.json();
        setOrganizations(json.data);
        setTotalPages(json.pagination.totalPages);
        setTotal(json.pagination.total);
      } catch {
        setOrganizations([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchOrgs, 300);
    return () => clearTimeout(debounce);
  }, [search, statusFilter, page]);

  return (
    <AdminLayout title={t("title")} description={t("description")}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nome, slug ou e-mail do owner..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-violet-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          >
            <option value="all">Todos os status</option>
            <option value="ACTIVE">Ativas</option>
            <option value="SUSPENDED">Suspensas</option>
            <option value="TRIAL">Trial</option>
          </select>
          <Link href="/admin/organizations/new">
            <Button className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500">
              <Plus className="h-4 w-4" />
              Nova organização
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : organizations.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-12 w-12 text-gray-600" />}
          title={t("emptyTitle")}
          description={t("emptyDesc")}
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {organizations.map(org => (
              <Link key={org.id} href={`/admin/organizations/${org.id}`}>
                <Card className="border-white/10 bg-white/5 transition-colors hover:border-violet-500/30 hover:bg-white/10">
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-white">{org.name}</h3>
                        <p className="text-xs text-gray-500">{org.slug}</p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[org.status]}`}
                      >
                        {statusLabels[org.status]}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-400">
                      <p>
                        Owner:{" "}
                        <span className="text-gray-300">
                          {org.owner.name ?? org.owner.email}
                        </span>
                      </p>
                      <p>
                        {org._count.members} membros · {org._count.rooms} salas
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                page={page}
                pageSize={12}
                total={total}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
