"use client";

import React, { useRef, useState } from "react";
import { Plus, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditorField, TrackToggle, inputClass } from "./shared";

interface NavGuide {
  id: string;
  label: string;
  fileName: string;
  assetId: string;
  track: "career" | "sales" | "both";
  updatedAt: string;
}

function newGuide(): NavGuide {
  return {
    id: `ng-${Date.now()}`,
    label: "",
    fileName: "",
    assetId: "",
    track: "both",
    updatedAt: new Date().toISOString(),
  };
}

export function NavigationGuideEditor({
  guides,
  onChange,
  moduleSlug,
  requiredTier,
}: {
  guides: NavGuide[];
  onChange: (g: NavGuide[]) => void;
  moduleSlug: string;
  requiredTier: string;
}) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadMsg, setUploadMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<string | null>(null);

  function patchGuide(i: number, g: NavGuide) {
    const next = [...guides];
    next[i] = g;
    onChange(next);
  }

  function deleteGuide(i: number) {
    if (!confirm("Delete this guide?")) return;
    onChange(guides.filter((_, j) => j !== i));
  }

  function addGuide() {
    onChange([...guides, newGuide()]);
  }

  async function uploadFile(file: File, guideId: string, idx: number) {
    setUploading(guideId);
    setUploadMsg("");
    const form = new FormData();
    form.append("file", file);
    form.append("moduleSlug", moduleSlug);
    form.append("requiredTier", requiredTier);
    form.append("assetKey", `nav-guide-${guideId}`);
    const res = await fetch("/api/admin/content/assets", { method: "POST", body: form });
    if (res.ok) {
      const data = await res.json();
      patchGuide(idx, { ...guides[idx], fileName: data.fileName, assetId: data.id, updatedAt: new Date().toISOString() });
      setUploadMsg(`Uploaded ${data.fileName}`);
    } else {
      const data = await res.json();
      setUploadMsg(data.error || "Upload failed");
    }
    setUploading(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-fg">{guides.length} guide PDFs</p>
        <Button variant="outline" size="sm" onClick={addGuide}>
          <Plus className="w-3.5 h-3.5" /> Add guide
        </Button>
      </div>

      <input
        ref={fileRef}
        type="file"
        className="sr-only"
        accept=".pdf,.doc,.docx"
        onChange={(e) => {
          const f = e.target.files?.[0];
          const id = uploadTargetRef.current;
          if (f && id) {
            const idx = guides.findIndex((g) => g.id === id);
            if (idx !== -1) uploadFile(f, id, idx);
          }
          e.target.value = "";
        }}
      />

      <div className="space-y-3">
        {guides.map((g, i) => (
          <div key={g.id} className="border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 grid gap-3 sm:grid-cols-2">
                <EditorField label="Label">
                  <input className={inputClass} value={g.label} onChange={(e) => patchGuide(i, { ...g, label: e.target.value })} placeholder="e.g. Crude Trading Navigation" />
                </EditorField>
                <EditorField label="Track">
                  <TrackToggle value={g.track} onChange={(v) => patchGuide(i, { ...g, track: v })} />
                </EditorField>
              </div>
              <button type="button" onClick={() => deleteGuide(i)} className="text-red-400 hover:text-red-600 p-1 mt-5">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => { uploadTargetRef.current = g.id; fileRef.current?.click(); }}
                disabled={uploading === g.id}
                className="flex items-center gap-2 text-xs px-3 py-1.5 border border-dashed border-border rounded-lg hover:border-primary-400 hover:bg-secondary/40 transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-primary-400" />
                {uploading === g.id ? "Uploading..." : g.fileName ? "Replace file" : "Upload PDF"}
              </button>
              {g.fileName && <span className="text-xs text-muted-fg truncate max-w-xs">{g.fileName}</span>}
            </div>
          </div>
        ))}
        {guides.length === 0 && (
          <p className="text-center text-sm text-muted-fg py-8">No guides yet.</p>
        )}
      </div>

      {uploadMsg && (
        <p className="text-xs px-3 py-2 rounded-lg bg-green-50 text-green-800">{uploadMsg}</p>
      )}
    </div>
  );
}
