"use client";

import { OrganizationRole, OrganizationStatus } from "@/lib/auth/roles";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AdminPageContent, AdminPageHeader } from "@/components/admin/AdminLayout";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import {
  OrganizationDetail,
  OrganizationDetailView,
} from "@/components/admin/OrganizationDetailView";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Link } from "@/navigation";

export default function OrganizationDetailPage() {
  const t = useTranslations("Admin.organizations");
  const params = useParams();
  const id = params.id as string;
  const [org, setOrg] = useState<OrganizationDetail | null>(null);
  const [plans, setPlans] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRoleDrafts, setMemberRoleDrafts] = useState<
    Record<string, OrganizationRole>
  >({});
  const [savingMemberRoleId, setSavingMemberRoleId] = useState<string | null>(
    null
  );

  const fetchOrg = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/organizations/${id}`);
      if (!res.ok) throw new Error("Não encontrada");
      setOrg(await res.json());
    } catch {
      setOrg(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrg();
    fetch("/api/admin/plans")
      .then(r => (r.ok ? r.json() : []))
      .then(setPlans)
      .catch(() => setPlans([]));
  }, [fetchOrg]);

  useEffect(() => {
    if (!org) return;
    const drafts: Record<string, OrganizationRole> = {};
    for (const member of org.members) {
      if (member.role !== OrganizationRole.OWNER) {
        drafts[member.user.id] = member.role;
      }
    }
    setMemberRoleDrafts(drafts);
  }, [org]);

  const updateStatus = async (status: OrganizationStatus) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/organizations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) await fetchOrg();
    } finally {
      setUpdating(false);
    }
  };

  const updateIsSchool = async (isSchool: boolean) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/organizations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSchool }),
      });
      if (res.ok) await fetchOrg();
    } finally {
      setUpdating(false);
    }
  };

  const saveMemberRole = async (userId: string) => {
    const role = memberRoleDrafts[userId];
    const savedRole = org?.members.find(m => m.user.id === userId)?.role;
    if (!role || role === savedRole) return;

    setSavingMemberRoleId(userId);
    try {
      const res = await fetch(
        `/api/admin/organizations/${id}/members/${userId}/role`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        }
      );
      if (res.ok) await fetchOrg();
    } finally {
      setSavingMemberRoleId(null);
    }
  };

  const updatePlan = async (planId: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/organizations/${id}/subscription`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      if (res.ok) await fetchOrg();
    } finally {
      setUpdating(false);
    }
  };

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberEmail.trim()) return;
    const res = await fetch(`/api/admin/organizations/${id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: memberEmail.trim(), role: "MEMBER" }),
    });
    if (res.ok) {
      setMemberEmail("");
      await fetchOrg();
    }
  };

  const removeMember = async (userId: string) => {
    if (!confirm(t("removeMemberConfirm"))) return;
    const res = await fetch(
      `/api/admin/organizations/${id}/members?userId=${userId}`,
      { method: "DELETE" }
    );
    if (res.ok) await fetchOrg();
  };

  if (loading) {
    return (
      <>
        <AdminPageHeader title={t("detailTitle")} />
        <AdminPageContent>
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        </AdminPageContent>
      </>
    );
  }

  if (!org) {
    return (
      <>
        <AdminPageHeader title={t("notFound")} />
        <AdminPageContent>
          <Link href="/admin/organizations" className="text-violet-400">
            {t("backToList")}
          </Link>
        </AdminPageContent>
      </>
    );
  }

  return (
    <>
      <AdminPageHeader
        title={org.name}
        description={`Slug: ${org.slug}`}
        actions={
          <AdminStatusBadge status={org.status} kind="organization" />
        }
      />
      <AdminPageContent>
        <Link
          href="/admin/organizations"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToList")}
        </Link>

        <OrganizationDetailView
          org={org}
          plans={plans}
          updating={updating}
          memberEmail={memberEmail}
          setMemberEmail={setMemberEmail}
          updateStatus={updateStatus}
          updateIsSchool={updateIsSchool}
          memberRoleDrafts={memberRoleDrafts}
          setMemberRoleDrafts={setMemberRoleDrafts}
          saveMemberRole={saveMemberRole}
          savingMemberRoleId={savingMemberRoleId}
          updatePlan={updatePlan}
          addMember={addMember}
          removeMember={removeMember}
        />
      </AdminPageContent>
    </>
  );
}
