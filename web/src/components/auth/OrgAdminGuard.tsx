"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useOrgPermissions } from "@/lib/hooks/useOrgPermissions";

interface OrgAdminGuardProps {
  children: React.ReactNode;
}

export function OrgAdminGuard({ children }: OrgAdminGuardProps) {
  const router = useRouter();
  const { isOrgAdmin, hasOrganization, isLoading } = useOrgPermissions();

  useEffect(() => {
    if (isLoading) return;
    if (!hasOrganization) {
      router.replace("/organizations");
      return;
    }
    if (!isOrgAdmin) {
      router.replace("/explorar");
    }
  }, [isOrgAdmin, hasOrganization, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isOrgAdmin) return null;

  return <>{children}</>;
}
