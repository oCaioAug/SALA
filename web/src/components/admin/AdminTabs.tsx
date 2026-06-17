"use client";

import type { LucideIcon } from "lucide-react";

import {
  adminCardClass,
  adminTabActiveClass,
  adminTabInactiveClass,
} from "@/components/admin/admin-styles";
import { cn } from "@/lib/utils";

export interface AdminTabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
}

interface AdminTabsProps {
  tabs: AdminTabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function AdminTabs({
  tabs,
  activeTab,
  onTabChange,
  className,
}: AdminTabsProps) {
  return (
    <div className={cn("overflow-hidden rounded-xl", adminCardClass, className)}>
      <div
        className="flex overflow-x-auto border-b border-border"
        role="tablist"
      >
        {tabs.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex min-w-0 flex-1 items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-colors",
                active ? adminTabActiveClass : adminTabInactiveClass
              )}
            >
              {Icon && <Icon className="h-4 w-4 shrink-0" />}
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface AdminTabPanelProps {
  tabId: string;
  activeTab: string;
  children: React.ReactNode;
  className?: string;
}

export function AdminTabPanel({
  tabId,
  activeTab,
  children,
  className,
}: AdminTabPanelProps) {
  if (tabId !== activeTab) return null;

  return (
    <div role="tabpanel" className={className}>
      {children}
    </div>
  );
}
