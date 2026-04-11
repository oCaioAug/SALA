"use client";

import React, { useEffect, useId, useRef } from "react";

import { cn } from "@/lib/utils";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  /** Painel à esquerda (ex.: navegação mobile) ou à direita (padrão) */
  side?: "left" | "right";
  /** Quando false, Escape não fecha (útil com outro painel empilhado) */
  closeOnEscape?: boolean;
  /**
   * Mantém o conteúdo montado, mas o overlay não intercepta eventos
   * (ex.: arrastar item para o conteúdo atrás, como um grid).
   */
  passThrough?: boolean;
}

const sizeClasses = {
  sm: "max-w-full md:max-w-sm",
  md: "max-w-full md:max-w-md",
  lg: "max-w-full md:max-w-lg lg:max-w-2xl",
  xl: "max-w-full md:max-w-2xl lg:max-w-4xl",
};

const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
  size = "md",
  side = "right",
  closeOnEscape = true,
  passThrough = false,
}) => {
  const isLeft = side === "left";
  const titleId = useId();
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEscape) onClose();
    };
    document.addEventListener("keydown", onKey);

    let prevOverflow = "";
    if (!passThrough) {
      prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      queueMicrotask(() => closeBtnRef.current?.focus());
    }

    return () => {
      document.removeEventListener("keydown", onKey);
      if (!passThrough) {
        document.body.style.overflow = prevOverflow;
      }
    };
  }, [isOpen, onClose, closeOnEscape, passThrough]);

  if (!isOpen) return null;

  return (
    <div
      className={cn("fixed inset-0 z-[100]", passThrough && "pointer-events-none")}
    >
      <button
        type="button"
        className={cn(
          "absolute inset-0 bg-black/50 backdrop-blur-sm dark:bg-black/50",
          passThrough && "opacity-0"
        )}
        onClick={onClose}
        aria-label="Fechar painel"
      />

      <div
        className={cn(
          "pointer-events-none absolute inset-0 flex p-3 sm:p-4",
          isLeft ? "justify-start" : "justify-end"
        )}
      >
        <div
          role="dialog"
          aria-modal={!passThrough}
          aria-labelledby={titleId}
          className={cn(
            "flex max-h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-transform duration-200 ease-out sm:rounded-3xl dark:border-slate-700 dark:bg-slate-800",
            passThrough
              ? isLeft
                ? "pointer-events-none -translate-x-full"
                : "pointer-events-none translate-x-full"
              : "pointer-events-auto transition-colors",
            sizeClasses[size],
            className
          )}
        >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 p-4 sm:p-6 dark:border-slate-700">
          <h2
            id={titleId}
            className="pr-4 text-lg font-semibold text-slate-900 sm:text-xl dark:text-white"
          >
            {title}
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="shrink-0 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 text-slate-900 sm:p-6 dark:text-white">
          {children}
        </div>
        </div>
      </div>
    </div>
  );
};

export { Drawer };
