"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, Check, Loader2, X } from "lucide-react";
import type { BookmarkSource } from "@prisma/client";
import { AccountLinkedToast } from "@/components/dashboard/account-linked-toast";

interface TrackedAccountOption {
  id: string;
  name: string;
  deskType: string;
}

interface BookmarkUnderAccountModalProps {
  open: boolean;
  onClose: () => void;
  sourceType: BookmarkSource;
  sourceId: string;
  sourceTitle: string;
  onBookmarked?: (accountName: string) => void;
}

export function BookmarkUnderAccountModal({
  open,
  onClose,
  sourceType,
  sourceId,
  sourceTitle,
  onBookmarked,
}: BookmarkUnderAccountModalProps) {
  const [accounts, setAccounts] = useState<TrackedAccountOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savedName, setSavedName] = useState<string | null>(null);
  const [error, setError] = useState("");
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/account-intelligence/accounts");
      if (!res.ok) {
        throw new Error("Could not load accounts");
      }
      const data: TrackedAccountOption[] = await res.json();
      setAccounts(data);
    } catch {
      setError("Could not load your tracked accounts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setSavedId(null);
      setSavedName(null);
      void loadAccounts();
    }
  }, [open, loadAccounts]);

  async function handleSelect(account: TrackedAccountOption) {
    setSavingId(account.id);
    setError("");
    try {
      const res = await fetch("/api/account-intelligence/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: account.id,
          sourceType,
          sourceId,
          sourceTitle,
        }),
      });
      if (!res.ok) {
        throw new Error("Could not save bookmark");
      }
      setSavedId(account.id);
      setSavedName(account.name);
      onBookmarked?.(account.name);
      if (closeTimer.current) clearTimeout(closeTimer.current);
      closeTimer.current = setTimeout(() => onClose(), 2200);
    } catch {
      setError("Could not bookmark under that account. Please try again.");
    } finally {
      setSavingId(null);
    }
  }

  function handleClose() {
    onClose();
    setTimeout(() => {
      setSavedId(null);
      setSavedName(null);
      setError("");
    }, 250);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary-800/50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-muted-fg hover:bg-secondary transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Bookmark className="w-4 h-4 text-[#065F46]" />
              <h2 className="font-semibold text-gray-900">Bookmark under account</h2>
            </div>
            <p className="text-sm text-muted-fg mb-4 pr-6 leading-relaxed">
              Link <span className="font-medium text-gray-800">{sourceTitle}</span> to one of your
              tracked accounts.
            </p>

            {loading ? (
              <div className="flex items-center justify-center py-8 text-muted-fg gap-2 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading accounts…
              </div>
            ) : accounts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-secondary/30 px-4 py-6 text-center">
                <p className="text-sm text-muted-fg mb-3">No tracked accounts yet.</p>
                <Link
                  href="/dashboard/account-intelligence"
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-[#065F46] px-4 text-sm font-medium text-white hover:bg-[#047857]"
                >
                  Create an account first
                </Link>
              </div>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {accounts.map((account) => {
                  const isSaving = savingId === account.id;
                  const isSaved = savedId === account.id;
                  return (
                    <li key={account.id}>
                      <button
                        type="button"
                        disabled={Boolean(savingId)}
                        onClick={() => void handleSelect(account)}
                        className="w-full rounded-xl border border-border px-4 py-3 text-left hover:border-[#065F46]/30 hover:bg-teal-50/40 transition-colors disabled:opacity-60"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-gray-900 truncate">
                              {account.name}
                            </p>
                            <p className="text-xs text-muted-fg truncate">{account.deskType}</p>
                          </div>
                          {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin text-muted-fg shrink-0" />
                          ) : isSaved ? (
                            <Check className="w-4 h-4 text-green-600 shrink-0" />
                          ) : null}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
            {savedName && (
              <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-green-700">
                <Check className="w-4 h-4 shrink-0" aria-hidden />
                Account is linked!
              </p>
            )}
            <AccountLinkedToast show={Boolean(savedName)} accountName={savedName} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
