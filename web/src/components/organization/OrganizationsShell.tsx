"use client";

import { LogOut } from "lucide-react";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { AppPreferencesControls } from "@/components/preferences/AppPreferencesControls";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Link } from "@/navigation";

type OrganizationsShellProps = {
  children: ReactNode;
  className?: string;
  /** Visual do hub `/organizations` — não altera setup/new. */
  variant?: "default" | "hub";
};

function UserAvatar({
  name,
  image,
  email,
  size = "md",
}: {
  name?: string | null;
  image?: string | null;
  email?: string | null;
  size?: "sm" | "md";
}) {
  const initial = (name?.trim() || email || "?").charAt(0).toUpperCase();
  const sizeClass = size === "sm" ? "h-9 w-9 text-sm" : "h-12 w-12 text-lg";

  if (image) {
    return (
      <Image
        src={image}
        alt=""
        width={size === "sm" ? 36 : 48}
        height={size === "sm" ? 36 : 48}
        className={cn(
          "rounded-full border border-border object-cover",
          sizeClass
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full border border-blue-200 bg-blue-50 font-semibold text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-100",
        sizeClass
      )}
    >
      {initial}
    </div>
  );
}

export function OrganizationsShell({
  children,
  className,
  variant = "default",
}: OrganizationsShellProps) {
  const t = useTranslations("OrganizationsPage");
  const { data: session } = useSession();
  const isHub = variant === "hub";

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/auth/login" });
  };

  return (
    <div
      className={cn(
        "relative min-h-screen overflow-hidden text-foreground",
        isHub ? "bg-slate-50 dark:bg-background" : "bg-background"
      )}
    >
      {!isHub && (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -left-32 top-0 h-[520px] w-[520px] rounded-full bg-violet-600/20 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-[480px] w-[480px] rounded-full bg-blue-600/15 blur-[120px]" />
          <div className="absolute left-1/2 top-1/3 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-violet-500/5 blur-[80px]" />
        </div>
      )}

      <div
        className={cn(
          "relative z-10 mx-auto flex min-h-screen w-full flex-col px-4 py-6 sm:px-6 lg:px-8",
          isHub ? "max-w-6xl" : "max-w-5xl"
        )}
      >
        <header
          className={cn(
            "mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
            isHub &&
              "rounded-2xl border border-border/60 bg-card/80 px-4 py-3 shadow-sm backdrop-blur-sm sm:px-5"
          )}
        >
          <div className="flex items-center gap-3">
            <Link href="/" className="group flex items-center gap-2.5">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl shadow-sm transition-transform group-hover:scale-105",
                  isHub
                    ? "bg-blue-600 shadow-blue-600/20"
                    : "bg-gradient-to-br from-violet-500 to-blue-600 shadow-lg shadow-violet-500/20"
                )}
              >
                <span className="text-sm font-bold text-white">S</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">
                {isHub ? t("shell.brand") : "S.A.L.A."}
              </span>
            </Link>

            {!isHub && (
              <>
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
              </>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isHub && (
              <div className="mr-1 hidden items-center gap-2 sm:flex">
                <UserAvatar
                  name={session?.user?.name}
                  image={session?.user?.image}
                  email={session?.user?.email}
                  size="sm"
                />
                <p className="max-w-[10rem] truncate text-sm font-medium text-foreground lg:max-w-[14rem]">
                  {session?.user?.name ?? t("greeting")}
                </p>
              </div>
            )}
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
