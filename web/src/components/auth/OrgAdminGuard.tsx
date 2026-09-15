"use client";

import { useEffect, useRef } from "react";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useOrgPermissions } from "@/lib/hooks/useOrgPermissions";
import { useRouter } from "@/navigation";

interface OrgAdminGuardProps {
  children: React.ReactNode;
}

export function OrgAdminGuard({ children }: OrgAdminGuardProps) {
  const router = useRouter();
  const redirectedRef = useRef(false);
  const { isOrgAdmin, isSuperAdmin, hasOrganization, isLoading, status } =
    useOrgPermissions();

  const canAccess = isOrgAdmin || isSuperAdmin;

  useEffect(() => {
    if (isLoading || status === "loading" || redirectedRef.current) return;

    if (status === "unauthenticated") {
      redirectedRef.current = true;
      router.replace("/auth/login");
      return;
    }

    if (!hasOrganization && !isSuperAdmin) {
      redirectedRef.current = true;
      router.replace("/organizations");
      return;
    }

    if (!canAccess) {
      redirectedRef.current = true;
      router.replace("/explorar");
    }
  }, [canAccess, isSuperAdmin, hasOrganization, isLoading, status, router]);

  if (isLoading || status === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (status === "unauthenticated" || !canAccess) return null;

  return <>{children}</>;
}
