"use client";

import { OrganizationRole, OrganizationStatus } from "@/lib/auth/roles";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AdminActionError } from "@/components/admin/AdminActionError";
import {
  AdminPageContent,
  AdminPageHeader,
} from "@/components/admin/AdminLayout";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import {
  OrganizationDetail,
  OrganizationDetailView,
} from "@/components/admin/OrganizationDetailView";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useApiErrorMessage } from "@/lib/hooks/useApiErrorMessage";
import { Link, useRouter } from "@/navigation";

type PendingAction =
  | { type: "removeMember"; userId: string }
  | { type: "transferOwnership"; userId: string }
  | null;

export default function OrganizationDetailPage() {
  const t = useTranslations("Admin.organizations");
  const { fromResponse } = useApiErrorMessage();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [org, setOrg] = useState<OrganizationDetail | null>(null);
  const [plans, setPlans] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionWarning, setActionWarning] = useState<string | null>(null);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<OrganizationRole>(
    OrganizationRole.MEMBER
  );
  const [memberRoleDrafts, setMemberRoleDrafts] = useState<
    Record<string, OrganizationRole>
  >({});
  const [savingMemberRoleId, setSavingMemberRoleId] = useState<string | null>(
    null
  );
  const [profileDraft, setProfileDraft] = useState({
    name: "",
    slug: "",
    email: "",
    phone: "",
    legalName: "",
    cnpj: "",
  });
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const fetchOrg = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/organizations/${id}`);
      if (!res.ok) throw new Error(t("notFound"));
      const data = await res.json();
      setOrg(data);
      setProfileDraft({
        name: data.name ?? "",
        slug: data.slug ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
        legalName: data.legalName ?? "",
        cnpj: data.cnpj ?? "",
      });
    } catch {
      setOrg(null);
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    fetchOrg();
    fetch("/api/admin/plans")
      .then(r => (r.ok ? r.json() : []))
      .then(setPlans)
      .catch(() => setPlans([]));

    const warningKey = `admin-org-warning-${id}`;
    const warning = sessionStorage.getItem(warningKey);
    if (warning) {
      setActionWarning(warning);
      sessionStorage.removeItem(warningKey);
    }
  }, [fetchOrg, id]);

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

  const runMutation = async (fn: () => Promise<Response>) => {
    setUpdating(true);
    setActionError(null);
    try {
      const res = await fn();
      if (!res.ok) {
        setActionError(await fromResponse(res));
        return false;
      }
      await fetchOrg();
      return true;
    } finally {
      setUpdating(false);
    }
  };

  const updateStatus = async (status: OrganizationStatus) => {
    await runMutation(() =>
      fetch(`/api/admin/organizations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
    );
  };

  const updateIsSchool = async (isSchool: boolean) => {
    await runMutation(() =>
      fetch(`/api/admin/organizations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSchool }),
      })
    );
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await runMutation(() =>
      fetch(`/api/admin/organizations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileDraft.name.trim(),
          slug: profileDraft.slug.trim(),
          email: profileDraft.email.trim() || null,
          phone: profileDraft.phone.trim() || null,
          legalName: profileDraft.legalName.trim() || null,
          cnpj: profileDraft.cnpj.trim() || null,
        }),
      })
    );
  };

  const saveMemberRole = async (userId: string) => {
    const role = memberRoleDrafts[userId];
    const savedRole = org?.members.find(m => m.user.id === userId)?.role;
    if (!role || role === savedRole) return;

    setSavingMemberRoleId(userId);
    setActionError(null);
    try {
      const res = await fetch(
        `/api/admin/organizations/${id}/members/${userId}/role`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        }
      );
      if (!res.ok) {
        setActionError(await fromResponse(res));
        return;
      }
      await fetchOrg();
    } finally {
      setSavingMemberRoleId(null);
    }
  };

  const updatePlan = async (planId: string) => {
    await runMutation(() =>
      fetch(`/api/admin/organizations/${id}/subscription`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      })
    );
  };

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberEmail.trim()) return;
    setActionError(null);
    const res = await fetch(`/api/admin/organizations/${id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: memberEmail.trim(),
        role: memberRole,
      }),
    });
    if (!res.ok) {
      setActionError(await fromResponse(res));
      return;
    }
    setMemberEmail("");
    setMemberRole(OrganizationRole.MEMBER);
    await fetchOrg();
  };

  const removeMember = (userId: string) => {
    setPendingAction({ type: "removeMember", userId });
  };

  const transferOwnership = (userId: string) => {
    setPendingAction({ type: "transferOwnership", userId });
  };

  const executePendingAction = async () => {
    if (!pendingAction) return;
    const { type, userId } = pendingAction;
    setActionError(null);

    if (type === "removeMember") {
      setUpdating(true);
      try {
        const res = await fetch(
          `/api/admin/organizations/${id}/members?userId=${userId}`,
          { method: "DELETE" }
        );
        if (!res.ok) {
          setActionError(await fromResponse(res));
          return;
        }
        setPendingAction(null);
        await fetchOrg();
      } finally {
        setUpdating(false);
      }
      return;
    }

    const ok = await runMutation(() =>
      fetch(`/api/admin/organizations/${id}/transfer-ownership`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newOwnerUserId: userId }),
      })
    );
    if (ok) setPendingAction(null);
  };

  const deleteOrganization = async () => {
    setUpdating(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/organizations/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setActionError(await fromResponse(res));
        return;
      }
      router.push("/admin/organizations");
    } finally {
      setUpdating(false);
    }
  };

  const restoreOrganization = async () => {
    await runMutation(() =>
      fetch(`/api/admin/organizations/${id}/restore`, { method: "POST" })
    );
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
          <Link href="/admin/organizations" className="text-primary">
            {t("backToList")}
          </Link>
        </AdminPageContent>
      </>
    );
  }

  const confirmTitle =
    pendingAction?.type === "removeMember"
      ? t("removeMemberTitle")
      : t("transferOwnershipTitle");
  const confirmDescription =
    pendingAction?.type === "removeMember"
      ? t("removeMemberConfirm")
      : t("transferOwnershipConfirm");

  return (
    <>
      <AdminPageHeader
        title={org.name}
        description={t("slugLabel", { slug: org.slug })}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <AdminStatusBadge status={org.status} kind="organization" />
            {org.deletedAt ? (
              <AdminStatusBadge
                status="deleted"
                kind="danger"
                label={t("deleted")}
              />
            ) : null}
          </div>
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

        <AdminActionError
          message={actionError}
          onDismiss={() => setActionError(null)}
        />
        {actionWarning && (
          <div
            role="status"
            className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200"
          >
            {actionWarning}
          </div>
        )}

        <OrganizationDetailView
          org={org}
          plans={plans}
          updating={updating}
          memberEmail={memberEmail}
          setMemberEmail={setMemberEmail}
          memberRole={memberRole}
          setMemberRole={setMemberRole}
          updateStatus={updateStatus}
          updateIsSchool={updateIsSchool}
          memberRoleDrafts={memberRoleDrafts}
          setMemberRoleDrafts={setMemberRoleDrafts}
          saveMemberRole={saveMemberRole}
          savingMemberRoleId={savingMemberRoleId}
          updatePlan={updatePlan}
          addMember={addMember}
          removeMember={removeMember}
          profileDraft={profileDraft}
          setProfileDraft={setProfileDraft}
          saveProfile={saveProfile}
          transferOwnership={transferOwnership}
          deleteOrganization={deleteOrganization}
          restoreOrganization={restoreOrganization}
        />

        <ConfirmModal
          isOpen={Boolean(pendingAction)}
          variant={
            pendingAction?.type === "removeMember" ? "destructive" : "default"
          }
          title={confirmTitle}
          description={confirmDescription}
          confirmLabel={t("confirmAction")}
          cancelLabel={t("cancelAction")}
          loading={updating}
          onCancel={() => {
            if (!updating) setPendingAction(null);
          }}
          onConfirm={() => void executePendingAction()}
        />
      </AdminPageContent>
    </>
  );
}
