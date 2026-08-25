"use client";

import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  Settings,
  User as UserIcon,
} from "lucide-react";
import Image from "next/image";
import { OrganizationRole, PlatformRole } from "@/lib/auth/roles";
import { signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import React, { useCallback, useEffect, useState } from "react";

import { AppPreferencesControls } from "@/components/preferences/AppPreferencesControls";
import { NotificationModal } from "@/components/ui/NotificationModal";
import { getUserGradient, getUserInitials } from "@/lib/utils/userUtils";
import { Link } from "@/navigation";

interface HeaderProps {
  onNotificationClick?: () => void;
  onNotificationItemClick?: (notification: any) => void;
  notificationUpdateTrigger?: number;
  showMobileNavTrigger?: boolean;
  onMobileNavOpen?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onNotificationClick,
  onNotificationItemClick,
  notificationUpdateTrigger,
  showMobileNavTrigger = false,
  onMobileNavOpen,
}) => {
  const t = useTranslations("Header");
  const tCommon = useTranslations("Common");
  const { data: session } = useSession();

  const tenantRoleLabel = (() => {
    const orgRole = session?.user?.organizationRole;
    if (orgRole === OrganizationRole.OWNER) return t("roles.owner");
    if (orgRole === OrganizationRole.ADMIN) return t("roles.admin");
    if (orgRole === OrganizationRole.MEMBER) return t("roles.member");
    if (session?.user?.platformRole === PlatformRole.SUPER_ADMIN) {
      return t("roles.platformSuperAdmin");
    }
    return tCommon("user");
  })();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  const fetchNotificationCount = useCallback(async () => {
    if (!session?.user?.email) {
      return;
    }

    if (session.user.platformRole === PlatformRole.SUPER_ADMIN) {
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(
        `/api/notifications/count?userId=${session.user.email}`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setNotificationCount(data.count);
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          console.warn(" Header: Timeout ao buscar contador de notificações");
        } else {
          console.error(
            "Header: Erro ao buscar contador de notificações:",
            error
          );
        }
      }
    }
  }, [session?.user?.email]);

  useEffect(() => {
    if (session?.user?.email) {
      fetchNotificationCount();

      const interval = setInterval(fetchNotificationCount, 60000);
      return () => clearInterval(interval);
    }
  }, [session?.user?.email, fetchNotificationCount]);

  useEffect(() => {
    if (notificationUpdateTrigger) {
      fetchNotificationCount();
    }
  }, [notificationUpdateTrigger, fetchNotificationCount]);

  const handleNotificationClick = () => {
    setIsNotificationModalOpen(true);
    if (onNotificationClick) {
      onNotificationClick();
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: "/auth/login" });
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <header className="relative z-50 border-b border-border bg-card px-3 py-2.5 sm:px-5">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {showMobileNavTrigger && onMobileNavOpen && (
            <button
              type="button"
              onClick={onMobileNavOpen}
              className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
              aria-label={t("openMenu")}
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <div className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
            <span className="truncate text-xs sm:text-sm">
              {t("breadcrumb.dashboard")}
            </span>
            <span className="text-xs text-muted-foreground/60">/</span>
            <span className="truncate text-xs font-medium text-foreground sm:text-sm">
              {t("breadcrumb.overview")}
            </span>
          </div>
        </div>

        <div className="w-full min-w-0 sm:max-w-xs md:max-w-sm">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("search.placeholder")}
              className="h-8 w-full rounded-md border border-input bg-background py-1.5 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          {session?.user && (
            <div className="relative notification-dropdown">
              <button
                onClick={handleNotificationClick}
                className="relative rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Bell className="h-4 w-4" />
                {notificationCount > 0 && (
                  <div className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1">
                    <span className="text-[10px] font-semibold text-white">
                      {notificationCount > 9 ? "9+" : notificationCount}
                    </span>
                  </div>
                )}
              </button>

              <NotificationModal
                isOpen={isNotificationModalOpen}
                onClose={() => setIsNotificationModalOpen(false)}
                userId={session.user.email || session.user.id || ""}
                onNotificationChange={fetchNotificationCount}
                onNotificationClick={onNotificationItemClick}
              />
            </div>
          )}

          <AppPreferencesControls variant="tenant" showLabels />

          {session?.user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 rounded-md p-1.5 hover:bg-muted"
              >
                <div className="relative">
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || "Avatar"}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-md object-cover"
                    />
                  ) : (
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-md ${getUserGradient(session.user.name)}`}
                    >
                      <span className="text-xs font-semibold text-white">
                        {getUserInitials(session.user.name)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="hidden text-left sm:block">
                  <p className="text-sm font-medium text-foreground">
                    {session.user.name || tCommon("user")}
                  </p>
                </div>

                <ChevronDown
                  className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${
                    showUserMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full z-50 mt-1.5 w-60 overflow-hidden rounded-md border border-border bg-card shadow-sm">
                  <div className="border-b border-border p-3">
                    <div className="flex items-center gap-2.5">
                      {session.user.image ? (
                        <Image
                          src={session.user.image}
                          alt={session.user.name || "Avatar"}
                          width={36}
                          height={36}
                          className="h-9 w-9 rounded-md object-cover"
                        />
                      ) : (
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-md ${getUserGradient(session.user.name)}`}
                        >
                          <span className="text-sm font-semibold text-white">
                            {getUserInitials(session.user.name)}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {session.user.name || tCommon("user")}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {session.user.email || "user@sala.com"}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {tenantRoleLabel}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="py-1">
                    <button className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted">
                      <Link
                        href="/profile"
                        className="flex w-full items-center gap-2.5"
                      >
                        <UserIcon className="h-4 w-4" />
                        <span>{t("userMenu.profile")}</span>
                      </Link>
                    </button>

                    <button className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted">
                      <Settings className="h-4 w-4" />
                      <span>{t("userMenu.settings")}</span>
                    </button>

                    <div className="my-1 border-t border-border" />

                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>{t("userMenu.logout")}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="flex items-center gap-2 rounded-md p-1.5 hover:bg-muted"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-dashed border-border bg-muted">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="hidden min-w-0 text-left sm:block">
                <p className="text-sm font-medium text-foreground">
                  {t("guest.greeting")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("guest.loginPrompt")}
                </p>
              </div>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export { Header };
