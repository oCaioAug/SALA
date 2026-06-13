"use client";

import { Filter, Search } from "lucide-react";

import { cn } from "@/lib/utils";

export interface AdminFilterOption {
  value: string;
  label: string;
}

export interface AdminFilterConfig {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: AdminFilterOption[];
  allLabel?: string;
}

interface AdminFilterBarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchTitle?: string;
  filters?: AdminFilterConfig[];
  actions?: React.ReactNode;
  className?: string;
}

export function AdminFilterBar({
  searchPlaceholder = "Pesquisar...",
  searchValue = "",
  onSearchChange,
  searchTitle,
  filters = [],
  actions,
  className,
}: AdminFilterBarProps) {
  const showSearch = onSearchChange !== undefined;

  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/10",
        className
      )}
    >
      <div className="flex flex-col gap-4">
        {showSearch && (
          <div className="flex flex-col gap-2">
            {searchTitle && (
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Search className="h-4 w-4 text-gray-500" />
                {searchTitle}
              </label>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={e => onSearchChange(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-gray-950/50 py-2 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {(filters.length > 0 || actions) && (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            {filters.length > 0 && (
              <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filters.map(filter => (
                  <div key={filter.id} className="flex flex-col gap-2">
                    <label
                      htmlFor={`admin-filter-${filter.id}`}
                      className="flex items-center gap-2 text-sm font-medium text-gray-300"
                    >
                      <Filter className="h-3.5 w-3.5 text-gray-500" />
                      {filter.label}
                    </label>
                    <select
                      id={`admin-filter-${filter.id}`}
                      value={filter.value}
                      onChange={e => filter.onChange(e.target.value)}
                      className="rounded-lg border border-white/10 bg-gray-950/50 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
                    >
                      <option value="">
                        {filter.allLabel ?? "Todos"}
                      </option>
                      {filter.options.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
            {actions && (
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {actions}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
