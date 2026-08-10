"use client";

import { Copy, Mail, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { getIntlLocale } from "@/lib/utils";

interface OrgInvite {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  inviteUrl: string;
  isActive: boolean;
}

export function OrganizationInvitesPanel() {
  const t = useTranslations("Invites");
  const locale = useLocale();
  const [invites, setInvites] = useState<OrgInvite[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);

  const fetchInvites = useCallback(async () => {
    try {
      const res = await fetch("/api/organizations/invites");
      if (res.ok) setInvites(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setLastInviteUrl(null);
    try {
      const res = await fetch("/api/organizations/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role: "MEMBER" }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmail("");
        setLastInviteUrl(data.inviteUrl);
        await fetchInvites();
      } else if (data.inviteUrl) {
        setLastInviteUrl(data.inviteUrl);
      }
    } finally {
      setSending(false);
    }
  };

  const cancelInvite = async (id: string) => {
    await fetch(`/api/organizations/invites/${id}`, { method: "DELETE" });
    await fetchInvites();
  };

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Mail className="h-5 w-5" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={sendInvite} className="flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            required
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400"
          />
          <Button type="submit" disabled={sending}>
            {sending ? t("sending") : t("sendInvite")}
          </Button>
        </form>

        {lastInviteUrl && (
          <div className="flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm dark:border-violet-500/20 dark:bg-violet-500/10">
            <span className="flex-1 truncate text-violet-800 dark:text-violet-200">
              {lastInviteUrl}
            </span>
            <button
              type="button"
              onClick={() => copyUrl(lastInviteUrl)}
              className="text-violet-600 hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-100"
              aria-label={t("copyLink")}
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-4">
            <LoadingSpinner size="sm" />
          </div>
        ) : invites.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {t("pendingTitle")}
            </p>
            {invites.map(invite => (
              <div
                key={invite.id}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/50"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {invite.email}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("expires", {
                      role: invite.role,
                      date: new Date(invite.expiresAt).toLocaleDateString(
                        getIntlLocale(locale)
                      ),
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyUrl(invite.inviteUrl)}
                    className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    aria-label={t("copyLink")}
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => cancelInvite(invite.id)}
                    className="text-red-500 hover:text-red-600 dark:hover:text-red-400"
                    aria-label={t("cancelInvite")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
