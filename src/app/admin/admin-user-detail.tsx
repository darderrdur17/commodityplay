"use client";

import React, { useState } from "react";
import { X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PERSONA_LABELS, formatDate } from "@/lib/utils";
import {
  formatMentorCreditsUsedLabel,
  getMentorCreditUsage,
  MENTOR_CREDITS_MONTHLY_LIMIT,
} from "@/lib/mentor-credits";

export interface AdminUserDetail {
  id: string;
  name: string | null;
  email: string;
  role: string;
  tier: string;
  track: string;
  persona: string | null;
  mentorCreditsUsedThisMonth?: number;
  resumeCredits: number;
  onboardingDone?: boolean;
  stripeStatus?: string | null;
  stripeCurrentPeriodEnd?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  createdAt: string;
  updatedAt?: string;
  _count?: { mentorQuestions: number; progress: number };
}

interface Props {
  user: AdminUserDetail;
  onClose: () => void;
  onSaved: () => void;
  isSelf: boolean;
}

export function AdminUserDetailPanel({ user, onClose, onSaved, isSelf }: Props) {
  const [form, setForm] = useState({
    tier: user.tier,
    role: user.role,
    track: user.track,
    persona: user.persona || "",
    resumeCredits: user.resumeCredits,
    onboardingDone: user.onboardingDone ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const mentorUsage =
    form.tier === "ELITE"
      ? getMentorCreditUsage(user.mentorCreditsUsedThisMonth ?? 0)
      : null;

  async function save() {
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        tier: form.tier,
        role: form.role,
        track: form.track,
        persona: form.persona || null,
        resumeCredits: form.resumeCredits,
        onboardingDone: form.onboardingDone,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Update failed");
      setSaving(false);
      return;
    }
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-border shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-border px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-serif font-bold text-lg text-gray-900">{user.name || "User"}</h2>
            <p className="text-sm text-muted-fg">{user.email}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-secondary rounded-lg p-3">
              <p className="text-xs text-muted-fg mb-1">Joined</p>
              <p className="font-medium">{formatDate(user.createdAt)}</p>
            </div>
            <div className="bg-secondary rounded-lg p-3">
              <p className="text-xs text-muted-fg mb-1">Stripe</p>
              <p className="font-medium">{user.stripeStatus || "inactive"}</p>
            </div>
            <div className="bg-secondary rounded-lg p-3">
              <p className="text-xs text-muted-fg mb-1">Mentor Qs (all time)</p>
              <p className="font-medium">{user._count?.mentorQuestions ?? 0}</p>
            </div>
            <div className="bg-secondary rounded-lg p-3">
              <p className="text-xs text-muted-fg mb-1">Chapters started</p>
              <p className="font-medium">{user._count?.progress ?? 0}</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-fg">Tier</label>
            <select
              className="w-full border border-border rounded-lg px-3 py-2 text-sm"
              value={form.tier}
              onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value }))}
            >
              <option value="STARTER">Starter</option>
              <option value="PRO">Pro</option>
              <option value="ELITE">Elite</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-fg">Role</label>
            <select
              className="w-full border border-border rounded-lg px-3 py-2 text-sm"
              value={form.role}
              disabled={isSelf}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-fg mb-1">Track</label>
              <select
                className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                value={form.track}
                onChange={(e) => setForm((f) => ({ ...f, track: e.target.value }))}
              >
                <option value="CAREER">Career</option>
                <option value="SALES">Sales</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-fg mb-1">Persona</label>
              <select
                className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                value={form.persona}
                onChange={(e) => setForm((f) => ({ ...f, persona: e.target.value }))}
              >
                <option value="">None</option>
                {Object.keys(PERSONA_LABELS).map((p) => (
                  <option key={p} value={p}>{PERSONA_LABELS[p].label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-fg mb-1">
                Mentor credits this month
              </label>
              <div className="rounded-lg border border-border bg-secondary/50 px-3 py-2.5">
                {mentorUsage ? (
                  <>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatMentorCreditsUsedLabel(mentorUsage)}
                    </p>
                    <p className="text-xs text-muted-fg mt-0.5">
                      {mentorUsage.monthLabel} · {mentorUsage.remaining} remaining of {MENTOR_CREDITS_MONTHLY_LIMIT}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-700">Elite only</p>
                    <p className="text-xs text-muted-fg mt-0.5">Not applicable for Starter / Pro</p>
                  </>
                )}
              </div>
              <p className="text-[11px] text-muted-fg mt-1.5 leading-relaxed">
                Read-only — counted from questions asked this month. Resets automatically; not editable here.
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-fg mb-1">Resume credits</label>
              <input
                type="number"
                min={0}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                value={form.resumeCredits}
                onChange={(e) => setForm((f) => ({ ...f, resumeCredits: Number(e.target.value) }))}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.onboardingDone}
              onChange={(e) => setForm((f) => ({ ...f, onboardingDone: e.target.checked }))}
            />
            Onboarding completed
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2 pt-2">
            <Button className="flex-1" onClick={save} loading={saving}>
              <Save className="w-4 h-4" />
              Save customer
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
