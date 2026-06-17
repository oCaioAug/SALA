"use client";

import { PlatformRole } from "@prisma/client";
import { Calendar, Mail, Shield, User, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { Button } from "@/components/ui/Button";
import { Link } from "@/navigation";

export interface AdminUserDetail {
  id: string;
  name: string | null;
  email: string;
  platformRole: PlatformRole;
  createdAt: string;
  memberships: {
    organization: { id: string; name: string; slug: string };
    role: string;
  }[];
}

interface AdminUserDetailModalProps {
  user: AdminUserDetail | null;
  open: boolean;
  onClose: () => void;
  onToggleSuperAdmin: (user: AdminUserDetail) => void;
  updating?: boolean;
}

export function AdminUserDetailModal({
  user,
  open,
  onClose,
  onToggleSuperAdmin,
  updating = false,
}: AdminUserDetailModalProps) {
  const t = useTranslations("Admin.users");

  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !user) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-user-detail-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label={t("closeModal")}
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-start justify-between border-b border-border bg-gradient-to-r from-violet-500/10 to-card px-6 py-5">
          <div className="min-w-0">
            <p
              id="admin-user-detail-title"
              className="truncate text-lg font-bold text-foreground"
            >
              {user.name ?? user.email}
            </p>
            <p className="mt-1 truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailField
              icon={Shield}
              label={t("platformRole")}
              value={
                <AdminStatusBadge
                  status={user.platformRole}
                  kind="platformRole"
                />
              }
            />
            <DetailField
              icon={Calendar}
              label={t("memberSince")}
              value={new Date(user.createdAt).toLocaleDateString("pt-BR")}
            />
          </div>

          <div>
            <p className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <User className="h-4 w-4 text-violet-400" />
              {t("organizations")}
            </p>
            {user.memberships.length === 0 ? (
              <p className="rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                {t("noOrganizations")}
              </p>
            ) : (
              <ul className="space-y-2">
                {user.memberships.map(membership => (
                  <li
                    key={membership.organization.id}
                    className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/admin/organizations/${membership.organization.id}`}
                        className="block truncate text-sm font-medium text-foreground hover:text-foreground"
                        onClick={onClose}
                      >
                        {membership.organization.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {membership.organization.slug}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-violet-700 dark:text-violet-300">
                      {membership.role}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              {t("closeModal")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={updating}
              onClick={() => onToggleSuperAdmin(user)}
            >
              {user.platformRole === PlatformRole.SUPER_ADMIN
                ? t("removeSuperAdmin")
                : t("promoteSuperAdmin")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailField({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-muted/50 px-4 py-3">
      <p className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  );
}
