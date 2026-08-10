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
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
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
  "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
  "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
  "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
  "bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300",
] as const;

function SectionTitle({
  title,
  icon,
}: {
  title: string;
  icon?: ReactNode;
}) {
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
  tone?: "blue" | "violet" | "amber" | "emerald";
}) {
  const tones = {
    blue: "bg-blue-600 text-white",
    violet: "bg-violet-600 text-white",
    amber: "bg-amber-500 text-white",
    emerald: "bg-emerald-600 text-white",
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
  const tone: Record<OrganizationStatus, "emerald" | "violet" | "amber"> = {
    ACTIVE: "emerald",
    TRIAL: "violet",
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

  return (
    <article className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-7">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {isActive && <StatusPill label={t("activeOrg")} tone="blue" />}
          {!isActive && <MembershipStatusBadge status={organization.status} />}
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
          <Building2 className="h-6 w-6" />
        </div>
      </div>

      <h3 className="text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">
        {organization.name}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {organization.plan
          ? t("card.planLine", {
              plan: organization.plan.name,
              role: t(roleLabelKey[role]),
            })
          : t("card.roleLine", { role: t(roleLabelKey[role]) })}
      </p>

      <div className="mt-5 space-y-2.5 text-sm text-muted-foreground">
        <p className="inline-flex items-center gap-2">
          <Users className="h-4 w-4 shrink-0" />
          {t("stats.members", { count: organization._count.members })}
        </p>
        <p className="inline-flex items-center gap-2">
          <Calendar className="h-4 w-4 shrink-0" />
          {t("card.createdAt", {
            date: formatCreatedAt(organization.createdAt, locale),
          })}
        </p>
      </div>

      <Button
        className="mt-8 w-full"
        size="lg"
        variant="primary"
        disabled={entering}
        onClick={onEnter}
      >
        {entering ? (
          <LoadingSpinner size="sm" />
        ) : (
          <>
            {isAdmin ? t("enterAdmin") : t("enterMember")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </article>
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

  return (
    <article className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
            accent
          )}
        >
          <Building2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-foreground">
              {organization.name}
            </h3>
            {isActive && <StatusPill label={t("activeOrg")} tone="blue" />}
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {organization.plan
              ? t("card.planLine", {
                  plan: organization.plan.name,
                  role: t(roleLabelKey[role]),
                })
              : t("card.roleLine", { role: t(roleLabelKey[role]) })}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
        <p className="inline-flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 shrink-0" />
          {t("stats.members", { count: organization._count.members })}
        </p>
        <p className="inline-flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          {t("card.createdAt", {
            date: formatCreatedAt(organization.createdAt, locale),
          })}
        </p>
      </div>

      <Button
        className="mt-4 w-full"
        variant="outline"
        disabled={entering}
        onClick={onEnter}
      >
        {entering ? (
          <LoadingSpinner size="sm" />
        ) : (
          <>
            {isAdmin ? t("enterAdmin") : t("enterMember")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </article>
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
      className="group flex items-center gap-4 rounded-2xl border border-border bg-card px-4 py-4 shadow-sm transition-all duration-200 hover:border-blue-300 hover:shadow-md dark:hover:border-blue-500/40"
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
  invitesLoading,
  actionLoading,
  error,
  onAcceptInvite,
}: OrganizationsHubProps) {
  const t = useTranslations("OrganizationsPage");
  const router = useRouter();
  const { update } = useSession();
  const [enteringOrgId, setEnteringOrgId] = useState<string | null>(null);

  const handleEnterOrg = async (membership: UserMembership) => {
    const { organization, role } = membership;
    setEnteringOrgId(organization.id);
    try {
      await update({ preferOrganizationId: organization.id });
      const href =
        role === OrganizationRole.MEMBER ? "/explorar" : "/dashboard";
      router.push(href);
      router.refresh();
    } finally {
      setEnteringOrgId(null);
    }
  };

  const showProfileHint =
    !profileComplete && !hasOrganization && invites.length > 0;

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
          {t("subtitle")}
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
          {t("completeProfileHint")}
        </div>
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
              entering={
                enteringOrgId === featuredMembership.organization.id
              }
            />

            {secondaryMemberships.length > 0 && (
              <div className="flex flex-col gap-4">
                {secondaryMemberships.map((membership, index) => (
                  <CompactOrgCard
                    key={membership.organization.id}
                    membership={membership}
                    isActive={
                      membership.organization.id === activeOrganizationId
                    }
                    accentIndex={index}
                    onEnter={() => handleEnterOrg(membership)}
                    entering={enteringOrgId === membership.organization.id}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {!hasOrganization && !invitesLoading && memberships.length === 0 && (
        <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
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
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            {t("empty.cta")}
          </Link>
        </div>
      )}

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
              iconClassName="bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300"
              title={t("manageOrg.title")}
              description={t("manageOrg.description")}
            />
          )}

          {isSuperAdmin && (
            <QuickActionCard
              href="/admin"
              icon={<Shield className="h-5 w-5" />}
              iconClassName="bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300"
              title={t("platform.title")}
              description={t("platform.description")}
            />
          )}

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
        </div>
      </section>

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
                  className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
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
    </div>
  );
}
