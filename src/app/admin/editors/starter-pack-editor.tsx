"use client";

import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  mergeStarterEmailDigest,
  mergeStarterUpgradeCta,
  type StarterEmailDigest,
  type StarterInfographic,
  type StarterUpgradeCta,
} from "@/data/starter-pack";
import { CONTENT_STAT_PLACEHOLDER_HINT } from "@/lib/content/content-stat-placeholders";
import {
  EditorField,
  EditorRow,
  InlineFileUpload,
  UploadSection,
  inputClass,
  textareaClass,
  uploadContentAssetFile,
} from "./shared";

interface EmailDigest extends StarterEmailDigest {}

interface StarterPayload {
  infographics?: StarterInfographic[];
  emailDigest?: Partial<EmailDigest>;
  /** Legacy CMS key — read-only migration source */
  marketNote?: Partial<EmailDigest> & { subscribed?: string };
  upgradeCta?: Partial<StarterUpgradeCta>;
  [key: string]: unknown;
}

// ─── Free Infographics ────────────────────────────────────────────────────────

function newInfographic(idx: number): StarterInfographic {
  const id = `sp-${Date.now()}`;
  return {
    id,
    num: String(idx + 1).padStart(2, "0"),
    title: "",
    description: "",
    thumbClass: "from-gray-100 to-gray-300",
    fileKey: `starter-pack/${id}.pdf`,
    delivery: "download",
  };
}

function FreeInfographicsTab({
  data,
  onChange,
  moduleSlug,
  requiredTier,
}: {
  data: StarterPayload;
  onChange: (d: StarterPayload) => void;
  moduleSlug: string;
  requiredTier: string;
}) {
  const items = data.infographics ?? [];
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  function patch(i: number, item: StarterInfographic) {
    const next = [...items];
    next[i] = item;
    onChange({ ...data, infographics: next });
  }

  function del(i: number) {
    if (!confirm("Delete this item?")) return;
    onChange({ ...data, infographics: items.filter((_, j) => j !== i) });
  }

  function add() {
    onChange({ ...data, infographics: [...items, newInfographic(items.length)] });
  }

  async function handleUpload(i: number, file: File, item: StarterInfographic) {
    const key = item.fileKey?.trim() || `starter-pack/${item.id}.pdf`;
    setUploadingId(item.id);
    const result = await uploadContentAssetFile({ file, moduleSlug, requiredTier, assetKey: key });
    setUploadingId(null);
    if ("error" in result) {
      alert(result.error);
      return;
    }
    patch(i, {
      ...item,
      fileKey: key,
      assetId: result.id,
      fileName: result.fileName,
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-fg">
        Upload each free infographic here. Files appear on the Starter Pack page after Save.
      </p>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-fg">{items.length} infographics</p>
        <Button variant="outline" size="sm" onClick={add}>
          <Plus className="w-3.5 h-3.5" /> Add infographic
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((item, i) => (
          <EditorRow
            key={item.id}
            summary={<span><span className="font-medium">{item.num}. {item.title || "(untitled)"}</span></span>}
            onDelete={() => del(i)}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <EditorField label="Number">
                <input className={inputClass} value={item.num} onChange={(e) => patch(i, { ...item, num: e.target.value })} />
              </EditorField>
              <EditorField label="Title">
                <input className={inputClass} value={item.title} onChange={(e) => patch(i, { ...item, title: e.target.value })} />
              </EditorField>
              <EditorField label="File key" hint="e.g. starter-pack/ecosystem-map.pdf">
                <input className={inputClass} value={item.fileKey} onChange={(e) => patch(i, { ...item, fileKey: e.target.value })} />
              </EditorField>
              <EditorField label="Delivery">
                <select
                  className={inputClass}
                  value={item.delivery ?? "download"}
                  onChange={(e) => patch(i, { ...item, delivery: e.target.value as "view-only" | "download" })}
                >
                  <option value="download">Download</option>
                  <option value="view-only">View only</option>
                </select>
              </EditorField>
              <EditorField label="Thumb class" hint="Tailwind gradient classes">
                <input className={inputClass} value={item.thumbClass} onChange={(e) => patch(i, { ...item, thumbClass: e.target.value })} />
              </EditorField>
            </div>
            <EditorField label="Description">
              <textarea className={textareaClass} value={item.description} onChange={(e) => patch(i, { ...item, description: e.target.value })} />
            </EditorField>
            <InlineFileUpload
              moduleSlug={moduleSlug}
              requiredTier={requiredTier}
              assetKey={item.fileKey || `starter-pack/${item.id}.pdf`}
              fileName={item.fileName}
              uploading={uploadingId === item.id}
              onPickFile={(file) => handleUpload(i, file, item)}
            />
          </EditorRow>
        ))}
        {items.length === 0 && (
          <p className="text-center text-sm text-muted-fg py-8">No infographics yet.</p>
        )}
      </div>

      <UploadSection moduleSlug={moduleSlug} requiredTier={requiredTier} />
    </div>
  );
}

// ─── Email Digest ─────────────────────────────────────────────────────────────

function EmailDigestTab({ data, onChange }: { data: StarterPayload; onChange: (d: StarterPayload) => void }) {
  const rawDigest = data.emailDigest ?? (data.marketNote
    ? {
        ...data.marketNote,
        confirmedText: data.marketNote.confirmedText ?? data.marketNote.subscribed,
      }
    : undefined);
  const digest = mergeStarterEmailDigest(rawDigest);

  function patch(updates: Partial<EmailDigest>) {
    onChange({ ...data, emailDigest: { ...digest, ...updates } });
  }

  function addTopic() {
    patch({ topics: [...digest.topics, { title: "" }] });
  }

  function patchTopic(i: number, val: string) {
    const next = [...digest.topics];
    next[i] = { ...next[i], title: val };
    patch({ topics: next });
  }

  function delTopic(i: number) {
    patch({ topics: digest.topics.filter((_, j) => j !== i) });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-fg">
        Shared headline and topics for both tracks. Career and Sales members receive different digest descriptions.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <EditorField label="Eyebrow">
          <input className={inputClass} value={digest.eyebrow} onChange={(e) => patch({ eyebrow: e.target.value })} />
        </EditorField>
        <EditorField label="Frequency">
          <input className={inputClass} value={digest.frequency} onChange={(e) => patch({ frequency: e.target.value })} placeholder="e.g. Biweekly" />
        </EditorField>
      </div>
      <EditorField label="Title">
        <input className={inputClass} value={digest.title} onChange={(e) => patch({ title: e.target.value })} />
      </EditorField>
      <EditorField label="Career track description">
        <textarea className={textareaClass} value={digest.careerDescription} onChange={(e) => patch({ careerDescription: e.target.value })} />
      </EditorField>
      <EditorField label="Sales track description">
        <textarea className={textareaClass} value={digest.salesDescription} onChange={(e) => patch({ salesDescription: e.target.value })} />
      </EditorField>
      <EditorField label="Subscription confirmed text">
        <input className={inputClass} value={digest.confirmedText} onChange={(e) => patch({ confirmedText: e.target.value })} />
      </EditorField>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-700">Topics</p>
          <Button variant="outline" size="sm" onClick={addTopic}><Plus className="w-3.5 h-3.5" /> Add topic</Button>
        </div>
        {digest.topics.map((topic, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className={inputClass}
              value={topic.title}
              onChange={(e) => patchTopic(i, e.target.value)}
              placeholder={`Topic ${i + 1}`}
            />
            <button type="button" onClick={() => delTopic(i)} className="text-red-400 hover:text-red-600 p-1">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {digest.topics.length === 0 && (
          <p className="text-xs text-muted-fg">No topics yet.</p>
        )}
      </div>
    </div>
  );
}

// ─── Upgrade CTA ──────────────────────────────────────────────────────────────

function UpgradeCtaTab({ data, onChange }: { data: StarterPayload; onChange: (d: StarterPayload) => void }) {
  const cta = mergeStarterUpgradeCta(data.upgradeCta);

  function patch(updates: Partial<StarterUpgradeCta>) {
    onChange({ ...data, upgradeCta: { ...cta, ...updates } });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-fg">
        Blue strip at the bottom of <strong>/starter-pack</strong>. Placeholders: {CONTENT_STAT_PLACEHOLDER_HINT}
      </p>
      <EditorField label="Title">
        <input className={inputClass} value={cta.title} onChange={(e) => patch({ title: e.target.value })} />
      </EditorField>
      <EditorField label="Description">
        <textarea className={textareaClass} value={cta.description} onChange={(e) => patch({ description: e.target.value })} />
      </EditorField>
      <EditorField label="Button label">
        <input className={inputClass} value={cta.buttonLabel} onChange={(e) => patch({ buttonLabel: e.target.value })} />
      </EditorField>
    </div>
  );
}

// ─── Main editor ─────────────────────────────────────────────────────────────

const TABS = [
  { id: "infographics", label: "Free Infographics" },
  { id: "glossary", label: "Desk Glossary" },
  { id: "digest", label: "Email Digest" },
  { id: "upgrade", label: "Upgrade CTA" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function StarterPackEditor({
  payload,
  onChange,
  moduleSlug,
  requiredTier,
}: {
  payload: unknown;
  onChange: (p: unknown) => void;
  moduleSlug: string;
  requiredTier: string;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("infographics");
  const data = (payload as StarterPayload) ?? {};

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-border pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              activeTab === tab.id ? "bg-primary-soft text-primary-400" : "text-muted-fg hover:bg-secondary/60"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "infographics" && (
        <FreeInfographicsTab data={data} onChange={onChange as (d: StarterPayload) => void} moduleSlug={moduleSlug} requiredTier={requiredTier} />
      )}
      {activeTab === "glossary" && (
        <div className="text-center py-8 text-muted-fg">
          <p className="text-sm font-medium">Desk Glossary</p>
          <p className="text-xs mt-1">Edit the glossary terms in the <strong>Desk Glossary</strong> module (Starter Pack section).</p>
        </div>
      )}
      {activeTab === "digest" && (
        <EmailDigestTab data={data} onChange={onChange as (d: StarterPayload) => void} />
      )}
      {activeTab === "upgrade" && (
        <UpgradeCtaTab data={data} onChange={onChange as (d: StarterPayload) => void} />
      )}
    </div>
  );
}
