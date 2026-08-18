"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_MENTOR_CONNECT_CONTENT,
  type MentorConnectCategory,
  type MentorConnectContent,
} from "@/data/mentor-connect-content";
import { normalizeMentorConnectPayload } from "@/lib/content/mentor-connect-schema";
import { EditorField, EditorSection, TrackToggle, inputClass, textareaClass } from "./shared";

function newCategory(): MentorConnectCategory {
  return { id: `mc-${Date.now()}`, label: "", track: "both" };
}

export function MentorConnectEditor({
  payload,
  onChange,
}: {
  payload: unknown;
  onChange: (p: unknown) => void;
}) {
  const content: MentorConnectContent = normalizeMentorConnectPayload(
    payload ?? DEFAULT_MENTOR_CONNECT_CONTENT
  );

  function patch(next: MentorConnectContent) {
    onChange(next);
  }

  function patchCategory(i: number, cat: MentorConnectCategory) {
    const next = [...content.categories];
    next[i] = cat;
    patch({ ...content, categories: next });
  }

  function patchStep(i: number, step: MentorConnectContent["howItWorks"]["steps"][number]) {
    const next = [...content.howItWorks.steps];
    next[i] = step;
    patch({ ...content, howItWorks: { ...content.howItWorks, steps: next } });
  }

  function deleteCategory(i: number) {
    if (!confirm("Delete this category?")) return;
    patch({ ...content, categories: content.categories.filter((_, j) => j !== i) });
  }

  function addCategory() {
    patch({ ...content, categories: [...content.categories, newCategory()] });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-fg bg-secondary/50 rounded-lg px-3 py-2">
        Edit copy on <code className="text-[11px]">/mentor-connect</code>. With{" "}
        <strong>Published</strong> checked, Save updates the live page. In the hero subtitle and step 01
        body, use <code className="text-[11px]">{`{mentorCount}`}</code> and{" "}
        <code className="text-[11px]">{`{segmentCount}`}</code> for live practitioner/segment counts.
      </p>

      <EditorSection title="Page hero" description="Eyebrow, title, and subtitle on the Mentor Connect page" defaultOpen>
        <div className="grid gap-4 sm:grid-cols-2">
          <EditorField label="Eyebrow (pill label)">
            <input
              className={inputClass}
              value={content.hero.eyebrow}
              onChange={(e) => patch({ ...content, hero: { ...content.hero, eyebrow: e.target.value } })}
            />
          </EditorField>
          <EditorField label="Title">
            <input
              className={inputClass}
              value={content.hero.title}
              onChange={(e) => patch({ ...content, hero: { ...content.hero, title: e.target.value } })}
            />
          </EditorField>
        </div>
        <EditorField
          label="Subtitle"
          hint="Supports {mentorCount} and {segmentCount} placeholders for live stats."
        >
          <textarea
            className={textareaClass}
            value={content.hero.subtitle}
            onChange={(e) => patch({ ...content, hero: { ...content.hero, subtitle: e.target.value } })}
          />
        </EditorField>
      </EditorSection>

      <EditorSection
        title="How the session works"
        description="Three step cards and the anonymity callout at the bottom of the page"
      >
        <EditorField label="Section title">
          <input
            className={inputClass}
            value={content.howItWorks.title}
            onChange={(e) =>
              patch({ ...content, howItWorks: { ...content.howItWorks, title: e.target.value } })
            }
          />
        </EditorField>

        <div className="space-y-3 mt-4">
          {content.howItWorks.steps.map((step, i) => (
            <div key={step.num} className="border border-border rounded-lg p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider">
                Step {step.num}
              </p>
              <EditorField label="Title">
                <input
                  className={inputClass}
                  value={step.title}
                  onChange={(e) => patchStep(i, { ...step, title: e.target.value })}
                />
              </EditorField>
              <EditorField
                label="Body"
                hint={
                  step.num === "01"
                    ? "Supports {mentorCount} and {segmentCount} placeholders for live stats."
                    : undefined
                }
              >
                <textarea
                  className={textareaClass}
                  value={step.body}
                  onChange={(e) => patchStep(i, { ...step, body: e.target.value })}
                />
              </EditorField>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-border space-y-3">
          <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider">
            Anonymity callout (blue strip)
          </p>
          <EditorField label="Title">
            <input
              className={inputClass}
              value={content.howItWorks.callout.title}
              onChange={(e) =>
                patch({
                  ...content,
                  howItWorks: {
                    ...content.howItWorks,
                    callout: { ...content.howItWorks.callout, title: e.target.value },
                  },
                })
              }
            />
          </EditorField>
          <EditorField label="Body">
            <textarea
              className={textareaClass}
              value={content.howItWorks.callout.body}
              onChange={(e) =>
                patch({
                  ...content,
                  howItWorks: {
                    ...content.howItWorks,
                    callout: { ...content.howItWorks.callout, body: e.target.value },
                  },
                })
              }
            />
          </EditorField>
        </div>
      </EditorSection>

      <EditorSection title="Subject categories" description="Optional taxonomy labels (legacy admin field)">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-fg">{content.categories.length} categories</p>
          <Button variant="outline" size="sm" onClick={addCategory}>
            <Plus className="w-3.5 h-3.5" /> Add category
          </Button>
        </div>

        <div className="space-y-2">
          {content.categories.map((cat, i) => (
            <div key={cat.id} className="flex items-center gap-3 p-3 border border-border rounded-lg">
              <div className="flex-1 grid gap-3 sm:grid-cols-2">
                <EditorField label="Label">
                  <input
                    className={inputClass}
                    value={cat.label}
                    onChange={(e) => patchCategory(i, { ...cat, label: e.target.value })}
                    placeholder="e.g. Crude Oil Desk"
                  />
                </EditorField>
                <EditorField label="Track">
                  <TrackToggle
                    value={cat.track}
                    onChange={(v) => patchCategory(i, { ...cat, track: v })}
                  />
                </EditorField>
              </div>
              <button
                type="button"
                onClick={() => deleteCategory(i)}
                className="text-red-400 hover:text-red-600 p-1 shrink-0 mt-5"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {content.categories.length === 0 && (
            <p className="text-center text-sm text-muted-fg py-4">No categories configured.</p>
          )}
        </div>
      </EditorSection>
    </div>
  );
}
