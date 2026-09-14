"use client";

import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSectionAssets } from "@/data/playbook-assets";
import { mergePlaybookHubHero, type PlaybookHubHeroCopy } from "@/data/playbook-hub-hero";
import type { ContentAttachment } from "@/lib/content/attachments";
import { ensurePlaybookSectionAssets } from "@/lib/content/playbook-section-assets";
import {
  playbookPayloadFromEditorChapters,
  type PlaybookChapterRecord,
  type PlaybookSectionBody,
} from "@/lib/content/playbook-payload";
import {
  EditorField,
  EditorRow,
  EditorSection,
  InlineFileUpload,
  TrackToggle,
  inputClass,
  textareaClass,
  uploadContentAssetFile,
} from "./shared";

interface PlaybookPayload {
  chapters: PlaybookChapterRecord[];
  hubHero?: Partial<PlaybookHubHeroCopy>;
}

function sectionAssets(chapterId: string, sec: PlaybookSectionBody): ContentAttachment[] {
  const raw = sec.assets?.length
    ? sec.assets
    : getSectionAssets(chapterId, sec.id).map((a) => ({
        ...a,
        delivery: "download" as const,
      }));
  return ensurePlaybookSectionAssets(chapterId, sec.id, sec.title, raw);
}

function newSection(chapterId: string, idx: number): PlaybookSectionBody {
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

function newChapter(idx: number): PlaybookChapterRecord {
  const letter = String.fromCharCode(65 + idx);
  return { id: letter.toLowerCase(), letter, title: "New Chapter", subtitle: "", pages: 0, sections: [] };
}

function SectionAssetsEditor({
  chapterId,
  sectionId,
  sectionTitle,
  assets,
  onChange,
  moduleSlug,
  requiredTier,
}: {
  chapterId: string;
  sectionId: string;
  sectionTitle: string;
  assets: ContentAttachment[];
  onChange: (assets: ContentAttachment[]) => void;
  moduleSlug: string;
  requiredTier: string;
}) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const slots = ensurePlaybookSectionAssets(chapterId, sectionId, sectionTitle, assets);

  function patchAsset(i: number, asset: ContentAttachment) {
    const next = [...slots];
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
    <div className="mt-4 pt-4 border-t border-border space-y-3">
      <p className="text-xs font-bold text-muted-fg uppercase">Reference files (3 PDF slots)</p>
      {slots.map((asset, i) => (
        <div key={asset.id ?? i} className="rounded-lg border border-border p-3 space-y-2 bg-secondary/20">
          <p className="text-xs font-semibold text-primary-800">{asset.type}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <EditorField label="Title">
              <input
                className={inputClass}
                value={asset.title}
                onChange={(e) => patchAsset(i, { ...asset, title: e.target.value })}
              />
            </EditorField>
            <EditorField label="File key" hint="Auto-generated from chapter/section">
              <input
                className={inputClass}
                value={asset.fileKey ?? ""}
                onChange={(e) => patchAsset(i, { ...asset, fileKey: e.target.value })}
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
          <InlineFileUpload
            moduleSlug={moduleSlug}
            requiredTier={requiredTier}
            assetKey={asset.fileKey ?? ""}
            fileName={asset.fileName}
            uploading={uploadingId === (asset.id ?? String(i))}
            onPickFile={(file) => handleUpload(i, file, asset)}
            accept="application/pdf"
          />
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
  const data = (payload as PlaybookPayload) ?? { chapters: [] };
  const chapters: PlaybookChapterRecord[] = data.chapters ?? [];
  const hubHero = mergePlaybookHubHero(data.hubHero);

  function emit(nextChapters: PlaybookChapterRecord[], nextHero?: Partial<PlaybookHubHeroCopy>) {
    onChange({
      ...data,
      ...playbookPayloadFromEditorChapters(nextChapters, nextHero ?? data.hubHero),
    });
  }

  function patchHubHero(updates: Partial<PlaybookHubHeroCopy>) {
    emit(chapters, { ...hubHero, ...updates });
  }

  function patchChapter(i: number, ch: PlaybookChapterRecord) {
    const next = [...chapters];
    next[i] = ch;
    emit(next);
  }

  function patchSection(ci: number, si: number, sec: PlaybookSectionBody) {
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
    emit([...chapters, newChapter(chapters.length)]);
  }

  function deleteChapter(i: number) {
    if (!confirm("Delete this chapter?")) return;
    emit(chapters.filter((_, j) => j !== i));
  }

  return (
    <div className="space-y-4">
      <EditorSection
        title="Hub hero strip"
        description="Blue banner at the top of /playbook — badge, title, and description. Progress stats stay dynamic."
      >
        <p className="text-xs font-semibold text-gray-700">Pro members</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <EditorField label="Badge">
            <input className={inputClass} value={hubHero.proBadge} onChange={(e) => patchHubHero({ proBadge: e.target.value })} />
          </EditorField>
          <EditorField label="Title">
            <input className={inputClass} value={hubHero.proTitle} onChange={(e) => patchHubHero({ proTitle: e.target.value })} />
          </EditorField>
        </div>
        <EditorField label="Description" hint="Use {chapterCount} and {sectionCount} for live counts">
          <textarea className={textareaClass} rows={3} value={hubHero.proDescription} onChange={(e) => patchHubHero({ proDescription: e.target.value })} />
        </EditorField>

        <p className="text-xs font-semibold text-gray-700 pt-2">Starter preview</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <EditorField label="Badge">
            <input className={inputClass} value={hubHero.previewBadge} onChange={(e) => patchHubHero({ previewBadge: e.target.value })} />
          </EditorField>
          <EditorField label="Title">
            <input className={inputClass} value={hubHero.previewTitle} onChange={(e) => patchHubHero({ previewTitle: e.target.value })} />
          </EditorField>
        </div>
        <EditorField label="Description">
          <textarea className={textareaClass} rows={3} value={hubHero.previewDescription} onChange={(e) => patchHubHero({ previewDescription: e.target.value })} />
        </EditorField>
      </EditorSection>

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
                  <EditorField label="Paragraphs" hint="One paragraph per line. Keep **term** markers so glossary links stay blue on the member page."><textarea className={textareaClass} rows={6} value={(sec.paragraphs ?? []).join("\n")} onChange={(e) => patchSection(ci, si, { ...sec, paragraphs: e.target.value.split("\n") })} /></EditorField>
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
                    sectionTitle={sec.title}
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
    </div>
  );
}
