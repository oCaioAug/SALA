import {
  Bell,
  ChevronDown,
  LogOut,
  Moon,
  Search,
  Settings,
  Sun,
  User as UserIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import React, { useCallback, useEffect, useState } from "react";

import { NotificationModal } from "@/components/ui/NotificationModal";
import { useTheme } from "@/lib/providers/ThemeProvider";
import { getUserInitials, getUserGradient } from "@/lib/utils/userUtils";

interface HeaderProps {
  onNotificationClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNotificationClick }) => {
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
      "🔄 Header: Buscando contador de notificações para:",
      session.user.email
    );
    try {
      const response = await fetch(
        `/api/notifications/count?userId=${session.user.email}`
      );
      console.log(
        "📡 Header: Resposta do contador:",
        response.status,
        response.ok
      );
      if (response.ok) {
        const data = await response.json();
        console.log("✅ Header: Contador atualizado:", data.count);
        setNotificationCount(data.count);
      } else {
        console.error("❌ Header: Erro ao buscar contador:", response.status);
      }
    } catch (error) {
      console.error(
        "❌ Header: Erro ao buscar contador de notificações:",
        error
      );
    }
  }, [session?.user?.email]);

  useEffect(() => {
    if (session?.user?.email) {
      fetchNotificationCount();

      // Atualizar contador a cada 30 segundos
      const interval = setInterval(fetchNotificationCount, 30000);
      return () => clearInterval(interval);
    }
  }, [session?.user?.email, fetchNotificationCount]);

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

  if (!session?.user) return null;

  return (
    <header className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 border-b border-slate-300/50 dark:border-slate-600/50 px-6 py-4 shadow-lg backdrop-blur-sm relative z-50 transition-colors duration-300">
      <div className="flex items-center justify-between">
        {/* Breadcrumb e título */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <span className="text-sm">Dashboard</span>
            <ChevronDown className="w-4 h-4 rotate-90" />
            <span className="text-sm font-medium text-slate-900 dark:text-white">
              Visão Geral
            </span>
          </div>
        </div>

        {/* Barra de busca centralizada */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
            <input
              type="text"
              placeholder="Buscar salas, itens, usuários..."
              className="w-full pl-10 pr-4 py-2 bg-white/80 dark:bg-slate-600/50 border border-slate-300/50 dark:border-slate-500/50 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
            />
          </div>
        </div>

        {/* Ações e perfil */}
        <div className="flex items-center gap-3">
          {/* Botão de notificações */}
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

            {/* Modal de Notificações */}
            {session?.user && (
              <NotificationModal
                isOpen={isNotificationModalOpen}
                onClose={() => setIsNotificationModalOpen(false)}
                userId={session.user.email || session.user.id || ""}
                onNotificationChange={fetchNotificationCount}
              />
            )}
          </div>

          {/* Toggle de tema */}
          <button
            onClick={toggleTheme}
            className="p-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-600/50 rounded-xl transition-all duration-300"
            aria-label="Alternar tema"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* Menu do usuário */}
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
                  {session.user.name || "Usuário"}
                </p>
                <p className="text-slate-600 dark:text-slate-400 text-xs capitalize">
                  {session.user.role || "User"}
                </p>
              </div>

              <ChevronDown
                className={`w-4 h-4 text-slate-600 dark:text-slate-400 transition-transform duration-300 ${
                  showUserMenu ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown do usuário */}
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
                        {session.user.name || "Usuário"}
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
                      <span>Perfil</span>
                    </Link>
                  </button>

                  <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white transition-colors duration-200">
                    <Settings className="w-4 h-4" />
                    <span>Configurações</span>
                  </button>

                  <div className="border-t border-slate-200 dark:border-slate-600/50 my-2"></div>

                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-300 transition-colors duration-200"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export { Header };
