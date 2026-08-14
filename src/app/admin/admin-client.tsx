"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, Shield, MessageSquare, Mail, Crown, TrendingUp,
  CheckCircle, Clock, ArrowLeft, RefreshCw, FileJson, Pencil,
  BarChart2, UserCheck, CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/animations";
import { PERSONA_LABELS, formatDate, cn } from "@/lib/utils";
import { AdminContentTab } from "./admin-content-tab";
import { AdminUserDetailPanel, type AdminUserDetail } from "./admin-user-detail";
import { AdminMentorDetailPanel, type AdminMentorDetail, type MentorSegmentOption } from "./admin-mentor-detail";
import { MENTOR_COUNT, MENTOR_SEGMENTS, UNASSIGNED_SEGMENT_ID } from "@/data/mentors";

interface Stats {
  totalUsers: number;
  tiers: { starter: number; pro: number; elite: number };
  adminCount: number;
  waitlistCount: number;
  mentor: { pending: number; answered: number };
  subscribers: number;
}

interface MentorQ {
  id: string;
  segment: string;
  question: string;
  answer: string | null;
  isAnswered: boolean;
  createdAt: string;
  answeredAt?: string | null;
  answeredByEmail?: string | null;
  mentorReminderSentAt?: string | null;
  menteeNotifiedAt?: string | null;
  user: { name: string | null; email: string; tier: string };
}

interface WaitlistEntry {
  id: string;
  email: string;
  name: string | null;
  track: string;
  createdAt: string;
}

interface ChapterProgressRow {
  userId: string;
  userName: string | null;
  userEmail: string;
  tier: string;
  track: string;
  chapters: Record<string, { completed: boolean; progress: number; completedAt: string | null }>;
}

interface MentorSegmentRow {
  id: string;
  num: string;
  title: string;
  blurb: string;
  questionCount: number;
  mentors: {
    id: string;
    years: number;
    headline: string;
    bio: string;
    tags: string[];
    name: string | null;
    email: string | null;
    company: string | null;
    track: "career" | "sales" | "both";
    status: "pending" | "active";
    isNew: boolean;
    segmentId: string;
  }[];
}

const CHAPTERS = ["a", "b", "c", "d", "e"];

type AdminTab = "users" | "content" | "mentor" | "waitlist" | "progress" | "mentors" | "billing";

const VALID_TABS: AdminTab[] = ["users", "content", "mentor", "waitlist", "progress", "mentors", "billing"];

export function AdminClient({
  adminName,
  adminId,
  initialTab,
  initialTrack,
}: {
  adminName: string;
  adminId: string;
  initialTab?: string;
  initialTrack?: string;
}) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUserDetail[]>([]);
  const [mentorQs, setMentorQs] = useState<MentorQ[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [progressData, setProgressData] = useState<ChapterProgressRow[]>([]);
  const [mentorSegments, setMentorSegments] = useState<MentorSegmentRow[]>([]);
  const [pendingMentorApps, setPendingMentorApps] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>(
    initialTab && VALID_TABS.includes(initialTab as AdminTab) ? (initialTab as AdminTab) : "users"
  );
  const [answerDraft, setAnswerDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [notifying, setNotifying] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null);
  const [selectedMentor, setSelectedMentor] = useState<AdminMentorDetail | null>(null);
  // Q&A tab filters
  const [qaFilter, setQaFilter] = useState<"all" | "pending" | "answered">("all");
  // Progress tab filters
  const [progressTierFilter, setProgressTierFilter] = useState<string>("ALL");
  // Mentors tab filter
  const [mentorsSegFilter, setMentorsSegFilter] = useState<string>("all");

  async function loadAll() {
    setLoading(true);
    try {
      const [statsRes, usersRes, mentorRes, waitlistRes, progressRes, mentorSegRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/users"),
        fetch("/api/admin/mentor"),
        fetch("/api/admin/waitlist"),
        fetch("/api/admin/progress"),
        fetch("/api/admin/mentors"),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (mentorRes.ok) setMentorQs(await mentorRes.json());
      if (waitlistRes.ok) setWaitlist(await waitlistRes.json());
      if (progressRes.ok) setProgressData(await progressRes.json());
      if (mentorSegRes.ok) {
        const data = await mentorSegRes.json();
        setMentorSegments(data.segments ?? []);
        setPendingMentorApps(data.pendingCount ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadMentorSegments() {
    const res = await fetch("/api/admin/mentors");
    if (res.ok) {
      const data = await res.json();
      setMentorSegments(data.segments ?? []);
      setPendingMentorApps(data.pendingCount ?? 0);
    }
  }

  async function loadQAs(filter: "all" | "pending" | "answered") {
    const res = await fetch(`/api/admin/mentor?status=${filter}`);
    if (res.ok) setMentorQs(await res.json());
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function submitAnswer(id: string) {
    const answer = answerDraft[id];
    if (!answer || answer.length < 10) return;
    setSaving(id);
    setActionMsg(null);
    const res = await fetch(`/api/admin/mentor/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer, isPublic: false }),
    });
    const data = res.ok ? await res.json() : null;
    setAnswerDraft((d) => ({ ...d, [id]: "" }));
    await loadQAs(qaFilter);
    setSaving(null);
    if (data?.menteeEmail?.sent) {
      setActionMsg("Answer saved and member notified by email.");
    } else if (data?.menteeEmail?.skipped) {
      setActionMsg("Answer saved. Email skipped — configure RESEND_API_KEY on server.");
    } else if (!res.ok) {
      setActionMsg("Could not save answer.");
    }
  }

  async function notifyMentor(id: string) {
    setNotifying(id);
    setActionMsg(null);
    const res = await fetch(`/api/admin/mentor/${id}/notify`, { method: "POST" });
    const data = res.ok ? await res.json() : null;
    await loadQAs(qaFilter);
    setNotifying(null);
    if (data?.email?.sent) {
      setActionMsg("Reminder email sent to mentor inbox.");
    } else if (data?.email?.skipped) {
      setActionMsg("Reminder logged. Email skipped — configure RESEND_API_KEY on server.");
    } else if (!res.ok) {
      setActionMsg("Could not send mentor reminder.");
    }
  }

  const tierBadge = (tier: string) =>
    tier === "ELITE" ? "elite" : tier === "PRO" ? "pro" : "starter";

  const pendingCount = mentorQs.filter((q) => !q.isAnswered).length;

  // Filtered progress rows
  const filteredProgress = progressTierFilter === "ALL"
    ? progressData
    : progressData.filter((r) => r.tier === progressTierFilter);

  // Active billing summary
  const activeCount = users.filter((u) => u.stripeStatus === "active").length;
  const inactiveCount = users.filter((u) => u.stripeStatus && u.stripeStatus !== "active").length;

  const stripeStatusColor = (status: string | null | undefined) => {
    if (!status) return "text-muted-fg";
    if (status === "active") return "text-green-600";
    if (status === "past_due") return "text-red-500";
    return "text-gray-400";
  };

  // Mentors filtered by segment
  const filteredMentorSegs = mentorsSegFilter === "all"
    ? mentorSegments
    : mentorSegments.filter((s) => s.id === mentorsSegFilter);

  const totalMentorCount = mentorSegments.length > 0
    ? mentorSegments.reduce((n, s) => n + s.mentors.length, 0)
    : MENTOR_COUNT;

  // Segment choices for the "reassign segment" dropdown — real segments plus the
  // synthetic "Unassigned" bucket (only ever present once a new application exists).
  const mentorSegmentOptions: MentorSegmentOption[] = [
    ...MENTOR_SEGMENTS.map((s) => ({ id: s.id, label: `${s.num} ${s.title}` })),
    { id: UNASSIGNED_SEGMENT_ID, label: "Unassigned" },
  ];

  return (
    <div className="min-h-screen bg-secondary">
      <div className="bg-primary-800 text-white">
        <div className="page-container py-6 sm:py-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white mb-4 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Member Dashboard
              </Link>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-serif text-2xl font-bold">Admin Panel</h1>
                  <p className="text-white/70 text-sm">Signed in as {adminName}</p>
                </div>
              </div>
            </div>
            <Button variant="outline-dark" size="sm" onClick={loadAll} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="page-container py-6 sm:py-8">
        {stats && (
          <Reveal className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-4 mb-8">
            {[
              { label: "Total Users", value: stats.totalUsers, icon: Users, color: "#3280ff" },
              { label: "Starter", value: stats.tiers.starter, icon: TrendingUp, color: "#16a34a" },
              { label: "Pro", value: stats.tiers.pro, icon: Crown, color: "#3280ff" },
              { label: "Elite", value: stats.tiers.elite, icon: Crown, color: "#B45309" },
              { label: "Mentors", value: totalMentorCount, icon: UserCheck, color: "#0891b2" },
              { label: "Pending Applications", value: pendingMentorApps, icon: Clock, color: "#d97706" },
              { label: "Pending Q&A", value: stats.mentor.pending, icon: MessageSquare, color: "#ef4444" },
              { label: "Waitlist", value: stats.waitlistCount, icon: Mail, color: "#5B21B6" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-fg">{s.label}</p>
                  <s.icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
                <p className="font-serif text-2xl font-bold text-gray-900">{s.value}</p>
              </div>
            ))}
          </Reveal>
        )}

        <div className="flex gap-2 mb-6 flex-wrap">
          {([
            ["users", `Customers (${users.length})`, Users],
            ["progress", "Progress Activity", BarChart2],
            ["mentors", `Mentors (${totalMentorCount})`, UserCheck],
            ["mentor", `Q&A (${pendingCount} pending)`, MessageSquare],
            ["billing", "Billing & Invoice", CreditCard],
            ["waitlist", `Waitlist (${waitlist.length})`, Mail],
            ["content", "Content CMS", FileJson],
          ] as const).map(([tab, label, Icon]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                activeTab === tab
                  ? "bg-primary-400 text-white"
                  : "bg-white text-muted-fg border border-border hover:border-primary-line"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
          <Link href="/demo" className="ml-auto">
            <Button variant="outline" size="sm">Demo Accounts</Button>
          </Link>
        </div>

        {/* ── Customers tab ── */}
        {activeTab === "users" && (
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-secondary">
              <p className="text-sm text-muted-fg">Click a row to view and edit customer details, tier, role, and credits.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="border-b border-border bg-secondary text-left">
                    <th className="px-4 py-3 font-semibold text-muted-fg">Customer</th>
                    <th className="px-4 py-3 font-semibold text-muted-fg">Role</th>
                    <th className="px-4 py-3 font-semibold text-muted-fg">Tier</th>
                    <th className="px-4 py-3 font-semibold text-muted-fg">Persona</th>
                    <th className="px-4 py-3 font-semibold text-muted-fg">Track</th>
                    <th className="px-4 py-3 font-semibold text-muted-fg">Credits</th>
                    <th className="px-4 py-3 font-semibold text-muted-fg">Joined</th>
                    <th className="px-4 py-3 font-semibold text-muted-fg" />
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-border hover:bg-secondary/50 cursor-pointer"
                      onClick={() => setSelectedUser(u)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{u.name || "-"}</p>
                        <p className="text-xs text-muted-fg">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        {u.role === "ADMIN" ? (
                          <Badge variant="danger" size="sm">Admin</Badge>
                        ) : (
                          <Badge variant="secondary" size="sm">User</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={tierBadge(u.tier) as "starter" | "pro" | "elite"} size="sm">{u.tier}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {u.persona ? PERSONA_LABELS[u.persona]?.label : "-"}
                      </td>
                      <td className="px-4 py-3 text-xs">{u.track}</td>
                      <td className="px-4 py-3 text-xs text-muted-fg">
                        M:{u.mentorCredits} / R:{u.resumeCredits}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-fg">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Pencil className="w-4 h-4 text-muted-fg" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Content CMS tab ── */}
        {activeTab === "content" && (
          <AdminContentTab
            initialTrack={initialTrack === "sales" ? "sales" : initialTrack === "career" ? "career" : undefined}
          />
        )}

        {/* ── Progress Activity tab ── */}
        {activeTab === "progress" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-sm text-muted-fg font-medium">Filter by tier:</p>
              {["ALL", "STARTER", "PRO", "ELITE"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setProgressTierFilter(t)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                    progressTierFilter === t
                      ? "bg-primary-400 text-white"
                      : "bg-white text-muted-fg border border-border hover:border-primary-line"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border bg-secondary text-left">
                      <th className="px-4 py-3 font-semibold text-muted-fg">Customer</th>
                      <th className="px-4 py-3 font-semibold text-muted-fg">Tier</th>
                      <th className="px-4 py-3 font-semibold text-muted-fg">Track</th>
                      {CHAPTERS.map((ch) => (
                        <th key={ch} className="px-4 py-3 font-semibold text-muted-fg text-center uppercase">
                          Ch {ch.toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProgress.length === 0 ? (
                      <tr>
                        <td colSpan={3 + CHAPTERS.length} className="px-4 py-8 text-center text-muted-fg">
                          No progress data yet.
                        </td>
                      </tr>
                    ) : (
                      filteredProgress.map((row) => (
                        <tr key={row.userId} className="border-b border-border">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{row.userName || "-"}</p>
                            <p className="text-xs text-muted-fg">{row.userEmail}</p>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={tierBadge(row.tier) as "starter" | "pro" | "elite"} size="sm">{row.tier}</Badge>
                          </td>
                          <td className="px-4 py-3 text-xs">{row.track}</td>
                          {CHAPTERS.map((ch) => {
                            const cp = row.chapters[ch];
                            if (!cp) return (
                              <td key={ch} className="px-4 py-3 text-center text-muted-fg">–</td>
                            );
                            return (
                              <td key={ch} className="px-4 py-3">
                                <div className="flex flex-col items-center gap-1 min-w-[56px]">
                                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                                    <div
                                      className="bg-primary-400 h-1.5 rounded-full"
                                      style={{ width: `${cp.progress}%` }}
                                    />
                                  </div>
                                  <div className="flex items-center gap-1 text-xs">
                                    <span className="text-muted-fg">{cp.progress}%</span>
                                    {cp.completed && <CheckCircle className="w-3 h-3 text-green-500" />}
                                  </div>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Mentors tab ── */}
        {activeTab === "mentors" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-white px-4 py-3 text-sm text-muted-fg">
              Each mentor has an <strong className="text-gray-800">anonymous ID</strong> (e.g. PT-01) shown publicly on Mentor Connect.
              Name, email, and company are internal only. Edit headline, <strong className="text-gray-800">bio</strong>, years, and tags below, then{" "}
              <strong className="text-gray-800">Publish to Mentor Connect</strong> when ready.
              Invite-only applications arrive via the hidden <code className="text-xs bg-secondary px-1 rounded">/mentor-apply</code> form.
            </div>
            {pendingMentorApps > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center gap-2.5">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>
                  <strong>{pendingMentorApps}</strong> new mentor application{pendingMentorApps === 1 ? "" : "s"} awaiting review — sorted to the top of their segment below.
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setMentorsSegFilter("all")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  mentorsSegFilter === "all"
                    ? "bg-primary-400 text-white"
                    : "bg-white text-muted-fg border border-border hover:border-primary-line"
                )}
              >
                All Segments
              </button>
              {(mentorSegments.length > 0 ? mentorSegments : MENTOR_SEGMENTS).map((seg) => (
                <button
                  key={seg.id}
                  type="button"
                  onClick={() => setMentorsSegFilter(seg.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                    mentorsSegFilter === seg.id
                      ? "bg-primary-400 text-white"
                      : "bg-white text-muted-fg border border-border hover:border-primary-line"
                  )}
                >
                  {seg.num} {seg.title}
                </button>
              ))}
            </div>
            {filteredMentorSegs.map((seg) => (
              <div key={seg.id} className="bg-white rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-secondary flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-muted-fg uppercase tracking-wider mr-2">{seg.num}</span>
                    <span className="font-semibold text-gray-900">{seg.title}</span>
                  </div>
                  <Badge variant="secondary" size="sm">
                    <MessageSquare className="w-3 h-3" /> {seg.questionCount} Q&As
                  </Badge>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[1100px]">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="px-4 py-2 font-semibold text-muted-fg">Mentor ID</th>
                      <th className="px-4 py-2 font-semibold text-muted-fg">Status</th>
                      <th className="px-4 py-2 font-semibold text-muted-fg">Name</th>
                      <th className="px-4 py-2 font-semibold text-muted-fg">Email</th>
                      <th className="px-4 py-2 font-semibold text-muted-fg">Company</th>
                      <th className="px-4 py-2 font-semibold text-muted-fg">Headline</th>
                      <th className="px-4 py-2 font-semibold text-muted-fg">Years</th>
                      <th className="px-4 py-2 font-semibold text-muted-fg">Tags</th>
                      <th className="px-4 py-2 font-semibold text-muted-fg">Track</th>
                      <th className="px-4 py-2 font-semibold text-muted-fg" />
                    </tr>
                  </thead>
                  <tbody>
                    {seg.mentors.map((m) => (
                      <tr
                        key={m.id}
                        className={cn(
                          "border-b border-border last:border-0",
                          m.status === "pending" && "bg-amber-50/60"
                        )}
                      >
                        <td className="px-4 py-2.5 font-mono text-xs text-muted-fg">{m.id}</td>
                        <td className="px-4 py-2.5">
                          {m.status === "pending" ? (
                            <Badge variant="warning" size="sm"><Clock className="w-3 h-3" /> Pending</Badge>
                          ) : (
                            <Badge variant="success" size="sm">Published</Badge>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-xs">
                          {m.name ? (
                            <span className="text-gray-800 font-medium">{m.name}</span>
                          ) : (
                            <span className="text-muted-fg">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-fg">{m.email || "—"}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-fg">{m.company || "—"}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-800">{m.headline}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-fg">{m.years}y</td>
                        <td className="px-4 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {m.tags.map((tag) => (
                              <span key={tag} className="px-1.5 py-0.5 bg-secondary rounded text-xs text-muted-fg border border-border">{tag}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge
                            size="sm"
                            variant={m.track === "career" ? "starter" : m.track === "sales" ? "pro" : "secondary"}
                          >
                            {m.track === "career" ? "Career" : m.track === "sales" ? "Sales" : "Both"}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedMentor({
                                id: m.id,
                                headline: m.headline,
                                bio: m.bio,
                                years: m.years,
                                tags: m.tags,
                                name: m.name,
                                email: m.email,
                                company: m.company,
                                track: m.track,
                                segmentTitle: seg.title,
                                status: m.status,
                                segmentId: m.segmentId,
                                isNew: m.isNew,
                              })
                            }
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary-800 hover:text-primary-400"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Q&A tab ── */}
        {activeTab === "mentor" && (
          <div className="space-y-4">
            {/* Status filter */}
            <div className="flex items-center gap-2">
              {(["all", "pending", "answered"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={async () => {
                    setQaFilter(f);
                    await loadQAs(f);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all",
                    qaFilter === f
                      ? "bg-primary-400 text-white"
                      : "bg-white text-muted-fg border border-border hover:border-primary-line"
                  )}
                >
                  {f === "all" ? `All (${mentorQs.length})` : f === "pending" ? `Pending (${mentorQs.filter(q => !q.isAnswered).length})` : `Answered (${mentorQs.filter(q => q.isAnswered).length})`}
                </button>
              ))}
            </div>
            {actionMsg && (
              <div className="rounded-lg border border-primary-line bg-primary-soft px-4 py-3 text-sm text-primary-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span>{actionMsg}</span>
                <Link href="/demo/emails" className="text-primary-400 hover:underline text-xs font-semibold whitespace-nowrap">
                  View demo email inbox →
                </Link>
              </div>
            )}
            {mentorQs.length === 0 ? (
              <div className="bg-white rounded-xl border border-border p-8 text-center text-muted-fg">
                No mentor questions yet.
              </div>
            ) : (
              mentorQs.map((q) => (
                <div key={q.id} className="bg-white rounded-xl border border-border p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {q.isAnswered ? (
                          <Badge variant="success" size="sm"><CheckCircle className="w-3 h-3" /> Answered</Badge>
                        ) : (
                          <Badge variant="warning" size="sm"><Clock className="w-3 h-3" /> Pending</Badge>
                        )}
                        <span className="text-xs text-muted-fg capitalize">{q.segment.replace("-", " ")}</span>
                      </div>
                      <p className="text-sm text-gray-800">{q.question}</p>
                      <p className="text-xs text-muted-fg mt-1">
                        From {q.user.name || q.user.email} | {q.user.tier} | {formatDate(q.createdAt)}
                      </p>
                      {q.isAnswered && (
                        <p className="text-xs text-muted-fg mt-1">
                          Answered {q.answeredAt ? formatDate(q.answeredAt) : ""}
                          {q.answeredByEmail ? ` · by ${q.answeredByEmail}` : ""}
                          {q.menteeNotifiedAt ? " · member emailed" : " · member email pending"}
                        </p>
                      )}
                      {!q.isAnswered && q.mentorReminderSentAt && (
                        <p className="text-xs text-amber-700 mt-1">
                          Mentor reminded {formatDate(q.mentorReminderSentAt)}
                        </p>
                      )}
                    </div>
                  </div>
                  {q.isAnswered && q.answer ? (
                    <div className="bg-primary-soft border border-primary-line rounded-lg p-3 text-sm text-primary-800">
                      {q.answer}
                    </div>
                  ) : (
                    <div className="space-y-2 mt-2">
                      <div className="flex gap-2 flex-col sm:flex-row">
                        <textarea
                          className="flex-1 text-sm border border-border rounded-lg p-2.5 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary-400"
                          placeholder="Write mentor answer..."
                          value={answerDraft[q.id] || ""}
                          onChange={(e) => setAnswerDraft((d) => ({ ...d, [q.id]: e.target.value }))}
                        />
                        <Button
                          size="sm"
                          className="sm:self-end"
                          onClick={() => submitAnswer(q.id)}
                          loading={saving === q.id}
                          disabled={!answerDraft[q.id] || answerDraft[q.id].length < 10}
                        >
                          Send
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => notifyMentor(q.id)}
                        loading={notifying === q.id}
                      >
                        <Mail className="w-3.5 h-3.5" /> Notify mentor (email)
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Billing & Invoice tab ── */}
        {activeTab === "billing" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-border p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-fg mb-1">Active Subscriptions</p>
                <p className="font-serif text-2xl font-bold text-green-600">{activeCount}</p>
              </div>
              <div className="bg-white rounded-xl border border-border p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-fg mb-1">Inactive / Canceled</p>
                <p className="font-serif text-2xl font-bold text-gray-400">{inactiveCount}</p>
              </div>
              <div className="bg-white rounded-xl border border-border p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-fg mb-1">No Billing Data</p>
                <p className="font-serif text-2xl font-bold text-muted-fg">{users.filter((u) => !u.stripeCustomerId).length}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[900px]">
                  <thead>
                    <tr className="border-b border-border bg-secondary text-left">
                      <th className="px-4 py-3 font-semibold text-muted-fg">Customer</th>
                      <th className="px-4 py-3 font-semibold text-muted-fg">Tier</th>
                      <th className="px-4 py-3 font-semibold text-muted-fg">Stripe Status</th>
                      <th className="px-4 py-3 font-semibold text-muted-fg">Subscription ID</th>
                      <th className="px-4 py-3 font-semibold text-muted-fg">Period End</th>
                      <th className="px-4 py-3 font-semibold text-muted-fg">Customer ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-border">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{u.name || "-"}</p>
                          <p className="text-xs text-muted-fg">{u.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={tierBadge(u.tier) as "starter" | "pro" | "elite"} size="sm">{u.tier}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          {u.stripeCustomerId ? (
                            <span className={cn("text-xs font-semibold capitalize", stripeStatusColor(u.stripeStatus))}>
                              {u.stripeStatus || "—"}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-fg">No billing data</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-fg">
                          {u.stripeSubscriptionId
                            ? `${u.stripeSubscriptionId.slice(0, 14)}…`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-fg">
                          {u.stripeCurrentPeriodEnd ? formatDate(u.stripeCurrentPeriodEnd) : "—"}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-fg">
                          {u.stripeCustomerId
                            ? `${u.stripeCustomerId.slice(0, 14)}…`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Waitlist tab ── */}
        {activeTab === "waitlist" && (
          <div className="bg-white rounded-xl border border-border overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b border-border bg-secondary text-left">
                  <th className="px-4 py-3 font-semibold text-muted-fg">Email</th>
                  <th className="px-4 py-3 font-semibold text-muted-fg">Name</th>
                  <th className="px-4 py-3 font-semibold text-muted-fg">Track</th>
                  <th className="px-4 py-3 font-semibold text-muted-fg">Joined</th>
                </tr>
              </thead>
              <tbody>
                {waitlist.map((w) => (
                  <tr key={w.id} className="border-b border-border">
                    <td className="px-4 py-3">{w.email}</td>
                    <td className="px-4 py-3">{w.name || "-"}</td>
                    <td className="px-4 py-3">{w.track}</td>
                    <td className="px-4 py-3 text-muted-fg">{formatDate(w.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedUser && (
        <AdminUserDetailPanel
          user={selectedUser}
          isSelf={selectedUser.id === adminId}
          onClose={() => setSelectedUser(null)}
          onSaved={loadAll}
        />
      )}

      {selectedMentor && (
        <AdminMentorDetailPanel
          mentor={selectedMentor}
          segmentOptions={mentorSegmentOptions}
          onClose={() => setSelectedMentor(null)}
          onSaved={loadMentorSegments}
        />
      )}
    </div>
  );
}
