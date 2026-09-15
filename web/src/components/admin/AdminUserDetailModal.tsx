"use client";

import { PlatformRole } from "@prisma/client";
import { Calendar, Mail, RotateCcw, Shield, Trash2, User, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect } from "react";

import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { Button } from "@/components/ui/Button";
import { getIntlLocale } from "@/lib/utils";
import { Link } from "@/navigation";

export interface AdminUserDetail {
  id: string;
  name: string | null;
  email: string;
  platformRole: PlatformRole;
  createdAt: string;
  deletedAt?: string | null;
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
  onDeleteUser?: (user: AdminUserDetail) => void;
  onRestoreUser?: (user: AdminUserDetail) => void;
  updating?: boolean;
}

export function AdminUserDetailModal({
  user,
  open,
  onClose,
  onToggleSuperAdmin,
  onDeleteUser,
  onRestoreUser,
  updating = false,
}: AdminUserDetailModalProps) {
  const t = useTranslations("Admin.users");
  const tRoles = useTranslations("Admin.badges.organizationRole");
  const locale = useLocale();
  const intlLocale = getIntlLocale(locale);

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

  const isDeleted = Boolean(user.deletedAt);

  const roleLabel = (role: string) => {
    try {
      return tRoles(role as "OWNER" | "ADMIN" | "MEMBER");
    } catch {
      return role;
    }
  };

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
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="flex items-start justify-between border-b border-border bg-muted/40 px-6 py-5">
          <div className="min-w-0">
            <p
              id="admin-user-detail-title"
              className="truncate text-lg font-bold text-foreground"
            >
              {user.name ?? user.email}
            </p>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {user.email}
            </p>
            {isDeleted && (
              <div className="mt-2">
                <AdminStatusBadge
                  status="deleted"
                  kind="danger"
                  label={t("deleted")}
                />
              </div>
            )}
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
              value={new Date(user.createdAt).toLocaleDateString(intlLocale)}
            />
          </div>

          <div>
            <p className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <User className="h-4 w-4 text-primary" />
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
                    <span className="shrink-0 text-xs font-medium text-primary dark:text-primary">
                      {roleLabel(membership.role)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              {t("closeModal")}
            </Button>
            {isDeleted ? (
              onRestoreUser && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={updating}
                  onClick={() => onRestoreUser(user)}
                >
                  <RotateCcw className="mr-1.5 h-4 w-4" />
                  {t("restoreUser")}
                </Button>
              )
            ) : (
              <>
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
                {onDeleteUser && (
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    disabled={updating}
                    onClick={() => onDeleteUser(user)}
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" />
                    {t("deleteUser")}
                  </Button>
                )}
              </>
            )}
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
