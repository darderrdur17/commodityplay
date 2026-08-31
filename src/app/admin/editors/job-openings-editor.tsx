"use client";

import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditorField, EditorRow, UploadSection, inputClass, textareaClass } from "./shared";

interface JobOpening {
  id: string;
  title: string;
  company: string;
  companyType: string;
  location: string;
  region: string;
  segment: string;
  level: string;
  type: string;
  posted: string;
  description: string;
  requirements: string[];
  salary?: string;
  featured?: boolean;
  hirerEmail?: string;
  hirerName?: string;
}

interface JobOpeningsPayload {
  jobs: JobOpening[];
  regions?: string[];
  levels?: string[];
  segments?: string[];
}

function readPayload(payload: unknown): JobOpeningsPayload {
  if (Array.isArray(payload)) {
    return { jobs: payload as JobOpening[] };
  }
  const data = (payload ?? {}) as Partial<JobOpeningsPayload>;
  return {
    jobs: data.jobs ?? [],
    regions: data.regions,
    levels: data.levels,
    segments: data.segments,
  };
}

function newJob(): JobOpening {
  return {
    id: `j-${Date.now()}`,
    title: "",
    company: "",
    companyType: "Independent",
    location: "",
    region: "Asia",
    segment: "Energy",
    level: "Junior",
    type: "Full-time",
    posted: new Date().toISOString().slice(0, 10),
    description: "",
    requirements: [],
  };
}

export function JobOpeningsEditor({
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
  const data = readPayload(payload);
  const items = data.jobs;

  function commitJobs(jobs: JobOpening[]) {
    onChange({ ...data, jobs });
  }

  function patchItem(i: number, item: JobOpening) {
    const next = [...items];
    next[i] = item;
    commitJobs(next);
  }

  function deleteItem(i: number) {
    if (!confirm("Delete this job?")) return;
    commitJobs(items.filter((_, j) => j !== i));
  }

  function addItem() {
    commitJobs([...items, newJob()]);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-fg">{items.length} listings</p>
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="w-3.5 h-3.5" /> Add job
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((item, i) => (
          <EditorRow
            key={item.id}
            summary={
              <span>
                <span className="font-medium">{item.title || "(untitled)"}</span>
                {item.company && <span className="ml-2 text-xs text-muted-fg">{item.company}</span>}
                {item.level && <span className="ml-2 text-xs text-muted-fg">· {item.level}</span>}
              </span>
            }
            onDelete={() => deleteItem(i)}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <EditorField label="Title">
                <input className={inputClass} value={item.title} onChange={(e) => patchItem(i, { ...item, title: e.target.value })} />
              </EditorField>
              <EditorField label="Company">
                <input className={inputClass} value={item.company} onChange={(e) => patchItem(i, { ...item, company: e.target.value })} />
              </EditorField>
              <EditorField label="Company type">
                <select className={inputClass} value={item.companyType} onChange={(e) => patchItem(i, { ...item, companyType: e.target.value })}>
                  {["Major", "Independent", "Bank", "Utility", "Vendor"].map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </EditorField>
              <EditorField label="Location">
                <input className={inputClass} value={item.location} onChange={(e) => patchItem(i, { ...item, location: e.target.value })} />
              </EditorField>
              <EditorField label="Region">
                <select className={inputClass} value={item.region} onChange={(e) => patchItem(i, { ...item, region: e.target.value })}>
                  {["Asia", "Europe", "Americas", "Middle East", "Global"].map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </EditorField>
              <EditorField label="Level">
                <select className={inputClass} value={item.level} onChange={(e) => patchItem(i, { ...item, level: e.target.value })}>
                  {["Junior", "Mid", "Senior", "Leadership"].map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </EditorField>
              <EditorField label="Type">
                <select className={inputClass} value={item.type} onChange={(e) => patchItem(i, { ...item, type: e.target.value })}>
                  {["Full-time", "Contract", "Internship"].map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </EditorField>
              <EditorField label="Segment">
                <input className={inputClass} value={item.segment} onChange={(e) => patchItem(i, { ...item, segment: e.target.value })} />
              </EditorField>
              <EditorField label="Posted (YYYY-MM-DD)">
                <input className={inputClass} value={item.posted} onChange={(e) => patchItem(i, { ...item, posted: e.target.value })} />
              </EditorField>
              <EditorField label="Salary (optional)">
                <input className={inputClass} value={item.salary ?? ""} onChange={(e) => patchItem(i, { ...item, salary: e.target.value })} />
              </EditorField>
              <EditorField label="Hirer email" hint="Required for Live Chat — receives question emails">
                <input className={inputClass} value={item.hirerEmail ?? ""} onChange={(e) => patchItem(i, { ...item, hirerEmail: e.target.value })} />
              </EditorField>
              <EditorField label="Hirer name (optional)">
                <input className={inputClass} value={item.hirerName ?? ""} onChange={(e) => patchItem(i, { ...item, hirerName: e.target.value })} />
              </EditorField>
            </div>
            <EditorField label="Description">
              <textarea className={textareaClass} rows={4} value={item.description} onChange={(e) => patchItem(i, { ...item, description: e.target.value })} />
            </EditorField>
            <EditorField label="Requirements" hint="One per line">
              <textarea className={textareaClass} value={(item.requirements ?? []).join("\n")} onChange={(e) => patchItem(i, { ...item, requirements: e.target.value.split("\n").filter(Boolean) })} />
            </EditorField>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={item.featured ?? false} onChange={(e) => patchItem(i, { ...item, featured: e.target.checked })} />
              Featured listing
            </label>
          </EditorRow>
        ))}
        {items.length === 0 && (
          <p className="text-center text-sm text-muted-fg py-8">No job listings yet.</p>
        )}
      </div>

      <UploadSection moduleSlug={moduleSlug} requiredTier={requiredTier} />
    </div>
  );
}
