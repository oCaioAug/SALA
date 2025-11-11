"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useApp } from "@/lib/hooks/useApp";
import { useNavigation } from "@/lib/hooks/useNavigation";
import {
  Settings,
  User as UserIcon,
  Bell,
  Shield,
  Database,
  Palette,
} from "lucide-react";
import Link from "next/link";

const ConfiguracoesPage: React.FC = () => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState("configuracoes");
  const { showInfo } = useApp();

  // Hook de navegação otimizada
  const { navigate, isNavigating } = useNavigation({
    currentPage,
    onPageChange: setCurrentPage,
  });

  const handleNotificationClick = () => {
    console.log("Notificação clicada");
  };

  const configuracoesItems = [
    {
      id: "perfil",
      title: "Perfil do Usuário",
      description: "Gerencie suas informações pessoais e preferências",
      icon: <UserIcon className="w-6 h-6" />,
      action: () =>
        showInfo("Configurações de perfil serão implementadas em breve"),
      url: "/profile",
    },
    {
      id: "notificacoes",
      title: "Notificações",
      description: "Configure como e quando receber notificações",
      icon: <Bell className="w-6 h-6" />,
      action: () =>
        showInfo("Configurações de notificações serão implementadas em breve"),
      url: "/notifications",
    },
    {
      id: "seguranca",
      title: "Segurança",
      description: "Gerencie senhas e configurações de segurança",
      icon: <Shield className="w-6 h-6" />,
      action: () =>
        showInfo("Configurações de segurança serão implementadas em breve"),
      url: "/security",
    },
    {
      id: "banco-dados",
      title: "Banco de Dados",
      description: "Configurações do banco de dados e backup",
      icon: <Database className="w-6 h-6" />,
      action: () =>
        showInfo(
          "Configurações de banco de dados serão implementadas em breve"
        ),
      url: "/database",
    },
    {
      id: "aparencia",
      title: "Aparência",
      description: "Personalize o tema e visual da aplicação",
      icon: <Palette className="w-6 h-6" />,
      action: () =>
        showInfo("Configurações de aparência serão implementadas em breve"),
      url: "/appearance",
    },
  ];

  return (
    <PageLayout
      currentPage={currentPage}
      onNavigate={navigate}
      isNavigating={isNavigating}
      onNotificationClick={handleNotificationClick}
    >
            {/* Header da página */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="w-8 h-8 text-yellow-500" />
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    Configurações
                  </h1>
                  <p className="text-slate-600 dark:text-gray-400">
                    Gerencie as configurações do sistema
                  </p>
                </div>
              </div>
            </div>

            {/* Grid de configurações */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {configuracoesItems.map((item) => (
                <Card
                  key={item.id}
                  variant="elevated"
                  hover
                  className="cursor-pointer"
                  onClick={item.action}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-yellow-500/10 rounded-lg text-yellow-500">
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">
                          {item.title}
                        </CardTitle>
                        <p className="text-slate-600 dark:text-gray-400 text-sm mb-4">
                          {item.description}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            item.action();
                          }}
                        >
                          <Link href={item.url} className="w-full">
                            Configurar
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Informações do sistema */}
            <div className="mt-12">
              <Card variant="elevated">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4">
                    Informações do Sistema
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-600 dark:text-gray-400">Versão:</span>
                      <span className="text-slate-900 dark:text-white ml-2">1.0.0</span>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-gray-400">Última atualização:</span>
                      <span className="text-slate-900 dark:text-white ml-2">Hoje</span>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-gray-400">Status do banco:</span>
                      <span className="text-green-500 ml-2">Conectado</span>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-gray-400">Usuário atual:</span>
                      <span className="text-slate-900 dark:text-white ml-2">Sistema</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
    </PageLayout>
  );
};

export default ConfiguracoesPage;
