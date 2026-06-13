"use client";

import {
  ArrowRight,
  Building2,
  ChevronRight,
  Compass,
  LayoutDashboard,
  Mail,
  Plus,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { OrganizationRole, OrganizationStatus } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Link } from "@/navigation";
import { cn } from "@/lib/utils";

export type UserMembership = {
  role: OrganizationRole;
  joinedAt: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    status: OrganizationStatus;
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

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: OrganizationStatus }) {
  const t = useTranslations("OrganizationsPage.status");

  const styles: Record<OrganizationStatus, string> = {
    ACTIVE: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    TRIAL: "border-violet-500/30 bg-violet-500/10 text-violet-300",
    SUSPENDED: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  };

  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        styles[status]
      )}
    >
      {t(status.toLowerCase() as "active" | "trial" | "suspended")}
    </span>
  );
}

function MembershipCard({
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
  const { organization, role } = membership;
  const isAdmin = role === OrganizationRole.OWNER || role === OrganizationRole.ADMIN;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200",
        isActive
          ? "border-violet-500/50 shadow-lg shadow-violet-500/10 ring-1 ring-violet-500/20"
          : "hover:border-violet-500/30 hover:shadow-md"
      )}
    >
      {isActive && (
        <span className="absolute right-4 top-4 rounded-full border border-violet-400/30 bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-200">
          {t("activeOrg")}
        </span>
      )}

      <div className="mb-4 flex items-start gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            isAdmin
              ? "bg-gradient-to-br from-blue-500/20 to-cyan-500/15 text-blue-600 dark:text-blue-300"
              : "bg-gradient-to-br from-emerald-500/20 to-teal-500/15 text-emerald-600 dark:text-emerald-300"
          )}
        >
          {isAdmin ? (
            <LayoutDashboard className="h-5 w-5" />
          ) : (
            <Compass className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0 flex-1 pr-16">
          <h3 className="truncate text-base font-semibold text-foreground">
            {organization.name}
          </h3>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {organization.slug}
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={organization.status} />
        <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
          {t(roleLabelKey[role])}
        </span>
        {organization.plan && (
          <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            {organization.plan.name}
          </span>
        )}
      </div>

      <div className="mb-5 flex gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {t("stats.members", { count: organization._count.members })}
        </span>
        <span className="inline-flex items-center gap-1">
          <Building2 className="h-3.5 w-3.5" />
          {t("stats.rooms", { count: organization._count.rooms })}
        </span>
      </div>

      <Button
        className="mt-auto w-full"
        variant={isActive ? "primary" : "outline"}
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

function ActionCard({
  href,
  icon,
  title,
  description,
  badge,
  actionLabel,
  accent = "emerald",
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
  badge?: string;
  actionLabel: string;
  accent?: "emerald" | "violet";
}) {
  const accentRing =
    accent === "violet"
      ? "hover:border-violet-500/40 hover:shadow-violet-500/10"
      : "hover:border-emerald-500/40 hover:shadow-emerald-500/10";

  return (
    <Link
      href={href}
      className={cn(
        "group flex h-full flex-col rounded-2xl border border-dashed border-border bg-card/50 p-5 transition-all duration-200 hover:bg-muted/40 hover:shadow-lg",
        accentRing
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-2">
        {icon}
        {badge && (
          <span className="rounded-full border border-violet-500/30 bg-violet-500/15 px-2 py-0.5 text-[11px] font-medium text-violet-700 dark:text-violet-200">
            {badge}
          </span>
        )}
      </div>
      <h3 className="text-base font-semibold text-foreground group-hover:text-violet-700 dark:group-hover:text-violet-200">
        {title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      <span className="mt-4 inline-flex items-center text-sm font-medium text-violet-600 transition-colors group-hover:text-violet-500 dark:text-violet-400 dark:group-hover:text-violet-300">
        {actionLabel}
        <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
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

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-800 dark:text-violet-200">
          <Sparkles className="h-3.5 w-3.5" />
          {t("hubBadge")}
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {t("title")}
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">{t("subtitle")}</p>
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

      {memberships.length > 0 && (
        <section>
          <SectionTitle
            title={t("sections.organizations")}
            description={t("sections.organizationsDesc")}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {memberships.map(membership => (
              <MembershipCard
                key={membership.organization.id}
                membership={membership}
                isActive={
                  membership.organization.id === activeOrganizationId
                }
                onEnter={() => handleEnterOrg(membership)}
                entering={enteringOrgId === membership.organization.id}
              />
            ))}
          </div>
        </section>
      )}

      {!hasOrganization && !invitesLoading && memberships.length === 0 && (
        <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-600/20">
            <Building2 className="h-7 w-7 text-violet-600 dark:text-violet-300" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            {t("empty.title")}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {t("empty.description")}
          </p>
          <Link
            href={createOrgHref}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500"
          >
            {t("empty.cta")}
          </Link>
        </div>
      )}

      <section>
        <SectionTitle
          title={t("sections.actions")}
          description={t("sections.actionsDesc")}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {isSuperAdmin && (
            <ActionCard
              href="/admin"
              accent="violet"
              badge={t("platform.badge")}
              actionLabel={t("enter")}
              icon={
                <div className="rounded-xl bg-gradient-to-br from-violet-500/30 to-purple-600/30 p-3">
                  <Shield className="h-6 w-6 text-violet-300" />
                </div>
              }
              title={t("platform.title")}
              description={t("platform.description")}
            />
          )}

          <ActionCard
            href={createOrgHref}
            accent="emerald"
            actionLabel={t("createOrg.action")}
            icon={
              <div className="rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 p-3">
                <Plus className="h-6 w-6 text-emerald-300" />
              </div>
            }
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
          <SectionTitle
            title={t("invites.title")}
            description={t("invites.subtitle")}
          />
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
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-300">
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
