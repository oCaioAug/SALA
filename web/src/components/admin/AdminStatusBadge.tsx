"use client";

import {
  IncidentPriority,
  IncidentStatus,
  OrganizationStatus,
  PlatformRole,
  SubscriptionStatus,
} from "@prisma/client";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

type AdminBadgeVariant =
  | "organization"
  | "platformRole"
  | "subscription"
  | "incident"
  | "incidentPriority"
  | "neutral"
  | "success"
  | "warning"
  | "danger";

const organizationStatusClass: Record<OrganizationStatus, string> = {
  ACTIVE:
    "bg-emerald-500/20 text-emerald-800 ring-emerald-500/30 dark:text-emerald-300",
  SUSPENDED: "bg-red-500/20 text-red-800 ring-red-500/30 dark:text-red-300",
  TRIAL:
    "bg-amber-500/20 text-amber-800 ring-amber-500/30 dark:text-amber-300",
};

const platformRoleClass: Record<PlatformRole, string> = {
  SUPER_ADMIN: "bg-primary/20 text-primary dark:text-primary ring-ring/30",
  NONE: "bg-gray-500/20 text-gray-700 ring-gray-500/30 dark:text-gray-300",
};

const subscriptionStatusClass: Record<SubscriptionStatus, string> = {
  ACTIVE:
    "bg-emerald-500/20 text-emerald-800 ring-emerald-500/30 dark:text-emerald-300",
  TRIALING:
    "bg-amber-500/20 text-amber-800 ring-amber-500/30 dark:text-amber-300",
  PAST_DUE:
    "bg-orange-500/20 text-orange-800 ring-orange-500/30 dark:text-orange-300",
  CANCELLED: "bg-red-500/20 text-red-800 ring-red-500/30 dark:text-red-300",
};

const incidentStatusClass: Record<IncidentStatus, string> = {
  REPORTED:
    "bg-blue-500/20 text-blue-800 ring-blue-500/30 dark:text-blue-300",
  IN_ANALYSIS:
    "bg-amber-500/20 text-amber-800 ring-amber-500/30 dark:text-amber-300",
  IN_PROGRESS: "bg-primary/20 text-primary dark:text-primary ring-ring/30",
  RESOLVED:
    "bg-emerald-500/20 text-emerald-800 ring-emerald-500/30 dark:text-emerald-300",
  CANCELLED:
    "bg-gray-500/20 text-gray-700 ring-gray-500/30 dark:text-gray-300",
};

const incidentPriorityClass: Record<IncidentPriority, string> = {
  LOW: "bg-gray-500/20 text-gray-700 ring-gray-500/30 dark:text-gray-300",
  MEDIUM: "bg-blue-500/20 text-blue-800 ring-blue-500/30 dark:text-blue-300",
  HIGH: "bg-orange-500/20 text-orange-800 ring-orange-500/30 dark:text-orange-300",
  CRITICAL: "bg-red-500/20 text-red-800 ring-red-500/30 dark:text-red-300",
};

const variantFallback: Record<
  Exclude<
    AdminBadgeVariant,
    | "organization"
    | "platformRole"
    | "subscription"
    | "incident"
    | "incidentPriority"
  >,
  string
> = {
  neutral: "bg-gray-500/20 text-gray-700 ring-gray-500/30 dark:text-gray-300",
  success:
    "bg-emerald-500/20 text-emerald-800 ring-emerald-500/30 dark:text-emerald-300",
  warning:
    "bg-amber-500/20 text-amber-800 ring-amber-500/30 dark:text-amber-300",
  danger: "bg-red-500/20 text-red-800 ring-red-500/30 dark:text-red-300",
};

interface AdminStatusBadgeProps {
  status:
    | OrganizationStatus
    | PlatformRole
    | SubscriptionStatus
    | IncidentStatus
    | IncidentPriority
    | string;
  kind?: AdminBadgeVariant;
  label?: string;
  className?: string;
}

export function AdminStatusBadge({
  status,
  kind = "neutral",
  label,
  className,
}: AdminStatusBadgeProps) {
  const t = useTranslations("Admin.badges");
  let resolvedLabel = label;
  let resolvedClassName = variantFallback.neutral;

  if (kind === "organization" && status in organizationStatusClass) {
    resolvedLabel =
      label ?? t(`organization.${status as OrganizationStatus}`);
    resolvedClassName = organizationStatusClass[status as OrganizationStatus];
  } else if (kind === "platformRole" && status in platformRoleClass) {
    resolvedLabel = label ?? t(`platformRole.${status as PlatformRole}`);
    resolvedClassName = platformRoleClass[status as PlatformRole];
  } else if (kind === "subscription" && status in subscriptionStatusClass) {
    resolvedLabel =
      label ?? t(`subscription.${status as SubscriptionStatus}`);
    resolvedClassName =
      subscriptionStatusClass[status as SubscriptionStatus];
  } else if (kind === "incident" && status in incidentStatusClass) {
    resolvedLabel = label ?? t(`incident.${status as IncidentStatus}`);
    resolvedClassName = incidentStatusClass[status as IncidentStatus];
  } else if (kind === "incidentPriority" && status in incidentPriorityClass) {
    resolvedLabel =
      label ?? t(`incidentPriority.${status as IncidentPriority}`);
    resolvedClassName = incidentPriorityClass[status as IncidentPriority];
  } else if (kind in variantFallback) {
    resolvedClassName = variantFallback[kind as keyof typeof variantFallback];
    resolvedLabel = label ?? String(status);
  } else {
    resolvedLabel = label ?? String(status);
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        resolvedClassName,
        className
      )}
    >
      {resolvedLabel}
    </span>
  );
}

/** @deprecated Prefer AdminStatusBadge with translations; kept for className lookups */
export const organizationStatusConfig = Object.fromEntries(
  (Object.keys(organizationStatusClass) as OrganizationStatus[]).map(k => [
    k,
    { label: k, className: organizationStatusClass[k] },
  ])
) as Record<OrganizationStatus, { label: string; className: string }>;

export const platformRoleConfig = Object.fromEntries(
  (Object.keys(platformRoleClass) as PlatformRole[]).map(k => [
    k,
    { label: k, className: platformRoleClass[k] },
  ])
) as Record<PlatformRole, { label: string; className: string }>;

export const subscriptionStatusConfig = Object.fromEntries(
  (Object.keys(subscriptionStatusClass) as SubscriptionStatus[]).map(k => [
    k,
    { label: k, className: subscriptionStatusClass[k] },
  ])
) as Record<SubscriptionStatus, { label: string; className: string }>;
