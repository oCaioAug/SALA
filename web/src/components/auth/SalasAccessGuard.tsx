"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useOrgPermissions } from "@/lib/hooks/useOrgPermissions";

interface SalasAccessGuardProps {
  children: React.ReactNode;
}

/** Org admins and sector managers may access /salas (managers: scoped inventory). */
export function SalasAccessGuard({ children }: SalasAccessGuardProps) {
  const router = useRouter();
  const { canAccessSalas, hasOrganization, isLoading } = useOrgPermissions();

  useEffect(() => {
    if (isLoading) return;
    if (!hasOrganization) {
      router.replace("/organizations");
      return;
    }
    if (!canAccessSalas) {
      router.replace("/explorar");
    }
  }, [canAccessSalas, hasOrganization, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!canAccessSalas) return null;

  return <>{children}</>;
}
