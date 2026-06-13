"use client";

import {
  AlertTriangle,
  Building2,
  ChevronRight,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Receipt,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { signOut, useSession } from "next-auth/react";

import { AppPreferencesControls } from "@/components/preferences/AppPreferencesControls";
import { Link, usePathname } from "@/navigation";
import { cn } from "@/lib/utils";

export function AdminSidebar() {
  const t = useTranslations("Admin");
  const pathname = usePathname();
  const { data: session } = useSession();

  const menuItems = [
    {
      id: "dashboard",
      label: t("nav.dashboard"),
      href: "/admin" as const,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      id: "organizations",
      label: t("nav.organizations"),
      href: "/admin/organizations" as const,
      icon: Building2,
      exact: false,
    },
    {
      id: "users",
      label: t("nav.users"),
      href: "/admin/users" as const,
      icon: Users,
      exact: false,
    },
    {
      id: "plans",
      label: t("nav.plans"),
      href: "/admin/plans" as const,
      icon: CreditCard,
      exact: false,
    },
    {
      id: "billing",
      label: t("nav.billing"),
      href: "/admin/billing" as const,
      icon: Receipt,
      exact: false,
    },
    {
      id: "incidents",
      label: t("nav.incidents"),
      href: "/admin/incidents" as const,
      icon: AlertTriangle,
      exact: false,
    },
    {
      id: "audit",
      label: t("nav.audit"),
      href: "/admin/audit" as const,
      icon: ClipboardList,
      exact: false,
    },
  ];

  return (
    <aside className="sticky top-0 flex h-screen w-72 shrink-0 flex-col border-r border-violet-900/30 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      <div className="border-b border-violet-900/30 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-600">
            <span className="text-sm font-bold text-white">S</span>
          </div>
          <div>
            <p className="font-bold text-white">{t("brand")}</p>
            <p className="text-xs text-violet-300/70">{t("subtitle")}</p>
          </div>
        </div>
      </div>
      <nav className="flex min-h-0 flex-1 flex-col p-4">
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
          {menuItems.map(item => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                  active
                    ? "bg-violet-600/20 text-violet-200 shadow-lg shadow-violet-900/20"
                    : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight className="h-4 w-4 text-violet-400" />}
              </Link>
            );
          })}
        </div>
        <div className="mt-4 shrink-0 border-t border-violet-900/30 pt-4">
          <Link
            href="/organizations"
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
              pathname.includes("/organizations")
                ? "bg-violet-600/20 text-violet-200"
                : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
            )}
          >
            <Building2 className="h-5 w-5 shrink-0" />
            <span className="flex-1">{t("nav.myOrganizations")}</span>
            <ChevronRight className="h-4 w-4 opacity-50" />
          </Link>
        </div>
      </nav>
      <div className="border-t border-violet-900/30 p-4">
        <AppPreferencesControls
          variant="marketing"
          className="mb-4 justify-center"
        />
        <p className="mb-3 truncate text-sm text-gray-300">
          {session?.user?.name ?? session?.user?.email}
        </p>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-gray-200"
        >
          <LogOut className="h-4 w-4" />
          {t("nav.logout")}
        </button>
      </div>
    </aside>
  );
}
