"use client";

import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSectionAssets } from "@/data/playbook-assets";
import type { ContentAttachment } from "@/lib/content/attachments";
import { slugifyFileName } from "@/lib/content/attachments";
import {
  EditorField,
  EditorRow,
  EditorSection,
  InlineFileUpload,
  TrackToggle,
  UploadSection,
  inputClass,
  textareaClass,
  uploadContentAssetFile,
} from "./shared";

interface PlaybookSectionData {
  id: string;
  number: string;
  title: string;
  desc: string;
  hook: string;
  paragraphs: string[];
  pullQuote?: string;
  wtmfy?: string;
  handoff?: string;
  freePreview?: boolean;
  assets?: ContentAttachment[];
}

interface PlaybookChapter {
  id: string;
  letter: string;
  title: string;
  subtitle: string;
  pages: number;
  readTime: string;
  sections: PlaybookSectionData[];
  track?: "career" | "sales" | "both";
}

interface PlaybookPayload {
  chapters: PlaybookChapter[];
}

function newAttachment(chapterId: string, sectionId: string, title = "New Asset"): ContentAttachment {
  const slug = slugifyFileName(title) || "asset";
  return {
    id: `att-${Date.now()}`,
    type: "Infographic",
    title,
    description: "",
    fileKey: `playbook/${chapterId}/${sectionId}/${slug}.pdf`,
    delivery: "download",
  };
}

function sectionAssets(chapterId: string, sec: PlaybookSectionData): ContentAttachment[] {
  if (sec.assets?.length) return sec.assets;
  return getSectionAssets(chapterId, sec.id).map((a) => ({
    ...a,
    delivery: "download" as const,
  }));
}

function newSection(chapterId: string, idx: number): PlaybookSectionData {
  return {
    id: `${chapterId}-s${idx + 1}`,
    number: `${chapterId.toUpperCase()}.${idx + 1}`,
    title: "New Section",
    desc: "",
    hook: "",
    paragraphs: [],
    assets: [],
  };
}

function newChapter(idx: number): PlaybookChapter {
  const letter = String.fromCharCode(65 + idx);
  return { id: letter.toLowerCase(), letter, title: "New Chapter", subtitle: "", pages: 0, readTime: "0 min", sections: [] };
}

function SectionAssetsEditor({
  chapterId,
  sectionId,
  assets,
  onChange,
  moduleSlug,
  requiredTier,
}: {
  chapterId: string;
  sectionId: string;
  assets: ContentAttachment[];
  onChange: (assets: ContentAttachment[]) => void;
  moduleSlug: string;
  requiredTier: string;
}) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  function patchAsset(i: number, asset: ContentAttachment) {
    const next = [...assets];
    next[i] = asset;
    onChange(next);
  }

  async function handleUpload(i: number, file: File, asset: ContentAttachment) {
    const key = asset.fileKey?.trim();
    if (!key) return;
    setUploadingId(asset.id ?? String(i));
    const result = await uploadContentAssetFile({ file, moduleSlug, requiredTier, assetKey: key });
    setUploadingId(null);
    if ("error" in result) {
      alert(result.error);
      return;
    }
    patchAsset(i, {
      ...asset,
      assetId: result.id,
      fileName: result.fileName,
      mimeType: file.type || "application/pdf",
    });
  }

  return (
    <div className="mt-4 pt-4 border-t border-border space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-muted-fg uppercase">Section attachments ({assets.length})</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange([...assets, newAttachment(chapterId, sectionId)])}
        >
          <Plus className="w-3.5 h-3.5" /> Add attachment
        </Button>
      </div>
      {assets.map((asset, i) => (
        <div key={asset.id ?? i} className="rounded-lg border border-border p-3 space-y-2 bg-secondary/20">
          <div className="grid gap-2 sm:grid-cols-2">
            <EditorField label="Type">
              <input
                className={inputClass}
                value={asset.type ?? ""}
                onChange={(e) => patchAsset(i, { ...asset, type: e.target.value })}
                placeholder="Infographic, Framework..."
              />
            </EditorField>
            <EditorField label="Title">
              <input
                className={inputClass}
                value={asset.title}
                onChange={(e) => patchAsset(i, { ...asset, title: e.target.value })}
              />
            </EditorField>
          </div>
          <EditorField label="Description">
            <textarea
              className={textareaClass}
              rows={2}
              value={asset.description ?? ""}
              onChange={(e) => patchAsset(i, { ...asset, description: e.target.value })}
            />
          </EditorField>
          <EditorField label="File key" hint="Auto-generated from chapter/section; must match uploaded file">
            <input
              className={inputClass}
              value={asset.fileKey ?? ""}
              onChange={(e) => patchAsset(i, { ...asset, fileKey: e.target.value })}
            />
          </EditorField>
          <EditorField label="Delivery">
            <select
              className={inputClass}
              value={asset.delivery ?? "download"}
              onChange={(e) => patchAsset(i, { ...asset, delivery: e.target.value as "view-only" | "download" })}
            >
              <option value="download">Download</option>
              <option value="view-only">View only</option>
            </select>
          </EditorField>
          <InlineFileUpload
            moduleSlug={moduleSlug}
            requiredTier={requiredTier}
            assetKey={asset.fileKey ?? ""}
            fileName={asset.fileName}
            uploading={uploadingId === (asset.id ?? String(i))}
            onPickFile={(file) => handleUpload(i, file, asset)}
          />
          <button
            type="button"
            onClick={() => onChange(assets.filter((_, j) => j !== i))}
            className="text-xs text-red-500 hover:text-red-700"
          >
            Remove attachment
          </button>
        </div>
      ))}
    </div>
  );
}

export function PlaybookEditor({
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
  const data = payload as PlaybookPayload ?? { chapters: [] };
  const chapters: PlaybookChapter[] = data.chapters ?? [];

  function patchChapter(i: number, ch: PlaybookChapter) {
    const next = [...chapters];
    next[i] = ch;
    onChange({ ...data, chapters: next });
  }

  function patchSection(ci: number, si: number, sec: PlaybookSectionData) {
    const ch = { ...chapters[ci], sections: [...chapters[ci].sections] };
    ch.sections[si] = sec;
    patchChapter(ci, ch);
  }

  function addSection(ci: number) {
    const ch = chapters[ci];
    const sec = newSection(ch.id, ch.sections.length);
    patchChapter(ci, { ...ch, sections: [...ch.sections, sec] });
  }

  function deleteSection(ci: number, si: number) {
    const ch = chapters[ci];
    patchChapter(ci, { ...ch, sections: ch.sections.filter((_, j) => j !== si) });
  }

  function addChapter() {
    onChange({ ...data, chapters: [...chapters, newChapter(chapters.length)] });
  }

  function deleteChapter(i: number) {
    if (!confirm("Delete this chapter?")) return;
    onChange({ ...data, chapters: chapters.filter((_, j) => j !== i) });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-fg">
        Attach PDFs and documents directly on each section below. Files appear on the matching playbook chapter page after Save.
      </p>
      {chapters.map((ch, ci) => (
        <EditorSection
          key={ch.id}
          title={`Chapter ${ch.letter}: ${ch.title}`}
          description={`${ch.sections.length} sections · ${ch.pages} pages`}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <EditorField label="Title">
              <input className={inputClass} value={ch.title} onChange={(e) => patchChapter(ci, { ...ch, title: e.target.value })} />
            </EditorField>
            <EditorField label="Letter">
              <input className={inputClass} value={ch.letter} onChange={(e) => patchChapter(ci, { ...ch, letter: e.target.value })} />
            </EditorField>
            <EditorField label="Read time">
              <input className={inputClass} value={ch.readTime} onChange={(e) => patchChapter(ci, { ...ch, readTime: e.target.value })} />
            </EditorField>
            <EditorField label="Pages">
              <input type="number" className={inputClass} value={ch.pages} onChange={(e) => patchChapter(ci, { ...ch, pages: Number(e.target.value) })} />
            </EditorField>
          </div>
          <EditorField label="Track">
            <TrackToggle value={ch.track ?? "both"} onChange={(v) => patchChapter(ci, { ...ch, track: v })} />
          </EditorField>
          <EditorField label="Subtitle">
            <input className={inputClass} value={ch.subtitle} onChange={(e) => patchChapter(ci, { ...ch, subtitle: e.target.value })} />
          </EditorField>

          <div className="space-y-2">
            <p className="text-xs font-bold text-muted-fg uppercase">Sections</p>
            {ch.sections.map((sec, si) => {
              const assets = sectionAssets(ch.id, sec);
              return (
                <EditorRow
                  key={sec.id}
                  summary={
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{sec.number} {sec.title}</span>
                      {sec.freePreview && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">Free Preview</span>}
                      {assets.length > 0 && <span className="text-[10px] text-muted-fg">{assets.length} file(s)</span>}
                    </span>
                  }
                  onDelete={() => deleteSection(ci, si)}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <EditorField label="Number"><input className={inputClass} value={sec.number} onChange={(e) => patchSection(ci, si, { ...sec, number: e.target.value })} /></EditorField>
                    <EditorField label="Title"><input className={inputClass} value={sec.title} onChange={(e) => patchSection(ci, si, { ...sec, title: e.target.value })} /></EditorField>
                  </div>
                  <EditorField label="Description"><textarea className={textareaClass} value={sec.desc} onChange={(e) => patchSection(ci, si, { ...sec, desc: e.target.value })} /></EditorField>
                  <EditorField label="Hook"><textarea className={textareaClass} value={sec.hook} onChange={(e) => patchSection(ci, si, { ...sec, hook: e.target.value })} /></EditorField>
                  <EditorField label="Paragraphs" hint="One paragraph per line"><textarea className={textareaClass} rows={6} value={(sec.paragraphs ?? []).join("\n")} onChange={(e) => patchSection(ci, si, { ...sec, paragraphs: e.target.value.split("\n") })} /></EditorField>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox" checked={sec.freePreview ?? false} onChange={(e) => patchSection(ci, si, { ...sec, freePreview: e.target.checked })} />
                    Free preview (visible to Starter members)
                  </label>
                  <EditorField label="Pull quote"><input className={inputClass} value={sec.pullQuote ?? ""} onChange={(e) => patchSection(ci, si, { ...sec, pullQuote: e.target.value })} /></EditorField>
                  <EditorField label="WTMFY"><textarea className={textareaClass} value={sec.wtmfy ?? ""} onChange={(e) => patchSection(ci, si, { ...sec, wtmfy: e.target.value })} /></EditorField>
                  <EditorField label="Handoff"><textarea className={textareaClass} value={sec.handoff ?? ""} onChange={(e) => patchSection(ci, si, { ...sec, handoff: e.target.value })} /></EditorField>
                  <SectionAssetsEditor
                    chapterId={ch.id}
                    sectionId={sec.id}
                    assets={assets}
                    onChange={(nextAssets) => patchSection(ci, si, { ...sec, assets: nextAssets })}
                    moduleSlug={moduleSlug}
                    requiredTier={requiredTier}
                  />
                </EditorRow>
              );
            })}
            <Button variant="outline" size="sm" onClick={() => addSection(ci)}>
              <Plus className="w-3.5 h-3.5" /> Add section
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={() => deleteChapter(ci)} className="text-red-600 border-red-200 hover:bg-red-50">
            <Trash2 className="w-3.5 h-3.5" /> Delete chapter
          </Button>
        </EditorSection>
      ))}

      <Button variant="outline" size="sm" onClick={addChapter}>
        <Plus className="w-3.5 h-3.5" /> Add chapter
      </Button>

      <UploadSection moduleSlug={moduleSlug} requiredTier={requiredTier} />
    </div>
  );
}
