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
  const sizeClass = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";

  if (image) {
    return (
      <Image
        src={image}
        alt=""
        width={size === "sm" ? 32 : 40}
        height={size === "sm" ? 32 : 40}
        className={cn(
          "rounded-md border border-border object-cover",
          sizeClass
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-md bg-slate-600 font-semibold text-white",
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
    <div className="relative min-h-screen bg-background text-foreground">
      <div
        className={cn(
          "relative z-10 mx-auto flex min-h-screen w-full flex-col px-4 py-5 sm:px-6 lg:px-8",
          isHub ? "max-w-6xl" : "max-w-5xl"
        )}
      >
        <header
          className={cn(
            "mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
            isHub && "rounded-lg border border-border bg-card px-4 py-3 sm:px-5"
          )}
        >
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <span className="text-sm font-bold">S</span>
              </div>
              <span className="text-base font-semibold tracking-tight text-foreground">
                {isHub ? t("shell.brand") : "S.A.L.A."}
              </span>
            </Link>

            {!isHub && (
              <>
                <div className="hidden h-6 w-px bg-border sm:block" />
                <div className="flex items-center gap-2.5">
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
