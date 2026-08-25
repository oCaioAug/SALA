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

import {
  adminNavActiveClass,
  adminNavInactiveClass,
} from "@/components/admin/admin-styles";
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
    <aside className="sticky top-0 flex h-screen w-72 shrink-0 flex-col border-r border-border bg-card">
      <div className="border-b border-border p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="text-sm font-bold text-white">S</span>
          </div>
          <div>
            <p className="font-bold text-foreground">{t("brand")}</p>
            <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
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
                  "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? adminNavActiveClass : adminNavInactiveClass
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {active && (
                  <ChevronRight className="h-4 w-4 text-primary dark:text-primary" />
                )}
              </Link>
            );
          })}
        </div>
        <div className="mt-4 shrink-0 border-t border-border pt-4">
          <Link
            href="/organizations"
            className={cn(
              "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/organizations" ||
                pathname.startsWith("/organizations/")
                ? adminNavActiveClass
                : adminNavInactiveClass
            )}
          >
            <Building2 className="h-5 w-5 shrink-0" />
            <span className="flex-1">{t("nav.myOrganizations")}</span>
            <ChevronRight className="h-4 w-4 opacity-50" />
          </Link>
        </div>
      </nav>
      <div className="border-t border-border p-4">
        <AppPreferencesControls
          variant="marketing"
          className="mb-4 justify-center"
          languageDropdownPlacement="auto"
        />
        <p className="mb-3 truncate text-sm text-foreground">
          {session?.user?.name ?? session?.user?.email}
        </p>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
            adminNavInactiveClass
          )}
        >
          <LogOut className="h-4 w-4" />
          {t("nav.logout")}
        </button>
      </div>
    </aside>
  );
}
