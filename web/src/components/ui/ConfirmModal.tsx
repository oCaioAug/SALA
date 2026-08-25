"use client";

import { AlertTriangle } from "lucide-react";
import React, { useEffect, useId, useRef } from "react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Destructive styling for remove/delete actions */
  variant?: "default" | "destructive";
  loading?: boolean;
};

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  variant = "default",
  loading = false,
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const onCancelRef = useRef(onCancel);

  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onCancelRef.current();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    queueMicrotask(() => cancelRef.current?.focus());

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, loading]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110]">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => {
          if (!loading) onCancel();
        }}
        aria-label={cancelLabel}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          className="pointer-events-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-700 dark:bg-slate-800 sm:p-6"
        >
          <div className="flex gap-3">
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                variant === "destructive"
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
              )}
            >
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div className="min-w-0 space-y-1.5">
              <h2
                id={titleId}
                className="text-lg font-semibold text-slate-900 dark:text-white"
              >
                {title}
              </h2>
              <p
                id={descriptionId}
                className="text-sm leading-relaxed text-slate-600 dark:text-slate-300"
              >
                {description}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              ref={cancelRef}
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="sm:min-w-[6.5rem]"
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant={variant === "destructive" ? "destructive" : "primary"}
              onClick={onConfirm}
              disabled={loading}
              className="sm:min-w-[6.5rem]"
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { ConfirmModal };
