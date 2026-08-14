"use client";

import React, { useRef, useState } from "react";
import { Plus, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EditorField, TrackToggle, inputClass } from "./shared";

interface LibraryFile {
  id: string;
  label: string;
  fileName: string;
  assetId: string;
  mimeType: string;
  delivery: "view-only" | "download";
  track: "career" | "sales" | "both";
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
  const raw = payload as { files?: LibraryFile[] } | null;
  const files: LibraryFile[] = raw?.files ?? [];
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadMsg, setUploadMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<string | null>(null);

  function patchFile(i: number, f: LibraryFile) {
    const next = [...files];
    next[i] = f;
    onChange({ ...raw, files: next });
  }

  function deleteFile(i: number) {
    if (!confirm("Delete this file?")) return;
    onChange({ ...raw, files: files.filter((_, j) => j !== i) });
  }

  function addFile() {
    onChange({ ...raw, files: [...files, newFile()] });
  }

  async function uploadFile(file: File, fileId: string, idx: number) {
    setUploading(fileId);
    setUploadMsg("");
    const form = new FormData();
    form.append("file", file);
    form.append("moduleSlug", moduleSlug);
    form.append("requiredTier", requiredTier);
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
      <p className="text-xs text-muted-fg">
        Standalone Elite resources published at <strong>/library</strong>. For playbook chapter files, use Full Playbook → section attachments. For free starter downloads, use Starter Pack → Free Infographics.
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
