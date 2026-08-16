"use client";

import React, { useRef, useState } from "react";
import { FileJson, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditorSection } from "./shared";

export function JsonImportSection({
  title = "Import JSON",
  description,
  exampleJson,
  exampleFileName,
  onImport,
}: {
  title?: string;
  description: string;
  exampleJson: string;
  exampleFileName: string;
  onImport: (parsed: unknown) => { ok: true } | { ok: false; error: string };
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  function downloadExample() {
    const blob = new Blob([exampleJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exampleFileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importFile(file: File) {
    setMessage("");
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const result = onImport(parsed);
      if (result.ok) {
        setMessage(`Imported from ${file.name}. Review below, then click Save to publish.`);
        setIsError(false);
      } else {
        setMessage(result.error);
        setIsError(true);
      }
    } catch {
      setMessage("Invalid JSON file — check format and try again.");
      setIsError(true);
    }
  }

  return (
    <EditorSection title={`📥 ${title}`} description={description}>
      <p className="text-xs text-muted-fg">
        Upload a <code className="text-[11px] bg-secondary px-1 rounded">.json</code> file using the template below.
        Imported content loads into the editor only — click <strong>Save</strong> to publish to the site.
      </p>
      <button
        type="button"
        onClick={downloadExample}
        className="inline-flex items-center gap-2 text-xs text-primary-400 hover:underline"
      >
        <Download className="w-3.5 h-3.5" />
        Download example template
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) importFile(f);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 border border-dashed rounded-lg p-4 cursor-pointer hover:border-primary-400 hover:bg-secondary/40 transition-colors"
      >
        <FileJson className="w-4 h-4 text-primary-400" />
        <span className="text-sm font-medium">Import JSON file</span>
      </button>
      {message && (
        <p
          className={cn(
            "text-xs px-3 py-2 rounded-lg",
            isError ? "bg-red-50 text-red-700" : "bg-green-50 text-green-800"
          )}
        >
          {message}
        </p>
      )}
    </EditorSection>
  );
}
