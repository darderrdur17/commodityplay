"use client";

import React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function normalizeAdminSearch(value: string): string {
  return value.trim().toLowerCase();
}

export function matchesAdminSearch(
  query: string,
  ...fields: (string | null | undefined)[]
): boolean {
  if (!query) return true;
  const haystack = fields.filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(query);
}

export interface AdminFilterChip {
  id: string;
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

interface AdminTableFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  chips?: AdminFilterChip[];
  filteredCount?: number;
  totalCount?: number;
}

export function AdminTableFilters({
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  chips = [],
  filteredCount,
  totalCount,
}: AdminTableFiltersProps) {
  const showCount = filteredCount !== undefined && totalCount !== undefined;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full h-9 pl-9 pr-8 rounded-lg border border-border bg-white text-sm placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-fg hover:text-gray-700 p-0.5"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {showCount && (
          <p className="text-xs text-muted-fg whitespace-nowrap">
            Showing {filteredCount} of {totalCount}
          </p>
        )}
      </div>
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {chips.map((chip) => (
            <div key={chip.id} className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-muted-fg">{chip.label}:</span>
              {chip.options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => chip.onChange(opt.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                    chip.value === opt.value
                      ? "bg-primary-400 text-white"
                      : "bg-white text-muted-fg border border-border hover:border-primary-line"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
