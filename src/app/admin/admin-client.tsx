"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, Shield, MessageSquare, Mail, Crown, TrendingUp,
  CheckCircle, Clock, ArrowLeft, RefreshCw, FileJson, Pencil, Trash2,
  ChevronUp, ChevronDown, RotateCcw,
  BarChart2, UserCheck, CreditCard, Copy, ExternalLink, Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/animations";
import { PERSONA_LABELS, formatDate, cn } from "@/lib/utils";
import { AdminContentTab } from "./admin-content-tab";
import { AdminUserDetailPanel, type AdminUserDetail } from "./admin-user-detail";
import { AdminMentorDetailPanel, type AdminMentorDetail, type MentorSegmentOption } from "./admin-mentor-detail";
import { MENTOR_COUNT, MENTOR_SEGMENTS, UNASSIGNED_SEGMENT_ID, type MentorStatus } from "@/data/mentors";
import { formatMentorCreditsUsedLabel, getMentorCreditUsage } from "@/lib/mentor-credits";
import {
  isDeskChannelQueueItem,
  MENTOR_SEGMENT_TO_DESK_CATEGORY,
} from "@/lib/mentor-share-consent";
import {
  AdminTableFilters,
  matchesAdminSearch,
  normalizeAdminSearch,
} from "./admin-table-filters";
import { MentorRewardProgressDisplay } from "@/components/mentor-connect/mentor-reward-progress";
import type { MentorRewardProgress } from "@/lib/mentor-reward-ladder";
import type { MentorAccessState } from "@/lib/mentor-profile-sync";

function formatAdminMentorCreditsCell(user: AdminUserDetail): string {
  if (user.tier !== "ELITE") return "M: —";
  const usage = getMentorCreditUsage(user.mentorCreditsUsedThisMonth ?? 0);
  return `M: ${formatMentorCreditsUsedLabel(usage)}`;
}

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
  memberShareOptIn: boolean;
  mentorShareOptIn: boolean;
  deskChannelStatus?: string | null;
  deskChannelQaId?: string | null;
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
  user?: { name: string | null; tier: string } | null;
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
    linkedIn: string | null;
    location: string | null;
    role: string | null;
    commodityDesk: string | null;
    track: "career" | "sales" | "both";
    status: "pending" | "active";
    isNew: boolean;
    segmentId: string;
    mentorAccess: MentorAccessState;
    answeredCount: number;
    rewardProgress: MentorRewardProgress;
  }[];
}

interface DemoEmail {
  id: string;
  kind: string;
  kindLabel: string;
  to: string;
  subject: string;
  bodyText: string;
  delivered: boolean;
  createdAt: string;
  hirerReplyUrl?: string | null;
}

/** A soft-deleted ("hidden") mentor profile — tombstoned, dropped from `segments`,
 * surfaced separately by the admin GET so the operator can restore it. */
interface HiddenMentorRow {
  id: string;
  name: string | null;
  email: string | null;
  status: MentorStatus;
  isNew: boolean;
  wasSeeded: boolean;
  deletedAt: string | null;
  segmentTitle: string | null;
  mentorAccess: MentorAccessState;
}

const CHAPTERS = ["a", "b", "c", "d", "e"];

type AdminTab = "users" | "content" | "mentor" | "waitlist" | "progress" | "mentors" | "billing" | "emails";

const VALID_TABS: AdminTab[] = ["users", "content", "mentor", "waitlist", "progress", "mentors", "billing", "emails"];

export function AdminClient({
  adminName,
  adminId,
  initialTab,
  initialTrack,
  initialSlug,
}: {
  adminName: string;
  adminId: string;
  initialTab?: string;
  initialTrack?: string;
  initialSlug?: string;
}) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUserDetail[]>([]);
  const [mentorQs, setMentorQs] = useState<MentorQ[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [progressData, setProgressData] = useState<ChapterProgressRow[]>([]);
  const [mentorSegments, setMentorSegments] = useState<MentorSegmentRow[]>([]);
  const [pendingMentorApps, setPendingMentorApps] = useState(0);
  const [demoEmails, setDemoEmails] = useState<DemoEmail[]>([]);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
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
  const [qaFilter, setQaFilter] = useState<"all" | "pending" | "answered" | "queue">("all");
  const [deskCategoryDraft, setDeskCategoryDraft] = useState<Record<string, string>>({});
  const [deskPublishDraft, setDeskPublishDraft] = useState<
    Record<string, { question: string; answer: string }>
  >({});
  const [deskChannelBusy, setDeskChannelBusy] = useState<string | null>(null);
  // Progress tab filters
  const [progressSearch, setProgressSearch] = useState("");
  const [progressTierFilter, setProgressTierFilter] = useState<string>("ALL");
  const [progressTrackFilter, setProgressTrackFilter] = useState<string>("ALL");
  // Customers tab filters
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerTierFilter, setCustomerTierFilter] = useState("ALL");
  const [customerRoleFilter, setCustomerRoleFilter] = useState("ALL");
  const [customerPersonaFilter, setCustomerPersonaFilter] = useState("ALL");
  const [customerTrackFilter, setCustomerTrackFilter] = useState("ALL");
  // Billing tab filters
  const [billingSearch, setBillingSearch] = useState("");
  const [billingTierFilter, setBillingTierFilter] = useState("ALL");
  const [billingStatusFilter, setBillingStatusFilter] = useState("ALL");
  // Waitlist tab filters
  const [waitlistSearch, setWaitlistSearch] = useState("");
  const [waitlistTrackFilter, setWaitlistTrackFilter] = useState("ALL");
  const [waitlistMemberFilter, setWaitlistMemberFilter] = useState("ALL");
  // Mentors tab filter
  const [mentorsSegFilter, setMentorsSegFilter] = useState<string>("all");
  const [mentorSaveNotice, setMentorSaveNotice] = useState<string | null>(null);
  const [deletingMentorId, setDeletingMentorId] = useState<string | null>(null);
  const [reorderingMentorId, setReorderingMentorId] = useState<string | null>(null);
  const [restoringMentorId, setRestoringMentorId] = useState<string | null>(null);
  const [hiddenMentors, setHiddenMentors] = useState<HiddenMentorRow[]>([]);
  const [showHiddenMentors, setShowHiddenMentors] = useState(false);

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
        setHiddenMentors(data.hidden ?? []);
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
      setHiddenMentors(data.hidden ?? []);
    }
  }

  async function handleMentorSaved(notice: string) {
    setMentorSaveNotice(notice);
    await loadMentorSegments();
    window.setTimeout(() => setMentorSaveNotice(null), 12000);
  }

  async function handleMentorMove(id: string, segmentId: string, direction: "up" | "down") {
    setReorderingMentorId(id);
    try {
      const res = await fetch("/api/admin/mentors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, segmentId, direction }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMentorSaveNotice(data.error || `Could not move ${id}.`);
        window.setTimeout(() => setMentorSaveNotice(null), 12000);
        return;
      }
      await loadMentorSegments();
    } finally {
      setReorderingMentorId(null);
    }
  }

  async function handleMentorDeleted(id: string, wasSeeded: boolean) {
    setDeletingMentorId(id);
    try {
      const res = await fetch("/api/admin/mentors", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMentorSaveNotice(data.error || `Could not delete ${id}.`);
        window.setTimeout(() => setMentorSaveNotice(null), 12000);
        return;
      }
      setMentorSaveNotice(
        wasSeeded
          ? `${id} hidden from Mentor Connect and the admin list. Re-adding the profile restores it.`
          : `${id} deleted — removed from Mentor Connect and the admin list.`
      );
      await loadMentorSegments();
      window.setTimeout(() => setMentorSaveNotice(null), 12000);
    } finally {
      setDeletingMentorId(null);
    }
  }

  async function handleMentorRestored(id: string, status: MentorStatus) {
    setRestoringMentorId(id);
    try {
      const res = await fetch("/api/admin/mentors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMentorSaveNotice(data.error || `Could not restore ${id}.`);
        window.setTimeout(() => setMentorSaveNotice(null), 12000);
        return;
      }
      // A restored profile only reaches Mentor Connect once it is published — a
      // still-pending application returns to the admin list but stays hidden publicly.
      setMentorSaveNotice(
        status === "active"
          ? `${id} restored — back on Mentor Connect and the admin list.`
          : `${id} restored to the admin list — still pending, so it will not appear on Mentor Connect until it is published.`
      );
      await loadMentorSegments();
      window.setTimeout(() => setMentorSaveNotice(null), 12000);
    } finally {
      setRestoringMentorId(null);
    }
  }

  async function loadQAs() {
    const res = await fetch("/api/admin/mentor?status=all");
    if (res.ok) setMentorQs(await res.json());
  }

  async function loadDemoEmails() {
    setEmailsLoading(true);
    try {
      const res = await fetch("/api/admin/emails");
      if (res.ok) {
        const data = await res.json();
        setDemoEmails(data);
        if (!selectedEmailId && data.length > 0) setSelectedEmailId(data[0].id);
      }
    } finally {
      setEmailsLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (activeTab === "emails") loadDemoEmails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  async function submitAnswer(id: string) {
    const answer = answerDraft[id];
    if (!answer || answer.length < 10) return;
    setSaving(id);
    setActionMsg(null);
    const res = await fetch(`/api/admin/mentor/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer, mentorShareOptIn: false }),
    });
    const data = res.ok ? await res.json() : null;
    setAnswerDraft((d) => ({ ...d, [id]: "" }));
    await loadQAs();
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
    await loadQAs();
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

  async function deskChannelReview(
    id: string,
    action: "publish" | "reject",
    segment: string,
    copy?: { question: string; answer: string }
  ) {
    setDeskChannelBusy(`${id}:${action}`);
    setActionMsg(null);
    const category =
      deskCategoryDraft[id] || MENTOR_SEGMENT_TO_DESK_CATEGORY[segment] || "career";
    const res = await fetch(`/api/admin/mentor/${id}/desk-channel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        category,
        ...(action === "publish" && copy
          ? { question: copy.question.trim(), answer: copy.answer.trim() }
          : {}),
      }),
    });
    const data = await res.json().catch(() => null);
    await loadQAs();
    setDeskChannelBusy(null);
    if (!res.ok) {
      setActionMsg((data && data.error) || "Could not update Desk Channel review.");
      return;
    }
    setActionMsg(
      action === "publish"
        ? "Published to Desk Channel. It now appears on /desk-channel."
        : "Removed from the Desk Channel queue. Q&A stays private."
    );
  }

  const pendingCount = mentorQs.filter((q) => !q.isAnswered).length;
  const queueCount = mentorQs.filter((q) => isDeskChannelQueueItem(q)).length;
  const visibleMentorQs = mentorQs.filter((q) => {
    if (qaFilter === "pending") return !q.isAnswered;
    if (qaFilter === "answered") return q.isAnswered;
    if (qaFilter === "queue") return isDeskChannelQueueItem(q);
    return true;
  });

  const TIER_FILTER_OPTIONS = [
    { value: "ALL", label: "All" },
    { value: "STARTER", label: "Starter" },
    { value: "PRO", label: "Pro" },
    { value: "ELITE", label: "Elite" },
  ];

  const TRACK_FILTER_OPTIONS = [
    { value: "ALL", label: "All" },
    { value: "CAREER", label: "Career" },
    { value: "SALES", label: "Sales" },
  ];

  const PERSONA_FILTER_OPTIONS = [
    { value: "ALL", label: "All" },
    ...Object.entries(PERSONA_LABELS).map(([value, { label }]) => ({ value, label })),
  ];

  // Filtered customers
  const filteredUsers = users.filter((u) => {
    const q = normalizeAdminSearch(customerSearch);
    if (!matchesAdminSearch(q, u.name, u.email, u.company, u.profession)) return false;
    if (customerTierFilter !== "ALL" && u.tier !== customerTierFilter) return false;
    if (customerRoleFilter === "ADMIN" && u.role !== "ADMIN") return false;
    if (customerRoleFilter === "USER" && u.role === "ADMIN") return false;
    if (customerPersonaFilter !== "ALL" && u.persona !== customerPersonaFilter) return false;
    if (customerTrackFilter !== "ALL" && u.track !== customerTrackFilter) return false;
    return true;
  });

  // Filtered progress rows
  const filteredProgress = progressData.filter((r) => {
    const q = normalizeAdminSearch(progressSearch);
    if (!matchesAdminSearch(q, r.userName, r.userEmail)) return false;
    if (progressTierFilter !== "ALL" && r.tier !== progressTierFilter) return false;
    if (progressTrackFilter !== "ALL" && r.track !== progressTrackFilter) return false;
    return true;
  });

  // Filtered billing rows
  const filteredBillingUsers = users.filter((u) => {
    const q = normalizeAdminSearch(billingSearch);
    if (
      !matchesAdminSearch(
        q,
        u.name,
        u.email,
        u.stripeCustomerId,
        u.stripeSubscriptionId,
        u.stripeStatus
      )
    ) {
      return false;
    }
    if (billingTierFilter !== "ALL" && u.tier !== billingTierFilter) return false;
    if (billingStatusFilter === "active" && u.stripeStatus !== "active") return false;
    if (billingStatusFilter === "inactive" && (!u.stripeStatus || u.stripeStatus === "active")) {
      return false;
    }
    if (billingStatusFilter === "none" && u.stripeCustomerId) return false;
    return true;
  });

  // Filtered waitlist rows
  const filteredWaitlist = waitlist.filter((w) => {
    const q = normalizeAdminSearch(waitlistSearch);
    if (!matchesAdminSearch(q, w.email, w.name, w.track, w.user?.name, w.user?.tier)) return false;
    if (waitlistTrackFilter !== "ALL" && w.track !== waitlistTrackFilter) return false;
    if (waitlistMemberFilter === "member" && !w.user) return false;
    if (waitlistMemberFilter === "alerts" && w.user) return false;
    return true;
  });

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

  const selectedDemoEmail = demoEmails.find((e) => e.id === selectedEmailId);

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
            <div className="flex items-center gap-2">
              <Link href="/admin/database">
                <Button variant="outline-dark" size="sm">
                  <Database className="w-4 h-4" />
                  Database
                </Button>
              </Link>
              <Button variant="outline-dark" size="sm" onClick={loadAll} disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="page-container py-6 sm:py-8">
        {stats && (
          <Reveal className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-4 mb-8">
            {[
              { label: "Total Users", value: stats.totalUsers, icon: Users, color: "#3280ff", tab: "users" as const },
              { label: "Starter", value: stats.tiers.starter, icon: TrendingUp, color: "#16a34a", tab: "users" as const },
              { label: "Pro", value: stats.tiers.pro, icon: Crown, color: "#3280ff", tab: "users" as const },
              { label: "Elite", value: stats.tiers.elite, icon: Crown, color: "#B45309", tab: "users" as const },
              { label: "Mentors", value: totalMentorCount, icon: UserCheck, color: "#0891b2", tab: "mentors" as const },
              {
                label: "Pending Mentor Applications",
                value: pendingMentorApps,
                icon: Clock,
                color: "#d97706",
                tab: "mentors" as const,
              },
              { label: "Pending Q&A", value: stats.mentor.pending, icon: MessageSquare, color: "#ef4444", tab: "mentor" as const },
              { label: "Job Board Waitlist", value: stats.waitlistCount, icon: Mail, color: "#5B21B6", tab: "waitlist" as const },
            ].map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => setActiveTab(s.tab)}
                className="bg-white rounded-xl border border-border p-4 text-left hover:border-primary-line transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-fg">{s.label}</p>
                  <s.icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
                <p className="font-serif text-2xl font-bold text-gray-900">{s.value}</p>
              </button>
            ))}
          </Reveal>
        )}

        <div className="flex gap-2 mb-6 flex-wrap">
          {([
            ["users", `Customers (${users.length})`, Users],
            ["progress", "Progress Activity", BarChart2],
            ["mentors", `Mentors (${totalMentorCount})`, UserCheck],
            ["mentor", `Q&A (${pendingCount} pending${queueCount ? ` · ${queueCount} queue` : ""})`, MessageSquare],
            ["billing", "Billing & Invoice", CreditCard],
            ["waitlist", `Job Board Waitlist (${waitlist.length})`, Mail],
            ["emails", "Email Log", Mail],
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
          <div className="space-y-4">
            <AdminTableFilters
              search={customerSearch}
              onSearchChange={setCustomerSearch}
              searchPlaceholder="Search name, email, company…"
              filteredCount={filteredUsers.length}
              totalCount={users.length}
              chips={[
                {
                  id: "tier",
                  label: "Tier",
                  value: customerTierFilter,
                  onChange: setCustomerTierFilter,
                  options: TIER_FILTER_OPTIONS,
                },
                {
                  id: "role",
                  label: "Role",
                  value: customerRoleFilter,
                  onChange: setCustomerRoleFilter,
                  options: [
                    { value: "ALL", label: "All" },
                    { value: "ADMIN", label: "Admin" },
                    { value: "USER", label: "User" },
                  ],
                },
                {
                  id: "persona",
                  label: "Persona",
                  value: customerPersonaFilter,
                  onChange: setCustomerPersonaFilter,
                  options: PERSONA_FILTER_OPTIONS,
                },
                {
                  id: "track",
                  label: "Track",
                  value: customerTrackFilter,
                  onChange: setCustomerTrackFilter,
                  options: TRACK_FILTER_OPTIONS,
                },
              ]}
            />
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
                    <th className="px-4 py-3 font-semibold text-muted-fg">Mentor / Resume</th>
                    <th className="px-4 py-3 font-semibold text-muted-fg">Joined</th>
                    <th className="px-4 py-3 font-semibold text-muted-fg" />
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-muted-fg">
                        No customers match your filters.
                      </td>
                    </tr>
                  ) : filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-border hover:bg-secondary/50 cursor-pointer"
                      onClick={() => setSelectedUser(u)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{u.name || "-"}</p>
                        <p className="text-xs text-muted-fg">{u.email}</p>
                        {(u.company || u.profession) && (
                          <p className="text-[11px] text-muted-fg mt-0.5">
                            {[u.company, u.profession].filter(Boolean).join(" · ")}
                          </p>
                        )}
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
                        {formatAdminMentorCreditsCell(u)} / R:{u.resumeCredits}
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
          </div>
        )}

        {/* ── Content CMS tab ── */}
        {activeTab === "content" && (
          <AdminContentTab
            initialTrack={initialTrack === "sales" ? "sales" : initialTrack === "career" ? "career" : undefined}
            initialSlug={initialSlug}
          />
        )}

        {/* ── Progress Activity tab ── */}
        {activeTab === "progress" && (
          <div className="space-y-4">
            <AdminTableFilters
              search={progressSearch}
              onSearchChange={setProgressSearch}
              searchPlaceholder="Search customer name or email…"
              filteredCount={filteredProgress.length}
              totalCount={progressData.length}
              chips={[
                {
                  id: "tier",
                  label: "Tier",
                  value: progressTierFilter,
                  onChange: setProgressTierFilter,
                  options: TIER_FILTER_OPTIONS,
                },
                {
                  id: "track",
                  label: "Track",
                  value: progressTrackFilter,
                  onChange: setProgressTrackFilter,
                  options: TRACK_FILTER_OPTIONS,
                },
              ]}
            />
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
                          {progressData.length === 0
                            ? "No progress data yet."
                            : "No progress rows match your filters."}
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
              After you click <strong className="text-gray-800">Save &amp; update live profile</strong>, headline, bio, years, and tags go live on Mentor Connect right away.
              Name, email, and company stay admin-only (never shown publicly). New applications stay hidden until you click{" "}
              <strong className="text-gray-800">Publish to Mentor Connect</strong>.
            </div>
            {mentorSaveNotice && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900 flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{mentorSaveNotice}</span>
              </div>
            )}
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
              {hiddenMentors.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowHiddenMentors((v) => !v)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5",
                    showHiddenMentors
                      ? "bg-primary-400 text-white"
                      : "bg-white text-muted-fg border border-border hover:border-primary-line"
                  )}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {showHiddenMentors ? "Hide hidden" : `Show hidden (${hiddenMentors.length})`}
                </button>
              )}
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
                  <table className="w-full text-sm min-w-[1400px]">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="px-4 py-2 font-semibold text-muted-fg">Mentor ID</th>
                      <th className="px-4 py-2 font-semibold text-muted-fg">Order</th>
                      <th className="px-4 py-2 font-semibold text-muted-fg">Status</th>
                      <th className="px-4 py-2 font-semibold text-muted-fg">Name</th>
                      <th className="px-4 py-2 font-semibold text-muted-fg">Email</th>
                      <th className="px-4 py-2 font-semibold text-muted-fg">LinkedIn</th>
                      <th className="px-4 py-2 font-semibold text-muted-fg">Company</th>
                      <th className="px-4 py-2 font-semibold text-muted-fg">Role</th>
                      <th className="px-4 py-2 font-semibold text-muted-fg">Headline</th>
                      <th className="px-4 py-2 font-semibold text-muted-fg">Years</th>
                      <th className="px-4 py-2 font-semibold text-muted-fg">Tags</th>
                        <th className="px-4 py-2 font-semibold text-muted-fg">Track</th>
                        <th className="px-4 py-2 font-semibold text-muted-fg">Reward ladder</th>
                        <th className="px-4 py-2 font-semibold text-muted-fg" />
                    </tr>
                  </thead>
                  <tbody>
                    {seg.mentors.map((m, mentorIndex) => (
                      <tr
                        key={m.id}
                        className={cn(
                          "border-b border-border last:border-0",
                          m.status === "pending" && "bg-amber-50/60"
                        )}
                      >
                        <td className="px-4 py-2.5 font-mono text-xs text-muted-fg">{m.id}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              aria-label={`Move ${m.id} up`}
                              disabled={mentorIndex === 0 || reorderingMentorId === m.id}
                              onClick={() => void handleMentorMove(m.id, seg.id, "up")}
                              className="inline-flex items-center rounded border border-border p-1 text-muted-fg hover:text-primary-800 disabled:opacity-40"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label={`Move ${m.id} down`}
                              disabled={
                                mentorIndex === seg.mentors.length - 1 || reorderingMentorId === m.id
                              }
                              onClick={() => void handleMentorMove(m.id, seg.id, "down")}
                              className="inline-flex items-center rounded border border-border p-1 text-muted-fg hover:text-primary-800 disabled:opacity-40"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
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
                        <td className="px-4 py-2.5 text-xs text-muted-fg max-w-[120px] truncate">
                          {m.linkedIn ? (
                            <a href={m.linkedIn} target="_blank" rel="noopener noreferrer" className="text-primary-800 hover:underline">
                              Profile
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-fg">{m.company || "—"}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-fg">{m.role || "—"}</td>
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
                          <MentorRewardProgressDisplay
                            progress={m.rewardProgress ?? {
                              answeredCount: m.answeredCount ?? 0,
                              unlockedRung: null,
                              nextRung: null,
                              progressPercent: 0,
                            }}
                            variant="compact"
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-3">
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
                                  linkedIn: m.linkedIn,
                                  location: m.location,
                                  role: m.role,
                                  commodityDesk: m.commodityDesk,
                                  track: m.track,
                                  segmentTitle: seg.title,
                                  status: m.status,
                                  segmentId: m.segmentId,
                                  isNew: m.isNew,
                                  mentorAccess: m.mentorAccess,
                                })
                              }
                              className="inline-flex items-center gap-1 text-xs font-semibold text-primary-800 hover:text-primary-400"
                            >
                              <Pencil className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                              type="button"
                              disabled={deletingMentorId === m.id}
                              onClick={() => {
                                const ok = window.confirm(
                                  `Delete mentor "${m.id}"? They will be removed from Mentor Connect and the admin list. This can be undone only by re-adding them.`
                                );
                                if (ok) void handleMentorDeleted(m.id, !m.isNew);
                              }}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </div>
            ))}
            {showHiddenMentors && hiddenMentors.length > 0 && (
              <div className="bg-white rounded-xl border border-border overflow-hidden opacity-70">
                <div className="px-4 py-3 border-b border-border bg-secondary flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-gray-900">Hidden profiles</span>
                    <span className="text-xs text-muted-fg ml-2">
                      Soft-deleted — restore to bring them back to Mentor Connect and the admin list.
                    </span>
                  </div>
                  <Badge variant="secondary" size="sm">
                    {hiddenMentors.length} hidden
                  </Badge>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[900px]">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="px-4 py-2 font-semibold text-muted-fg">Mentor ID</th>
                        <th className="px-4 py-2 font-semibold text-muted-fg">Status</th>
                        <th className="px-4 py-2 font-semibold text-muted-fg">Name</th>
                        <th className="px-4 py-2 font-semibold text-muted-fg">Email</th>
                        <th className="px-4 py-2 font-semibold text-muted-fg">Segment</th>
                        <th className="px-4 py-2 font-semibold text-muted-fg">Deleted</th>
                        <th className="px-4 py-2 font-semibold text-muted-fg" />
                      </tr>
                    </thead>
                    <tbody>
                      {hiddenMentors.map((m) => (
                        <tr key={m.id} className="border-b border-border last:border-0 text-muted-fg">
                          <td className="px-4 py-2.5 font-mono text-xs">{m.id}</td>
                          <td className="px-4 py-2.5">
                            <Badge variant="secondary" size="sm">Hidden</Badge>
                            {m.mentorAccess !== "none" && (
                              <span className="block text-[10px] text-muted-fg mt-1">
                                {m.mentorAccess === "revoked" ? "access revoked" : "access active"}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-xs">{m.name || "—"}</td>
                          <td className="px-4 py-2.5 text-xs">{m.email || "—"}</td>
                          <td className="px-4 py-2.5 text-xs">{m.segmentTitle || "—"}</td>
                          <td className="px-4 py-2.5 text-xs">
                            {m.deletedAt ? formatDate(m.deletedAt) : "—"}
                          </td>
                          <td className="px-4 py-2.5">
                            <button
                              type="button"
                              disabled={restoringMentorId === m.id}
                              onClick={() => {
                                const ok = window.confirm(
                                  `Restore mentor "${m.id}"? They will reappear on Mentor Connect and in the admin list.`
                                );
                                if (ok) void handleMentorRestored(m.id, m.status);
                              }}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-primary-800 hover:text-primary-400 disabled:opacity-50"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Restore
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Q&A tab ── */}
        {activeTab === "mentor" && (
          <div className="space-y-4">
            {/* Status filter */}
            <div className="flex items-center gap-2 flex-wrap">
              {(["all", "pending", "answered", "queue"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setQaFilter(f)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all",
                    qaFilter === f
                      ? "bg-primary-400 text-white"
                      : "bg-white text-muted-fg border border-border hover:border-primary-line"
                  )}
                >
                  {f === "all"
                    ? `All (${mentorQs.length})`
                    : f === "pending"
                      ? `Pending (${mentorQs.filter((q) => !q.isAnswered).length})`
                      : f === "answered"
                        ? `Answered (${mentorQs.filter((q) => q.isAnswered).length})`
                        : `Desk Channel queue (${queueCount})`}
                </button>
              ))}
            </div>
            {qaFilter === "queue" && (
              <p className="text-xs text-muted-fg">
                Dual consent only — both member and mentor opted in. Publish adds an anonymous Q&amp;A to Desk Channel; reject keeps it private.
              </p>
            )}
            {actionMsg && (
              <div className="rounded-lg border border-primary-line bg-primary-soft px-4 py-3 text-sm text-primary-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span>{actionMsg}</span>
                <button
                  type="button"
                  onClick={() => setActiveTab("emails")}
                  className="text-primary-400 hover:underline text-xs font-semibold whitespace-nowrap"
                >
                  View email log →
                </button>
              </div>
            )}
            {visibleMentorQs.length === 0 ? (
              <div className="bg-white rounded-xl border border-border p-8 text-center text-muted-fg">
                {qaFilter === "queue"
                  ? "No dual-consent Q&As waiting for Desk Channel review."
                  : "No mentor questions yet."}
              </div>
            ) : (
              visibleMentorQs.map((q) => (
                <div key={q.id} className="bg-white rounded-xl border border-border p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {q.isAnswered ? (
                          <Badge variant="success" size="sm"><CheckCircle className="w-3 h-3" /> Answered</Badge>
                        ) : (
                          <Badge variant="warning" size="sm"><Clock className="w-3 h-3" /> Pending</Badge>
                        )}
                        <span className="text-xs text-muted-fg capitalize">{q.segment.replace("-", " ")}</span>
                        {q.deskChannelStatus === "published" && (
                          <Badge variant="success" size="sm">On Desk Channel</Badge>
                        )}
                        {q.deskChannelStatus === "rejected" && (
                          <Badge variant="secondary" size="sm">Review declined</Badge>
                        )}
                        {isDeskChannelQueueItem(q) && (
                          <Badge variant="warning" size="sm">Desk Channel candidate</Badge>
                        )}
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
                      <p className="text-xs mt-2 flex flex-wrap gap-x-3 gap-y-1">
                        <span className={q.memberShareOptIn ? "text-green-700" : "text-muted-fg"}>
                          Member share: {q.memberShareOptIn ? "opted in" : "no"}
                        </span>
                        <span className={q.mentorShareOptIn ? "text-green-700" : "text-muted-fg"}>
                          Mentor share: {q.mentorShareOptIn ? "opted in" : "no"}
                        </span>
                      </p>
                      {!q.isAnswered && q.mentorReminderSentAt && (
                        <p className="text-xs text-amber-700 mt-1">
                          Mentor reminded {formatDate(q.mentorReminderSentAt)}
                        </p>
                      )}
                    </div>
                  </div>
                  {q.isAnswered && q.answer ? (
                    <>
                      <div className="bg-primary-soft border border-primary-line rounded-lg p-3 text-sm text-primary-800">
                        {q.answer}
                      </div>
                      {isDeskChannelQueueItem(q) && (
                        <div className="mt-3 space-y-3 rounded-lg border border-amber-200 bg-amber-50/40 p-4">
                          <p className="text-xs font-semibold text-amber-900">
                            Edit for Desk Channel before publish — wording changes here do not alter the private member/mentor record.
                          </p>
                          <label className="block text-xs font-semibold text-muted-fg">
                            Question (Desk Channel)
                            <textarea
                              className="mt-1 w-full text-sm border border-border rounded-lg px-2.5 py-2 bg-white text-gray-800 min-h-[72px] resize-y focus:outline-none focus:ring-2 focus:ring-primary-400"
                              value={deskPublishDraft[q.id]?.question ?? q.question}
                              onChange={(e) =>
                                setDeskPublishDraft((d) => ({
                                  ...d,
                                  [q.id]: {
                                    question: e.target.value,
                                    answer: d[q.id]?.answer ?? q.answer ?? "",
                                  },
                                }))
                              }
                            />
                          </label>
                          <label className="block text-xs font-semibold text-muted-fg">
                            Answer (Desk Channel)
                            <textarea
                              className="mt-1 w-full text-sm border border-border rounded-lg px-2.5 py-2 bg-white text-gray-800 min-h-[120px] resize-y focus:outline-none focus:ring-2 focus:ring-primary-400"
                              value={deskPublishDraft[q.id]?.answer ?? q.answer ?? ""}
                              onChange={(e) =>
                                setDeskPublishDraft((d) => ({
                                  ...d,
                                  [q.id]: {
                                    question: d[q.id]?.question ?? q.question,
                                    answer: e.target.value,
                                  },
                                }))
                              }
                            />
                          </label>
                          <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                            <label className="flex-1 text-xs font-semibold text-muted-fg">
                              Desk Channel category
                              <select
                                className="mt-1 w-full text-sm border border-border rounded-lg px-2.5 py-2 bg-white text-gray-800"
                                value={
                                  deskCategoryDraft[q.id] ||
                                  MENTOR_SEGMENT_TO_DESK_CATEGORY[q.segment] ||
                                  "career"
                                }
                                onChange={(e) =>
                                  setDeskCategoryDraft((d) => ({ ...d, [q.id]: e.target.value }))
                                }
                              >
                                <option value="trading">Trading &amp; Market Analysis</option>
                                <option value="ops">Operations &amp; Scheduling</option>
                                <option value="risk">Risk &amp; Compliance</option>
                                <option value="tools">Market Intelligence &amp; Tools</option>
                                <option value="career">Career Positioning</option>
                              </select>
                            </label>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() =>
                                  deskChannelReview(q.id, "publish", q.segment, {
                                    question: deskPublishDraft[q.id]?.question ?? q.question,
                                    answer: deskPublishDraft[q.id]?.answer ?? q.answer ?? "",
                                  })
                                }
                                loading={deskChannelBusy === `${q.id}:publish`}
                                disabled={
                                  Boolean(deskChannelBusy) ||
                                  (deskPublishDraft[q.id]?.question ?? q.question).trim().length < 10 ||
                                  (deskPublishDraft[q.id]?.answer ?? q.answer ?? "").trim().length < 10
                                }
                              >
                                Publish to Desk Channel
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deskChannelReview(q.id, "reject", q.segment)}
                                loading={deskChannelBusy === `${q.id}:reject`}
                                disabled={Boolean(deskChannelBusy)}
                              >
                                Keep private
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
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
            <AdminTableFilters
              search={billingSearch}
              onSearchChange={setBillingSearch}
              searchPlaceholder="Search customer, email, Stripe ID…"
              filteredCount={filteredBillingUsers.length}
              totalCount={users.length}
              chips={[
                {
                  id: "tier",
                  label: "Tier",
                  value: billingTierFilter,
                  onChange: setBillingTierFilter,
                  options: TIER_FILTER_OPTIONS,
                },
                {
                  id: "status",
                  label: "Stripe status",
                  value: billingStatusFilter,
                  onChange: setBillingStatusFilter,
                  options: [
                    { value: "ALL", label: "All" },
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                    { value: "none", label: "No billing" },
                  ],
                },
              ]}
            />
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
                    {filteredBillingUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-fg">
                          No billing rows match your filters.
                        </td>
                      </tr>
                    ) : filteredBillingUsers.map((u) => (
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
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-white px-4 py-3 text-sm text-muted-fg">
              This is the <strong className="text-gray-800">job board waitlist</strong> — people who asked to be emailed when curated roles launch.
              Signup already creates a CommodityPlay account (see Customers). Signing up does <strong className="text-gray-800">not</strong> auto-add someone here, because job alerts need separate consent.
            </div>
            <AdminTableFilters
              search={waitlistSearch}
              onSearchChange={setWaitlistSearch}
              searchPlaceholder="Search email or name…"
              filteredCount={filteredWaitlist.length}
              totalCount={waitlist.length}
              chips={[
                {
                  id: "track",
                  label: "Track",
                  value: waitlistTrackFilter,
                  onChange: setWaitlistTrackFilter,
                  options: TRACK_FILTER_OPTIONS,
                },
                {
                  id: "member",
                  label: "Account",
                  value: waitlistMemberFilter,
                  onChange: setWaitlistMemberFilter,
                  options: [
                    { value: "ALL", label: "All" },
                    { value: "member", label: "Has account" },
                    { value: "alerts", label: "Alerts only" },
                  ],
                },
              ]}
            />
            <div className="bg-white rounded-xl border border-border overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-border bg-secondary text-left">
                  <th className="px-4 py-3 font-semibold text-muted-fg">Email</th>
                  <th className="px-4 py-3 font-semibold text-muted-fg">Name</th>
                  <th className="px-4 py-3 font-semibold text-muted-fg">Track</th>
                  <th className="px-4 py-3 font-semibold text-muted-fg">Member account</th>
                  <th className="px-4 py-3 font-semibold text-muted-fg">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filteredWaitlist.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-fg">
                      {waitlist.length === 0
                        ? "No job board waitlist entries yet."
                        : "No waitlist entries match your filters."}
                    </td>
                  </tr>
                ) : filteredWaitlist.map((w) => (
                  <tr key={w.id} className="border-b border-border">
                    <td className="px-4 py-3">{w.email}</td>
                    <td className="px-4 py-3">{w.name || "-"}</td>
                    <td className="px-4 py-3">{w.track}</td>
                    <td className="px-4 py-3">
                      {w.user ? (
                        <Badge variant="success" size="sm">{w.user.tier}</Badge>
                      ) : (
                        <span className="text-xs text-muted-fg">Alerts only — no account</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-fg">{formatDate(w.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {/* ── Email Log tab ── */}
        {activeTab === "emails" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm text-muted-fg">
                Demo notification log for Mentor Connect and system emails. Live Chat logs show delivery metadata
                (not conversation content). For job-chat questions, open or copy the hirer reply link here to test
                without waiting for inbox delivery.
              </p>
              <Button variant="outline" size="sm" onClick={loadDemoEmails} loading={emailsLoading}>
                <RefreshCw className="w-4 h-4" /> Refresh
              </Button>
            </div>

            {demoEmails.length === 0 && !emailsLoading ? (
              <div className="bg-white rounded-xl border border-border p-10 text-center">
                <Mail className="w-10 h-10 text-muted-fg mx-auto mb-3" />
                <p className="text-gray-800 font-medium mb-1">No demo emails yet</p>
                <p className="text-sm text-muted-fg">
                  Answer a mentor question or send an admin reminder from the Q&amp;A tab to generate emails.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                <div className="lg:col-span-2 space-y-2">
                  {demoEmails.map((email) => (
                    <button
                      key={email.id}
                      type="button"
                      onClick={() => setSelectedEmailId(email.id)}
                      className={cn(
                        "w-full text-left rounded-xl border bg-white p-4 transition-all",
                        selectedEmailId === email.id
                          ? "border-primary-400 ring-2 ring-primary-400/20"
                          : "border-border hover:border-primary-line"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <Badge variant={email.delivered ? "success" : "secondary"} size="sm">
                          {email.delivered ? "Sent" : "Demo log"}
                        </Badge>
                        <span className="text-[10px] text-muted-fg">{formatDate(email.createdAt)}</span>
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-primary-800 mb-1">
                        {email.kindLabel}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1">{email.subject}</p>
                      <p className="text-xs text-muted-fg mt-1">To: {email.to}</p>
                    </button>
                  ))}
                </div>

                <div className="lg:col-span-3">
                  {selectedDemoEmail ? (
                    <div className="bg-white rounded-xl border border-border overflow-hidden">
                      <div className="px-5 py-4 border-b border-border bg-secondary/40">
                        <p className="text-sm font-semibold text-gray-900">{selectedDemoEmail.subject}</p>
                        <p className="text-xs text-muted-fg mt-1">
                          To: {selectedDemoEmail.to} · {formatDate(selectedDemoEmail.createdAt)}
                        </p>
                      </div>
                      <div className="px-5 py-5">
                        <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                          {selectedDemoEmail.bodyText}
                        </pre>
                        {selectedDemoEmail.hirerReplyUrl ? (
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <a href={selectedDemoEmail.hirerReplyUrl} target="_blank" rel="noreferrer">
                                <ExternalLink className="w-3.5 h-3.5" />
                                Open hirer reply
                              </a>
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                void navigator.clipboard.writeText(selectedDemoEmail.hirerReplyUrl!);
                              }}
                            >
                              <Copy className="w-3.5 h-3.5" />
                              Copy hirer reply link
                            </Button>
                          </div>
                        ) : null}
                      </div>
                      {!selectedDemoEmail.delivered && (
                        <div className="px-5 py-3 bg-amber-50 border-t border-amber-100 text-xs text-amber-800 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          Logged for demo — configure RESEND_API_KEY to deliver real emails.
                        </div>
                      )}
                      {selectedDemoEmail.delivered && (
                        <div className="px-5 py-3 bg-green-50 border-t border-green-100 text-xs text-green-800 flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                          Delivered via Resend.
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            )}
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
          onSaved={handleMentorSaved}
        />
      )}
    </div>
  );
}
