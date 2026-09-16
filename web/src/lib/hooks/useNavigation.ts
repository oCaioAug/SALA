"use client";

import { useCallback, useState } from "react";

import { useRouter } from "@/navigation";

interface UseNavigationProps {
  currentPage: string;
  onPageChange?: (page: string) => void;
}

export const useNavigation = ({
  currentPage,
  onPageChange,
}: UseNavigationProps) => {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const navigate = useCallback(
    async (page: string) => {
      if (currentPage === page) return;

      setIsNavigating(true);
      onPageChange?.(page);

      await new Promise(resolve => setTimeout(resolve, 50));

      const routeMap: Record<string, string> = {
        inicio: "/organizations",
        organizations: "/organizations",
        dashboard: "/dashboard",
        explorar: "/explorar",
        salas: "/salas",
        solicitacoes: "/solicitacoes",
        setores: "/setores",
        agendamentos: "/agendamentos",
        notificacoes: "/notificacoes",
        incidentes: "/incidentes",
        configuracoes: "/configuracoes",
        vision: "/vision",
        users: "/users",
        profile: "/profile",
        "grade-horaria": "/grade-horaria",
        "grade-horaria-turmas": "/grade-horaria/turmas",
        "grade-horaria-disciplinas": "/grade-horaria/disciplinas",
        "grade-horaria-professores": "/grade-horaria/professores",
        "grade-horaria-cargas": "/grade-horaria/cargas",
        "grade-horaria-disponibilidades": "/grade-horaria/disponibilidades",
        "grade-horaria-gerar": "/grade-horaria/gerar",
        "grade-horaria-configuracoes": "/grade-horaria/configuracoes",
      };

      const route = routeMap[page] || (page.startsWith("/") ? page : "/explorar");
      router.push(route);

      setTimeout(() => setIsNavigating(false), 200);
    },
    [currentPage, router, onPageChange]
  );

  return {
    navigate,
    isNavigating,
  };
};
