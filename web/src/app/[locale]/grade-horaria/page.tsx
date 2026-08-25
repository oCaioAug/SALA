"use client";

import {
  Calendar,
  Settings,
  Users,
  BookOpen,
  Clock,
  Play,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

import { OrgAdminGuard } from "@/components/auth/OrgAdminGuard";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { useNavigation } from "@/lib/hooks/useNavigation";

const GradeHorariaPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState("grade-horaria");

  const { navigate, isNavigating } = useNavigation({
    currentPage,
    onPageChange: setCurrentPage,
  });

  const menuItems = [
    {
      id: "turmas",
      title: "Turmas",
      description: "Gerencie as turmas da instituição e seus períodos.",
      icon: <Users className="w-6 h-6" />,
      url: "/grade-horaria/turmas",
    },
    {
      id: "disciplinas",
      title: "Disciplinas",
      description: "Cadastre as matérias e disciplinas ofertadas.",
      icon: <BookOpen className="w-6 h-6" />,
      url: "/grade-horaria/disciplinas",
    },
    {
      id: "professores",
      title: "Professores",
      description:
        "Cadastre os professores independentemente de seus usuários.",
      icon: <GraduationCap className="w-6 h-6" />,
      url: "/grade-horaria/professores",
    },
    {
      id: "cargas",
      title: "Carga Horária",
      description: "Associe professores, disciplinas e turmas.",
      icon: <Clock className="w-6 h-6" />,
      url: "/grade-horaria/cargas",
    },
    {
      id: "disponibilidades",
      title: "Disponibilidades",
      description: "Defina os horários disponíveis de cada professor.",
      icon: <Calendar className="w-6 h-6" />,
      url: "/grade-horaria/disponibilidades",
    },
    {
      id: "gerar",
      title: "Gerar Grade",
      description: "Execute o motor de alocação para gerar os horários.",
      icon: <Play className="w-6 h-6" />,
      url: "/grade-horaria/gerar",
    },
    {
      id: "configuracoes",
      title: "Configurações da Grade",
      description: "Defina os turnos e os horários de início e fim das aulas.",
      icon: <Settings className="w-6 h-6" />,
      url: "/grade-horaria/configuracoes",
    },
  ];

  return (
    <OrgAdminGuard>
      <PageLayout
        currentPage={currentPage}
        onNavigate={navigate}
        isNavigating={isNavigating}
      >
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
                Alocação de Grade Horária
              </h1>
              <p className="text-slate-600 dark:text-gray-400">
                Configure os parâmetros e gere a grade horária automaticamente
                para sua instituição.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map(item => (
            <Card
              key={item.id}
              variant="elevated"
              hover
              className="cursor-pointer transition-transform hover:scale-105"
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{item.title}</CardTitle>
                    <p className="text-slate-600 dark:text-gray-400 text-sm mb-4">
                      {item.description}
                    </p>
                    <Button size="sm" variant="outline" className="w-full">
                      <Link href={item.url} className="w-full">
                        Acessar
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </PageLayout>
    </OrgAdminGuard>
  );
};

export default GradeHorariaPage;
