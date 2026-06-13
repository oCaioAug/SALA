import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { cn } from "@/lib/utils";

export interface AdminMetric {
  id: string;
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  iconClassName?: string;
  borderClassName?: string;
}

interface AdminMetricCardsProps {
  metrics: AdminMetric[];
  loading?: boolean;
  className?: string;
}

export function AdminMetricCards({
  metrics,
  loading = false,
  className,
}: AdminMetricCardsProps) {
  return (
    <div
      className={cn(
        "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
        className
      )}
    >
      {metrics.map(metric => {
        const Icon = metric.icon;
        return (
          <Card
            key={metric.id}
            className={cn(
              "border-white/10 bg-white/5 backdrop-blur",
              metric.borderClassName
            )}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium uppercase tracking-wide text-gray-400">
                    {metric.label}
                  </p>
                  <p className="mt-1 text-3xl font-bold text-white">
                    {loading ? (
                      <span className="inline-flex h-9 items-center">
                        <LoadingSpinner size="sm" />
                      </span>
                    ) : (
                      metric.value
                    )}
                  </p>
                  {metric.sub && (
                    <p className="mt-1 text-xs text-gray-500">{metric.sub}</p>
                  )}
                </div>
                <Icon
                  className={cn(
                    "h-8 w-8 shrink-0",
                    metric.iconClassName ?? "text-violet-400"
                  )}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
