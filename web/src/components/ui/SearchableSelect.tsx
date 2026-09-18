"use client";

import { Check, ChevronDown, Search } from "lucide-react";
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

export type SearchableSelectOption = {
  value: string;
  label: string;
};

type SearchableSelectProps = {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  error?: boolean;
  id?: string;
  name?: string;
  /** Allow clearing to empty string (shows placeholder option) */
  allowEmpty?: boolean;
};

type MenuCoords = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: "top" | "bottom";
};

const MENU_GAP = 4;
const MENU_MAX_WIDTH = 384; // 24rem
const MENU_ESTIMATE = 280;

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
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
  allowEmpty = true,
}) => {
  const tSearch = useTranslations("Common.searchSelect");
  const resolvedPlaceholder = placeholder ?? tSearch("placeholder");
  const resolvedSearchPlaceholder =
    searchPlaceholder ?? tSearch("searchPlaceholder");
  const resolvedEmptyMessage = emptyMessage ?? tSearch("empty");
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [coords, setCoords] = useState<MenuCoords | null>(null);

  const safeOptions = useMemo(
    () => (Array.isArray(options) ? options : []),
    [options]
  );

  const selected = useMemo(
    () => safeOptions.find(o => o.value === value) ?? null,
    [safeOptions, value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return safeOptions;
    return safeOptions.filter(o => (o.label || "").toLowerCase().includes(q));
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
    const width = Math.min(
      Math.max(rect.width, Math.min(MENU_MAX_WIDTH, rect.width + 48)),
      window.innerWidth - 16,
      MENU_MAX_WIDTH
    );
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
      width: Math.max(rect.width, width),
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
    setHighlight(0);
    const t = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const pick = (next: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    onChange(next);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight(h => Math.min(h + 1, Math.max(filtered.length - 1, 0)));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight(h => Math.max(h - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[highlight];
      if (opt) pick(opt.value);
    }
  };

  const hasEmptyOption = safeOptions.some(o => o.value === "");

  const menu =
    open && coords && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            className="overflow-hidden rounded-md border border-border bg-card shadow-md"
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
            <div className="flex items-center gap-2 border-b border-border px-2 py-1.5">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  setHighlight(0);
                }}
                placeholder={resolvedSearchPlaceholder}
                className="h-8 w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                aria-autocomplete="list"
                aria-controls={listId}
              />
            </div>
            <ul
              id={listId}
              role="listbox"
              className="overflow-y-auto py-1"
              style={{ maxHeight: Math.max(80, coords.maxHeight - 48) }}
            >
              {allowEmpty && !hasEmptyOption ? (
                <li role="option" aria-selected={value === ""}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted",
                      value === "" && "bg-muted"
                    )}
                    onClick={e => pick("", e)}
                  >
                    {resolvedPlaceholder}
                  </button>
                </li>
              ) : null}
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted-foreground">
                  {resolvedEmptyMessage}
                </li>
              ) : (
                filtered.map((opt, i) => {
                  const isSelected = opt.value === value;
                  const isActive = i === highlight;
                  return (
                    <li
                      key={`${opt.value}-${i}`}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <button
                        type="button"
                        className={cn(
                          "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted",
                          isActive && "bg-muted",
                          isSelected && "font-medium text-foreground"
                        )}
                        onMouseEnter={() => setHighlight(i)}
                        onClick={e => pick(opt.value, e)}
                      >
                        <Check
                          className={cn(
                            "h-3.5 w-3.5 shrink-0",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="min-w-0 truncate">{opt.label}</span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>,
          document.body
        )
      : null;

  return (
    <div
      ref={rootRef}
      className={cn("relative", className)}
      onKeyDown={onKeyDown}
    >
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={e => {
          e.preventDefault();
          if (!disabled) setOpen(o => !o);
        }}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-card px-3 py-2 text-left text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          error
            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
            : "border-input",
          triggerClassName
        )}
      >
        <span
          className={cn(
            "min-w-0 truncate",
            !selected && "text-muted-foreground"
          )}
        >
          {selected?.label ?? resolvedPlaceholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {menu}
    </div>
  );
};

export { SearchableSelect };
