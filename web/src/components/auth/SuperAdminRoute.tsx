"use client";

import { PlatformRole } from "@/lib/auth/roles";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

import { useRouter } from "@/navigation";

interface SuperAdminRouteProps {
  children: React.ReactNode;
}

export function SuperAdminRoute({ children }: SuperAdminRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/auth/login");
      return;
    }
    if (session?.user?.platformRole !== PlatformRole.SUPER_ADMIN) {
      router.replace("/organizations");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (
    status === "unauthenticated" ||
    session?.user?.platformRole !== PlatformRole.SUPER_ADMIN
  ) {
    return null;
  }

  return <>{children}</>;
}
