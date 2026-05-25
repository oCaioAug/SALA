"use client";

import { Building2, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useApiErrorMessage } from "@/lib/hooks/useApiErrorMessage";

interface PendingInvite {
  id: string;
  token: string;
  email: string;
  role: string;
  expiresAt: string;
  organization: { id: string; name: string; slug: string };
  invitedBy: { name: string | null; email: string } | null;
}

export default function OnboardingPage() {
  const t = useTranslations("OnboardingPage");
  const { fromPayload } = useApiErrorMessage();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvites = useCallback(async () => {
    try {
      const res = await fetch("/api/organizations/me/invites");
      if (res.ok) setInvites(await res.json());
    } finally {
      setInvitesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;
    if (session.user.organizationId) {
      router.replace("/inicio");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (status === "authenticated") fetchInvites();
  }, [status, fetchInvites]);

  const createOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(fromPayload(data) || t("errors.createOrg"));
        return;
      }
      window.location.href = "/inicio";
    } catch {
      setError(t("errors.createOrg"));
    } finally {
      setLoading(false);
    }
  };

  const acceptInvite = async (token: string) => {
    setError(null);
    setLoading(true);
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
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <PageShell>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">{t("title")}</h1>
          <p className="mt-2 text-gray-400">{t("subtitle")}</p>
          {session?.user?.email && (
            <p className="mt-1 text-sm text-violet-300">{session.user.email}</p>
          )}
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <Card className="border-white/10 bg-white/5 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Building2 className="h-5 w-5 text-violet-400" />
              {t("createOrgTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createOrganization} className="space-y-4">
              <input
                required
                type="text"
                placeholder={t("orgNamePlaceholder")}
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-500">{t("trialHint")}</p>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? t("creating") : t("createOrg")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Mail className="h-5 w-5 text-blue-400" />
              {t("pendingInvitesTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invitesLoading ? (
              <div className="flex justify-center py-6">
                <LoadingSpinner />
              </div>
            ) : invites.length === 0 ? (
              <p className="text-sm text-gray-500">
                {t("noInvites", { email: session?.user?.email ?? "" })}
              </p>
            ) : (
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
                        {t("role", { role: invite.role })}
                        {invite.invitedBy && (
                          <>
                            {" · "}
                            {t("invitedBy", {
                              name:
                                invite.invitedBy.name ?? invite.invitedBy.email,
                            })}
                          </>
                        )}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      disabled={loading}
                      onClick={() => acceptInvite(invite.token)}
                    >
                      {t("acceptInvite")}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </PageShell>
    </ProtectedRoute>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-violet-950 p-6">
      <div className="w-full max-w-2xl space-y-6">{children}</div>
    </div>
  );
}
