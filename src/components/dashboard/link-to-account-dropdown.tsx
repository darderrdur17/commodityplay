"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Link2, Loader2 } from "lucide-react";
import type { BookmarkSource } from "@prisma/client";
import { cn } from "@/lib/utils";
import { AccountLinkedToast } from "@/components/dashboard/account-linked-toast";

interface TrackedAccountOption {
  id: string;
  name: string;
  deskType: string;
}

interface LinkToAccountDropdownProps {
  sourceType: BookmarkSource;
  sourceId: string;
  sourceTitle: string;
  onLinked?: (accountName: string) => void;
  /** `on-green` = weekly nudge row on dark background */
  variant?: "default" | "on-green" | "compact";
  className?: string;
}

export function LinkToAccountDropdown({
  sourceType,
  sourceId,
  sourceTitle,
  onLinked,
  variant = "default",
  className,
}: LinkToAccountDropdownProps) {
  const [accounts, setAccounts] = useState<TrackedAccountOption[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [saving, setSaving] = useState(false);
  const [linkedAccount, setLinkedAccount] = useState<string | null>(null);
  const [error, setError] = useState("");
  const clearFeedbackTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (clearFeedbackTimer.current) clearTimeout(clearFeedbackTimer.current);
    };
  }, []);

  const loadAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    setError("");
    try {
      const res = await fetch("/api/account-intelligence/accounts");
      if (!res.ok) throw new Error("Failed to load accounts");
      const data: TrackedAccountOption[] = await res.json();
      setAccounts(data);
    } catch {
      setError("Could not load accounts.");
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  async function handleSelect(accountId: string) {
    if (!accountId || saving) return;

    const account = accounts.find((a) => a.id === accountId);
    if (!account) return;

    setSelectedId(accountId);
    setSaving(true);
    setError("");
    setLinkedAccount(null);

    try {
      const res = await fetch("/api/account-intelligence/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          sourceType,
          sourceId,
          sourceTitle,
        }),
      });
      if (!res.ok) throw new Error("Failed to link");
      setLinkedAccount(account.name);
      onLinked?.(account.name);
      if (clearFeedbackTimer.current) clearTimeout(clearFeedbackTimer.current);
      clearFeedbackTimer.current = setTimeout(() => {
        setSelectedId("");
        setLinkedAccount(null);
      }, 4000);
    } catch {
      setError("Could not link to that account.");
      setSelectedId("");
    } finally {
      setSaving(false);
    }
  }

  const labelClass = cn(
    "text-[10px] font-bold uppercase tracking-widest flex items-center gap-1",
    variant === "on-green" ? "text-white/80" : "text-muted-fg"
  );

  const selectClass = cn(
    "h-9 w-full min-w-[180px] rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 disabled:opacity-60",
    variant === "on-green"
      ? "border-white/40 bg-white/10 text-white focus:ring-white/30 [&>option]:text-gray-900"
      : "border-border bg-white text-gray-900 focus:ring-[#065F46]/30",
    variant === "compact" && "min-w-[160px] text-xs h-8"
  );

  if (loadingAccounts) {
    return (
      <div className={cn("flex items-center gap-2 text-xs text-muted-fg", className)}>
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Loading accounts…
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className={cn("text-xs", className)}>
        <p className={variant === "on-green" ? "text-white/80 mb-1" : "text-muted-fg mb-1"}>
          No tracked accounts yet.
        </p>
        <Link
          href="/dashboard/account-intelligence"
          className={cn(
            "font-medium underline-offset-2 hover:underline",
            variant === "on-green" ? "text-white" : "text-[#065F46]"
          )}
        >
          Create an account first
        </Link>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={`link-account-${sourceId}`} className={labelClass}>
        <Link2 className="w-3 h-3 shrink-0" aria-hidden />
        Link to account
      </label>
      <div className="flex items-center gap-2">
        <select
          id={`link-account-${sourceId}`}
          value={selectedId}
          disabled={saving}
          onChange={(e) => void handleSelect(e.target.value)}
          className={selectClass}
        >
          <option value="">Select an account</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
        {saving && <Loader2 className="w-4 h-4 animate-spin text-muted-fg shrink-0" />}
      </div>
      {linkedAccount && (
        <p
          className={cn(
            "flex items-center gap-1.5 text-xs font-semibold",
            variant === "on-green" ? "text-white" : "text-green-700"
          )}
        >
          <Check className="w-3.5 h-3.5 shrink-0" aria-hidden />
          Account is linked!
        </p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <AccountLinkedToast show={Boolean(linkedAccount)} accountName={linkedAccount} />
    </div>
  );
}