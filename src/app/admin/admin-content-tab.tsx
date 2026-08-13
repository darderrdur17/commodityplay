"use client";

import React, { useEffect, useState } from "react";
import { RefreshCw, LayoutGrid, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";
import { SaveBar, TrackBadge, useModuleEditor } from "./editors/shared";
import { PlaybookEditor } from "./editors/playbook-editor";
import { GlossaryEditor } from "./editors/glossary-editor";
import { DeskChannelEditor } from "./editors/desk-channel-editor";
import { InterviewEditor } from "./editors/interview-editor";
import { KnowledgeTestEditor } from "./editors/knowledge-test-editor";
import { CareerRoadmapEditor } from "./editors/career-roadmap-editor";
import { JobOpeningsEditor } from "./editors/job-openings-editor";
import { CaseStudiesEditor } from "./editors/case-studies-editor";
import { LandingEditorWrapper } from "./editors/landing-editor";
import { StarterPackEditor } from "./editors/starter-pack-editor";
import { ResumeEditor } from "./editors/resume-editor";
import { MentorConnectEditor } from "./editors/mentor-connect-editor";
import { LibraryEditor } from "./editors/library-editor";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModuleRow {
  slug: string;
  title: string;
  description: string | null;
  requiredTier: string;
  published: boolean;
  version: number;
  updatedAt: string;
  payloadSize: number;
}

type TrackLabel = "Career" | "Sales" | "Both" | "Elite";

// ─── Sidebar hierarchy ────────────────────────────────────────────────────────

interface SidebarItem {
  slug: string;
  label: string;
  track?: TrackLabel;
  tier?: string;
}

interface SidebarGroup {
  label: string;
  tier: string;
  items: SidebarItem[];
}

const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    label: "Landing Page",
    tier: "STARTER",
    items: [
      { slug: "landing", label: "Career Track", track: "Career", tier: "STARTER" },
      { slug: "landing", label: "Sales Track", track: "Sales", tier: "STARTER" },
    ],
  },
  {
    label: "Starter Pack",
    tier: "STARTER",
    items: [
      { slug: "starter-pack", label: "Free Infographics + Email Digest", track: "Both", tier: "STARTER" },
      { slug: "glossary", label: "Desk Glossary", track: "Both", tier: "STARTER" },
    ],
  },
  {
    label: "Pro Pack",
    tier: "PRO",
    items: [
      { slug: "playbook", label: "Full Playbook", track: "Both", tier: "PRO" },
      { slug: "resume-templates", label: "Resume", track: "Career", tier: "PRO" },
      { slug: "career-roadmap", label: "Career Roadmap + Nav Guide", track: "Career", tier: "PRO" },
      { slug: "interview-questions", label: "Interview Questions", track: "Career", tier: "PRO" },
      { slug: "knowledge-test", label: "Market Knowledge Test", track: "Both", tier: "PRO" },
    ],
  },
  {
    label: "Elite Pack",
    tier: "ELITE",
    items: [
      { slug: "case-studies", label: "Case Studies", track: "Both", tier: "ELITE" },
      { slug: "desk-channel", label: "Desk Channel", track: "Both", tier: "ELITE" },
      { slug: "mentor-connect", label: "Mentor Connect", track: "Both", tier: "ELITE" },
      { slug: "job-openings", label: "Market Role Openings", track: "Both", tier: "ELITE" },
      { slug: "library", label: "Library Resources", track: "Both", tier: "ELITE" },
    ],
  },
];

// Unique slugs that should be fetched/displayed in sidebar
function uniqueSlugs(): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const group of SIDEBAR_GROUPS) {
    for (const item of group.items) {
      if (!seen.has(item.slug)) {
        seen.add(item.slug);
        result.push(item.slug);
      }
    }
  }
  return result;
}

// ─── Tier colors ──────────────────────────────────────────────────────────────

const TIER_COLORS: Record<string, string> = {
  STARTER: "bg-emerald-50 border-emerald-200",
  PRO: "bg-blue-50 border-blue-200",
  ELITE: "bg-amber-50 border-amber-200",
};

const TIER_LABEL_COLORS: Record<string, string> = {
  STARTER: "text-emerald-700",
  PRO: "text-blue-700",
  ELITE: "text-amber-700",
};

// ─── Module editor panel ──────────────────────────────────────────────────────

function ModuleEditor({
  slug,
  label,
  track,
  modules,
  onRefresh,
}: {
  slug: string;
  label: string;
  track?: TrackLabel;
  modules: ModuleRow[];
  onRefresh: () => void;
}) {
  const {
    payload,
    setPayload,
    requiredTier,
    setRequiredTier,
    published,
    setPublished,
    version,
    loading,
    saving,
    message,
    isError,
    save,
    reset,
  } = useModuleEditor(slug);

  const mod = modules.find((m) => m.slug === slug);

  async function handleSave() {
    await save();
    onRefresh();
  }

  async function handleReset() {
    await reset();
    onRefresh();
  }

  const editorProps = { payload, onChange: setPayload, moduleSlug: slug, requiredTier };

  function renderEditor() {
    switch (slug) {
      case "landing":
        return (
          <LandingEditorWrapper
            {...editorProps}
            initialTrackFilter={track === "Career" ? "career" : track === "Sales" ? "sales" : "both"}
          />
        );
      case "playbook":
        return <PlaybookEditor {...editorProps} />;
      case "glossary":
        return <GlossaryEditor {...editorProps} />;
      case "desk-channel":
        return <DeskChannelEditor {...editorProps} />;
      case "interview-questions":
        return <InterviewEditor {...editorProps} />;
      case "knowledge-test":
        return <KnowledgeTestEditor {...editorProps} />;
      case "career-roadmap":
        return <CareerRoadmapEditor {...editorProps} />;
      case "job-openings":
        return <JobOpeningsEditor {...editorProps} />;
      case "case-studies":
        return <CaseStudiesEditor {...editorProps} />;
      case "starter-pack":
        return <StarterPackEditor {...editorProps} />;
      case "resume-templates":
        return <ResumeEditor {...editorProps} />;
      case "mentor-connect":
        return <MentorConnectEditor payload={payload} onChange={setPayload} />;
      case "library":
        return <LibraryEditor {...editorProps} />;
      default:
        return (
          <div className="p-6 text-center text-muted-fg text-sm">
            <p>
              No structured editor for <strong>{slug}</strong>.
            </p>
            <p className="text-xs mt-1">Edit via JSON in the original content tab.</p>
          </div>
        );
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-5 h-5 animate-spin text-muted-fg" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <SaveBar
        slug={slug}
        version={version}
        requiredTier={requiredTier}
        setRequiredTier={setRequiredTier}
        published={published}
        setPublished={setPublished}
        saving={saving}
        message={message}
        isError={isError}
        onSave={handleSave}
        onReset={handleReset}
      />
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-secondary/30">
        <p className="text-xs font-semibold text-gray-700">{label}</p>
        {track && <TrackBadge track={track} />}
        {mod && (
          <span className="ml-auto text-xs text-muted-fg">Updated {formatDate(mod.updatedAt)}</span>
        )}
      </div>
      <div className="p-4 max-h-[calc(100vh-260px)] overflow-y-auto">{renderEditor()}</div>
    </div>
  );
}

// ─── Collapsible sidebar group ────────────────────────────────────────────────

function SidebarGroupSection({
  group,
  modules,
  selectedKey,
  onSelect,
}: {
  group: SidebarGroup;
  modules: ModuleRow[];
  selectedKey: string | null;
  onSelect: (key: string, slug: string, label: string, track?: TrackLabel) => void;
}) {
  const [open, setOpen] = useState(true);
  const tierColor = TIER_COLORS[group.tier] ?? "";
  const tierLabelColor = TIER_LABEL_COLORS[group.tier] ?? "text-muted-fg";

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn("w-full flex items-center gap-2 px-4 py-2.5 text-left border-l-2", tierColor)}
      >
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 shrink-0 text-muted-fg" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-fg" />
        )}
        <p className={cn("text-xs font-bold uppercase tracking-wider", tierLabelColor)}>{group.label}</p>
        <span className={cn("ml-auto text-[10px] font-bold uppercase", tierLabelColor)}>{group.tier}</span>
      </button>
      {open && (
        <div className="divide-y divide-border">
          {group.items.map((item) => {
            const itemKey = `${item.slug}::${item.label}`;
            const mod = modules.find((m) => m.slug === item.slug);
            return (
              <button
                key={itemKey}
                type="button"
                onClick={() => onSelect(itemKey, item.slug, item.label, item.track)}
                className={cn(
                  "w-full text-left px-4 py-3 pl-9 hover:bg-secondary/60 transition-colors",
                  selectedKey === itemKey ? "bg-primary-soft" : ""
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <p className="font-semibold text-sm text-gray-900">{item.label}</p>
                  {mod && (
                    <Badge size="sm" variant={mod.published ? "success" : "secondary"}>
                      {mod.published ? "Live" : "Draft"}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {item.track && (
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
                        item.track === "Career"
                          ? "bg-blue-100 text-blue-700"
                          : item.track === "Sales"
                          ? "bg-violet-100 text-violet-700"
                          : item.track === "Both"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      )}
                    >
                      {item.track}
                    </span>
                  )}
                  {mod && (
                    <span className="text-[11px] text-muted-fg">
                      {item.slug} · v{mod.version}
                    </span>
                  )}
                  {!mod && <span className="text-[11px] text-muted-fg italic">{item.slug} (not seeded)</span>}
                </div>
                {mod && <p className="text-[11px] text-muted-fg mt-0.5">{formatDate(mod.updatedAt)}</p>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export function AdminContentTab({ initialTrack }: { initialTrack?: "career" | "sales" } = {}) {
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [selected, setSelected] = useState<{
    key: string;
    slug: string;
    label: string;
    track?: TrackLabel;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  async function loadModules() {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch("/api/admin/content", { cache: "no-store" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setLoadError(err.error || `Could not load modules (HTTP ${res.status}).`);
        return;
      }
      const data = await res.json();
      setModules(data.modules ?? []);
    } catch {
      setLoadError("Network error loading content. Check database connection and run npm run db:seed.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadModules();
  }, []);

  // Deep-link support: /admin?tab=content&track=career|sales opens the matching
  // landing page editor directly (e.g. from the "Edit this page" link on the live site).
  useEffect(() => {
    if (!initialTrack) return;
    const label = initialTrack === "sales" ? "Sales Track" : "Career Track";
    const track: TrackLabel = initialTrack === "sales" ? "Sales" : "Career";
    setSelected({ key: `landing::${label}`, slug: "landing", label, track });
  }, [initialTrack]);

  if (loading) {
    return <div className="text-center py-12 text-muted-fg">Loading content modules...</div>;
  }

  if (loadError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-700 text-sm mb-4">{loadError}</p>
        <p className="text-xs text-muted-fg mb-4">
          Demo admin: <strong>admin@demo.com</strong> / Demo1234! — then open Content CMS tab.
        </p>
        <Button size="sm" onClick={loadModules}>
          <RefreshCw className="w-4 h-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      {/* Sidebar */}
      <div className="bg-white rounded-xl border border-border overflow-hidden h-fit lg:sticky lg:top-4">
        <div className="px-4 py-3 border-b border-border bg-secondary flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-fg">Content CMS</p>
          <button
            type="button"
            onClick={loadModules}
            className="text-muted-fg hover:text-primary-400"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="max-h-[calc(100vh-180px)] overflow-y-auto">
          {SIDEBAR_GROUPS.map((group) => (
            <SidebarGroupSection
              key={group.label}
              group={group}
              modules={modules}
              selectedKey={selected?.key ?? null}
              onSelect={(key, slug, label, track) => setSelected({ key, slug, label, track })}
            />
          ))}
          {modules.length === 0 && (
            <p className="p-4 text-xs text-muted-fg">No modules yet. Run npm run db:seed.</p>
          )}
        </div>
        <div className="px-4 py-2 border-t border-border bg-secondary/30">
          <p className="text-[11px] text-muted-fg">
            {uniqueSlugs().length} slugs · {modules.length} seeded
          </p>
        </div>
      </div>

      {/* Editor panel */}
      <div>
        {!selected ? (
          <div className="bg-white rounded-xl border border-border p-12 text-center text-muted-fg">
            <LayoutGrid className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="mb-2 font-medium">Select a module to edit</p>
            <p className="text-xs">
              Each module has a structured form editor. Changes save as JSON via the API.
            </p>
          </div>
        ) : (
          <ModuleEditor
            key={selected.key}
            slug={selected.slug}
            label={selected.label}
            track={selected.track}
            modules={modules}
            onRefresh={loadModules}
          />
        )}
      </div>
    </div>
  );
}
