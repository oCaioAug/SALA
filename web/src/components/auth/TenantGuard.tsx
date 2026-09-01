"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface TenantGuardProps {
  children: React.ReactNode;
}

const EXEMPT_PATH_SEGMENTS = [
  "/organizations",
  "/inicio",
  "/onboarding",
  "/invite/",
  "/auth/",
];

/**
 * UX guard: redirects authenticated users without an active organization
 * away from tenant-scoped pages. API routes enforce real authorization.
 */
export function TenantGuard({ children }: TenantGuardProps) {
  const t = useTranslations("Common");
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const isExempt = useMemo(
    () => EXEMPT_PATH_SEGMENTS.some(segment => pathname.includes(segment)),
    [pathname]
  );

  const needsRedirect =
    status === "authenticated" &&
    !!session?.user &&
    !isExempt &&
    !session.user.organizationId;

  useEffect(() => {
    if (!needsRedirect) return;
    router.replace("/organizations");
  }, [needsRedirect, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (needsRedirect) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground">
            {t("redirectingToLogin")}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
