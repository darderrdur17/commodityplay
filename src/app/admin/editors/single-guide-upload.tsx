"use client";

import React, { useRef, useState } from "react";
import { Upload, Trash2 } from "lucide-react";
import { EditorField, inputClass } from "./shared";

export interface GuideAttachment {
  label: string;
  fileName: string;
  assetId: string;
  mimeType: string;
}

export function SingleGuideUpload({
  guide,
  onChange,
  moduleSlug,
  requiredTier,
  assetKey,
  defaultLabel,
  description,
  accept = ".pdf",
}: {
  guide: GuideAttachment | null;
  onChange: (g: GuideAttachment | null) => void;
  moduleSlug: string;
  requiredTier: string;
  assetKey: string;
  defaultLabel: string;
  description?: string;
  accept?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const current: GuideAttachment = guide ?? {
    label: defaultLabel,
    fileName: "",
    assetId: "",
    mimeType: "application/pdf",
  };

  async function uploadFile(file: File) {
    setUploading(true);
    setUploadMsg("");
    const form = new FormData();
    form.append("file", file);
    form.append("moduleSlug", moduleSlug);
    form.append("requiredTier", requiredTier);
    form.append("assetKey", assetKey);
    const res = await fetch("/api/admin/content/assets", { method: "POST", body: form });
    if (res.ok) {
      const data = await res.json();
      onChange({
        label: current.label || defaultLabel,
        fileName: data.fileName,
        assetId: data.id,
        mimeType: file.type || "application/pdf",
      });
      setUploadMsg(`Uploaded ${data.fileName}`);
    } else {
      const data = await res.json();
      setUploadMsg(data.error || "Upload failed");
    }
    setUploading(false);
  }

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      {description && <p className="text-xs text-muted-fg">{description}</p>}
      <EditorField label="Label">
        <input
          className={inputClass}
          value={current.label}
          onChange={(e) => onChange({ ...current, label: e.target.value })}
          placeholder={defaultLabel}
        />
      </EditorField>
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 text-xs px-3 py-1.5 border border-dashed border-border rounded-lg hover:border-primary-400 hover:bg-secondary/40 transition-colors"
        >
          <Upload className="w-3.5 h-3.5 text-primary-400" />
          {uploading ? "Uploading..." : current.fileName ? "Replace PDF" : "Upload PDF"}
        </button>
        {current.fileName && (
          <span className="text-xs text-muted-fg truncate max-w-xs">{current.fileName}</span>
        )}
        {current.assetId && (
          <button
            type="button"
            onClick={() => {
              if (confirm("Remove this guide?")) onChange(null);
            }}
            className="text-red-400 hover:text-red-600 p-1"
            title="Remove guide"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        className="sr-only"
        accept={accept}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) uploadFile(f);
          e.target.value = "";
        }}
      />
      {uploadMsg && (
        <p className={`text-xs px-3 py-2 rounded-lg ${uploadMsg.includes("failed") || uploadMsg.includes("Upload failed") ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>
          {uploadMsg}
        </p>
      )}
    </div>
  );
}
