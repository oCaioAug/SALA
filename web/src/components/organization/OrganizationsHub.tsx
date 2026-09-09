"use client";

import { OrganizationRole, OrganizationStatus } from "@prisma/client";
import {
  ArrowRight,
  Building2,
  Calendar,
  ChevronRight,
  Mail,
  Plus,
  Shield,
  Users,
  Zap,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { AccountSecurityForm } from "@/components/account/AccountSecurityForm";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { organizationEntryPath } from "@/lib/organization/entry-path";
import { navigateAfterOrgSwitch } from "@/lib/organization/navigate-after-org-switch";
import { useApp } from "@/lib/hooks/useApp";
import { cn } from "@/lib/utils";
import { Link } from "@/navigation";

export type UserMembership = {
  role: OrganizationRole;
  joinedAt: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    status: OrganizationStatus;
    createdAt: string;
    plan: { id: string; name: string } | null;
    _count: { members: number; rooms: number };
  };
};

export type PendingInvite = {
  id: string;
  token: string;
  email: string;
  role: string;
  organization: { id: string; name: string; slug: string };
  invitedBy: { name: string | null; email: string } | null;
};

type OrganizationsHubProps = {
  memberships: UserMembership[];
  activeOrganizationId: string | null;
  invites: PendingInvite[];
  isSuperAdmin: boolean;
  createOrgHref: string;
  profileComplete: boolean;
  hasOrganization: boolean;
  hasPassword: boolean;
  onPasswordCreated?: () => void;
  invitesLoading: boolean;
  actionLoading: boolean;
  error: string | null;
  onAcceptInvite: (token: string) => void;
};

const roleLabelKey: Record<OrganizationRole, string> = {
  OWNER: "roles.owner",
  ADMIN: "roles.admin",
  MEMBER: "roles.member",
};

const ICON_ACCENTS = [
  "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
  "bg-zinc-100 text-zinc-700 dark:bg-zinc-500/15 dark:text-zinc-300",
  "bg-stone-100 text-stone-700 dark:bg-stone-500/15 dark:text-stone-300",
  "bg-neutral-100 text-neutral-700 dark:bg-neutral-500/15 dark:text-neutral-300",
] as const;

function SectionTitle({ title, icon }: { title: string; icon?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      {icon}
      <h2 className="text-base font-semibold text-foreground sm:text-lg">
        {title}
      </h2>
    </div>
  );
}

function StatusPill({
  label,
  tone = "blue",
}: {
  label: string;
  tone?: "blue" | "slate" | "amber" | "emerald";
}) {
  const tones = {
    blue: "bg-slate-700 text-white",
    slate: "bg-slate-600 text-white",
    amber: "bg-amber-600 text-white",
    emerald: "bg-emerald-700 text-white",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        tones[tone]
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-white/90" aria-hidden />
      {label}
    </span>
  );
}

function MembershipStatusBadge({ status }: { status: OrganizationStatus }) {
  const t = useTranslations("OrganizationsPage.status");
  const tone: Record<OrganizationStatus, "emerald" | "slate" | "amber"> = {
    ACTIVE: "emerald",
    TRIAL: "slate",
    SUSPENDED: "amber",
  };

  return (
    <StatusPill
      label={t(status.toLowerCase() as "active" | "trial" | "suspended")}
      tone={tone[status]}
    />
  );
}

function formatCreatedAt(value: string, locale: string) {
  return new Date(value).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function FeaturedOrgCard({
  membership,
  isActive,
  onEnter,
  entering,
}: {
  membership: UserMembership;
  isActive: boolean;
  onEnter: () => void;
  entering: boolean;
}) {
  const t = useTranslations("OrganizationsPage");
  const locale = useLocale();
  const { organization, role } = membership;
  const isAdmin =
    role === OrganizationRole.OWNER || role === OrganizationRole.ADMIN;
  const enterLabel = isAdmin ? t("enterAdmin") : t("enterMember");

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-lg border bg-card p-5 shadow-sm sm:p-6",
        isActive
          ? "border-slate-400 ring-1 ring-slate-400/25 dark:border-slate-500 dark:ring-slate-500/25"
          : "border-border"
      )}
    >
      <div className="flex gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300 sm:h-14 sm:w-14"
          aria-hidden
        >
          <Building2 className="h-6 w-6 sm:h-7 sm:w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {organization.name}
            </h3>
            <span className="shrink-0">
              {isActive ? (
                <StatusPill label={t("activeOrg")} tone="blue" />
              ) : (
                <MembershipStatusBadge status={organization.status} />
              )}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {organization.plan
              ? t("card.planLine", {
                  plan: organization.plan.name,
                  role: t(roleLabelKey[role]),
                })
              : t("card.roleLine", { role: t(roleLabelKey[role]) })}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border/60 pt-4 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <Users className="h-4 w-4 shrink-0" aria-hidden />
          {t("stats.members", { count: organization._count.members })}
        </span>
        <span
          className="hidden h-1 w-1 rounded-full bg-muted-foreground/40 sm:inline"
          aria-hidden
        />
        <span className="inline-flex items-center gap-2">
          <Calendar className="h-4 w-4 shrink-0" aria-hidden />
          {t("card.createdAt", {
            date: formatCreatedAt(organization.createdAt, locale),
          })}
        </span>
      </div>

      <div className="mt-auto pt-5 sm:pt-6">
        <Button
          className="w-full"
          size="lg"
          variant="primary"
          disabled={entering}
          onClick={onEnter}
        >
          {entering ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              {enterLabel}
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function CompactOrgCard({
  membership,
  isActive,
  accentIndex,
  onEnter,
  entering,
}: {
  membership: UserMembership;
  isActive: boolean;
  accentIndex: number;
  onEnter: () => void;
  entering: boolean;
}) {
  const t = useTranslations("OrganizationsPage");
  const locale = useLocale();
  const { organization, role } = membership;
  const isAdmin =
    role === OrganizationRole.OWNER || role === OrganizationRole.ADMIN;
  const accent = ICON_ACCENTS[accentIndex % ICON_ACCENTS.length];
  const enterLabel = isAdmin ? t("enterAdmin") : t("enterMember");

  return (
    <button
      type="button"
      disabled={entering}
      onClick={onEnter}
      aria-label={`${enterLabel}: ${organization.name}`}
      className={cn(
        "group flex w-full flex-col rounded-lg border bg-card p-4 text-left shadow-sm transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-60",
        isActive
          ? "border-slate-400 ring-1 ring-slate-400/25 dark:border-slate-500 dark:ring-slate-500/25"
          : "border-border hover:border-slate-300 hover:shadow-md dark:hover:border-slate-600"
      )}
    >
      <div className="flex gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            accent
          )}
          aria-hidden
        >
          <Building2 className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className="truncate text-sm font-semibold text-foreground sm:text-base">
              {organization.name}
            </span>
            <span className="shrink-0">
              {isActive ? (
                <StatusPill label={t("activeOrg")} tone="blue" />
              ) : (
                <MembershipStatusBadge status={organization.status} />
              )}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground sm:text-sm">
            {organization.plan
              ? t("card.planLine", {
                  plan: organization.plan.name,
                  role: t(roleLabelKey[role]),
                })
              : t("card.roleLine", { role: t(roleLabelKey[role]) })}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/60 pt-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {t("stats.members", { count: organization._count.members })}
        </span>
        <span
          className="hidden h-1 w-1 rounded-full bg-muted-foreground/40 sm:inline"
          aria-hidden
        />
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {t("card.createdAt", {
            date: formatCreatedAt(organization.createdAt, locale),
          })}
        </span>
      </div>

      <span className="mt-3 flex items-center justify-between text-sm font-medium text-foreground transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
        {entering ? (
          <LoadingSpinner size="sm" />
        ) : (
          <>
            <span>{enterLabel}</span>
            <ArrowRight className="h-4 w-4 shrink-0 opacity-50 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
          </>
        )}
      </span>
    </button>
  );
}

function QuickActionCard({
  href,
  icon,
  title,
  description,
  iconClassName,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
  iconClassName: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-4 shadow-sm transition-all duration-200 hover:border-slate-400 dark:hover:border-slate-500"
    >
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          iconClassName
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-foreground sm:text-base">
          {title}
        </h3>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600" />
    </Link>
  );
}

export function OrganizationsHub({
  memberships,
  activeOrganizationId,
  invites,
  isSuperAdmin,
  createOrgHref,
  profileComplete,
  hasOrganization,
  hasPassword,
  onPasswordCreated,
  invitesLoading,
  actionLoading,
  error,
  onAcceptInvite,
}: OrganizationsHubProps) {
  const t = useTranslations("OrganizationsPage");
  const tSecurity = useTranslations("ProfilePage");
  const { showSuccess } = useApp();
  const { update } = useSession();
  const [enteringOrgId, setEnteringOrgId] = useState<string | null>(null);

  const handleEnterOrg = async (membership: UserMembership) => {
    const { organization, role } = membership;
    setEnteringOrgId(organization.id);
    try {
      await update({ preferOrganizationId: organization.id });
      navigateAfterOrgSwitch(organizationEntryPath(role));
    } finally {
      setEnteringOrgId(null);
    }
  };

  const showProfileHint = !profileComplete && !hasOrganization;
  const profileHintText =
    invites.length > 0
      ? t("completeProfileHint")
      : t("completeProfileHintNoInvites");

  const showEmptyState =
    !isSuperAdmin &&
    !hasOrganization &&
    !invitesLoading &&
    memberships.length === 0;

  const showSuperAdminHub =
    isSuperAdmin && !invitesLoading && memberships.length === 0;

  const showCreateOrgQuickAction = hasOrganization || memberships.length > 0;
  const showActionsSection =
    showCreateOrgQuickAction || hasOrganization || isSuperAdmin;

  const hubSubtitle = showSuperAdminHub
    ? t("empty.superAdminSubtitle")
    : memberships.length === 0
      ? t("empty.subtitle")
      : t("subtitle");

  const featuredMembership =
    memberships.find(m => m.organization.id === activeOrganizationId) ??
    memberships[0] ??
    null;

  const secondaryMemberships = featuredMembership
    ? memberships.filter(
        m => m.organization.id !== featuredMembership.organization.id
      )
    : [];

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {t("title")}
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          {hubSubtitle}
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300"
        >
          {error}
        </p>
      )}

      {showProfileHint && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          {profileHintText}
        </div>
      )}

      {!hasPassword && (
        <section
          className="rounded-lg border border-border bg-muted/40 px-4 py-4 sm:px-5 sm:py-5"
          aria-labelledby="hub-security-title"
        >
          <h2
            id="hub-security-title"
            className="mb-1 text-base font-semibold text-foreground"
          >
            {t("security.title")}
          </h2>
          <AccountSecurityForm
            hasPassword={false}
            hint={t("security.createHint")}
            compact
            onSuccess={() => {
              onPasswordCreated?.();
              showSuccess(tSecurity("security.created"));
            }}
            onError={() => {}}
          />
        </section>
      )}

      {featuredMembership && (
        <section>
          <div
            className={cn(
              "grid gap-4",
              secondaryMemberships.length > 0 && "lg:grid-cols-[1.35fr_1fr]"
            )}
          >
            <FeaturedOrgCard
              membership={featuredMembership}
              isActive={
                featuredMembership.organization.id === activeOrganizationId
              }
              onEnter={() => handleEnterOrg(featuredMembership)}
              entering={enteringOrgId === featuredMembership.organization.id}
            />

            {secondaryMemberships.length > 0 && (
              <ul className="flex flex-col gap-4" role="list">
                {secondaryMemberships.map((membership, index) => (
                  <li key={membership.organization.id}>
                    <CompactOrgCard
                      membership={membership}
                      isActive={
                        membership.organization.id === activeOrganizationId
                      }
                      accentIndex={index}
                      onEnter={() => handleEnterOrg(membership)}
                      entering={enteringOrgId === membership.organization.id}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {(invites.length > 0 || invitesLoading) && (
        <section>
          <SectionTitle title={t("invites.title")} />
          {invitesLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-3">
              {invites.map(invite => (
                <div
                  key={invite.id}
                  className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {invite.organization.name}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t("invites.role", { role: invite.role })}
                      </p>
                      {invite.invitedBy && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t("invites.invitedBy", {
                            name:
                              invite.invitedBy.name ?? invite.invitedBy.email,
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="shrink-0"
                    disabled={actionLoading}
                    onClick={() => onAcceptInvite(invite.token)}
                  >
                    {t("invites.accept")}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {showSuperAdminHub && (
        <div className="rounded-lg border border-border bg-card px-6 py-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md border border-border bg-muted text-foreground">
            <Shield className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            {t("empty.superAdminTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {t("empty.superAdminDescription")}
          </p>
          <Link
            href="/admin"
            className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            {t("platform.title")}
          </Link>
        </div>
      )}

      {showEmptyState && (
        <div className="rounded-lg border border-border bg-card px-6 py-10 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md border border-border bg-muted text-foreground">
            <Building2 className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            {t("empty.title")}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {t("empty.description")}
          </p>
          <Link
            href={createOrgHref}
            className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            {t("empty.cta")}
          </Link>
        </div>
      )}

      {showActionsSection && (
        <section>
          <SectionTitle
            title={t("sections.actions")}
            icon={<Zap className="h-4 w-4 text-blue-600" />}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {hasOrganization && (
              <QuickActionCard
                href="/users"
                icon={<Users className="h-5 w-5" />}
                iconClassName="bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300"
                title={t("manageOrg.title")}
                description={t("manageOrg.description")}
              />
            )}

            {isSuperAdmin && !showSuperAdminHub && (
              <QuickActionCard
                href="/admin"
                icon={<Shield className="h-5 w-5" />}
                iconClassName="bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300"
                title={t("platform.title")}
                description={t("platform.description")}
              />
            )}

            {showCreateOrgQuickAction && (
              <QuickActionCard
                href={createOrgHref}
                icon={<Plus className="h-5 w-5" />}
                iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
                title={
                  hasOrganization ? t("anotherOrg.title") : t("createOrg.title")
                }
                description={
                  hasOrganization
                    ? t("anotherOrg.description")
                    : t("createOrg.description")
                }
              />
            )}
          </div>
        </section>
      )}
    </div>
  );
}
