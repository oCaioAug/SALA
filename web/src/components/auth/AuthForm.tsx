"use client";

import React from "react";
import { FcGoogle } from "react-icons/fc";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

import {
  authInputClass,
  authInputErrorClass,
  authSurfaceClass,
} from "./auth-styles";

type AuthFieldProps = {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
};

export function AuthField({ label, error, required, children }: AuthFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-violet-600 dark:text-violet-400">*</span>}
      </label>
      {children}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

type AuthCardProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className={cn(authSurfaceClass, "p-6 sm:p-8")}>
      <div className="mb-8 space-y-2 text-center lg:text-left">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

export function AuthError({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-200">
      {children}
    </div>
  );
}

export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-card px-3 text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
    </div>
  );
}

export function AuthGoogleButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-border",
        "bg-background text-sm font-medium text-foreground transition-all",
        "hover:bg-muted",
        "focus:outline-none focus:ring-2 focus:ring-violet-500/30",
        "disabled:cursor-not-allowed disabled:opacity-50"
      )}
    >
      <FcGoogle className="h-5 w-5" />
      {label}
    </button>
  );
}

export function AuthPrimaryButton({
  children,
  loading,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <Button
      type="submit"
      disabled={loading || props.disabled}
      className={cn(
        "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border-0 bg-gradient-to-r from-violet-600 to-blue-600",
        "text-sm font-semibold text-white shadow-lg shadow-violet-500/25",
        "hover:from-violet-500 hover:to-blue-500",
        "focus-visible:ring-violet-500/50"
      )}
      {...props}
    >
      {children}
    </Button>
  );
}

export function AuthSecondaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border",
        "bg-muted/40 px-5 text-sm font-medium text-foreground transition-all",
        "hover:bg-muted",
        "focus:outline-none focus:ring-2 focus:ring-violet-500/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        props.className
      )}
    >
      {children}
    </button>
  );
}

export function AuthSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 pb-1">
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-600 dark:text-violet-400">
        {children}
      </h2>
      <div className="h-px flex-1 bg-gradient-to-r from-violet-500/30 to-transparent" />
    </div>
  );
}

export function AuthLegalFooter({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground lg:text-left">
      {children}
    </p>
  );
}

export function AuthFooterLink({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p className="mt-6 text-center text-sm text-muted-foreground">{children}</p>
  );
}

export { authInputClass, authInputErrorClass };
