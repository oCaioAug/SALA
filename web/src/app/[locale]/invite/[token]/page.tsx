"use client";

import { Building2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useEffect, useState } from "react";

import { AppPreferencesControls } from "@/components/preferences/AppPreferencesControls";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useApiErrorMessage } from "@/lib/hooks/useApiErrorMessage";
import { organizationEntryPath } from "@/lib/organization/entry-path";
import { navigateAfterOrgSwitch } from "@/lib/organization/navigate-after-org-switch";
import { getIntlLocale } from "@/lib/utils";
import { Link } from "@/navigation";

function InvitePageShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <AppPreferencesControls variant="marketing" />
      </div>
      {children}
    </div>
  );
}
interface InviteDetails {
  token: string;
  email: string;
  role: string;
  expiresAt: string;
  organization: { id: string; name: string; slug: string };
  invitedBy: { name: string | null; email: string } | null;
}

export default function InviteAcceptPage() {
  const t = useTranslations("InvitePage");
  const locale = useLocale();
  const { fromPayload } = useApiErrorMessage();
  const params = useParams();
  const token = params.token as string;
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memberOrgIds, setMemberOrgIds] = useState<string[]>([]);

  const inviteCallback = `/invite/${token}`;
  const loginHref = `/auth/login?callbackUrl=${encodeURIComponent(inviteCallback)}`;
  const registerHref = `/auth/register?callbackUrl=${encodeURIComponent(inviteCallback)}`;

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const res = await fetch(`/api/invites/${token}`);
        if (res.ok) {
          setInvite(await res.json());
        } else {
          const data = await res.json();
          setError(fromPayload(data) || t("invalidInvite"));
        }
      } finally {
        setLoading(false);
      }
    };
    fetchInvite();
  }, [token, fromPayload, t]);

  useEffect(() => {
    if (status !== "authenticated") {
      setMemberOrgIds([]);
      return;
    }

    const loadMemberships = async () => {
      const res = await fetch("/api/organizations/me");
      if (!res.ok) return;
      const data = (await res.json()) as {
        memberships?: { organization: { id: string } }[];
      };
      setMemberOrgIds(
        (data.memberships ?? []).map(membership => membership.organization.id)
      );
    };

    void loadMemberships();
  }, [status]);

  const acceptInvite = async () => {
    setAccepting(true);
    setError(null);
    try {
      const res = await fetch(`/api/invites/${token}/accept`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          fromPayload(data, { max: data.max }) || t("errors.acceptInvite")
        );
        return;
      }
      await update({ preferOrganizationId: data.organizationId });
      navigateAfterOrgSwitch(organizationEntryPath(data.role));
    } catch {
      setError(t("errors.acceptInvite"));
    } finally {
      setAccepting(false);
    }
  };

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: inviteCallback });
  };

  if (loading) {
    return (
      <InvitePageShell>
        <div className="flex min-h-screen items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </InvitePageShell>
    );
  }

  if (!invite) {
    return (
      <InvitePageShell>
        <div className="flex min-h-screen items-center justify-center p-6">
          <Card className="w-full max-w-md border-border bg-card">
            <CardContent className="p-6 text-center">
              <p className="text-destructive">{error ?? t("notFound")}</p>
              <Link
                href="/organizations"
                className="mt-4 inline-block text-primary"
              >
                {t("goToHub")}
              </Link>
            </CardContent>
          </Card>
        </div>
      </InvitePageShell>
    );
  }

  const emailMatches =
    session?.user?.email?.toLowerCase() === invite.email.toLowerCase();
  const alreadyMember = memberOrgIds.includes(invite.organization.id);

  const expiresLabel = new Date(invite.expiresAt).toLocaleString(
    getIntlLocale(locale)
  );

  return (
    <InvitePageShell>
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-lg border-border bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Building2 className="h-5 w-5 text-primary" />
              {t("title", { org: invite.organization.name })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {t("invitedAs", { role: invite.role })}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("inviteEmail", { email: invite.email })}
            </p>
            {invite.invitedBy && (
              <p className="text-sm text-muted-foreground">
                {t("sentBy", {
                  name: invite.invitedBy.name ?? invite.invitedBy.email,
                })}
              </p>
            )}
            <p className="text-xs text-muted-foreground/80">
              {t("expiresAt", { date: expiresLabel })}
            </p>

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-300">
                {error}
              </p>
            )}

            {status === "unauthenticated" ? (
              <div className="space-y-3">
                <Button onClick={handleGoogleLogin} className="w-full">
                  {t("loginGoogle")}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(loginHref)}
                >
                  {t("loginEmail")}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  <Link
                    href={registerHref}
                    className="font-medium text-primary hover:text-primary"
                  >
                    {t("createAccount")}
                  </Link>
                </p>
              </div>
            ) : !emailMatches ? (
              <div className="space-y-3">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {t("wrongAccount", {
                    current: session?.user?.email ?? "",
                    expected: invite.email,
                  })}
                </p>
                <Button
                  variant="outline"
                  onClick={handleGoogleLogin}
                  className="w-full"
                >
                  {t("switchAccount")}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(loginHref)}
                >
                  {t("loginEmail")}
                </Button>
              </div>
            ) : alreadyMember ? (
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {t("alreadyInOrg")}
              </p>
            ) : (
              <Button
                onClick={acceptInvite}
                disabled={accepting}
                className="w-full"
              >
                {accepting ? t("accepting") : t("acceptInvite")}
              </Button>
            )}

            <button
              type="button"
              onClick={() => router.push("/organizations")}
              className="w-full text-sm text-muted-foreground hover:text-foreground"
            >
              {t("createOwnOrg")}
            </button>
          </CardContent>
        </Card>
      </div>
    </InvitePageShell>
  );
}
