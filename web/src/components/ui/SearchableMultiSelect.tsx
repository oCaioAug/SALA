"use client";

import { Check, ChevronDown, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useEffect, useId, useMemo, useRef, useState } from "react";

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
  const searchRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

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

  useEffect(() => {
    if (!open) return;
    setQuery("");
    const t = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
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

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      {/* Hidden input for form serialization */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={JSON.stringify(safeValue)}
          disabled={disabled}
        />
      )}

      {/* Trigger Control (Div with Combobox semantics to avoid nested button issues) */}
      <div
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
        <div className="flex flex-wrap items-center gap-1.5 overflow-hidden text-left flex-1 min-w-0">
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
                    className="rounded-full p-0.5 hover:bg-muted-foreground/20 cursor-pointer"
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

        <div className="flex items-center gap-1 text-muted-foreground shrink-0">
          {selectedOptions.length > 0 && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={clearAll}
              className="p-1 hover:text-foreground cursor-pointer"
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

      {/* Dropdown Popover */}
      {open && (
        <div
          id={listId}
          role="listbox"
          aria-multiselectable="true"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
        >
          {/* Search Box */}
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

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto p-1">
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
                    {/* Lightweight Custom Checkbox indicator */}
                    <div
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-xs border transition-colors",
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-input bg-background"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>

                    <span className="flex-1 truncate">{opt.label}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
