"use client";

import React, { useRef, useState } from "react";
import { Plus, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DEFAULT_LIBRARY_HERO, normalizeLibraryPayload, type LibraryHeroCopy, type LibrarySectionCopy } from "@/lib/content/library-schema";
import { EditorField, EditorSection, TrackToggle, inputClass, textareaClass } from "./shared";

interface LibraryFile {
  id: string;
  label: string;
  fileName: string;
  assetId: string;
  mimeType: string;
  delivery: "view-only" | "download";
  track: "career" | "sales" | "both";
  accessTier: "free" | "elite";
}

function newFile(): LibraryFile {
  return {
    id: `lib-${Date.now()}`,
    label: "",
    fileName: "",
    assetId: "",
    mimeType: "application/pdf",
    delivery: "view-only",
    track: "both",
    accessTier: "elite",
  };
}

export function LibraryEditor({
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
  const data = normalizeLibraryPayload(payload);
  const files: LibraryFile[] = data.files;
  const hero = data.hero;
  const freeSection = data.freeSection;
  const eliteSection = data.eliteSection;
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadMsg, setUploadMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<string | null>(null);

  function emit(next: {
    files?: LibraryFile[];
    hero?: LibraryHeroCopy;
    freeSection?: LibrarySectionCopy;
    eliteSection?: LibrarySectionCopy;
  }) {
    onChange({
      files: next.files ?? files,
      hero: next.hero ?? hero,
      freeSection: next.freeSection ?? freeSection,
      eliteSection: next.eliteSection ?? eliteSection,
    });
  }

  function patchHero(updates: Partial<LibraryHeroCopy>) {
    emit({ hero: { ...hero, ...updates } });
  }

  function patchFreeSection(updates: Partial<LibrarySectionCopy>) {
    emit({ freeSection: { ...freeSection, ...updates } });
  }

  function patchEliteSection(updates: Partial<LibrarySectionCopy>) {
    emit({ eliteSection: { ...eliteSection, ...updates } });
  }

  function patchFile(i: number, f: LibraryFile) {
    const next = [...files];
    next[i] = f;
    emit({ files: next });
  }

  function deleteFile(i: number) {
    if (!confirm("Delete this file?")) return;
    emit({ files: files.filter((_, j) => j !== i) });
  }

  function addFile() {
    emit({ files: [...files, newFile()] });
  }

  async function uploadFile(file: File, fileId: string, idx: number) {
    setUploading(fileId);
    setUploadMsg("");
    const accessTier = files[idx].accessTier ?? "elite";
    const form = new FormData();
    form.append("file", file);
    form.append("moduleSlug", moduleSlug);
    form.append("requiredTier", accessTier === "free" ? "STARTER" : requiredTier);
    form.append("assetKey", `library/${fileId}`);
    const res = await fetch("/api/admin/content/assets", { method: "POST", body: form });
    if (res.ok) {
      const data = await res.json();
      patchFile(idx, {
        ...files[idx],
        fileName: data.fileName,
        assetId: data.id,
        mimeType: file.type || "application/octet-stream",
      });
      setUploadMsg(`Uploaded ${data.fileName}`);
    } else {
      const data = await res.json();
      setUploadMsg(data.error || "Upload failed");
    }
    setUploading(null);
  }

  return (
    <div className="space-y-4">
      <EditorSection
        title="Page hero strip"
        description="Blue banner on /library — kicker, title, and description. Same copy fields as other CMS pages. Empty fields fall back to the current Resource Library strip. The dashboard Library Resources card is a link only; this strip is the /library page."
        defaultOpen
      >
        <EditorField label="Kicker / eyebrow">
          <input
            className={inputClass}
            value={hero.eyebrow}
            onChange={(e) => patchHero({ eyebrow: e.target.value })}
            placeholder={DEFAULT_LIBRARY_HERO.eyebrow}
          />
        </EditorField>
        <EditorField label="Title">
          <input
            className={inputClass}
            value={hero.title}
            onChange={(e) => patchHero({ title: e.target.value })}
            placeholder={DEFAULT_LIBRARY_HERO.title}
          />
        </EditorField>
        <EditorField
          label="Description"
          hint="Shown under the title on the navy strip. This page does not use a separate disclaimer field."
        >
          <textarea
            className={textareaClass}
            rows={3}
            value={hero.description}
            onChange={(e) => patchHero({ description: e.target.value })}
            placeholder={DEFAULT_LIBRARY_HERO.description}
          />
        </EditorField>
      </EditorSection>
      <EditorSection
        title="List headings"
        description="Headings above the free and Elite file lists on /library (not the navy strip). Blank fields fall back to the current copy."
        defaultOpen
      >
        <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider">Elite Resources</p>
        <EditorField label="Elite heading">
          <input
            className={inputClass}
            value={eliteSection.title}
            onChange={(e) => patchEliteSection({ title: e.target.value })}
            placeholder="Elite Resources"
          />
        </EditorField>
        <EditorField label="Elite caption">
          <textarea
            className={textareaClass}
            rows={2}
            value={eliteSection.description}
            onChange={(e) => patchEliteSection({ description: e.target.value })}
            placeholder="Bonus guides and reference materials for Elite members."
          />
        </EditorField>
        <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider pt-2">Free Resources</p>
        <EditorField label="Free heading">
          <input
            className={inputClass}
            value={freeSection.title}
            onChange={(e) => patchFreeSection({ title: e.target.value })}
            placeholder="Free Resources"
          />
        </EditorField>
        <EditorField label="Free caption">
          <textarea
            className={textareaClass}
            rows={2}
            value={freeSection.description}
            onChange={(e) => patchFreeSection({ description: e.target.value })}
            placeholder="Available to all logged-in members."
          />
        </EditorField>
      </EditorSection>
      <p className="text-xs text-muted-fg">
        Published files appear on the member <strong>Resource Library</strong> at <strong>/library</strong> and as the
        Elite <strong>Library Resources</strong> dashboard card. Free files are open to any logged-in member; Elite files
        show with a lock until the member is Elite. Add as many files as you need — this is not limited to a few slots.
        For playbook chapter files, use Full Playbook → section attachments.
      </p>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-fg">{files.length} library files</p>
        <Button variant="outline" size="sm" onClick={addFile}>
          <Plus className="w-3.5 h-3.5" /> Add file
        </Button>
      </div>

      <input
        ref={fileRef}
        type="file"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          const id = uploadTargetRef.current;
          if (f && id) {
            const idx = files.findIndex((x) => x.id === id);
            if (idx !== -1) uploadFile(f, id, idx);
          }
          e.target.value = "";
        }}
      />

      <div className="space-y-3">
        {files.map((f, i) => (
          <div key={f.id} className="border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-1 grid gap-3 sm:grid-cols-2">
                <EditorField label="Label">
                  <input
                    className={inputClass}
                    value={f.label}
                    onChange={(e) => patchFile(i, { ...f, label: e.target.value })}
                    placeholder="e.g. Crude Hedging Guide"
                  />
                </EditorField>
                <EditorField label="Delivery">
                  <div className="inline-flex rounded-lg border border-border overflow-hidden text-xs font-semibold">
                    {(["view-only", "download"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => patchFile(i, { ...f, delivery: opt })}
                        className={cn(
                          "px-3 py-1.5 transition-colors",
                          f.delivery === opt
                            ? "bg-primary-soft text-primary-400"
                            : "bg-white text-muted-fg hover:bg-secondary/60"
                        )}
                      >
                        {opt === "view-only" ? "View Only" : "Download"}
                      </button>
                    ))}
                  </div>
                </EditorField>
                <EditorField label="Access">
                  <div className="inline-flex rounded-lg border border-border overflow-hidden text-xs font-semibold">
                    {(["free", "elite"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => patchFile(i, { ...f, accessTier: opt })}
                        className={cn(
                          "px-3 py-1.5 transition-colors",
                          f.accessTier === opt
                            ? "bg-primary-soft text-primary-400"
                            : "bg-white text-muted-fg hover:bg-secondary/60"
                        )}
                      >
                        {opt === "free" ? "Free" : "Elite"}
                      </button>
                    ))}
                  </div>
                </EditorField>
                <EditorField label="Track">
                  <TrackToggle value={f.track} onChange={(v) => patchFile(i, { ...f, track: v })} />
                </EditorField>
              </div>
              <button
                type="button"
                onClick={() => deleteFile(i)}
                className="text-red-400 hover:text-red-600 p-1 mt-5"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => { uploadTargetRef.current = f.id; fileRef.current?.click(); }}
                disabled={uploading === f.id}
                className="flex items-center gap-2 text-xs px-3 py-1.5 border border-dashed border-border rounded-lg hover:border-primary-400 hover:bg-secondary/40 transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-primary-400" />
                {uploading === f.id ? "Uploading..." : f.fileName ? "Replace file" : "Upload file"}
              </button>
              {f.fileName && <span className="text-xs text-muted-fg truncate max-w-xs">{f.fileName}</span>}
            </div>
          </div>
        ))}
        {files.length === 0 && (
          <p className="text-center text-sm text-muted-fg py-8">No library files yet.</p>
        )}
      </div>

      {uploadMsg && (
        <p className="text-xs px-3 py-2 rounded-lg bg-green-50 text-green-800">{uploadMsg}</p>
      )}
    </div>
  );
}
