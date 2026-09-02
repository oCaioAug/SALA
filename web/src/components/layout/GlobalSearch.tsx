"use client";

import {
  DoorOpen,
  LayoutDashboard,
  Network,
  Package,
  Search,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useOrgPermissions } from "@/lib/hooks/useOrgPermissions";
import { filterNavigationEntries } from "@/lib/search/navigation-index";
import type { SearchApiResponse, SearchResultType } from "@/lib/search/types";
import { cn } from "@/lib/utils";
import { Link, useRouter } from "@/navigation";

type FlatResult = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  groupType: SearchResultType | "pages";
  groupLabel: string;
};

const GROUP_ICONS: Record<SearchResultType | "pages", React.ElementType> = {
  pages: LayoutDashboard,
  rooms: DoorOpen,
  sectors: Network,
  users: Users,
  items: Package,
};

export function GlobalSearch() {
  const t = useTranslations("Header.search");
  const tSidebar = useTranslations("Sidebar.menuItems");
  const router = useRouter();
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { isOrgAdmin, canAccessSalas, canAccessSolicitacoes } =
    useOrgPermissions();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [loading, setLoading] = useState(false);
  const [apiGroups, setApiGroups] = useState<SearchApiResponse["groups"]>([]);

  const navContext = useMemo(
    () => ({
      isOrgAdmin,
      canAccessSalas,
      canAccessSolicitacoes,
    }),
    [isOrgAdmin, canAccessSalas, canAccessSolicitacoes]
  );

  const resolveNavLabel = useCallback(
    (labelKey: string) => tSidebar(`${labelKey}.label` as never),
    [tSidebar]
  );

  const pageResults = useMemo(() => {
    if (query.trim().length < 1) return [];
    return filterNavigationEntries(query, navContext, resolveNavLabel);
  }, [query, navContext, resolveNavLabel]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setApiGroups([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal, cache: "no-store" }
        );
        if (!response.ok) {
          setApiGroups([]);
          return;
        }
        const data = (await response.json()) as SearchApiResponse;
        setApiGroups(data.groups ?? []);
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          setApiGroups([]);
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  const flatResults = useMemo<FlatResult[]>(() => {
    const results: FlatResult[] = [];

    if (pageResults.length > 0) {
      const groupLabel = t("groups.pages");
      pageResults.forEach(page => {
        results.push({
          id: page.id,
          title: page.title,
          href: page.href,
          groupType: "pages",
          groupLabel,
        });
      });
    }

    apiGroups.forEach(group => {
      const groupLabel = t(`groups.${group.type}` as never);
      group.items.forEach(item => {
        results.push({
          ...item,
          groupType: group.type,
          groupLabel,
        });
      });
    });

    return results;
  }, [apiGroups, pageResults, t]);

  useEffect(() => {
    setHighlight(0);
  }, [flatResults.length, query]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const navigateTo = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router]
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (flatResults.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight(prev => (prev + 1) % flatResults.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight(
        prev => (prev - 1 + flatResults.length) % flatResults.length
      );
      return;
    }

    if (event.key === "Enter" && flatResults[highlight]) {
      event.preventDefault();
      navigateTo(flatResults[highlight].href);
    }
  };

  const trimmedQuery = query.trim();
  const showMinCharsHint = open && trimmedQuery.length === 1;
  const showEmpty =
    open &&
    trimmedQuery.length >= 1 &&
    !loading &&
    flatResults.length === 0 &&
    !showMinCharsHint;
  const showPanel =
    open && (trimmedQuery.length > 0 || loading || flatResults.length > 0);

  const groupedResults = useMemo(() => {
    const groups: { label: string; items: FlatResult[] }[] = [];
    flatResults.forEach(result => {
      const existing = groups.find(group => group.label === result.groupLabel);
      if (existing) {
        existing.items.push(result);
      } else {
        groups.push({ label: result.groupLabel, items: [result] });
      }
    });
    return groups;
  }, [flatResults]);

  let flatIndex = -1;

  return (
    <div ref={rootRef} className="relative">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-label={t("ariaLabel")}
        placeholder={t("placeholder")}
        value={query}
        onChange={event => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="h-9 w-full rounded-md border border-input bg-background py-1.5 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
      />

      {showPanel ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.375rem)] z-[60] overflow-hidden rounded-lg border border-border bg-card shadow-lg">
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-muted-foreground">
              <LoadingSpinner size="sm" />
              {t("loading")}
            </div>
          ) : null}

          {!loading && showMinCharsHint ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              {t("minChars")}
            </p>
          ) : null}

          {!loading && showEmpty ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              {t("empty")}
            </p>
          ) : null}

          {!loading && groupedResults.length > 0 ? (
            <ul
              id={listboxId}
              role="listbox"
              className="max-h-80 overflow-y-auto py-1"
            >
              {groupedResults.map(group => (
                <li key={group.label} role="presentation">
                  <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </p>
                  {group.items.map(result => {
                    flatIndex += 1;
                    const currentIndex = flatIndex;
                    const Icon = GROUP_ICONS[result.groupType];
                    const isActive = currentIndex === highlight;

                    return (
                      <Link
                        key={`${result.groupType}-${result.id}`}
                        href={result.href}
                        role="option"
                        aria-selected={isActive}
                        onMouseEnter={() => setHighlight(currentIndex)}
                        onClick={() => {
                          setOpen(false);
                          setQuery("");
                        }}
                        className={cn(
                          "flex items-start gap-2.5 px-3 py-2 text-sm transition-colors",
                          isActive
                            ? "bg-muted text-foreground"
                            : "text-foreground hover:bg-muted/70"
                        )}
                      >
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">
                            {result.title}
                          </span>
                          {result.subtitle ? (
                            <span className="block truncate text-xs text-muted-foreground">
                              {result.subtitle}
                            </span>
                          ) : null}
                        </span>
                      </Link>
                    );
                  })}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
