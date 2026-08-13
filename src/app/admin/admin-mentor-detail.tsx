"use client";

import React, { useState } from "react";
import { X, Save, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface AdminMentorDetail {
  id: string;
  headline: string;
  years: number;
  tags: string[];
  name: string | null;
  email: string | null;
  company: string | null;
  track: "career" | "sales" | "both";
  segmentTitle: string;
  status: "pending" | "active";
  /** Current segment id — only meaningful for new/self-submitted entries that can be reassigned. */
  segmentId: string;
  /** True for brand-new (self-submitted or admin-added) entries — enables the segment-reassignment dropdown. */
  isNew: boolean;
}

/** Segment options for reassigning a new/pending mentor entry out of "Unassigned" (or between segments). */
export interface MentorSegmentOption {
  id: string;
  label: string;
}

interface Props {
  mentor: AdminMentorDetail;
  segmentOptions: MentorSegmentOption[];
  onClose: () => void;
  onSaved: () => void;
}

export function AdminMentorDetailPanel({ mentor, segmentOptions, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    headline: mentor.headline,
    years: mentor.years,
    tagsText: mentor.tags.join(", "),
    name: mentor.name || "",
    email: mentor.email || "",
    company: mentor.company || "",
    track: mentor.track,
    segmentId: mentor.segmentId,
  });
  const [saving, setSaving] = useState<"save" | "approve" | null>(null);
  const [error, setError] = useState("");

  async function save(approve = false) {
    setSaving(approve ? "approve" : "save");
    setError("");
    const tags = form.tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const res = await fetch("/api/admin/mentors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: mentor.id,
        headline: form.headline,
        years: Number(form.years) || 0,
        tags,
        name: form.name.trim() || null,
        email: form.email.trim() || null,
        company: form.company.trim() || null,
        track: form.track,
        ...(mentor.isNew && { segmentId: form.segmentId }),
        ...(approve && { status: "active" }),
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Update failed");
      setSaving(null);
      return;
    }
    setSaving(null);
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-border shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-border px-5 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif font-bold text-lg text-gray-900 font-mono">{mentor.id}</h2>
              {mentor.status === "pending" ? (
                <Badge variant="warning" size="sm"><Clock className="w-3 h-3" /> Pending review</Badge>
              ) : (
                <Badge variant="success" size="sm"><CheckCircle2 className="w-3 h-3" /> Published</Badge>
              )}
            </div>
            <p className="text-sm text-muted-fg">{mentor.segmentTitle}</p>
            <p className="text-xs text-muted-fg mt-0.5">
              Anonymous ID shown on Mentor Connect — name and email stay internal.
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {mentor.isNew && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-fg">Segment</label>
              <select
                className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                value={form.segmentId}
                onChange={(e) => setForm((f) => ({ ...f, segmentId: e.target.value }))}
              >
                {segmentOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
              <p className="text-xs text-muted-fg">
                Self-submitted application — assign the segment this mentor best fits.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-fg">
              Name
            </label>
            <input
              type="text"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm"
              placeholder="Internal reference only — never shown publicly"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <p className="text-xs text-muted-fg">
              Admin-only note of the real person behind mentor ID <span className="font-mono">{mentor.id}</span>. Never displayed on Mentor Connect, case studies, or the mobile app.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-fg">Email</label>
              <input
                type="email"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                placeholder="mentor@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-fg">Company</label>
              <input
                type="text"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. Vitol"
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-fg">Headline</label>
            <input
              type="text"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm"
              placeholder="e.g. Crude Oil Trader — Ex-Supermajor"
              value={form.headline}
              onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
            />
            <p className="text-xs text-muted-fg">Shown publicly on Mentor Connect under anonymous ID {mentor.id}.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-fg">Years</label>
              <input
                type="number"
                min={0}
                max={80}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                value={form.years}
                onChange={(e) => setForm((f) => ({ ...f, years: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-fg">Track</label>
              <select
                className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                value={form.track}
                onChange={(e) => setForm((f) => ({ ...f, track: e.target.value as AdminMentorDetail["track"] }))}
              >
                <option value="both">Both</option>
                <option value="career">Career</option>
                <option value="sales">Sales</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-fg">Subjects (tags)</label>
            <input
              type="text"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm"
              placeholder="Comma-separated, e.g. Crude oil, Forward curves, Physical arbitrage"
              value={form.tagsText}
              onChange={(e) => setForm((f) => ({ ...f, tagsText: e.target.value }))}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2 pt-2">
            {mentor.status === "pending" ? (
              <>
                <Button className="flex-1" onClick={() => save(false)} loading={saving === "save"} disabled={saving === "approve"}>
                  <Save className="w-4 h-4" />
                  Save draft
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => save(true)}
                  loading={saving === "approve"}
                  disabled={saving === "save"}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Publish to Mentor Connect
                </Button>
              </>
            ) : (
              <Button className="flex-1" onClick={() => save(false)} loading={saving === "save"}>
                <Save className="w-4 h-4" />
                Save & update live profile
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
