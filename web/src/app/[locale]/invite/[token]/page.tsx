"use client";

import { Building2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useApiErrorMessage } from "@/lib/hooks/useApiErrorMessage";
import { Link } from "@/navigation";
import { getIntlLocale } from "@/lib/utils";

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
  const { data: session, status } = useSession();
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      window.location.href = "/inicio";
    } catch {
      setError(t("errors.acceptInvite"));
    } finally {
      setAccepting(false);
    }
  };

  const handleLogin = () => {
    signIn("google", { callbackUrl: `/invite/${token}` });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 p-6">
        <Card className="w-full max-w-md border-white/10 bg-white/5">
          <CardContent className="p-6 text-center">
            <p className="text-red-300">{error ?? t("notFound")}</p>
            <Link
              href="/onboarding"
              className="mt-4 inline-block text-violet-400"
            >
              {t("goOnboarding")}
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const emailMatches =
    session?.user?.email?.toLowerCase() === invite.email.toLowerCase();

  const expiresLabel = new Date(invite.expiresAt).toLocaleString(
    getIntlLocale(locale)
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-violet-950 p-6">
      <Card className="w-full max-w-lg border-white/10 bg-white/5 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Building2 className="h-5 w-5 text-violet-400" />
            {t("title", { org: invite.organization.name })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-300">
            {t("invitedAs", { role: invite.role })}
          </p>
          <p className="text-sm text-gray-500">
            {t("inviteEmail", { email: invite.email })}
          </p>
          {invite.invitedBy && (
            <p className="text-sm text-gray-500">
              {t("sentBy", {
                name: invite.invitedBy.name ?? invite.invitedBy.email,
              })}
            </p>
          )}
          <p className="text-xs text-gray-600">
            {t("expiresAt", { date: expiresLabel })}
          </p>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          {status === "unauthenticated" ? (
            <Button onClick={handleLogin} className="w-full">
              {t("loginGoogle")}
            </Button>
          ) : !emailMatches ? (
            <div className="space-y-3">
              <p className="text-sm text-amber-300">
                {t("wrongAccount", {
                  current: session?.user?.email ?? "",
                  expected: invite.email,
                })}
              </p>
              <Button
                variant="outline"
                onClick={handleLogin}
                className="w-full"
              >
                {t("switchAccount")}
              </Button>
            </div>
          ) : session?.user?.organizationId ? (
            <p className="text-sm text-amber-300">{t("alreadyInOrg")}</p>
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
            onClick={() => router.push("/onboarding")}
            className="w-full text-sm text-gray-500 hover:text-gray-300"
          >
            {t("createOwnOrg")}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
