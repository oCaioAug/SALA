import { PlatformRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { redirect as localeRedirect } from "@/navigation";

export const dynamic = "force-dynamic";

interface AdminLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AdminLayout({
  children,
  params,
}: AdminLayoutProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    localeRedirect({ href: "/auth/login", locale });
  }

  if (session!.user.platformRole !== PlatformRole.SUPER_ADMIN) {
    localeRedirect({ href: "/inicio", locale });
  }

  return <>{children}</>;
}
