"use client";

import {
  ChevronRight,
  Compass,
  LayoutDashboard,
  LogOut,
  Mail,
  Plus,
  Shield,
} from "lucide-react";
import NextLink from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useOrgPermissions } from "@/lib/hooks/useOrgPermissions";
import { Link } from "@/navigation";

interface PendingInvite {
  id: string;
  token: string;
  email: string;
  role: string;
  organization: { id: string; name: string; slug: string };
  invitedBy: { name: string | null; email: string } | null;
}

export default function InicioPage() {
  const t = useTranslations("InicioPage");
  const { data: session, status } = useSession();
  const {
    isOrgAdmin,
    isSuperAdmin,
    hasOrganization,
    isLoading: permLoading,
  } = useOrgPermissions();
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const organizationName = session?.user?.organizationName ?? null;
  const orgHref = isOrgAdmin ? "/dashboard" : "/explorar";

  const fetchInvites = useCallback(async () => {
    try {
      const res = await fetch("/api/organizations/me/invites");
      if (res.ok) setInvites(await res.json());
    } finally {
      setInvitesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchInvites();
  }, [status, fetchInvites]);

  const acceptInvite = async (token: string) => {
    setError(null);
    setActionLoading(true);
    try {
      const res = await fetch(`/api/invites/${token}/accept`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("inviteError"));
        return;
      }
      window.location.href = "/inicio";
    } catch {
      setError(t("inviteError"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/auth/login" });
  };

  if (status === "loading" || permLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-violet-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-violet-950 p-6">
        <div className="mx-auto w-full max-w-3xl space-y-8">
          <header className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-violet-300">
                {t("greeting")}
              </p>
              <h1 className="mt-1 text-3xl font-bold text-white">
                {t("title")}
              </h1>
              <p className="mt-2 text-gray-400">{t("subtitle")}</p>
              {session?.user?.email && (
                <p className="mt-2 text-sm text-gray-500">
                  {session.user.email}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="shrink-0 border-white/10 text-gray-300"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t("signOut")}
            </Button>
          </header>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {isSuperAdmin && (
              <HubOptionCard
                href="/admin"
                icon={
                  <div className="rounded-xl bg-gradient-to-br from-violet-500/30 to-purple-600/30 p-3">
                    <Shield className="h-7 w-7 text-violet-300" />
                  </div>
                }
                title={t("platform.title")}
                description={t("platform.description")}
                badge={t("platform.badge")}
                actionLabel={t("enter")}
              />
            )}

            {hasOrganization && (
              <HubOptionCard
                href={orgHref}
                icon={
                  <div className="rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-500/30 p-3">
                    {isOrgAdmin ? (
                      <LayoutDashboard className="h-7 w-7 text-blue-300" />
                    ) : (
                      <Compass className="h-7 w-7 text-emerald-300" />
                    )}
                  </div>
                }
                title={
                  organizationName
                    ? t("organization.namedTitle", { name: organizationName })
                    : isOrgAdmin
                      ? t("organization.adminTitle")
                      : t("organization.memberTitle")
                }
                description={
                  isOrgAdmin
                    ? t("organization.adminDescription")
                    : t("organization.memberDescription")
                }
                actionLabel={t("enter")}
              />
            )}

            <HubOptionCard
              href="/onboarding"
              icon={
                <div className="rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 p-3">
                  <Plus className="h-7 w-7 text-emerald-300" />
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
              actionLabel={t("enter")}
            />
          </div>

          {invites.length > 0 && (
            <Card className="border-white/10 bg-white/5 backdrop-blur">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center gap-2 text-white">
                  <Mail className="h-5 w-5 text-blue-400" />
                  <h2 className="text-lg font-semibold">
                    {t("invites.title")}
                  </h2>
                </div>
                <div className="space-y-3">
                  {invites.map(invite => (
                    <div
                      key={invite.id}
                      className="flex flex-col gap-3 rounded-lg bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-white">
                          {invite.organization.name}
                        </p>
                        <p className="text-sm text-gray-400">
                          {t("invites.role", { role: invite.role })}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        disabled={actionLoading}
                        onClick={() => acceptInvite(invite.token)}
                      >
                        {t("invites.accept")}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {invitesLoading && !hasOrganization && (
            <div className="flex justify-center py-4">
              <LoadingSpinner />
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

function HubOptionCard({
  href,
  icon,
  title,
  description,
  badge,
  actionLabel,
  skipLocalePrefix = false,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  actionLabel: string;
  skipLocalePrefix?: boolean;
}) {
  const card = (
    <Card className="h-full border-white/10 bg-white/5 backdrop-blur transition-all hover:border-violet-500/40 hover:bg-white/10">
      <CardContent className="flex h-full flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-2">
          {icon}
          {badge && (
            <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs font-medium text-violet-300">
              {badge}
            </span>
          )}
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-white group-hover:text-violet-200">
            {title}
          </h2>
          <p className="mt-2 text-sm text-gray-400">{description}</p>
        </div>
        <span className="inline-flex items-center text-sm font-medium text-violet-400">
          {actionLabel}
          <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </CardContent>
    </Card>
  );

  const className = "group block h-full";

  if (skipLocalePrefix) {
    return (
      <NextLink href={href} className={className}>
        {card}
      </NextLink>
    );
  }

  return (
    <Link href={href} className={className}>
      {card}
    </Link>
  );
}
