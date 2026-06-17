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
            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          <Button type="submit" disabled={sending}>
            {sending ? t("sending") : t("sendInvite")}
          </Button>
        </form>

        {lastInviteUrl && (
          <div className="flex items-center gap-2 rounded-lg bg-violet-500/10 px-3 py-2 text-sm">
            <span className="flex-1 truncate text-violet-200">
              {lastInviteUrl}
            </span>
            <button
              type="button"
              onClick={() => copyUrl(lastInviteUrl)}
              className="text-violet-300 hover:text-violet-100"
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
            <p className="text-sm font-medium text-gray-500">
              {t("pendingTitle")}
            </p>
            {invites.map(invite => (
              <div
                key={invite.id}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800/50"
              >
                <div>
                  <p className="font-medium">{invite.email}</p>
                  <p className="text-xs text-gray-500">
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
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    aria-label={t("copyLink")}
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => cancelInvite(invite.id)}
                    className="text-red-500 hover:text-red-400"
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
