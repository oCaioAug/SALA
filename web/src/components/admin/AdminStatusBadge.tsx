import {
  IncidentPriority,
  IncidentStatus,
  OrganizationStatus,
  PlatformRole,
  SubscriptionStatus,
} from "@prisma/client";

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

const organizationStatusConfig: Record<
  OrganizationStatus,
  { label: string; className: string }
> = {
  ACTIVE: {
    label: "Ativa",
    className: "bg-emerald-500/20 text-emerald-300 ring-emerald-500/30",
  },
  SUSPENDED: {
    label: "Suspensa",
    className: "bg-red-500/20 text-red-300 ring-red-500/30",
  },
  TRIAL: {
    label: "Trial",
    className: "bg-amber-500/20 text-amber-300 ring-amber-500/30",
  },
};

const platformRoleConfig: Record<
  PlatformRole,
  { label: string; className: string }
> = {
  SUPER_ADMIN: {
    label: "Super Admin",
    className: "bg-violet-500/20 text-violet-300 ring-violet-500/30",
  },
  NONE: {
    label: "Usuário",
    className: "bg-gray-500/20 text-gray-300 ring-gray-500/30",
  },
};

const subscriptionStatusConfig: Record<
  SubscriptionStatus,
  { label: string; className: string }
> = {
  ACTIVE: {
    label: "Ativa",
    className: "bg-emerald-500/20 text-emerald-300 ring-emerald-500/30",
  },
  TRIALING: {
    label: "Trial",
    className: "bg-amber-500/20 text-amber-300 ring-amber-500/30",
  },
  PAST_DUE: {
    label: "Inadimplente",
    className: "bg-orange-500/20 text-orange-300 ring-orange-500/30",
  },
  CANCELLED: {
    label: "Cancelada",
    className: "bg-red-500/20 text-red-300 ring-red-500/30",
  },
};

const incidentStatusConfig: Record<
  IncidentStatus,
  { label: string; className: string }
> = {
  REPORTED: {
    label: "Reportado",
    className: "bg-blue-500/20 text-blue-300 ring-blue-500/30",
  },
  IN_ANALYSIS: {
    label: "Em análise",
    className: "bg-amber-500/20 text-amber-300 ring-amber-500/30",
  },
  IN_PROGRESS: {
    label: "Em progresso",
    className: "bg-violet-500/20 text-violet-300 ring-violet-500/30",
  },
  RESOLVED: {
    label: "Resolvido",
    className: "bg-emerald-500/20 text-emerald-300 ring-emerald-500/30",
  },
  CANCELLED: {
    label: "Cancelado",
    className: "bg-gray-500/20 text-gray-300 ring-gray-500/30",
  },
};

const incidentPriorityConfig: Record<
  IncidentPriority,
  { label: string; className: string }
> = {
  LOW: {
    label: "Baixa",
    className: "bg-gray-500/20 text-gray-300 ring-gray-500/30",
  },
  MEDIUM: {
    label: "Média",
    className: "bg-blue-500/20 text-blue-300 ring-blue-500/30",
  },
  HIGH: {
    label: "Alta",
    className: "bg-orange-500/20 text-orange-300 ring-orange-500/30",
  },
  CRITICAL: {
    label: "Crítica",
    className: "bg-red-500/20 text-red-300 ring-red-500/30",
  },
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
  neutral: "bg-gray-500/20 text-gray-300 ring-gray-500/30",
  success: "bg-emerald-500/20 text-emerald-300 ring-emerald-500/30",
  warning: "bg-amber-500/20 text-amber-300 ring-amber-500/30",
  danger: "bg-red-500/20 text-red-300 ring-red-500/30",
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
  let resolvedLabel = label;
  let resolvedClassName = variantFallback.neutral;

  if (kind === "organization" && status in organizationStatusConfig) {
    const config =
      organizationStatusConfig[status as OrganizationStatus];
    resolvedLabel = label ?? config.label;
    resolvedClassName = config.className;
  } else if (kind === "platformRole" && status in platformRoleConfig) {
    const config = platformRoleConfig[status as PlatformRole];
    resolvedLabel = label ?? config.label;
    resolvedClassName = config.className;
  } else if (kind === "subscription" && status in subscriptionStatusConfig) {
    const config =
      subscriptionStatusConfig[status as SubscriptionStatus];
    resolvedLabel = label ?? config.label;
    resolvedClassName = config.className;
  } else if (kind === "incident" && status in incidentStatusConfig) {
    const config = incidentStatusConfig[status as IncidentStatus];
    resolvedLabel = label ?? config.label;
    resolvedClassName = config.className;
  } else if (kind === "incidentPriority" && status in incidentPriorityConfig) {
    const config = incidentPriorityConfig[status as IncidentPriority];
    resolvedLabel = label ?? config.label;
    resolvedClassName = config.className;
  } else if (kind in variantFallback) {
    resolvedClassName =
      variantFallback[kind as keyof typeof variantFallback];
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

export {
  organizationStatusConfig,
  platformRoleConfig,
  subscriptionStatusConfig,
};
