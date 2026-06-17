"use client";

import { LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import type { ReactNode } from "react";

import { AppPreferencesControls } from "@/components/preferences/AppPreferencesControls";
import { Button } from "@/components/ui/Button";
import { Link } from "@/navigation";
import { cn } from "@/lib/utils";

type OrganizationsShellProps = {
  children: ReactNode;
  className?: string;
};

function UserAvatar({
  name,
  image,
  email,
}: {
  name?: string | null;
  image?: string | null;
  email?: string | null;
}) {
  const initial = (name?.trim() || email || "?").charAt(0).toUpperCase();

  if (image) {
    return (
      <Image
        src={image}
        alt=""
        width={48}
        height={48}
        className="h-12 w-12 rounded-full border border-border object-cover"
      />
    );
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-violet-500/30 bg-gradient-to-br from-violet-500/30 to-blue-600/30 text-lg font-semibold text-white">
      {initial}
    </div>
  );
}

export function OrganizationsShell({
  children,
  className,
}: OrganizationsShellProps) {
  const t = useTranslations("OrganizationsPage");
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/auth/login" });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-32 top-0 h-[520px] w-[520px] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[480px] w-[480px] rounded-full bg-blue-600/15 blur-[120px]" />
        <div className="absolute left-1/2 top-1/3 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-violet-500/5 blur-[80px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="group flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 shadow-lg shadow-violet-500/20 transition-transform group-hover:scale-105">
                <span className="text-sm font-bold text-white">S</span>
              </div>
              <span className="hidden text-lg font-bold tracking-tight text-foreground sm:inline">
                S.A.L.A.
              </span>
            </Link>

            <div className="hidden h-8 w-px bg-border sm:block" />

            <div className="flex items-center gap-3">
              <UserAvatar
                name={session?.user?.name}
                image={session?.user?.image}
                email={session?.user?.email}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {session?.user?.name ?? t("greeting")}
                </p>
                {session?.user?.email && (
                  <p className="truncate text-xs text-muted-foreground">
                    {session.user.email}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <AppPreferencesControls variant="marketing" />
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="w-fit shrink-0"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t("signOut")}
            </Button>
          </div>
        </header>

        <main className={cn("flex-1 pb-10", className)}>{children}</main>
      </div>
    </div>
  );
}
