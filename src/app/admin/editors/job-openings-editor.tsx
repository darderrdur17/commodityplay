"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DEFAULT_JOB_OPENINGS_HERO,
  mergeJobOpeningsHero,
  type JobOpeningsHero,
} from "@/data/job-openings-content";
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
  hero?: Partial<JobOpeningsHero>;
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
    hero: data.hero,
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

function HeroTab({ data, onChange }: { data: JobOpeningsPayload; onChange: (d: JobOpeningsPayload) => void }) {
  const stored = data.hero ?? {};
  const defaults = DEFAULT_JOB_OPENINGS_HERO;
  const merged = mergeJobOpeningsHero(stored);

  function statChips(): string[] {
    if (Array.isArray(stored.statChips)) return stored.statChips;
    return defaults.statChips;
  }

  function patch(updates: Partial<JobOpeningsHero>) {
    onChange({ ...data, hero: { ...stored, ...updates } });
  }

  function patchChip(i: number, value: string) {
    const next = [...statChips()];
    next[i] = value;
    patch({ statChips: next });
  }

  function addChip() {
    patch({ statChips: [...statChips(), ""] });
  }

  function removeChip(i: number) {
    patch({ statChips: statChips().filter((_, j) => j !== i) });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-fg">
        Top blue hero strip on <strong>/job-openings</strong> — eyebrow pill, headline, description,
        disclaimer (smaller muted text at the bottom of the strip), and stat chips.
      </p>
      <EditorField label="Eyebrow pill">
        <input
          className={inputClass}
          value={merged.eyebrow}
          onChange={(e) => patch({ eyebrow: e.target.value })}
        />
      </EditorField>
      <EditorField label="Title">
        <input
          className={inputClass}
          value={merged.title}
          onChange={(e) => patch({ title: e.target.value })}
        />
      </EditorField>
      <EditorField label="Description">
        <textarea
          className={textareaClass}
          value={merged.description}
          onChange={(e) => patch({ description: e.target.value })}
        />
      </EditorField>
      <EditorField
        label="Disclaimer"
        hint="Shown at the bottom of the navy strip in smaller muted white, same as Case Studies."
      >
        <textarea
          className={textareaClass}
          rows={3}
          value={merged.disclaimer}
          onChange={(e) => patch({ disclaimer: e.target.value })}
        />
      </EditorField>
      <EditorField
        label="Stat chips"
        hint="Use {count} for active roles and {regions} for region count."
      >
        <div className="space-y-2">
          {statChips().map((chip, i) => (
            <div key={i} className="flex gap-2">
              <input
                className={cn(inputClass, "flex-1")}
                value={chip}
                placeholder={i === 0 ? "{count} active roles" : "{regions} regions"}
                onChange={(e) => patchChip(i, e.target.value)}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => removeChip(i)}>
                Remove
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addChip}>
            Add chip
          </Button>
        </div>
      </EditorField>
    </div>
  );
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
  const [tab, setTab] = useState<"hero" | "listings">("hero");

  function commit(next: JobOpeningsPayload) {
    onChange(next);
  }

  function commitJobs(jobs: JobOpening[]) {
    commit({ ...data, jobs });
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
      <div className="flex gap-2 border-b border-border pb-2">
        {(
          [
            ["hero", "Top blue strip"],
            ["listings", "Job listings"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
              tab === id
                ? "bg-primary-400/10 text-primary-400"
                : "text-muted-fg hover:bg-secondary"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "hero" ? (
        <HeroTab data={data} onChange={commit} />
      ) : (
        <>
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
                    {item.company && (
                      <span className="ml-2 text-xs text-muted-fg">{item.company}</span>
                    )}
                    {item.level && (
                      <span className="ml-2 text-xs text-muted-fg">· {item.level}</span>
                    )}
                  </span>
                }
                onDelete={() => deleteItem(i)}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <EditorField label="Title">
                    <input
                      className={inputClass}
                      value={item.title}
                      onChange={(e) => patchItem(i, { ...item, title: e.target.value })}
                    />
                  </EditorField>
                  <EditorField label="Company">
                    <input
                      className={inputClass}
                      value={item.company}
                      onChange={(e) => patchItem(i, { ...item, company: e.target.value })}
                    />
                  </EditorField>
                  <EditorField label="Company type">
                    <select
                      className={inputClass}
                      value={item.companyType}
                      onChange={(e) => patchItem(i, { ...item, companyType: e.target.value })}
                    >
                      {["Major", "Independent", "Bank", "Utility", "Vendor"].map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </EditorField>
                  <EditorField label="Location">
                    <input
                      className={inputClass}
                      value={item.location}
                      onChange={(e) => patchItem(i, { ...item, location: e.target.value })}
                    />
                  </EditorField>
                  <EditorField label="Region">
                    <select
                      className={inputClass}
                      value={item.region}
                      onChange={(e) => patchItem(i, { ...item, region: e.target.value })}
                    >
                      {["Asia", "Europe", "Americas", "Middle East", "Global"].map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </EditorField>
                  <EditorField label="Level">
                    <select
                      className={inputClass}
                      value={item.level}
                      onChange={(e) => patchItem(i, { ...item, level: e.target.value })}
                    >
                      {["Junior", "Mid", "Senior", "Leadership"].map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </EditorField>
                  <EditorField label="Type">
                    <select
                      className={inputClass}
                      value={item.type}
                      onChange={(e) => patchItem(i, { ...item, type: e.target.value })}
                    >
                      {["Full-time", "Contract", "Internship"].map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </EditorField>
                  <EditorField label="Segment">
                    <input
                      className={inputClass}
                      value={item.segment}
                      onChange={(e) => patchItem(i, { ...item, segment: e.target.value })}
                    />
                  </EditorField>
                  <EditorField label="Posted (YYYY-MM-DD)">
                    <input
                      className={inputClass}
                      value={item.posted}
                      onChange={(e) => patchItem(i, { ...item, posted: e.target.value })}
                    />
                  </EditorField>
                  <EditorField label="Salary (optional)">
                    <input
                      className={inputClass}
                      value={item.salary ?? ""}
                      onChange={(e) => patchItem(i, { ...item, salary: e.target.value })}
                    />
                  </EditorField>
                  <EditorField label="Hirer email" hint="Required for Live Chat — receives question emails">
                    <input
                      className={inputClass}
                      value={item.hirerEmail ?? ""}
                      onChange={(e) => patchItem(i, { ...item, hirerEmail: e.target.value })}
                    />
                  </EditorField>
                  <EditorField label="Hirer name (optional)">
                    <input
                      className={inputClass}
                      value={item.hirerName ?? ""}
                      onChange={(e) => patchItem(i, { ...item, hirerName: e.target.value })}
                    />
                  </EditorField>
                </div>
                <EditorField label="Description">
                  <textarea
                    className={textareaClass}
                    rows={4}
                    value={item.description}
                    onChange={(e) => patchItem(i, { ...item, description: e.target.value })}
                  />
                </EditorField>
                <EditorField label="Requirements" hint="One per line">
                  <textarea
                    className={textareaClass}
                    value={(item.requirements ?? []).join("\n")}
                    onChange={(e) =>
                      patchItem(i, {
                        ...item,
                        requirements: e.target.value.split("\n").filter(Boolean),
                      })
                    }
                  />
                </EditorField>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.featured ?? false}
                    onChange={(e) => patchItem(i, { ...item, featured: e.target.checked })}
                  />
                  Featured listing
                </label>
              </EditorRow>
            ))}
            {items.length === 0 && (
              <p className="text-center text-sm text-muted-fg py-8">No job listings yet.</p>
            )}
          </div>
        </>
      )}

      <UploadSection moduleSlug={moduleSlug} requiredTier={requiredTier} />
    </div>
  );
}
