"use client";

import { Check, ChevronDown, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import React, {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

export type SearchableMultiSelectOption = {
  value: string;
  label: string;
};

interface SearchableMultiSelectProps {
  options: SearchableMultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  error?: boolean;
  id?: string;
  name?: string;
  maxDisplayBadges?: number;
}

type MenuCoords = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: "top" | "bottom";
};

const MENU_GAP = 4;
const MENU_ESTIMATE = 280;

export const SearchableMultiSelect: React.FC<SearchableMultiSelectProps> = ({
  options,
  value = [],
  onChange,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  disabled = false,
  className,
  triggerClassName,
  error = false,
  id,
  name,
  maxDisplayBadges = 3,
}) => {
  const tSearch = useTranslations("Common.searchSelect");
  const resolvedPlaceholder = placeholder ?? tSearch("placeholder");
  const resolvedSearchPlaceholder =
    searchPlaceholder ?? tSearch("searchPlaceholder");
  const resolvedEmptyMessage = emptyMessage ?? tSearch("empty");

  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [coords, setCoords] = useState<MenuCoords | null>(null);

  const safeOptions = useMemo(
    () => (Array.isArray(options) ? options : []),
    [options]
  );
  const safeValue = useMemo(
    () => (Array.isArray(value) ? value : []),
    [value]
  );

  const selectedOptions = useMemo(
    () => safeOptions.filter(o => safeValue.includes(o.value)),
    [safeOptions, safeValue]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return safeOptions;
    return safeOptions.filter(o =>
      String(o.label || "")
        .toLowerCase()
        .includes(q)
    );
  }, [safeOptions, query]);

  const updatePosition = () => {
    const el = triggerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - MENU_GAP;
    const spaceAbove = rect.top - MENU_GAP;
    const placement: "top" | "bottom" =
      spaceBelow >= Math.min(MENU_ESTIMATE, 160) || spaceBelow >= spaceAbove
        ? "bottom"
        : "top";
    const available = placement === "bottom" ? spaceBelow : spaceAbove;
    const maxHeight = Math.min(280, Math.max(140, available));
    const width = Math.min(rect.width, window.innerWidth - 16);
    let left = rect.left;
    if (left + width > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - 8 - width);
    }
    if (left < 8) left = 8;

    setCoords({
      top:
        placement === "bottom"
          ? rect.bottom + MENU_GAP
          : rect.top - MENU_GAP,
      left,
      width,
      maxHeight,
      placement,
    });
  };

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    updatePosition();
    const onReposition = () => updatePosition();
    window.addEventListener("resize", onReposition);
    document.addEventListener("scroll", onReposition, true);
    return () => {
      window.removeEventListener("resize", onReposition);
      document.removeEventListener("scroll", onReposition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    const t = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const toggleOption = (val: string) => {
    if (safeValue.includes(val)) {
      onChange(safeValue.filter(v => v !== val));
    } else {
      onChange([...safeValue, val]);
    }
  };

  const removeBadge = (e: React.MouseEvent, val: string) => {
    e.stopPropagation();
    e.preventDefault();
    onChange(safeValue.filter(v => v !== val));
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onChange([]);
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    setOpen(prev => !prev);
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  const menu =
    open && coords && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            id={listId}
            role="listbox"
            aria-multiselectable="true"
            className="overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md"
            style={{
              position: "fixed",
              zIndex: 200,
              left: coords.left,
              width: coords.width,
              maxHeight: coords.maxHeight,
              ...(coords.placement === "bottom"
                ? { top: coords.top }
                : { bottom: window.innerHeight - coords.top }),
            }}
          >
            <div className="flex items-center border-b border-border px-3 py-2">
              <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={resolvedSearchPlaceholder}
                className="flex h-7 w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
              />
            </div>

            <div
              className="overflow-y-auto p-1"
              style={{ maxHeight: Math.max(80, coords.maxHeight - 48) }}
            >
              {filtered.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {resolvedEmptyMessage}
                </div>
              ) : (
                filtered.map(opt => {
                  const isSelected = safeValue.includes(opt.value);
                  return (
                    <div
                      key={opt.value}
                      role="option"
                      aria-selected={isSelected}
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleOption(opt.value);
                      }}
                      className={cn(
                        "flex cursor-pointer select-none items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-sm transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        isSelected && "bg-accent/60 font-medium"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded-xs border transition-colors",
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-input bg-background"
                        )}
                      >
                        {isSelected && (
                          <Check className="h-3 w-3 stroke-[3]" />
                        )}
                      </div>

                      <span className="flex-1 truncate">{opt.label}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      {name && (
        <input
          type="hidden"
          name={name}
          value={JSON.stringify(safeValue)}
          disabled={disabled}
        />
      )}

      <div
        ref={triggerRef}
        id={id}
        role="combobox"
        tabIndex={disabled ? -1 : 0}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          "flex min-h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-xs transition-colors select-none",
          "hover:bg-accent/30 focus:outline-none focus:ring-1 focus:ring-ring",
          disabled && "cursor-not-allowed opacity-50 hover:bg-background",
          error && "border-destructive focus:ring-destructive",
          triggerClassName
        )}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 overflow-hidden text-left">
          {selectedOptions.length === 0 ? (
            <span className="text-muted-foreground">{resolvedPlaceholder}</span>
          ) : (
            <>
              {selectedOptions.slice(0, maxDisplayBadges).map(opt => (
                <span
                  key={opt.value}
                  className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                >
                  <span className="max-w-[140px] truncate">{opt.label}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={e => removeBadge(e, opt.value)}
                    className="cursor-pointer rounded-full p-0.5 hover:bg-muted-foreground/20"
                    title="Remover"
                  >
                    <X className="h-3 w-3" />
                  </span>
                </span>
              ))}
              {selectedOptions.length > maxDisplayBadges && (
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                  +{selectedOptions.length - maxDisplayBadges}
                </span>
              )}
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 text-muted-foreground">
          {selectedOptions.length > 0 && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={clearAll}
              className="cursor-pointer p-1 hover:text-foreground"
              title="Limpar seleção"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </div>
      </div>

      {menu}
    </div>
  );
};
