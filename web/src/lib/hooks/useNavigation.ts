'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';

interface UseNavigationProps {
  currentPage: string;
  onPageChange?: (page: string) => void;
}

export const useNavigation = ({ currentPage, onPageChange }: UseNavigationProps) => {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [prefetchedPages, setPrefetchedPages] = useState<Set<string>>(new Set());

  // Prefetch das páginas mais comuns
  useEffect(() => {
    const pagesToPrefetch = ['/configuracoes', '/agendamentos'];
    
    pagesToPrefetch.forEach(page => {
      if (!prefetchedPages.has(page)) {
        router.prefetch(page);
        setPrefetchedPages(prev => new Set([...prev, page]));
      }
    });
  }, [router, prefetchedPages]);

  const navigate = useCallback(async (page: string) => {
    // Evitar navegação desnecessária
    if (currentPage === page) return;
    
    setIsNavigating(true);
    onPageChange?.(page);
    
    // Pequeno delay para feedback visual
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Mapear páginas para rotas
    const routeMap: Record<string, string> = {
      'dashboard': '/dashboard',
      'agendamentos': '/agendamentos',
      'configuracoes': '/configuracoes'
    };
    
    const route = routeMap[page] || '/dashboard';
    
    // Navegar usando router.push
    router.push(route);
    
    // Reset loading state após navegação
    setTimeout(() => setIsNavigating(false), 200);
  }, [currentPage, router, onPageChange]);

  return {
    navigate,
    isNavigating
  };
};
