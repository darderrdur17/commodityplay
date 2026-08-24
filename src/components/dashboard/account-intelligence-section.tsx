"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ClipboardList, Lock, Pin, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Reveal } from "@/components/animations";
import { hasAccess } from "@/lib/utils";
import { FOR_ELITE_ACCESS, UPGRADE_TO_ACCESS } from "@/data/pricing-shared";
import { SALES_PLAN_HREF } from "@/lib/pricing-routes";
import {
  ACCOUNT_STATUS_OPTIONS,
  FOREST_GREEN,
  getAccountStatusMeta,
  type AccountBookmarkRecord,
  type TrackedAccountRecord,
} from "@/lib/account-intelligence";
import {
  getBookmarkHref,
  PREP_LIBRARY_SALES_HREF,
  SALES_MARKET_NUDGES_HREF,
} from "@/lib/bookmark-navigation";
import type { AccountStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

const PREVIEW_ACCOUNTS: TrackedAccountRecord[] = [
  {
    id: "preview-meridian",
    name: "Meridian Energy",
    deskType: "LNG · Trading desk",
    status: "ACTIVE_DISCUSSION",
    notes: "Strong interest in JKM coverage — wants to see how we frame spread moves before their Q3 hedge review.",
    lastTouch: "2 weeks ago",
    nextStep: "Follow-up call Thu",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    bookmarks: [
      {
        id: "b1",
        accountId: "preview-meridian",
        sourceType: "PREP_LIBRARY",
        sourceId: "opening-with-observation",
        sourceTitle: "Opening a Meeting with a Market Observation, Not a Pitch",
        createdAt: new Date().toISOString(),
      },
      {
        id: "b2",
        accountId: "preview-meridian",
        sourceType: "MARKET_NUDGE",
        sourceId: "jkm-ttf-spread",
        sourceTitle: "JKM—TTF spread compressed sharply this week",
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: "preview-northbridge",
    name: "Northbridge Gas",
    deskType: "Gas · Physical trading",
    status: "FIRST_CONTACT",
    notes: "Intro call went well — desk lead asked for something specific on European storage before next meeting.",
    lastTouch: "1 week ago",
    nextStep: "Send storage brief",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    bookmarks: [
      {
        id: "b3",
        accountId: "preview-northbridge",
        sourceType: "PREP_LIBRARY",
        sourceId: "spread-move-framing",
        sourceTitle: "Framing a Spread Move in a Client Conversation",
        createdAt: new Date().toISOString(),
      },
      {
        id: "b4",
        accountId: "preview-northbridge",
        sourceType: "PREP_LIBRARY",
        sourceId: "vendor-data-turning-points",
        sourceTitle: "Why Vendor Data Matters More at Turning Points",
        createdAt: new Date().toISOString(),
      },
      {
        id: "b5",
        accountId: "preview-northbridge",
        sourceType: "MARKET_NUDGE",
        sourceId: "jkm-ttf-spread",
        sourceTitle: "JKM—TTF spread compressed sharply this week",
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: "preview-solace",
    name: "Solace Trade Finance",
    deskType: "Trade finance · Credit desk",
    status: "STALLED",
    notes: "Conversation paused after credit committee review — freight economics is the angle to reopen.",
    lastTouch: "3 weeks ago",
    nextStep: "Re-engage with VLCC note",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    bookmarks: [
      {
        id: "b6",
        accountId: "preview-solace",
        sourceType: "PREP_LIBRARY",
        sourceId: "freight-costs-conversation",
        sourceTitle: "Talking About Freight Costs Without Sounding Like a Pitch",
        createdAt: new Date().toISOString(),
      },
      {
        id: "b7",
        accountId: "preview-solace",
        sourceType: "MARKET_NUDGE",
        sourceId: "vlcc-rates-spike",
        sourceTitle: "Gulf Coast VLCC rates spiked on an unplanned outage",
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: "preview-halcyon",
    name: "Halcyon Resources",
    deskType: "Base metals · Procurement",
    status: "RESEARCHING",
    notes: "Early scoping — procurement team mapping vendor landscape before any formal RFP.",
    lastTouch: "5 days ago",
    nextStep: "Desk priorities follow-up",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    bookmarks: [
      {
        id: "b8",
        accountId: "preview-halcyon",
        sourceType: "PREP_LIBRARY",
        sourceId: "desk-priorities-stress",
        sourceTitle: "Reading Desk Priorities From Recent Market Stress",
        createdAt: new Date().toISOString(),
      },
    ],
  },
];

function BookmarkChip({ bookmark }: { bookmark: AccountBookmarkRecord }) {
  const isPrep = bookmark.sourceType === "PREP_LIBRARY";
  const href = getBookmarkHref(bookmark.sourceType, bookmark.sourceId);

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium leading-snug",
        "transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#3280ff]",
        isPrep
          ? "bg-teal-50 text-teal-800 hover:bg-teal-100"
          : "bg-amber-50 text-amber-800 hover:bg-amber-100"
      )}
    >
      <Pin className="w-3 h-3 shrink-0" aria-hidden />
      {bookmark.sourceTitle}
    </Link>
  );
}

function ContinueWhereYouLeftOff() {
  return (
    <section
      className="rounded-xl bg-primary-800 px-6 py-8 sm:px-10 sm:py-10"
      aria-labelledby="continue-where-you-left-off"
    >
      <h2 id="continue-where-you-left-off" className="text-lg sm:text-xl font-bold text-white mb-5">
        Continue where you left off
      </h2>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href={PREP_LIBRARY_SALES_HREF} className="w-full sm:w-auto">
          <Button
            size="sm"
            className="w-full sm:w-auto text-white border-0 rounded-lg h-10 px-5 text-sm font-semibold hover:opacity-90 bg-[#3280ff] hover:bg-[#2870e8]"
          >
            ← Back to Sales Prep Library
          </Button>
        </Link>
        <Link href={SALES_MARKET_NUDGES_HREF} className="w-full sm:w-auto">
          <Button
            size="sm"
            className="w-full sm:w-auto text-white border-0 rounded-lg h-10 px-5 text-sm font-semibold hover:opacity-90 bg-[#3280ff] hover:bg-[#2870e8]"
          >
            ← Back to Sales Market Nudges
          </Button>
        </Link>
      </div>
    </section>
  );
}

function AccountCard({
  account,
  onDelete,
  deleting = false,
}: {
  account: TrackedAccountRecord;
  onDelete?: (id: string) => void;
  deleting?: boolean;
}) {
  const statusMeta = getAccountStatusMeta(account.status);
  const prepBookmarks = account.bookmarks.filter((b) => b.sourceType === "PREP_LIBRARY");
  const nudgeBookmarks = account.bookmarks.filter((b) => b.sourceType === "MARKET_NUDGE");

  return (
    <article
      id={`account-${account.id}`}
      className="rounded-xl border border-border bg-white p-5 sm:p-6 shadow-sm scroll-mt-28"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="font-bold text-gray-900 text-base leading-snug">{account.name}</h3>
          <p className="text-sm text-muted-fg mt-0.5">{account.deskType}</p>
        </div>
        <div className="flex items-start gap-2 shrink-0">
          <span
            className={cn(
              "inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
              statusMeta.badgeClass
            )}
          >
            {statusMeta.label}
          </span>
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(account.id)}
              disabled={deleting}
              className="p-1.5 rounded-lg text-muted-fg hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
              aria-label={`Delete ${account.name}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {account.notes && (
        <div className="rounded-lg bg-slate-50 px-4 py-3 mb-4">
          <p className="text-sm text-gray-700 leading-relaxed italic">&ldquo;{account.notes}&rdquo;</p>
        </div>
      )}

      {(account.lastTouch || account.nextStep) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-fg mb-4">
          {account.lastTouch && (
            <span>
              Last touch: <span className="font-medium text-gray-700">{account.lastTouch}</span>
            </span>
          )}
          {account.nextStep && (
            <span>
              Next: <span className="font-medium text-gray-700">{account.nextStep}</span>
            </span>
          )}
        </div>
      )}

      <div className="pt-3 border-t border-border/60 space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-fg">
          Linked from your bookmarks
        </p>
        <div className="flex flex-wrap gap-2">
          {prepBookmarks.map((bookmark) => (
            <BookmarkChip key={bookmark.id} bookmark={bookmark} />
          ))}
          {nudgeBookmarks.map((bookmark) => (
            <BookmarkChip key={bookmark.id} bookmark={bookmark} />
          ))}
        </div>
        {nudgeBookmarks.length === 0 && (
          <p className="text-xs text-muted-fg italic">No nudges bookmarked yet.</p>
        )}
      </div>
    </article>
  );
}

function AddAccountModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (account: TrackedAccountRecord) => void;
}) {
  const [name, setName] = useState("");
  const [deskType, setDeskType] = useState("");
  const [status, setStatus] = useState<AccountStatus>("ACTIVE_DISCUSSION");
  const [notes, setNotes] = useState("");
  const [lastTouch, setLastTouch] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function resetForm() {
    setName("");
    setDeskType("");
    setStatus("ACTIVE_DISCUSSION");
    setNotes("");
    setLastTouch("");
    setNextStep("");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !deskType.trim()) return;

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/account-intelligence/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          deskType: deskType.trim(),
          status,
          notes: notes.trim() || undefined,
          lastTouch: lastTouch.trim() || undefined,
          nextStep: nextStep.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const created: TrackedAccountRecord = await res.json();
      onCreated(created);
      resetForm();
      onClose();
    } catch {
      setError("Could not create account. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    onClose();
    setTimeout(resetForm, 250);
  }

  const labelClass = "text-[10px] font-bold uppercase tracking-widest text-[#065F46]/70";

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
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
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

            <h2 className="font-semibold text-gray-900 mb-1">Add a new account</h2>
            <p className="text-sm text-muted-fg mb-5">
              Track a desk you&apos;re engaging and bookmark prep topics or market nudges to it.
            </p>

            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="account-name" className={labelClass}>
                    Account name
                  </label>
                  <Input
                    id="account-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. ABC Energy"
                    required
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="account-desk-type" className={labelClass}>
                    Desk type
                  </label>
                  <Input
                    id="account-desk-type"
                    value={deskType}
                    onChange={(e) => setDeskType(e.target.value)}
                    placeholder="e.g. LNG · Trading desk"
                    required
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <span className={labelClass}>Status</span>
                  <div className="flex flex-wrap gap-2">
                    {ACCOUNT_STATUS_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setStatus(option.value)}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors",
                          status === option.value
                            ? "border-[#065F46] bg-[#065F46]/10 text-[#065F46]"
                            : "border-border text-muted-fg hover:border-gray-300"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="account-notes" className={labelClass}>
                    Notes
                  </label>
                  <textarea
                    id="account-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Context, relationship notes, what they care about…"
                    className="flex w-full rounded-lg border border-border bg-white px-3 py-2 text-sm placeholder:text-muted-fg resize-none focus:outline-none focus:ring-2 focus:ring-[#065F46] focus:border-transparent"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="account-last-touch" className={labelClass}>
                    Last touch
                  </label>
                  <Input
                    id="account-last-touch"
                    value={lastTouch}
                    onChange={(e) => setLastTouch(e.target.value)}
                    placeholder="e.g. 2 weeks ago"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="account-next-step" className={labelClass}>
                    Next step
                  </label>
                  <Input
                    id="account-next-step"
                    value={nextStep}
                    onChange={(e) => setNextStep(e.target.value)}
                    placeholder="e.g. Follow-up call Thu"
                  />
                </div>
              </div>

              {error && <p className="text-xs text-red-600">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving || !name.trim() || !deskType.trim()}
                  className="bg-[#065F46] hover:bg-[#047857] text-white border-0"
                >
                  {saving ? "Saving…" : "Add account"}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function AccountIntelligenceSection({ userTier }: { userTier: string }) {
  const unlocked = hasAccess(userTier, "ELITE");
  const [accounts, setAccounts] = useState<TrackedAccountRecord[]>([]);
  const [loading, setLoading] = useState(unlocked);
  const [addOpen, setAddOpen] = useState(false);
  const [jumpTarget, setJumpTarget] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    if (!unlocked) return;
    setLoading(true);
    try {
      const res = await fetch("/api/account-intelligence/accounts");
      if (res.ok) {
        const data: TrackedAccountRecord[] = await res.json();
        setAccounts(data);
      }
    } finally {
      setLoading(false);
    }
  }, [unlocked]);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  const accountOptions = useMemo(
    () => accounts.map((account) => ({ id: account.id, name: account.name })),
    [accounts]
  );

  function handleJump(accountId: string) {
    const el = document.getElementById(`account-${accountId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  async function handleDeleteAccount(accountId: string) {
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return;

    const confirmed = window.confirm(
      `Delete "${account.name}"? Any bookmarks linked to this account will also be removed.`
    );
    if (!confirmed) return;

    setDeletingId(accountId);
    try {
      const res = await fetch(`/api/account-intelligence/accounts/${accountId}`, {
        method: "DELETE",
      });
      if (!res.ok) return;
      setAccounts((prev) => prev.filter((a) => a.id !== accountId));
      if (jumpTarget === accountId) setJumpTarget("");
    } finally {
      setDeletingId(null);
    }
  }

  if (!unlocked) {
    return (
      <Reveal>
        <div className="relative rounded-xl border border-border bg-white overflow-hidden">
          <div className="blur-sm pointer-events-none select-none p-6 space-y-6" aria-hidden>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PREVIEW_ACCOUNTS.slice(0, 2).map((account) => (
                <AccountCard key={account.id} account={account} />
              ))}
            </div>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm px-6 text-center py-10">
            <Lock className="w-5 h-5 text-muted-fg mb-2" />
            <p className="text-sm font-semibold text-gray-700 mb-4">{FOR_ELITE_ACCESS}</p>
            <Link href={SALES_PLAN_HREF("elite")}>
              <Button size="sm">{UPGRADE_TO_ACCESS}</Button>
            </Link>
          </div>
        </div>
      </Reveal>
    );
  }

  return (
    <Reveal className="space-y-8">
      <header className="space-y-4">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: FOREST_GREEN }}>
          Account Intelligence
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900">
          Your Desks. Your Edge.
        </h1>
        <p className="text-sm text-muted-fg max-w-2xl leading-relaxed">
          Track the desks you&apos;re engaging, and see the Prep Library topics and Market Nudges
          you&apos;ve bookmarked to each one — all in one place.
        </p>
      </header>

      <section className="rounded-xl border border-border bg-white p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-4 h-4" style={{ color: FOREST_GREEN }} />
            My Accounts
          </h2>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            {accountOptions.length > 0 && (
              <div className="flex items-center gap-2">
                <label htmlFor="jump-to-account" className="text-xs text-muted-fg shrink-0">
                  Jump to account
                </label>
                <select
                  id="jump-to-account"
                  value={jumpTarget}
                  onChange={(e) => {
                    const value = e.target.value;
                    setJumpTarget(value);
                    if (value) {
                      handleJump(value);
                    }
                  }}
                  className="h-9 rounded-lg border border-border bg-white px-3 text-sm text-gray-900 min-w-[180px]"
                >
                  <option value="">Select an account</option>
                  {accountOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Button
              type="button"
              size="sm"
              onClick={() => setAddOpen(true)}
              className="bg-[#065F46] hover:bg-[#047857] text-white border-0 gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add a New Account
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-fg">Loading your accounts…</p>
        ) : accounts.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {accounts.map((account, i) => (
              <Reveal key={account.id} delay={i * 0.03}>
                <AccountCard
                  account={account}
                  onDelete={handleDeleteAccount}
                  deleting={deletingId === account.id}
                />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-secondary/20 px-6 py-10 text-center">
            <p className="text-sm text-muted-fg mb-4">
              No accounts yet. Add your first desk to start bookmarking prep topics and market nudges.
            </p>
            <Button
              type="button"
              size="sm"
              onClick={() => setAddOpen(true)}
              className="bg-[#065F46] hover:bg-[#047857] text-white border-0 gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add a New Account
            </Button>
          </div>
        )}
      </section>

      <ContinueWhereYouLeftOff />

      <AddAccountModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(account) => setAccounts((prev) => [...prev, account])}
      />
    </Reveal>
  );
}
