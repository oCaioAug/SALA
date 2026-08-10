"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useOrgPermissions } from "@/lib/hooks/useOrgPermissions";

interface SolicitacoesGuardProps {
  children: React.ReactNode;
}

/** Allows org admins and sector managers to access reservation approval queue. */
export function SolicitacoesGuard({ children }: SolicitacoesGuardProps) {
  const router = useRouter();
  const { update, status: sessionStatus } = useSession();
  const refreshedRef = useRef(false);
  const { canAccessSolicitacoes, hasOrganization, isLoading } =
    useOrgPermissions();

  useEffect(() => {
    if (sessionStatus !== "authenticated" || refreshedRef.current) return;
    refreshedRef.current = true;
    void update();
  }, [sessionStatus, update]);

  useEffect(() => {
    if (isLoading) return;
    if (!hasOrganization) {
      router.replace("/organizations");
      return;
    }
    if (!canAccessSolicitacoes) {
      router.replace("/explorar");
    }
  }, [canAccessSolicitacoes, hasOrganization, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!canAccessSolicitacoes) return null;

  return <>{children}</>;
}
