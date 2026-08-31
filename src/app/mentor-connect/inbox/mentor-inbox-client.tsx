"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Inbox, Clock, CheckCircle, Send, User, Filter, Eye, EyeOff, Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/animations";
import { formatDate, PERSONA_LABELS } from "@/lib/utils";
import { MENTOR_SEGMENT_LABELS } from "@/lib/mentor-demo";

type FilterTab = "all" | "pending" | "answered";

interface MemberInfo {
  id: string;
  track: string;
  persona: string | null;
}

interface MentorRequest {
  id: string;
  segment: string;
  question: string;
  answer: string | null;
  isAnswered: boolean;
  isPublic: boolean;
  createdAt: string;
  answeredAt: string | null;
  member: MemberInfo;
}

interface InboxStats {
  pending: number;
  answered: number;
  total: number;
}

interface Props {
  mentorName: string;
  initialRequests: MentorRequest[];
  initialStats: InboxStats;
}

const ALL_TIME_KEY = "all";

function monthKeyOf(dateIso: string): string {
  const d = new Date(dateIso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

interface RequestDetailPanelProps {
  req: MentorRequest;
  answer: string;
  isPublic: boolean;
  submitting: boolean;
  error: string;
  successMsg: string;
  selectedId: string | null;
  onAnswerChange: (value: string) => void;
  onIsPublicChange: (value: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
}

function RequestDetailPanel({
  req,
  answer,
  isPublic,
  submitting,
  error,
  successMsg,
  selectedId,
  onAnswerChange,
  onIsPublicChange,
  onSubmit,
}: RequestDetailPanelProps) {
  return (
    <div className="bg-white rounded-b-xl border border-t-0 border-primary-400 ring-2 ring-primary-400/20 overflow-hidden -mt-px">
      <div className="px-5 sm:px-6 py-4 border-b border-border bg-secondary/40">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary-800 mb-1">
              {MENTOR_SEGMENT_LABELS[req.segment] ?? req.segment}
            </p>
            <h2 className="font-serif text-lg sm:text-xl font-bold text-gray-900">{req.member.id}</h2>
          </div>
          <Badge variant={req.isAnswered ? "success" : "warning"}>
            {req.isAnswered ? "Answered" : "Awaiting response"}
          </Badge>
        </div>
      </div>

      <div className="px-5 sm:px-6 py-4 border-b border-border">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-fg mb-3 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" /> Member profile (anonymous)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              label: "Persona",
              value: req.member.persona ? PERSONA_LABELS[req.member.persona]?.label : "—",
            },
            {
              label: "Track",
              value: req.member.track === "CAREER" ? "Career" : "Sales",
            },
            { label: "Submitted", value: formatDate(req.createdAt) },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-fg mb-0.5">
                {item.label}
              </p>
              <p className="text-sm font-semibold text-gray-900">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 sm:px-6 py-4 border-b border-border">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-fg mb-2">Member query</p>
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{req.question}</p>
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-fg">
          {req.isPublic ? (
            <>
              <Eye className="w-3.5 h-3.5" /> Member opted in to anonymous sharing
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5" /> Private — not shared publicly
            </>
          )}
        </div>
      </div>

      {req.isAnswered && req.answer ? (
        <div className="px-5 sm:px-6 py-4 bg-primary-soft/50">
          <p className="text-xs font-bold uppercase tracking-widest text-primary-800 mb-2">Your answer</p>
          <p className="text-sm text-primary-900 leading-relaxed whitespace-pre-wrap">{req.answer}</p>
          {req.answeredAt && (
            <p className="text-xs text-muted-fg mt-3">Sent {formatDate(req.answeredAt)}</p>
          )}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="px-5 sm:px-6 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-fg mb-2 flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5" /> Write your response
          </p>
          <textarea
            value={answer}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder="Give a direct, practitioner answer — specific enough that they can act on it this week."
            className="w-full h-36 px-3 py-2.5 rounded-lg border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-400 mb-3"
          />
          <p className={`text-xs mb-3 ${answer.length >= 10 ? "text-green-600" : "text-muted-fg"}`}>
            {answer.length}/2000 characters
          </p>
          <label className="flex items-center gap-2.5 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => onIsPublicChange(e.target.checked)}
              className="rounded accent-primary-400"
            />
            <span className="text-sm text-gray-700">Allow anonymous sharing in Desk Channel library</span>
          </label>
          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg p-3 mb-3">{error}</p>
          )}
          {successMsg && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
              {successMsg}
            </p>
          )}
          <Button type="submit" loading={submitting} disabled={answer.length < 10 || selectedId !== req.id}>
            <Send className="w-4 h-4" /> Send answer to member
          </Button>
        </form>
      )}
    </div>
  );
}

export function MentorInboxClient({ mentorName, initialRequests }: Props) {
  const [requests, setRequests] = useState(initialRequests);
  const [filter, setFilter] = useState<FilterTab>("pending");
  const [selectedMonth, setSelectedMonth] = useState<string>(ALL_TIME_KEY);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialRequests.find((r) => !r.isAnswered)?.id ?? initialRequests[0]?.id ?? null
  );
  const [answer, setAnswer] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Distinct months present in the mentor's request history, newest first —
  // powers the archive filter sidebar so the list stays manageable as
  // requests accumulate over time.
  const monthOptions = useMemo(() => {
    const byKey = new Map<string, { key: string; label: string; count: number }>();
    for (const r of requests) {
      const key = monthKeyOf(r.createdAt);
      const existing = byKey.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        byKey.set(key, {
          key,
          label: new Date(r.createdAt).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          }),
          count: 1,
        });
      }
    }
    return Array.from(byKey.values()).sort((a, b) => (a.key < b.key ? 1 : -1));
  }, [requests]);

  const monthFiltered = useMemo(() => {
    if (selectedMonth === ALL_TIME_KEY) return requests;
    return requests.filter((r) => monthKeyOf(r.createdAt) === selectedMonth);
  }, [requests, selectedMonth]);

  // Stat cards reflect the selected month's archive, not the all-time totals,
  // so the hero grid stays in sync with whichever period is being reviewed.
  const stats = useMemo(() => {
    const pending = monthFiltered.filter((r) => !r.isAnswered).length;
    const answered = monthFiltered.filter((r) => r.isAnswered).length;
    return { pending, answered, total: monthFiltered.length };
  }, [monthFiltered]);

  const filtered = useMemo(() => {
    if (filter === "pending") return monthFiltered.filter((r) => !r.isAnswered);
    if (filter === "answered") return monthFiltered.filter((r) => r.isAnswered);
    return monthFiltered;
  }, [monthFiltered, filter]);

  useEffect(() => {
    if (!filtered.find((r) => r.id === selectedId)) {
      setSelectedId(filtered[0]?.id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered]);

  const selected = requests.find((r) => r.id === selectedId) ?? null;

  async function handleAnswer(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || answer.length < 10) return;
    setSubmitting(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch(`/api/mentor-connect/inbox/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer, isPublic }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not send answer");
        return;
      }

      setRequests((prev) =>
        prev.map((r) =>
          r.id === selected.id
            ? {
                ...r,
                answer: data.answer,
                isAnswered: true,
                isPublic: data.isPublic,
                answeredAt: data.answeredAt,
              }
            : r
        )
      );
      setAnswer("");
      setIsPublic(false);
      if (data.menteeEmail?.sent) {
        setSuccessMsg("Answer saved — member notified by email and synced to their Mentor Connect page.");
      } else if (data.menteeEmail?.skipped) {
        setSuccessMsg("Answer saved and synced. Email logged for demo — ask an admin to check the Email Log.");
      } else {
        setSuccessMsg("Answer saved and synced to member page.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function selectRequest(id: string) {
    setSelectedId((prev) => {
      const next = prev === id ? null : id;
      if (next) {
        requestAnimationFrame(() => {
          cardRefs.current.get(next)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
      }
      return next;
    });
    setAnswer("");
    setError("");
    setSuccessMsg("");
    setIsPublic(false);
  }

  return (
    <div className="page-container py-8 sm:py-10">
      <section className="rounded-2xl bg-primary-800 px-6 sm:px-8 py-10 sm:py-12 mb-8 relative overflow-hidden">
        <div
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #3280ff 0%, transparent 70%)" }}
        />
        <Reveal className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <div className="pill pill-dark mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                Mentor Connect · Practitioner Inbox
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-2">
                Member <span className="text-accent italic">Requests</span>
              </h1>
              <p className="text-white/65 text-base max-w-xl">
                Signed in as {mentorName}. Review anonymous member queries, see persona context, and respond from your practitioner perspective.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <Link
                href="/mentor-connect"
                className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
              >
                Member view →
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-lg">
            {[
              { label: "Pending", value: stats.pending, icon: Clock },
              { label: "Answered", value: stats.answered, icon: CheckCircle },
              { label: "Total", value: stats.total, icon: Inbox },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="glass-card px-4 py-3 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-3.5 h-3.5 text-accent" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">{label}</span>
                </div>
                <p className="font-serif text-2xl font-bold">{value}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Mobile / narrow archive selector */}
      <div className="lg:hidden mb-4">
        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-fg mb-1.5">
          <Archive className="w-3.5 h-3.5" /> Archive
        </label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-400"
        >
          <option value={ALL_TIME_KEY}>All time ({requests.length})</option>
          {monthOptions.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label} ({m.count})
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Filter className="w-4 h-4 text-muted-fg" />
        {(["pending", "answered", "all"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              filter === tab
                ? "bg-primary-800 text-white border-primary-800"
                : "bg-white text-muted-fg border-border hover:border-primary-line"
            }`}
          >
            {tab === "all" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span className="opacity-70 ml-1">
              {tab === "pending"
                ? stats.pending
                : tab === "answered"
                  ? stats.answered
                  : stats.total}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 items-start">
        {/* Month/year archive filter sidebar */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="bg-white rounded-xl border border-border p-3 sticky top-24">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-fg px-2 pb-2">
              <Archive className="w-3 h-3" /> Archive
            </p>
            <div className="flex flex-col gap-0.5 max-h-[480px] overflow-y-auto">
              <button
                type="button"
                onClick={() => setSelectedMonth(ALL_TIME_KEY)}
                className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  selectedMonth === ALL_TIME_KEY
                    ? "bg-primary-800 text-white"
                    : "text-gray-600 hover:bg-secondary"
                }`}
              >
                All time
                <span className="opacity-70">{requests.length}</span>
              </button>
              {monthOptions.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setSelectedMonth(m.key)}
                  className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    selectedMonth === m.key
                      ? "bg-primary-800 text-white"
                      : "text-gray-600 hover:bg-secondary"
                  }`}
                >
                  {m.label}
                  <span className="opacity-70">{m.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Request list — detail expands inline below the selected card */}
        <div className="lg:col-span-5 space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-border p-8 text-center">
              <Inbox className="w-8 h-8 text-muted-fg mx-auto mb-3" />
              <p className="text-sm text-muted-fg">No {filter === "all" ? "" : filter} requests.</p>
            </div>
          ) : (
            filtered.map((req) => {
              const persona = req.member.persona ? PERSONA_LABELS[req.member.persona] : null;
              const active = selectedId === req.id;
              return (
                <div
                  key={req.id}
                  className="scroll-mt-24"
                  ref={(el) => {
                    if (el) cardRefs.current.set(req.id, el);
                    else cardRefs.current.delete(req.id);
                  }}
                >
                  <button
                    type="button"
                    onClick={() => selectRequest(req.id)}
                    className={`w-full text-left rounded-xl border bg-white p-4 transition-all ${
                      active
                        ? "border-primary-400 ring-2 ring-primary-400/20 shadow-sm rounded-b-none"
                        : "border-border hover:border-primary-line"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge variant={req.isAnswered ? "success" : "warning"} size="sm">
                        {req.isAnswered ? "Answered" : "Pending"}
                      </Badge>
                      <span className="text-[10px] text-muted-fg">{formatDate(req.createdAt)}</span>
                    </div>
                    <p className="text-xs font-bold text-primary-800 mb-1">{req.member.id}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-fg mb-2">
                      {MENTOR_SEGMENT_LABELS[req.segment] ?? req.segment}
                    </p>
                    <p className="text-sm text-gray-700 line-clamp-2 mb-3">{req.question}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {persona && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: persona.bg, color: persona.color }}
                        >
                          {persona.label}
                        </span>
                      )}
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-fg font-semibold capitalize">
                        {req.member.track.toLowerCase()} track
                      </span>
                    </div>
                  </button>
                  {active && selected?.id === req.id && (
                    <RequestDetailPanel
                      req={req}
                      answer={answer}
                      isPublic={isPublic}
                      submitting={submitting}
                      error={error}
                      successMsg={successMsg}
                      selectedId={selectedId}
                      onAnswerChange={setAnswer}
                      onIsPublicChange={setIsPublic}
                      onSubmit={handleAnswer}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
