"use client";

import {
  OrganizationRole,
  OrganizationStatus,
  SubscriptionStatus,
} from "@prisma/client";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  DoorOpen,
  Mail,
  Settings,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { AdminMetricCards } from "@/components/admin/AdminMetricCards";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTabPanel, AdminTabs } from "@/components/admin/AdminTabs";
import { OrganizationDailyStatsChart } from "@/components/admin/OrganizationDailyStatsChart";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export interface OrganizationUsage {
  planName: string | null;
  maxRooms: number | null;
  maxUsers: number | null;
  maxReservationsPerMonth: number | null;
  roomsCount: number;
  membersCount: number;
  reservationsThisMonth: number;
}

export interface OrganizationDetail {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  status: OrganizationStatus;
  isSchool: boolean;
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

const roleLabels: Record<OrganizationRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Membro",
};

const statusLabels: Record<OrganizationStatus, string> = {
  ACTIVE: "Ativa",
  SUSPENDED: "Suspensa",
  TRIAL: "Trial",
};

type OrgDetailTab = "general" | "members" | "rooms" | "usage";

interface OrganizationDetailViewProps {
  org: OrganizationDetail;
  plans: { id: string; name: string }[];
  updating: boolean;
  memberEmail: string;
  setMemberEmail: (value: string) => void;
  memberRole: OrganizationRole;
  setMemberRole: (value: OrganizationRole) => void;
  updateStatus: (status: OrganizationStatus) => void;
  updateIsSchool: (isSchool: boolean) => void;
  memberRoleDrafts: Record<string, OrganizationRole>;
  setMemberRoleDrafts: React.Dispatch<
    React.SetStateAction<Record<string, OrganizationRole>>
  >;
  saveMemberRole: (userId: string) => void;
  savingMemberRoleId: string | null;
  updatePlan: (planId: string) => void;
  addMember: (e: React.FormEvent) => void;
  removeMember: (userId: string) => void;
  profileDraft: {
    name: string;
    slug: string;
    email: string;
    phone: string;
  };
  setProfileDraft: React.Dispatch<
    React.SetStateAction<{
      name: string;
      slug: string;
      email: string;
      phone: string;
    }>
  >;
  saveProfile: (e: React.FormEvent) => void;
  transferOwnership: (userId: string) => void;
  deleteOrganization: () => void;
}

export function OrganizationDetailView({
  org,
  plans,
  updating,
  memberEmail,
  setMemberEmail,
  memberRole,
  setMemberRole,
  updateStatus,
  updateIsSchool,
  memberRoleDrafts,
  setMemberRoleDrafts,
  saveMemberRole,
  savingMemberRoleId,
  updatePlan,
  addMember,
  removeMember,
  profileDraft,
  setProfileDraft,
  saveProfile,
  transferOwnership,
  deleteOrganization,
}: OrganizationDetailViewProps) {
  const t = useTranslations("Admin.organizations");
  const [activeTab, setActiveTab] = useState<OrgDetailTab>("general");

  const tabs = [
    { id: "general" as const, label: t("tabs.general"), icon: Building2 },
    { id: "members" as const, label: t("tabs.members"), icon: Users },
    { id: "rooms" as const, label: t("tabs.rooms"), icon: DoorOpen },
    { id: "usage" as const, label: t("tabs.usage"), icon: Settings },
  ];

  const summaryMetrics = [
    {
      id: "members",
      label: "Membros",
      value: org._count.members,
      icon: Users,
      iconClassName: "text-blue-400",
    },
    {
      id: "rooms",
      label: "Salas",
      value: org._count.rooms,
      icon: DoorOpen,
      iconClassName: "text-emerald-400",
    },
    {
      id: "reservations",
      label: "Reservas (30d)",
      value: org.metrics.reservationsLast30Days,
      icon: BarChart3,
      iconClassName: "text-primary",
    },
    {
      id: "incidents",
      label: "Incidentes abertos",
      value: org.metrics.openIncidents,
      icon: AlertTriangle,
      iconClassName: "text-orange-400",
    },
  ];

  return (
    <div className="space-y-6">
      <AdminMetricCards metrics={summaryMetrics} />

      <AdminTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={id => setActiveTab(id as OrgDetailTab)}
      />

      <AdminTabPanel tabId="general" activeTab={activeTab}>
        <div className="space-y-6 pt-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Building2 className="h-5 w-5" />
                {t("tabs.general")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={saveProfile} className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">
                    {t("fields.name")}
                  </label>
                  <input
                    value={profileDraft.name}
                    onChange={e =>
                      setProfileDraft(prev => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">
                    {t("fields.slug")}
                  </label>
                  <input
                    value={profileDraft.slug}
                    onChange={e =>
                      setProfileDraft(prev => ({
                        ...prev,
                        slug: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">
                    {t("fields.email")}
                  </label>
                  <input
                    type="email"
                    value={profileDraft.email}
                    onChange={e =>
                      setProfileDraft(prev => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">
                    {t("fields.phone")}
                  </label>
                  <input
                    value={profileDraft.phone}
                    onChange={e =>
                      setProfileDraft(prev => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>
                <Button type="submit" size="sm" disabled={updating}>
                  {updating ? t("savingProfile") : t("saveProfile")}
                </Button>
              </form>

              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {t("fields.status")}:
                </span>
                <AdminStatusBadge status={org.status} kind="organization" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("changeStatus")}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(
                    [
                      OrganizationStatus.ACTIVE,
                      OrganizationStatus.TRIAL,
                      OrganizationStatus.SUSPENDED,
                    ] as OrganizationStatus[]
                  ).map(status => (
                    <Button
                      key={status}
                      size="sm"
                      variant={org.status === status ? "primary" : "outline"}
                      disabled={updating || org.status === status}
                      onClick={() => updateStatus(status)}
                      className={
                        org.status === status ? "bg-primary" : undefined
                      }
                    >
                      {statusLabels[status]}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Instituição de Ensino
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-sm text-foreground">
                    {org.isSchool ? "Sim" : "Não"}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateIsSchool(!org.isSchool)}
                    disabled={updating}
                  >
                    Alternar
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Owner</p>
                <div className="mt-1 flex items-center gap-2 text-foreground">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {org.owner.name ?? org.owner.email}
                  <span className="text-muted-foreground">
                    ({org.owner.email})
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("createdAt")}
                </p>
                <p className="text-foreground">
                  {new Date(org.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="border-t border-border pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="border-red-500/40 text-red-300 hover:bg-red-500/10"
                  disabled={updating}
                  onClick={deleteOrganization}
                >
                  {t("deleteOrg")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <OrganizationDailyStatsChart organizationId={org.id} />
        </div>
      </AdminTabPanel>

      <AdminTabPanel tabId="members" activeTab={activeTab}>
        <Card className="mt-6 border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">
              {t("tabs.members")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={addMember} className="flex flex-wrap gap-2">
              <input
                type="email"
                placeholder={t("addMemberPlaceholder")}
                value={memberEmail}
                onChange={e => setMemberEmail(e.target.value)}
                className="min-w-[12rem] flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
              />
              <select
                value={memberRole}
                onChange={e =>
                  setMemberRole(e.target.value as OrganizationRole)
                }
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
              >
                <option value={OrganizationRole.MEMBER}>
                  {roleLabels.MEMBER}
                </option>
                <option value={OrganizationRole.ADMIN}>
                  {roleLabels.ADMIN}
                </option>
              </select>
              <Button type="submit" size="sm">
                {t("addMember")}
              </Button>
            </form>
            <div className="max-h-[28rem] space-y-2 overflow-y-auto">
              {org.members.map(member => (
                <div
                  key={member.id}
                  className="flex flex-col gap-3 rounded-lg bg-muted/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {member.user.name ?? member.user.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {member.user.email}
                    </p>
                  </div>
                  {member.role === OrganizationRole.OWNER ? (
                    <span className="text-xs font-medium text-primary dark:text-primary">
                      Owner
                    </span>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={memberRoleDrafts[member.user.id] ?? member.role}
                        onChange={e =>
                          setMemberRoleDrafts(prev => ({
                            ...prev,
                            [member.user.id]: e.target
                              .value as OrganizationRole,
                          }))
                        }
                        className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground"
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
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={updating}
                        onClick={() => transferOwnership(member.user.id)}
                      >
                        {t("transferOwnership")}
                      </Button>
                      <button
                        type="button"
                        onClick={() => removeMember(member.user.id)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        {t("removeMember")}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </AdminTabPanel>

      <AdminTabPanel tabId="rooms" activeTab={activeTab}>
        <Card className="mt-6 border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">
              {t("tabs.rooms")} ({org.rooms.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {org.rooms.length === 0 ? (
              <EmptyState
                icon={<DoorOpen className="h-10 w-10 text-gray-600" />}
                title={t("noRoomsTitle")}
                description={t("noRoomsDesc")}
              />
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {org.rooms.map(room => (
                  <div
                    key={room.id}
                    className="rounded-lg bg-muted/50 px-4 py-3 text-sm"
                  >
                    <p className="font-medium text-foreground">{room.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {room.status}
                      {room.capacity ? ` · ${room.capacity} lugares` : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </AdminTabPanel>

      <AdminTabPanel tabId="usage" activeTab={activeTab}>
        <div className="space-y-6 pt-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">
                {t("usageVsLimits")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UsageSection usage={org.usage} />
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">
                {t("planSubscription")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground">
                {org.plan?.name ?? t("noPlan")}
                {org.subscription && (
                  <>
                    {" "}
                    <AdminStatusBadge
                      status={org.subscription.status}
                      kind="subscription"
                      className="ml-2"
                    />
                    <span className="ml-2 text-xs text-muted-foreground">
                      {t("renewsOn")}{" "}
                      {new Date(
                        org.subscription.currentPeriodEnd
                      ).toLocaleDateString("pt-BR")}
                    </span>
                  </>
                )}
              </p>
              {plans.length > 0 && (
                <div>
                  <label
                    htmlFor="org-plan-select"
                    className="mb-2 block text-sm text-muted-foreground"
                  >
                    {t("changePlan")}
                  </label>
                  <select
                    id="org-plan-select"
                    disabled={updating}
                    value={org.planId ?? ""}
                    onChange={e => updatePlan(e.target.value)}
                    className="w-full max-w-sm rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  >
                    {plans.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminTabPanel>
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
    <div className="space-y-3">
      {rows.map(row => (
        <UsageBar key={row.label} {...row} />
      ))}
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
    pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-primary";

  return (
    <div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>
          {current}
          {max != null ? ` / ${max}` : ""}
        </span>
      </div>
      {max != null && (
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
          <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}
