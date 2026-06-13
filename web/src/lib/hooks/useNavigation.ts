"use client";

import { useCallback, useEffect, useState } from "react";

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
  const [prefetchedPages, setPrefetchedPages] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    const pagesToPrefetch = [
      "/configuracoes",
      "/agendamentos",
      "/solicitacoes",
      "/notificacoes",
      "/incidentes",
      "/users",
      "/profile",
      "/salas",
      "/organizations",
      "/explorar",
    ];

    pagesToPrefetch.forEach(page => {
      if (!prefetchedPages.has(page)) {
        router.prefetch(page);
        setPrefetchedPages(prev => new Set([...prev, page]));
      }
    });
  }, [router, prefetchedPages]);

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
        agendamentos: "/agendamentos",
        notificacoes: "/notificacoes",
        incidentes: "/incidentes",
        configuracoes: "/configuracoes",
        users: "/users",
        profile: "/profile",
      };

      const route = routeMap[page] || "/explorar";
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
