"use client";

import {
  OrganizationRole,
  OrganizationStatus,
  SubscriptionStatus,
} from "@prisma/client";
import { ArrowLeft, Building2, DoorOpen, Mail, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { OrganizationDailyStatsChart } from "@/components/admin/OrganizationDailyStatsChart";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Link } from "@/navigation";

interface OrganizationUsage {
  planName: string | null;
  maxRooms: number | null;
  maxUsers: number | null;
  maxReservationsPerMonth: number | null;
  roomsCount: number;
  membersCount: number;
  reservationsThisMonth: number;
}

interface OrganizationDetail {
  id: string;
  name: string;
  slug: string;
  status: OrganizationStatus;
  createdAt: string;
  planId: string | null;
  plan: {
    id: string;
    name: string;
    slug: string;
    maxRooms: number;
    maxUsers: number;
    maxReservationsPerMonth: number | null;
  } | null;
  subscription: {
    id: string;
    status: SubscriptionStatus;
    currentPeriodEnd: string;
    plan: { id: string; name: string; slug: string };
  } | null;
  owner: {
    id: string;
    name: string | null;
    email: string;
    image?: string | null;
  };
  members: {
    id: string;
    role: OrganizationRole;
    user: {
      id: string;
      name: string | null;
      email: string;
      role: string;
      createdAt: string;
    };
  }[];
  metrics: { reservationsLast30Days: number; openIncidents: number };
  usage: OrganizationUsage;
  rooms: {
    id: string;
    name: string;
    status: string;
    capacity: number | null;
  }[];
  _count: { members: number; rooms: number };
}

const statusLabels: Record<OrganizationStatus, string> = {
  ACTIVE: "Ativa",
  SUSPENDED: "Suspensa",
  TRIAL: "Trial",
};

const roleLabels: Record<OrganizationRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Membro",
};

export default function OrganizationDetailPage() {
  const t = useTranslations("Admin.organizations");
  const params = useParams();
  const id = params.id as string;
  const [org, setOrg] = useState<OrganizationDetail | null>(null);
  const [plans, setPlans] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRoleDrafts, setMemberRoleDrafts] = useState<
    Record<string, OrganizationRole>
  >({});
  const [savingMemberRoleId, setSavingMemberRoleId] = useState<string | null>(
    null
  );

  const fetchOrg = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/organizations/${id}`);
      if (!res.ok) throw new Error("Não encontrada");
      setOrg(await res.json());
    } catch {
      setOrg(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrg();
    fetch("/api/admin/plans")
      .then(r => (r.ok ? r.json() : []))
      .then(setPlans)
      .catch(() => setPlans([]));
  }, [fetchOrg]);

  useEffect(() => {
    if (!org) return;
    const drafts: Record<string, OrganizationRole> = {};
    for (const member of org.members) {
      if (member.role !== OrganizationRole.OWNER) {
        drafts[member.user.id] = member.role;
      }
    }
    setMemberRoleDrafts(drafts);
  }, [org]);

  const updateStatus = async (status: OrganizationStatus) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/organizations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) await fetchOrg();
    } finally {
      setUpdating(false);
    }
  };

  const saveMemberRole = async (userId: string) => {
    const role = memberRoleDrafts[userId];
    const savedRole = org?.members.find(m => m.user.id === userId)?.role;
    if (!role || role === savedRole) return;

    setSavingMemberRoleId(userId);
    try {
      const res = await fetch(
        `/api/admin/organizations/${id}/members/${userId}/role`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        }
      );
      if (res.ok) await fetchOrg();
    } finally {
      setSavingMemberRoleId(null);
    }
  };

  const updatePlan = async (planId: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/organizations/${id}/subscription`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      if (res.ok) await fetchOrg();
    } finally {
      setUpdating(false);
    }
  };

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberEmail.trim()) return;
    const res = await fetch(`/api/admin/organizations/${id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: memberEmail.trim(), role: "MEMBER" }),
    });
    if (res.ok) {
      setMemberEmail("");
      await fetchOrg();
    }
  };

  const removeMember = async (userId: string) => {
    if (!confirm("Remover este membro da organização?")) return;
    const res = await fetch(
      `/api/admin/organizations/${id}/members?userId=${userId}`,
      { method: "DELETE" }
    );
    if (res.ok) await fetchOrg();
  };

  if (loading) {
    return (
      <AdminLayout title={t("detailTitle")}>
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  if (!org) {
    return (
      <AdminLayout title={t("notFound")}>
        <Link href="/admin/organizations" className="text-violet-400">
          Voltar
        </Link>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={org.name} description={`Slug: ${org.slug}`}>
      <Link
        href="/admin/organizations"
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para organizações
      </Link>

      <MotionlessOrgDetail
        org={org}
        plans={plans}
        updating={updating}
        memberEmail={memberEmail}
        setMemberEmail={setMemberEmail}
        updateStatus={updateStatus}
        memberRoleDrafts={memberRoleDrafts}
        setMemberRoleDrafts={setMemberRoleDrafts}
        saveMemberRole={saveMemberRole}
        savingMemberRoleId={savingMemberRoleId}
        updatePlan={updatePlan}
        addMember={addMember}
        removeMember={removeMember}
      />
    </AdminLayout>
  );
}

function MotionlessOrgDetail({
  org,
  plans,
  updating,
  memberEmail,
  setMemberEmail,
  updateStatus,
  memberRoleDrafts,
  setMemberRoleDrafts,
  saveMemberRole,
  savingMemberRoleId,
  updatePlan,
  addMember,
  removeMember,
}: {
  org: OrganizationDetail;
  plans: { id: string; name: string }[];
  updating: boolean;
  memberEmail: string;
  setMemberEmail: (v: string) => void;
  updateStatus: (s: OrganizationStatus) => void;
  memberRoleDrafts: Record<string, OrganizationRole>;
  setMemberRoleDrafts: React.Dispatch<
    React.SetStateAction<Record<string, OrganizationRole>>
  >;
  saveMemberRole: (userId: string) => void;
  savingMemberRoleId: string | null;
  updatePlan: (planId: string) => void;
  addMember: (e: React.FormEvent) => void;
  removeMember: (userId: string) => void;
}) {
  const t = useTranslations("Admin.organizations");
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-white/10 bg-white/5">
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-8 w-8 text-blue-400" />
            <div>
              <p className="text-2xl font-bold text-white">
                {org._count.members}
              </p>
              <p className="text-xs text-gray-500">Membros</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5">
          <CardContent className="flex items-center gap-3 p-4">
            <DoorOpen className="h-8 w-8 text-emerald-400" />
            <MotionlessRoomCount count={org._count.rooms} />
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-white">
              {org.metrics.reservationsLast30Days}
            </p>
            <p className="text-xs text-gray-500">Reservas (30d)</p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-white">
              {org.metrics.openIncidents}
            </p>
            <p className="text-xs text-gray-500">Incidentes abertos</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Building2 className="h-5 w-5" />
              Dados gerais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["ACTIVE", "TRIAL", "SUSPENDED"] as OrganizationStatus[]).map(
                  s => (
                    <Button
                      key={s}
                      size="sm"
                      variant={org.status === s ? "primary" : "outline"}
                      disabled={updating || org.status === s}
                      onClick={() => updateStatus(s)}
                      className={org.status === s ? "bg-violet-600" : undefined}
                    >
                      {statusLabels[s]}
                    </Button>
                  )
                )}
              </div>
            </div>
            <UsageSection usage={org.usage} />
            <div>
              <p className="text-sm text-gray-500">Plano / Assinatura</p>
              <p className="text-gray-200">
                {org.plan?.name ?? "Sem plano"}
                {org.subscription && (
                  <span className="ml-2 text-xs text-gray-500">
                    · {org.subscription.status} · renova{" "}
                    {new Date(
                      org.subscription.currentPeriodEnd
                    ).toLocaleDateString("pt-BR")}
                  </span>
                )}
              </p>
              {plans.length > 0 && (
                <select
                  disabled={updating}
                  value={org.planId ?? ""}
                  onChange={e => updatePlan(e.target.value)}
                  className="mt-2 rounded border border-white/10 bg-gray-900 px-2 py-1 text-sm text-white"
                >
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Owner</p>
              <div className="mt-1 flex items-center gap-2 text-gray-200">
                <Mail className="h-4 w-4 text-gray-500" />
                {org.owner.name ?? org.owner.email}
                <span className="text-gray-500">({org.owner.email})</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Criada em</p>
              <p className="text-gray-200">
                {new Date(org.createdAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Membros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={addMember} className="flex gap-2">
              <input
                type="email"
                placeholder="Adicionar membro por email"
                value={memberEmail}
                onChange={e => setMemberEmail(e.target.value)}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              />
              <Button type="submit" size="sm">
                Adicionar
              </Button>
            </form>
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {org.members.map(member => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-200">
                      {member.user.name ?? member.user.email}
                    </p>
                    <p className="text-xs text-gray-500">{member.user.email}</p>
                  </div>
                  {member.role === OrganizationRole.OWNER ? (
                    <span className="text-xs font-medium text-violet-300">
                      Owner
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <select
                        value={memberRoleDrafts[member.user.id] ?? member.role}
                        onChange={e =>
                          setMemberRoleDrafts(prev => ({
                            ...prev,
                            [member.user.id]: e.target
                              .value as OrganizationRole,
                          }))
                        }
                        className="rounded border border-white/10 bg-gray-900 px-2 py-1 text-xs text-white"
                      >
                        <option value="ADMIN">{roleLabels.ADMIN}</option>
                        <option value="MEMBER">{roleLabels.MEMBER}</option>
                      </select>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={
                          savingMemberRoleId === member.user.id ||
                          (memberRoleDrafts[member.user.id] ?? member.role) ===
                            member.role
                        }
                        onClick={() => saveMemberRole(member.user.id)}
                      >
                        {savingMemberRoleId === member.user.id
                          ? "..."
                          : t("saveRole")}
                      </Button>
                      <button
                        type="button"
                        onClick={() => removeMember(member.user.id)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <OrganizationDailyStatsChart organizationId={org.id} />

      {org.rooms.length > 0 && (
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">
              Salas ({org.rooms.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {org.rooms.map(room => (
                <div
                  key={room.id}
                  className="rounded-lg bg-white/5 px-4 py-3 text-sm"
                >
                  <p className="font-medium text-gray-200">{room.name}</p>
                  <p className="text-xs text-gray-500">
                    {room.status}
                    {room.capacity ? ` · ${room.capacity} lugares` : ""}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MotionlessRoomCount({ count }: { count: number }) {
  return (
    <div>
      <p className="text-2xl font-bold text-white">{count}</p>
      <p className="text-xs text-gray-500">Salas</p>
    </div>
  );
}

function UsageSection({ usage }: { usage: OrganizationUsage }) {
  const rows = [
    {
      label: "Salas",
      current: usage.roomsCount,
      max: usage.maxRooms,
    },
    {
      label: "Usuários",
      current: usage.membersCount,
      max: usage.maxUsers,
    },
    {
      label: "Reservas (mês)",
      current: usage.reservationsThisMonth,
      max: usage.maxReservationsPerMonth,
    },
  ];

  return (
    <div>
      <p className="text-sm text-gray-500">Uso vs limites do plano</p>
      <div className="mt-2 space-y-2">
        {rows.map(row => (
          <UsageBar key={row.label} {...row} />
        ))}
      </div>
    </div>
  );
}

function UsageBar({
  label,
  current,
  max,
}: {
  label: string;
  current: number;
  max: number | null;
}) {
  const pct =
    max != null && max > 0
      ? Math.min(100, Math.round((current / max) * 100))
      : 0;
  const tone =
    pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-violet-500";

  return (
    <div>
      <UsageLabel label={label} current={current} max={max} />
      {max != null && (
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
          <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

function UsageLabel({
  label,
  current,
  max,
}: {
  label: string;
  current: number;
  max: number | null;
}) {
  return (
    <div className="flex justify-between text-xs text-gray-400">
      <span>{label}</span>
      <span>
        {current}
        {max != null ? ` / ${max}` : ""}
      </span>
    </div>
  );
}
