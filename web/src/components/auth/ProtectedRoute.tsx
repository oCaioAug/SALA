"use client";

import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { ReactNode, Suspense, useEffect } from "react";

import { getSafeCallbackPath } from "@/lib/auth/callback-path";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { usePathname, useRouter } from "@/navigation";

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

function ProtectedRouteContent({ children, fallback }: ProtectedRouteProps) {
  const t = useTranslations("Common");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { status } = useSession();

  useEffect(() => {
    if (status !== "unauthenticated") return;

    const query = searchParams.toString();
    const returnPath = query ? `${pathname}?${query}` : pathname;
    const safePath = getSafeCallbackPath(returnPath) ?? "/organizations";

    router.push(`/auth/login?callbackUrl=${encodeURIComponent(safePath)}`);
  }, [status, pathname, searchParams, router]);

  if (status === "loading") {
    return (
      fallback || (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <LoadingSpinner size="lg" />
        </div>
      )
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-foreground">{t("redirectingToLogin")}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function ProtectedRoute(props: ProtectedRouteProps) {
  return (
    <Suspense
      fallback={
        props.fallback || (
          <div className="flex min-h-screen items-center justify-center bg-background">
            <LoadingSpinner size="lg" />
          </div>
        )
      }
    >
      <ProtectedRouteContent {...props} />
    </Suspense>
  );
}
