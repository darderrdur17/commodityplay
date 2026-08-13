"use client";

import React, { useEffect, useState } from "react";
import { RefreshCw, LayoutGrid } from "lucide-react";
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

type Track = "Career" | "Sales" | "Both" | "Elite";

const MODULE_META: Record<string, { track: Track; label: string }> = {
  landing: { track: "Both", label: "Landing Page" },
  playbook: { track: "Career", label: "Playbook" },
  glossary: { track: "Career", label: "Glossary" },
  "desk-channel": { track: "Elite", label: "Desk Channel" },
  "interview-questions": { track: "Career", label: "Interview Questions" },
  "knowledge-test": { track: "Career", label: "Knowledge Test" },
  "career-roadmap": { track: "Career", label: "Career Roadmap" },
  "starter-pack": { track: "Career", label: "Starter Pack" },
  "job-openings": { track: "Both", label: "Job Openings" },
  "case-studies": { track: "Elite", label: "Case Studies" },
};

const GROUPS: { label: string; slugs: string[] }[] = [
  { label: "Both Tracks", slugs: ["landing", "job-openings"] },
  { label: "Career Track", slugs: ["playbook", "glossary", "interview-questions", "knowledge-test", "career-roadmap", "starter-pack"] },
  { label: "Elite Track", slugs: ["desk-channel", "case-studies"] },
];

function ModuleEditor({
  slug,
  modules,
  onRefresh,
}: {
  slug: string;
  modules: ModuleRow[];
  onRefresh: () => void;
}) {
  const { payload, setPayload, requiredTier, setRequiredTier, published, setPublished, version, loading, saving, message, isError, save, reset } = useModuleEditor(slug);

  const meta = MODULE_META[slug];
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
      case "playbook": return <PlaybookEditor {...editorProps} />;
      case "glossary": return <GlossaryEditor {...editorProps} />;
      case "desk-channel": return <DeskChannelEditor {...editorProps} />;
      case "interview-questions": return <InterviewEditor {...editorProps} />;
      case "knowledge-test": return <KnowledgeTestEditor {...editorProps} />;
      case "career-roadmap": return <CareerRoadmapEditor {...editorProps} />;
      case "job-openings": return <JobOpeningsEditor {...editorProps} />;
      case "case-studies": return <CaseStudiesEditor {...editorProps} />;
      case "landing": return <LandingEditorWrapper {...editorProps} />;
      case "starter-pack": return <StarterPackEditor {...editorProps} />;
      default:
        return (
          <div className="p-6 text-center text-muted-fg text-sm">
            <p>No structured editor for <strong>{slug}</strong>.</p>
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
        <p className="text-xs font-semibold text-gray-700">{meta?.label ?? slug}</p>
        {meta?.track && <TrackBadge track={meta.track} />}
        {mod && (
          <span className="ml-auto text-xs text-muted-fg">
            Updated {formatDate(mod.updatedAt)}
          </span>
        )}
      </div>
      <div className="p-4 max-h-[calc(100vh-260px)] overflow-y-auto">
        {renderEditor()}
      </div>
    </div>
  );
}

export function AdminContentTab() {
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
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

  useEffect(() => { loadModules(); }, []);

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
          <p className="text-xs font-bold uppercase tracking-wider text-muted-fg">Content Modules</p>
          <button type="button" onClick={loadModules} className="text-muted-fg hover:text-primary-400">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="max-h-[calc(100vh-180px)] overflow-y-auto">
          {GROUPS.map((group) => {
            const groupModules = group.slugs
              .map((slug) => modules.find((m) => m.slug === slug))
              .filter(Boolean) as ModuleRow[];
            if (groupModules.length === 0) return null;
            return (
              <div key={group.label} className="border-b border-border last:border-b-0">
                <div className="px-4 py-2 bg-secondary/80">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-fg">{group.label}</p>
                </div>
                <div className="divide-y divide-border">
                  {groupModules.map((m) => {
                    const meta = MODULE_META[m.slug];
                    return (
                      <button
                        key={m.slug}
                        type="button"
                        onClick={() => setSelectedSlug(m.slug)}
                        className={cn(
                          "w-full text-left px-4 py-3 hover:bg-secondary/60 transition-colors",
                          selectedSlug === m.slug ? "bg-primary-soft" : ""
                        )}
                      >
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className="font-semibold text-sm text-gray-900">{meta?.label ?? m.title}</p>
                          <Badge size="sm" variant={m.published ? "success" : "secondary"}>
                            {m.published ? "Live" : "Draft"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-fg">{m.slug} · v{m.version}</p>
                        <p className="text-[11px] text-muted-fg">{formatDate(m.updatedAt)}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {modules.length === 0 && (
            <p className="p-4 text-xs text-muted-fg">No modules yet. Run npm run db:seed.</p>
          )}
        </div>
      </div>

      {/* Editor panel */}
      <div>
        {!selectedSlug ? (
          <div className="bg-white rounded-xl border border-border p-12 text-center text-muted-fg">
            <LayoutGrid className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="mb-2 font-medium">Select a module to edit</p>
            <p className="text-xs">Each module has a structured form editor. Changes save as JSON via the API.</p>
          </div>
        ) : (
          <ModuleEditor slug={selectedSlug} modules={modules} onRefresh={loadModules} />
        )}
      </div>
    </div>
  );
}
