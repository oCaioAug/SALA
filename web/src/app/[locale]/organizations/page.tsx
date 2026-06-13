"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import {
  OrganizationsHub,
  type PendingInvite,
  type UserMembership,
} from "@/components/organization/OrganizationsHub";
import { OrganizationsShell } from "@/components/organization/OrganizationsShell";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useOrgPermissions } from "@/lib/hooks/useOrgPermissions";

type MeSummary = {
  profileComplete: boolean;
  hasOrganization: boolean;
};

type MembershipsResponse = {
  activeOrganizationId: string | null;
  memberships: UserMembership[];
};

export default function OrganizationsPage() {
  const t = useTranslations("OrganizationsPage");
  const router = useRouter();
  const { status } = useSession();
  const { isSuperAdmin, hasOrganization, isLoading: permLoading } =
    useOrgPermissions();

  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(true);
  const [membershipsLoading, setMembershipsLoading] = useState(true);
  const [meLoading, setMeLoading] = useState(true);
  const [me, setMe] = useState<MeSummary | null>(null);
  const [memberships, setMemberships] = useState<UserMembership[]>([]);
  const [activeOrganizationId, setActiveOrganizationId] = useState<
    string | null
  >(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrgHref =
    me && (!me.profileComplete || !me.hasOrganization)
      ? "/organizations/setup"
      : "/organizations/new";

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch("/api/users/me");
      if (res.ok) setMe(await res.json());
    } finally {
      setMeLoading(false);
    }
  }, []);

  const fetchMemberships = useCallback(async () => {
    try {
      const res = await fetch("/api/organizations/me");
      if (res.ok) {
        const data = (await res.json()) as MembershipsResponse;
        setMemberships(data.memberships);
        setActiveOrganizationId(data.activeOrganizationId);
      }
    } finally {
      setMembershipsLoading(false);
    }
  }, []);

  const fetchInvites = useCallback(async () => {
    try {
      const res = await fetch("/api/organizations/me/invites");
      if (res.ok) setInvites(await res.json());
    } finally {
      setInvitesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      void fetchMe();
      void fetchMemberships();
      void fetchInvites();
    }
  }, [status, fetchMe, fetchMemberships, fetchInvites]);

  useEffect(() => {
    if (meLoading || invitesLoading || status !== "authenticated") return;
    if (
      me &&
      !me.hasOrganization &&
      !me.profileComplete &&
      invites.length === 0
    ) {
      router.replace("/organizations/setup");
    }
  }, [me, meLoading, invitesLoading, invites.length, status, router]);

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
      window.location.href = "/organizations";
    } catch {
      setError(t("inviteError"));
    } finally {
      setActionLoading(false);
    }
  };

  const loading =
    status === "loading" || permLoading || meLoading || membershipsLoading;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <OrganizationsShell>
        <OrganizationsHub
          memberships={memberships}
          activeOrganizationId={activeOrganizationId}
          invites={invites}
          isSuperAdmin={isSuperAdmin}
          createOrgHref={createOrgHref}
          profileComplete={me?.profileComplete ?? false}
          hasOrganization={hasOrganization}
          invitesLoading={invitesLoading}
          actionLoading={actionLoading}
          error={error}
          onAcceptInvite={acceptInvite}
        />
      </OrganizationsShell>
    </ProtectedRoute>
  );
}
