"use client";

import { useRouter } from "next/navigation";
import { useEffect, ReactNode, useState } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Verificar se há usuário no localStorage
    const user = localStorage.getItem('user');
    
    if (user) {
      setIsAuthenticated(true);
    } else {
      router.push("/auth/login");
    }
    
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      )
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-white">Redirecionando para login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
