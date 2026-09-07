"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Save, RotateCcw, Undo2, Upload, Download, Trash2, Copy, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CONTENT_ASSET_ACCEPT,
  CONTENT_ASSET_MAX_BYTES,
  buildContentAssetKey,
  formatAssetTypeLabel,
  validateContentAssetFile,
} from "@/lib/content/asset-files";

// ─── Base UI primitives ───────────────────────────────────────────────────────

export const inputClass =
  "w-full h-9 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400";
export const textareaClass =
  "w-full min-h-[72px] px-3 py-2 rounded-lg border border-border text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 resize-y";

export function EditorField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="block space-y-1.5">
      <span className="text-xs font-semibold text-gray-700">{label}</span>
      {hint && <span className="block text-[11px] text-muted-fg">{hint}</span>}
      {children}
    </div>
  );
}

export function EditorSection({
  title,
  description,
  defaultOpen = false,
  children,
}: {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-secondary/60 hover:bg-secondary text-left"
      >
        {open ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
        <div>
          <p className="font-semibold text-sm text-gray-900">{title}</p>
          {description && <p className="text-xs text-muted-fg mt-0.5">{description}</p>}
        </div>
      </button>
      {open && <div className="p-4 space-y-4 border-t border-border">{children}</div>}
    </div>
  );
}

/** Expandable table row with edit/delete */
export function EditorRow({
  summary,
  onDelete,
  defaultOpen = false,
  children,
}: {
  summary: React.ReactNode;
  onDelete?: () => void;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-secondary/30 hover:bg-secondary/60">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex-1 text-left flex items-center gap-2"
        >
          {open ? <ChevronDown className="w-3.5 h-3.5 shrink-0 text-muted-fg" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-fg" />}
          <span className="text-sm">{summary}</span>
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="text-red-400 hover:text-red-600 p-1 shrink-0"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {open && <div className="p-4 space-y-3 border-t border-border">{children}</div>}
    </div>
  );
}

export function TrackBadge({ track }: { track: "Career" | "Sales" | "Both" | "Elite" }) {
  const colors: Record<string, string> = {
    Career: "bg-blue-100 text-blue-700",
    Sales: "bg-violet-100 text-violet-700",
    Both: "bg-emerald-100 text-emerald-700",
    Elite: "bg-amber-100 text-amber-700",
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold", colors[track])}>
      {track} Track
    </span>
  );
}

export function TrackToggle({
  value,
  onChange,
}: {
  value: "career" | "sales" | "both";
  onChange: (v: "career" | "sales" | "both") => void;
}) {
  const options: { id: "career" | "sales" | "both"; label: string }[] = [
    { id: "career", label: "Career" },
    { id: "sales", label: "Sales" },
    { id: "both", label: "Both" },
  ];
  return (
    <div className="inline-flex rounded-lg border border-border overflow-hidden text-xs font-semibold">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={cn(
            "px-3 py-1.5 transition-colors",
            value === opt.id
              ? opt.id === "career"
                ? "bg-blue-100 text-blue-700"
                : opt.id === "sales"
                ? "bg-violet-100 text-violet-700"
                : "bg-emerald-100 text-emerald-700"
              : "bg-white text-muted-fg hover:bg-secondary/60"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Module Editor Hook ───────────────────────────────────────────────────────

export interface ModuleEditorState {
  payload: unknown;
  setPayload: (p: unknown) => void;
  requiredTier: string;
  setRequiredTier: (t: string) => void;
  published: boolean;
  setPublished: (v: boolean) => void;
  version: number;
  canRevert: boolean;
  loading: boolean;
  saving: boolean;
  message: string;
  isError: boolean;
  save: () => Promise<void>;
  revert: () => Promise<void>;
  reset: () => Promise<void>;
  reload: () => Promise<void>;
}

export function useModuleEditor(slug: string): ModuleEditorState {
  const [payload, setPayload] = useState<unknown>(null);
  const [requiredTier, setRequiredTier] = useState("PRO");
  const [published, setPublished] = useState(true);
  const [version, setVersion] = useState(0);
  const [canRevert, setCanRevert] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const slugRef = useRef(slug);
  slugRef.current = slug;

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/content/${slug}`, { cache: "no-store" });
      if (!res.ok) { setMessage("Failed to load module."); setIsError(true); return; }
      const data = await res.json();
      setPayload(data.payload);
      setRequiredTier(data.requiredTier ?? "PRO");
      setPublished(data.published ?? true);
      setVersion(data.version ?? 0);
      setCanRevert(Boolean(data.canRevert));
      setIsError(false);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/content/${slugRef.current}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload, requiredTier, published }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || data.details || "Save failed.");
        setIsError(true);
      } else {
        setVersion(data.version);
        setCanRevert(Boolean(data.canRevert));
        setMessage(`Saved v${data.version} — live after refresh.`);
        setIsError(false);
      }
    } finally {
      setSaving(false);
    }
  }, [payload, requiredTier, published]);

  const revert = useCallback(async () => {
    if (version <= 1) return;
    if (!confirm(`Revert to the previous saved version (v${version - 1})? Your current version will be archived.`)) {
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/content/${slugRef.current}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revertToPrevious: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Revert failed.");
        setIsError(true);
      } else {
        await load();
        setMessage(`Reverted to v${data.revertedTo} — now saved as v${data.version}. Refresh the live site to confirm.`);
        setIsError(false);
      }
    } finally {
      setSaving(false);
    }
  }, [load, version]);

  const reset = useCallback(async () => {
    if (!confirm("Reset all content to bundled code defaults? This replaces everything — use Revert for the previous saved version instead.")) return;
    setSaving(true);
    const res = await fetch(`/api/admin/content/${slugRef.current}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reset: true }),
    });
    if (res.ok) { await load(); setMessage("Reset to bundled defaults."); setIsError(false); }
    else { setMessage("Reset failed."); setIsError(true); }
    setSaving(false);
  }, [load]);

  return {
    payload,
    setPayload,
    requiredTier,
    setRequiredTier,
    published,
    setPublished,
    version,
    canRevert,
    loading,
    saving,
    message,
    isError,
    save,
    revert,
    reset,
    reload: load,
  };
}

// ─── SaveBar ─────────────────────────────────────────────────────────────────

export function SaveBar({
  slug,
  version,
  canRevert,
  requiredTier,
  setRequiredTier,
  published,
  setPublished,
  saving,
  message,
  isError,
  onSave,
  onRevert,
  onReset,
}: {
  slug: string;
  version: number;
  canRevert: boolean;
  requiredTier: string;
  setRequiredTier: (t: string) => void;
  published: boolean;
  setPublished: (v: boolean) => void;
  saving: boolean;
  message: string;
  isError: boolean;
  onSave: () => void;
  onRevert: () => void;
  onReset: () => void;
}) {
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-border px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-semibold text-gray-900 text-sm truncate">{slug}</span>
        <span className="text-xs text-muted-fg">v{version}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={requiredTier}
          onChange={(e) => setRequiredTier(e.target.value)}
          className="text-xs border border-border rounded-lg px-2 py-1.5"
        >
          <option value="STARTER">Starter</option>
          <option value="PRO">Pro</option>
          <option value="ELITE">Elite</option>
        </select>
        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          Published
        </label>
        <Button
          variant="outline"
          size="sm"
          onClick={onRevert}
          disabled={saving || !canRevert}
          title={canRevert ? `Restore version ${version - 1}` : "Save at least once to enable revert"}
        >
          <Undo2 className="w-3.5 h-3.5" /> Revert
        </Button>
        <Button variant="outline" size="sm" onClick={onReset} disabled={saving} title="Restore bundled code defaults">
          <RotateCcw className="w-3.5 h-3.5" /> Reset defaults
        </Button>
        <Button size="sm" onClick={onSave} loading={saving}>
          <Save className="w-3.5 h-3.5" /> Save
        </Button>
      </div>
      {message && (
        <div className={cn(
          "w-full text-xs px-3 py-2 rounded-lg",
          isError ? "bg-red-50 text-red-700" : "bg-green-50 text-green-800"
        )}>
          {message}
        </div>
      )}
    </div>
  );
}

// ─── File Upload Section ──────────────────────────────────────────────────────

interface AssetRow {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  moduleSlug: string | null;
  assetKey: string | null;
  requiredTier: string;
  label: string | null;
}

export function UploadSection({
  moduleSlug,
  requiredTier,
  filesOnlyHint = false,
}: {
  moduleSlug: string;
  requiredTier: string;
  /** When true, explains that uploads are reference files — not CMS text/JSON import */
  filesOnlyHint?: boolean;
}) {
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [assetKey, setAssetKey] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const loadAssets = useCallback(async () => {
    const res = await fetch("/api/admin/content/assets", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setAssets((data.assets as AssetRow[]).filter((a) => a.moduleSlug === moduleSlug));
    }
  }, [moduleSlug]);

  useEffect(() => { loadAssets(); }, [loadAssets]);

  async function uploadFile(file: File) {
    const err = validateContentAssetFile(file.name, file.size);
    if (err) { setMessage(err); return; }
    setUploading(true);
    setMessage("");
    const form = new FormData();
    form.append("file", file);
    form.append("moduleSlug", moduleSlug);
    form.append("requiredTier", requiredTier);
    form.append("assetKey", assetKey.trim() || buildContentAssetKey(moduleSlug, file.name));
    const res = await fetch("/api/admin/content/assets", { method: "POST", body: form });
    if (res.ok) {
      const data = await res.json();
      setMessage(`Uploaded ${data.fileName}`);
      setAssetKey("");
      await loadAssets();
    } else {
      const data = await res.json();
      setMessage(data.error || "Upload failed");
    }
    setUploading(false);
  }

  async function deleteAsset(id: string) {
    if (!confirm("Delete this file?")) return;
    await fetch(`/api/admin/content/assets/${id}`, { method: "DELETE" });
    await loadAssets();
  }

  function copyUrl(id: string) {
    navigator.clipboard.writeText(`${window.location.origin}/api/content/assets/${id}`);
    setMessage("URL copied.");
  }

  return (
    <EditorSection
      title="📎 Reference files"
      description={
        filesOnlyHint
          ? `Optional PDFs or docs for ${moduleSlug} — not used to populate Q&A in the editor`
          : `Assets for ${moduleSlug}`
      }
    >
      <p className="text-xs text-muted-fg">
        {filesOnlyHint ? (
          <>
            Stores downloadable files members can open (PDF, Word, images).{" "}
            <strong>Does not import questions into the site.</strong> Use <strong>Import JSON</strong> above for bulk
            Q&amp;A, then Save.
          </>
        ) : (
          <>PDF, Word, images, etc. (max {CONTENT_ASSET_MAX_BYTES / (1024 * 1024)}MB).</>
        )}
      </p>
      <input
        type="text"
        value={assetKey}
        onChange={(e) => setAssetKey(e.target.value)}
        placeholder={`Optional asset key (default: ${moduleSlug}/filename.pdf)`}
        className={inputClass}
      />
      <input
        ref={fileRef}
        type="file"
        className="sr-only"
        accept={CONTENT_ASSET_ACCEPT}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) uploadFile(f);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="w-full flex items-center justify-center gap-2 border border-dashed rounded-lg p-4 cursor-pointer hover:border-primary-400 hover:bg-secondary/40 transition-colors"
      >
        <Upload className="w-4 h-4 text-primary-400" />
        <span className="text-sm font-medium">{uploading ? "Uploading..." : "Upload new file"}</span>
      </button>
      {message && (
        <p className={cn("text-xs px-3 py-2 rounded-lg", message.includes("fail") || message.includes("error") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-800")}>
          {message}
        </p>
      )}
      <ul className="space-y-2 max-h-48 overflow-y-auto">
        {assets.length === 0 && <li className="text-xs text-muted-fg text-center py-2">No files yet.</li>}
        {assets.map((a) => (
          <li key={a.id} className="flex items-center gap-1 text-xs border border-border rounded-lg p-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{a.fileName}</p>
              <p className="text-muted-fg">{formatAssetTypeLabel(a.mimeType, a.fileName)} · {(a.size / 1024).toFixed(0)} KB</p>
            </div>
            <button type="button" onClick={() => copyUrl(a.id)} className="text-muted-fg p-1" title="Copy URL"><Copy className="w-3.5 h-3.5" /></button>
            <a href={`/api/content/assets/${a.id}`} className="text-primary-400 p-1" title="Download"><Download className="w-3.5 h-3.5" /></a>
            <button type="button" onClick={() => deleteAsset(a.id)} className="text-red-500 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
          </li>
        ))}
      </ul>
    </EditorSection>
  );
}

// ─── Inline file upload (per-row in Playbook / Starter / Library editors) ───

export function InlineFileUpload({
  moduleSlug,
  requiredTier,
  assetKey,
  fileName,
  uploading,
  accept = CONTENT_ASSET_ACCEPT,
  pickLabel = "Upload file",
  replaceLabel = "Replace file",
  onPickFile,
}: {
  moduleSlug: string;
  requiredTier: string;
  assetKey: string;
  fileName?: string;
  uploading?: boolean;
  accept?: string;
  pickLabel?: string;
  replaceLabel?: string;
  onPickFile: (file: File) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={fileRef}
        type="file"
        className="sr-only"
        accept={accept}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPickFile(f);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading || !assetKey.trim()}
        className="inline-flex items-center gap-2 text-xs px-3 py-1.5 border border-dashed border-border rounded-lg hover:border-primary-400 hover:bg-secondary/40 transition-colors disabled:opacity-50"
      >
        <Upload className="w-3.5 h-3.5 text-primary-400" />
        {uploading ? "Uploading..." : fileName ? replaceLabel : pickLabel}
      </button>
      {fileName && <span className="text-xs text-muted-fg truncate max-w-[200px]">{fileName}</span>}
      {assetKey && (
        <span className="text-[10px] text-muted-fg font-mono truncate max-w-full" title={assetKey}>
          {assetKey}
        </span>
      )}
    </div>
  );
}

export async function uploadContentAssetFile(input: {
  file: File;
  moduleSlug: string;
  requiredTier: string;
  assetKey: string;
}): Promise<{ id: string; fileName: string } | { error: string }> {
  const err = validateContentAssetFile(input.file.name, input.file.size);
  if (err) return { error: err };

  const form = new FormData();
  form.append("file", input.file);
  form.append("moduleSlug", input.moduleSlug);
  form.append("requiredTier", input.requiredTier);
  form.append("assetKey", input.assetKey.trim());

  const res = await fetch("/api/admin/content/assets", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) return { error: data.error || "Upload failed" };
  return { id: data.id, fileName: data.fileName };
}
