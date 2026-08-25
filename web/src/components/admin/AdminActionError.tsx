"use client";

import { X } from "lucide-react";

interface AdminActionErrorProps {
  message: string | null;
  onDismiss?: () => void;
  className?: string;
}

export function AdminActionError({
  message,
  onDismiss,
  className = "",
}: AdminActionErrorProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={`mb-4 flex items-start justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300 ${className}`}
    >
      <p className="flex-1">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded p-0.5 text-red-300/80 hover:bg-red-500/20 hover:text-red-200"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
