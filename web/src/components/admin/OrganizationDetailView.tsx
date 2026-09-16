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
  Calendar,
  DoorOpen,
  GraduationCap,
  Mail,
  Settings,
  ShieldAlert,
  UserRound,
  Users,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  type ElementType,
  type ReactNode,
  useState,
} from "react";

import { AdminMetricCards } from "@/components/admin/AdminMetricCards";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTabPanel, AdminTabs } from "@/components/admin/AdminTabs";
import { OrganizationDailyStatsChart } from "@/components/admin/OrganizationDailyStatsChart";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Switch } from "@/components/ui/Switch";
import { cn, getIntlLocale } from "@/lib/utils";

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
  legalName?: string | null;
  cnpj?: string | null;
  status: OrganizationStatus;
  isSchool: boolean;
  createdAt: string;
  deletedAt?: string | null;
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

const statusLabelsKey: Record<OrganizationStatus, string> = {
  ACTIVE: "statusActive",
  SUSPENDED: "statusSuspended",
  TRIAL: "statusTrial",
};

const roleLabelsKey: Record<OrganizationRole, string> = {
  OWNER: "roleOwner",
  ADMIN: "roleAdmin",
  MEMBER: "roleMember",
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
    legalName: string;
    cnpj: string;
  };
  setProfileDraft: React.Dispatch<
    React.SetStateAction<{
      name: string;
      slug: string;
      email: string;
      phone: string;
      legalName: string;
      cnpj: string;
    }>
  >;
  saveProfile: (e: React.FormEvent) => void;
  transferOwnership: (userId: string) => void;
  deleteOrganization: () => void;
  restoreOrganization?: () => void;
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
  restoreOrganization,
}: OrganizationDetailViewProps) {
  const t = useTranslations("Admin.organizations");
  const locale = useLocale();
  const intlLocale = getIntlLocale(locale);
  const [activeTab, setActiveTab] = useState<OrgDetailTab>("general");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const isDeleted = Boolean(org.deletedAt);
  const mutationsDisabled = updating || isDeleted;

  const deleteNameMatches =
    deleteConfirmName.trim() === org.name.trim() && org.name.trim().length > 0;

  const openDeleteModal = () => {
    setDeleteConfirmName("");
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (updating) return;
    setIsDeleteModalOpen(false);
    setDeleteConfirmName("");
  };

  const confirmDeleteOrganization = () => {
    if (!deleteNameMatches || updating) return;
    deleteOrganization();
  };

  const tabs = [
    { id: "general" as const, label: t("tabs.general"), icon: Building2 },
    { id: "members" as const, label: t("tabs.members"), icon: Users },
    { id: "rooms" as const, label: t("tabs.rooms"), icon: DoorOpen },
    { id: "usage" as const, label: t("tabs.usage"), icon: Settings },
  ];

  const summaryMetrics = [
    {
      id: "members",
      label: t("metricMembers"),
      value: org._count.members,
      icon: Users,
      iconClassName: "text-blue-400",
    },
    {
      id: "rooms",
      label: t("metricRooms"),
      value: org._count.rooms,
      icon: DoorOpen,
      iconClassName: "text-emerald-400",
    },
    {
      id: "reservations",
      label: t("metricReservations30d"),
      value: org.metrics.reservationsLast30Days,
      icon: BarChart3,
      iconClassName: "text-primary",
    },
    {
      id: "incidents",
      label: t("metricOpenIncidents"),
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
        <div className="space-y-5 pt-6">
          <OrgDetailSection
            icon={Building2}
            title={t("sections.profileTitle")}
            description={t("sections.profileHelp")}
          >
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="org-name"
                  label={t("fields.name")}
                  value={profileDraft.name}
                  onChange={value =>
                    setProfileDraft(prev => ({ ...prev, name: value }))
                  }
                  required
                  disabled={isDeleted}
                />
                <Field
                  id="org-slug"
                  label={t("fields.slug")}
                  value={profileDraft.slug}
                  onChange={value =>
                    setProfileDraft(prev => ({ ...prev, slug: value }))
                  }
                  required
                  disabled={isDeleted}
                />
                <Field
                  id="org-email"
                  label={t("fields.email")}
                  type="email"
                  value={profileDraft.email}
                  onChange={value =>
                    setProfileDraft(prev => ({ ...prev, email: value }))
                  }
                  disabled={isDeleted}
                />
                <Field
                  id="org-phone"
                  label={t("fields.phone")}
                  value={profileDraft.phone}
                  onChange={value =>
                    setProfileDraft(prev => ({ ...prev, phone: value }))
                  }
                  disabled={isDeleted}
                />
                <Field
                  id="org-legal-name"
                  label={t("fields.legalName")}
                  value={profileDraft.legalName}
                  onChange={value =>
                    setProfileDraft(prev => ({ ...prev, legalName: value }))
                  }
                  disabled={isDeleted}
                />
                <Field
                  id="org-cnpj"
                  label={t("fields.cnpj")}
                  value={profileDraft.cnpj}
                  onChange={value =>
                    setProfileDraft(prev => ({ ...prev, cnpj: value }))
                  }
                  disabled={isDeleted}
                />
              </div>
              <div className="flex justify-end border-t border-border pt-4">
                <Button type="submit" size="sm" disabled={mutationsDisabled}>
                  {updating ? t("savingProfile") : t("saveProfile")}
                </Button>
              </div>
            </form>
          </OrgDetailSection>

          <OrgDetailSection
            icon={Settings}
            title={t("sections.statusTitle")}
            description={t("sections.statusHelp")}
            badge={
              <AdminStatusBadge status={org.status} kind="organization" />
            }
          >
            <div className="space-y-5">
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("changeStatus")}
                </p>
                <div
                  className="inline-flex flex-wrap rounded-lg border border-border bg-muted/30 p-1"
                  role="group"
                  aria-label={t("changeStatus")}
                >
                  {(
                    [
                      OrganizationStatus.ACTIVE,
                      OrganizationStatus.TRIAL,
                      OrganizationStatus.SUSPENDED,
                    ] as OrganizationStatus[]
                  ).map(status => {
                    const isActive = org.status === status;
                    return (
                      <button
                        key={status}
                        type="button"
                        disabled={mutationsDisabled || isActive}
                        onClick={() => updateStatus(status)}
                        className={cn(
                          "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                            : "text-muted-foreground hover:text-foreground",
                          "disabled:cursor-not-allowed disabled:opacity-60"
                        )}
                      >
                        {t(statusLabelsKey[status])}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/15 px-3.5 py-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground ring-1 ring-border">
                    <GraduationCap className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {t("isSchool")}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {org.isSchool ? t("yes") : t("no")}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={org.isSchool}
                  disabled={mutationsDisabled}
                  onChange={e => updateIsSchool(e.target.checked)}
                  aria-label={t("isSchool")}
                />
              </div>
            </div>
          </OrgDetailSection>

          <OrgDetailSection
            icon={UserRound}
            title={t("sections.ownershipTitle")}
            description={t("sections.ownershipHelp")}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-muted/15 p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("ownerLabel")}
                </p>
                <div className="mt-2 flex items-start gap-2.5">
                  <Mail
                    className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {org.owner.name ?? org.owner.email}
                    </p>
                    {org.owner.name ? (
                      <p className="truncate text-xs text-muted-foreground">
                        {org.owner.email}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-muted/15 p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("createdAt")}
                </p>
                <div className="mt-2 flex items-center gap-2.5">
                  <Calendar
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <p className="text-sm font-medium tabular-nums text-foreground">
                    {new Date(org.createdAt).toLocaleDateString(intlLocale)}
                  </p>
                </div>
              </div>
            </div>
          </OrgDetailSection>

          <OrgDetailSection
            icon={ShieldAlert}
            title={t("sections.dangerTitle")}
            description={t("sections.dangerHelp")}
            tone="danger"
            badge={
              isDeleted ? (
                <AdminStatusBadge
                  status="deleted"
                  kind="danger"
                  label={t("deleted")}
                />
              ) : undefined
            }
          >
            {isDeleted ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {t("confirmRestoreOrg")}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  disabled={updating || !restoreOrganization}
                  onClick={() => restoreOrganization?.()}
                >
                  {t("restoreOrg")}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {t("deleteOrgConfirm")}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-300 dark:hover:bg-rose-500/10"
                  disabled={updating}
                  onClick={openDeleteModal}
                >
                  {t("deleteOrg")}
                </Button>
              </div>
            )}
          </OrgDetailSection>

          <OrganizationDailyStatsChart organizationId={org.id} />
        </div>
      </AdminTabPanel>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        variant="destructive"
        title={t("deleteOrgModal.title")}
        description={t("deleteOrgModal.risk")}
        confirmLabel={t("deleteOrgModal.confirm")}
        cancelLabel={t("cancel")}
        loading={updating}
        confirmDisabled={!deleteNameMatches}
        onCancel={closeDeleteModal}
        onConfirm={confirmDeleteOrganization}
      >
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-600 dark:text-slate-300">
          <li>{t("deleteOrgModal.riskHide")}</li>
          <li>{t("deleteOrgModal.riskAccess")}</li>
          <li>{t("deleteOrgModal.riskData")}</li>
        </ul>

        <div className="space-y-2">
          <label
            htmlFor="delete-org-confirm-name"
            className="block text-sm font-medium text-slate-800 dark:text-slate-200"
          >
            {t("deleteOrgModal.typeNameLabel", { name: org.name })}
          </label>
          <input
            id="delete-org-confirm-name"
            value={deleteConfirmName}
            onChange={e => setDeleteConfirmName(e.target.value)}
            placeholder={org.name}
            autoComplete="off"
            disabled={updating}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/30 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          {t("deleteOrgModal.finalConfirm")}
        </p>
      </ConfirmModal>

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
                disabled={isDeleted}
                className="min-w-[12rem] flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
              />
              <select
                value={memberRole}
                onChange={e =>
                  setMemberRole(e.target.value as OrganizationRole)
                }
                disabled={isDeleted}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value={OrganizationRole.MEMBER}>
                  {t(roleLabelsKey.MEMBER)}
                </option>
                <option value={OrganizationRole.ADMIN}>
                  {t(roleLabelsKey.ADMIN)}
                </option>
              </select>
              <Button type="submit" size="sm" disabled={isDeleted}>
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
                      {t("roleOwner")}
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
                        disabled={isDeleted}
                        className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="ADMIN">{t(roleLabelsKey.ADMIN)}</option>
                        <option value="MEMBER">
                          {t(roleLabelsKey.MEMBER)}
                        </option>
                      </select>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={
                          isDeleted ||
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
                        disabled={mutationsDisabled}
                        onClick={() => transferOwnership(member.user.id)}
                      >
                        {t("transferOwnership")}
                      </Button>
                      <button
                        type="button"
                        disabled={isDeleted}
                        onClick={() => removeMember(member.user.id)}
                        className="text-xs text-red-400 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
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
                      {room.capacity
                        ? ` · ${t("seats", { count: room.capacity })}`
                        : ""}
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
                    disabled={mutationsDisabled}
                    value={org.planId ?? ""}
                    onChange={e => updatePlan(e.target.value)}
                    className="w-full max-w-sm rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
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

function OrgDetailSection({
  icon: Icon,
  title,
  description,
  badge,
  tone = "default",
  children,
}: {
  icon: ElementType;
  title: string;
  description: string;
  badge?: ReactNode;
  tone?: "default" | "danger";
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border bg-card shadow-sm",
        tone === "danger"
          ? "border-rose-200/80 dark:border-rose-500/30"
          : "border-border"
      )}
    >
      <div
        className={cn(
          "flex items-start justify-between gap-3 border-b px-4 py-3.5 sm:px-5",
          tone === "danger"
            ? "border-rose-200/70 bg-rose-50/50 dark:border-rose-500/20 dark:bg-rose-500/5"
            : "border-border bg-muted/25"
        )}
      >
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1",
              tone === "danger"
                ? "bg-background text-rose-600 ring-rose-200 dark:text-rose-300 dark:ring-rose-500/30"
                : "bg-background text-muted-foreground ring-border"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        {badge ? <div className="shrink-0">{badge}</div> : null}
      </div>
      <div className="px-4 py-4 sm:px-5">{children}</div>
    </section>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  required,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium text-foreground/90"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  );
}

function UsageSection({ usage }: { usage: OrganizationUsage }) {
  const t = useTranslations("Admin.organizations");
  const rows = [
    {
      label: t("metricRooms"),
      current: usage.roomsCount,
      max: usage.maxRooms,
    },
    {
      label: t("metricUsers"),
      current: usage.membersCount,
      max: usage.maxUsers,
    },
    {
      label: t("metricReservationsMonth"),
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
