"use client";

import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  User as UserIcon,
} from "lucide-react";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import React, { useCallback, useEffect, useState } from "react";

import LanguageSwitcher from "@/components/LanguageSwitcher";
import { NotificationModal } from "@/components/ui/NotificationModal";
import { useTheme } from "@/lib/providers/ThemeProvider";
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
  const { theme, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // Buscar contador de notificações
  const fetchNotificationCount = useCallback(async () => {
    if (!session?.user?.email) {
      console.log("No user email available for fetching notifications");
      return;
    }

    console.log(
      "Header: Buscando contador de notificações para:",
      session.user.email
    );

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 segundos timeout

      const response = await fetch(
        `/api/notifications/count?userId=${session.user.email}`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      console.log(
        "Header: Resposta do contador:",
        response.status,
        response.ok
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Header: Contador atualizado:", data.count);
        setNotificationCount(data.count);
      } else {
        console.error("Header: Erro ao buscar contador:", response.status);
        // Em caso de erro, manter o valor anterior
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
      // Em caso de erro, não alterar o contador atual
    }
  }, [session?.user?.email]);

  useEffect(() => {
    if (session?.user?.email) {
      fetchNotificationCount();

      // Atualizar contador a cada 60 segundos (reduzido de 30s)
      const interval = setInterval(fetchNotificationCount, 60000);
      return () => clearInterval(interval);
    }
  }, [session?.user?.email, fetchNotificationCount]);

  // Escutar atualizações de notificação vindas da página
  useEffect(() => {
    if (notificationUpdateTrigger) {
      // Re-buscar o contador quando há mudanças
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
    <header className="relative z-50 border-b border-slate-300/50 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 px-3 py-3 shadow-lg backdrop-blur-sm transition-colors duration-300 dark:border-slate-600/50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 sm:px-6 sm:py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          {showMobileNavTrigger && onMobileNavOpen && (
            <button
              type="button"
              onClick={onMobileNavOpen}
              className="rounded-xl p-2.5 text-slate-600 hover:bg-slate-200/80 dark:text-slate-400 dark:hover:bg-slate-600/50 md:hidden"
              aria-label={t("openMenu")}
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <div className="flex min-w-0 items-center gap-2 text-slate-600 dark:text-slate-300">
            <span className="truncate text-xs sm:text-sm">
              {t("breadcrumb.dashboard")}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 rotate-90" />
            <span className="truncate text-xs font-medium text-slate-900 sm:text-sm dark:text-white">
              {t("breadcrumb.overview")}
            </span>
          </div>
        </div>

        <div className="mx-0 w-full min-w-0 max-w-none sm:mx-4 sm:max-w-md md:flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-slate-500 dark:text-slate-400" />
            <input
              type="text"
              placeholder={t("search.placeholder")}
              className="w-full rounded-xl border border-slate-300/50 bg-white/80 py-2 pl-10 pr-4 text-sm text-slate-900 transition-all duration-300 placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-slate-500/50 dark:bg-slate-600/50 dark:text-white dark:placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          {session?.user && (
            <div className="relative notification-dropdown">
              <button
                onClick={handleNotificationClick}
                className="relative p-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-600/50 rounded-xl transition-all duration-300 group"
              >
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full opacity-75 animate-ping"></div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">
                        {notificationCount > 9 ? "9+" : notificationCount}
                      </span>
                    </div>
                  </>
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

          {/* Seletor de idioma */}
          <LanguageSwitcher />

          {/* Toggle de tema */}
          <button
            onClick={toggleTheme}
            className="p-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-600/50 rounded-xl transition-all duration-300"
            aria-label={t("userMenu.ariaLabel")}
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {session?.user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-200/80 dark:hover:bg-slate-600/50 transition-all duration-300 group"
              >
                <div className="relative">
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || "Avatar"}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-xl object-cover shadow-lg group-hover:shadow-xl transition-all duration-300"
                    />
                  ) : (
                    <div
                      className={`w-10 h-10 bg-gradient-to-br ${getUserGradient(session.user.name)} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300`}
                    >
                      <span className="text-white font-semibold text-sm">
                        {getUserInitials(session.user.name)}
                      </span>
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-slate-800"></div>
                </div>

                <div className="text-left">
                  <p className="text-slate-900 dark:text-white font-medium text-sm">
                    {session.user.name || tCommon("user")}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-xs capitalize">
                    {session.user.role || tCommon("user")}
                  </p>
                </div>

                <ChevronDown
                  className={`w-4 h-4 text-slate-600 dark:text-slate-400 transition-transform duration-300 ${
                    showUserMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600/50 rounded-xl shadow-2xl z-50 overflow-hidden transition-colors duration-300">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-600/50">
                    <div className="flex items-center gap-3">
                      {session.user.image ? (
                        <Image
                          src={session.user.image}
                          alt={session.user.name || "Avatar"}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                      ) : (
                        <div
                          className={`w-12 h-12 bg-gradient-to-br ${getUserGradient(session.user.name)} rounded-xl flex items-center justify-center`}
                        >
                          <span className="text-white font-semibold">
                            {getUserInitials(session.user.name)}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-slate-900 dark:text-white font-medium">
                          {session.user.name || tCommon("user")}
                        </p>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                          {session.user.email || "user@sala.com"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="py-2">
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white transition-colors duration-200">
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 w-full"
                      >
                        <UserIcon className="w-4 h-4" />
                        <span>{t("userMenu.profile")}</span>
                      </Link>
                    </button>

                    <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white transition-colors duration-200">
                      <Settings className="w-4 h-4" />
                      <span>{t("userMenu.settings")}</span>
                    </button>

                    <div className="border-t border-slate-200 dark:border-slate-600/50 my-2"></div>

                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-300 transition-colors duration-200"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t("userMenu.logout")}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="flex items-center gap-3 rounded-xl p-2 transition-all duration-300 hover:bg-slate-200/80 dark:hover:bg-slate-600/50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-400 bg-slate-100 dark:border-slate-500 dark:bg-slate-700/80">
                <UserIcon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              </div>
              <div className="hidden min-w-0 text-left sm:block">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {t("guest.greeting")}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
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
