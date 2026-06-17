"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

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

export function TenantGuard({ children }: TenantGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;

    const isExempt = EXEMPT_PATH_SEGMENTS.some(segment =>
      pathname.includes(segment)
    );
    if (isExempt) return;

    if (!session.user.organizationId) {
      router.replace("/organizations");
    }
  }, [session, status, pathname, router]);

  return <>{children}</>;
}
