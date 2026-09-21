"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_MENTOR_CONNECT_CONTENT,
  type MentorConnectCategory,
  type MentorConnectContent,
  type MentorConnectSegmentCopy,
} from "@/data/mentor-connect-content";
import type { MentorApplyPageCopy } from "@/data/mentor-apply-content";
import { normalizeMentorConnectPayload, mergeMentorConnectSegmentCopy } from "@/lib/content/mentor-connect-schema";
import { EditorField, EditorSection, TrackToggle, inputClass, textareaClass } from "./shared";

function newCategory(): MentorConnectCategory {
  return { id: `mc-${Date.now()}`, label: "", track: "both" };
}

function LabelAndPlaceholder({
  labelCaption,
  placeholderCaption,
  label,
  placeholder,
  onLabel,
  onPlaceholder,
}: {
  labelCaption: string;
  placeholderCaption: string;
  label: string;
  placeholder: string;
  onLabel: (v: string) => void;
  onPlaceholder: (v: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <EditorField label={labelCaption}>
        <input className={inputClass} value={label} onChange={(e) => onLabel(e.target.value)} />
      </EditorField>
      <EditorField label={placeholderCaption}>
        <input className={inputClass} value={placeholder} onChange={(e) => onPlaceholder(e.target.value)} />
      </EditorField>
    </div>
  );
}

export function MentorConnectEditor({
  payload,
  onChange,
  focus = "connect",
}: {
  payload: unknown;
  onChange: (p: unknown) => void;
  focus?: "connect" | "apply";
}) {
  const content: MentorConnectContent = normalizeMentorConnectPayload(
    payload ?? DEFAULT_MENTOR_CONNECT_CONTENT
  );
  const apply = content.application;

  function patch(next: MentorConnectContent) {
    onChange(next);
  }

  function patchApply(updates: Partial<MentorApplyPageCopy>) {
    patch({ ...content, application: { ...apply, ...updates } });
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

  function patchSegment(i: number, segment: MentorConnectSegmentCopy) {
    const next = [...mergedSegments];
    next[i] = segment;
    patch({ ...content, segments: next });
  }

  const mergedSegments = mergeMentorConnectSegmentCopy(content.segments);

  function deleteCategory(i: number) {
    if (!confirm("Delete this category?")) return;
    patch({ ...content, categories: content.categories.filter((_, j) => j !== i) });
  }

  function addCategory() {
    patch({ ...content, categories: [...content.categories, newCategory()] });
  }

  function patchRung(i: number, rung: MentorConnectContent["rewardLadder"]["rungs"][number]) {
    const next = [...content.rewardLadder.rungs];
    next[i] = rung;
    patch({ ...content, rewardLadder: { rungs: next } });
  }

  function addRung() {
    const last = content.rewardLadder.rungs.at(-1);
    const minQuestions = (last?.minQuestions ?? 0) + 50;
    patch({
      ...content,
      rewardLadder: {
        rungs: [
          ...content.rewardLadder.rungs,
          {
            id: `rung-${Date.now()}`,
            minQuestions,
            label: `${minQuestions} questions`,
            reward: "Reward (TBD)",
          },
        ],
      },
    });
  }

  function deleteRung(i: number) {
    if (!confirm("Delete this reward rung?")) return;
    patch({
      ...content,
      rewardLadder: {
        rungs: content.rewardLadder.rungs.filter((_, j) => j !== i),
      },
    });
  }

  return (
    <div className="space-y-4">
      {focus === "connect" ? (
        <p className="text-xs text-muted-fg bg-secondary/50 rounded-lg px-3 py-2">
          Edit copy on <code className="text-[11px]">/mentor-connect</code>. With{" "}
          <strong>Published</strong> checked, Save updates the live page. In the hero subtitle and step 01
          body, use <code className="text-[11px]">{`{mentorCount}`}</code> and{" "}
          <code className="text-[11px]">{`{segmentCount}`}</code> for live practitioner/segment counts.
        </p>
      ) : (
        <p className="text-xs text-muted-fg bg-secondary/50 rounded-lg px-3 py-2">
          Edit the public invitation form at <code className="text-[11px]">/mentor-apply</code>. With{" "}
          <strong>Published</strong> checked, Save updates that page. Fields marked with * on the live form
          stay public on Mentor Connect; that rule is not editable here. Name, company, LinkedIn, and email
          stay internal.
        </p>
      )}

      {focus === "connect" && (
        <>
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
        title="Segment titles & captions"
        description="Heading and blurb for each mentor segment on the browse grid"
        defaultOpen
      >
        <div className="space-y-3">
          {mergedSegments.map((seg, i) => (
            <div key={seg.id} className="border border-border rounded-lg p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider">
                Segment {seg.id}
              </p>
              <EditorField label="Title">
                <input
                  className={inputClass}
                  value={seg.title}
                  onChange={(e) => patchSegment(i, { ...seg, title: e.target.value })}
                  placeholder="e.g. Physical & Paper Trading Markets"
                />
              </EditorField>
              <EditorField label="Caption / blurb">
                <textarea
                  className={textareaClass}
                  value={seg.blurb}
                  onChange={(e) => patchSegment(i, { ...seg, blurb: e.target.value })}
                  placeholder="Short description shown below the segment title"
                />
              </EditorField>
            </div>
          ))}
        </div>
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

      <EditorSection
        title="Mentor reward ladder"
        description="Ordered rungs unlocked when a mentor's answered-question count hits each threshold. v1 tracks and displays only — no Stripe or auto payout."
        defaultOpen
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-fg">{content.rewardLadder.rungs.length} rungs</p>
          <Button variant="outline" size="sm" onClick={addRung}>
            <Plus className="w-3.5 h-3.5" /> Add rung
          </Button>
        </div>
        <div className="space-y-3">
          {content.rewardLadder.rungs.map((rung, i) => (
            <div key={rung.id} className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider">
                  Rung {i + 1}
                </p>
                <button
                  type="button"
                  onClick={() => deleteRung(i)}
                  className="text-red-400 hover:text-red-600 p-1"
                  disabled={content.rewardLadder.rungs.length <= 1}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <EditorField label="Minimum answered questions">
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={rung.minQuestions}
                    onChange={(e) =>
                      patchRung(i, {
                        ...rung,
                        minQuestions: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                  />
                </EditorField>
                <EditorField label="Label (shown to mentors/admin)">
                  <input
                    className={inputClass}
                    value={rung.label}
                    onChange={(e) => patchRung(i, { ...rung, label: e.target.value })}
                  />
                </EditorField>
              </div>
              <EditorField label="Reward copy" hint="e.g. $160, gift card, or Reward (TBD).">
                <input
                  className={inputClass}
                  value={rung.reward}
                  onChange={(e) => patchRung(i, { ...rung, reward: e.target.value })}
                />
              </EditorField>
            </div>
          ))}
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
        </>
      )}

      {focus === "apply" && (
        <>
          <EditorSection title="Hero" description="Blue header on /mentor-apply" defaultOpen>
            <div className="grid gap-4 sm:grid-cols-2">
              <EditorField label="Eyebrow (pill)">
                <input
                  className={inputClass}
                  value={apply.hero.eyebrow}
                  onChange={(e) =>
                    patchApply({ hero: { ...apply.hero, eyebrow: e.target.value } })
                  }
                />
              </EditorField>
              <EditorField label="Title">
                <input
                  className={inputClass}
                  value={apply.hero.title}
                  onChange={(e) => patchApply({ hero: { ...apply.hero, title: e.target.value } })}
                />
              </EditorField>
            </div>
            <EditorField label="Description">
              <textarea
                className={textareaClass}
                value={apply.hero.description}
                onChange={(e) =>
                  patchApply({ hero: { ...apply.hero, description: e.target.value } })
                }
              />
            </EditorField>
          </EditorSection>

          <EditorSection title="Section headings" description="Form group titles">
            <EditorField label="Your details">
              <input
                className={inputClass}
                value={apply.detailsHeading}
                onChange={(e) => patchApply({ detailsHeading: e.target.value })}
              />
            </EditorField>
            <EditorField label="Professional background">
              <input
                className={inputClass}
                value={apply.backgroundHeading}
                onChange={(e) => patchApply({ backgroundHeading: e.target.value })}
              />
            </EditorField>
            <EditorField label="What can you mentor on?">
              <input
                className={inputClass}
                value={apply.mentorOnHeading}
                onChange={(e) => patchApply({ mentorOnHeading: e.target.value })}
              />
            </EditorField>
          </EditorSection>

          <EditorSection title="Your details fields" description="Labels and placeholders">
            <LabelAndPlaceholder
              labelCaption="Full name label"
              placeholderCaption="Placeholder"
              label={apply.nameLabel}
              placeholder={apply.namePlaceholder}
              onLabel={(v) => patchApply({ nameLabel: v })}
              onPlaceholder={(v) => patchApply({ namePlaceholder: v })}
            />
            <LabelAndPlaceholder
              labelCaption="Email label"
              placeholderCaption="Placeholder"
              label={apply.emailLabel}
              placeholder={apply.emailPlaceholder}
              onLabel={(v) => patchApply({ emailLabel: v })}
              onPlaceholder={(v) => patchApply({ emailPlaceholder: v })}
            />
            <LabelAndPlaceholder
              labelCaption="LinkedIn label"
              placeholderCaption="Placeholder"
              label={apply.linkedInLabel}
              placeholder={apply.linkedInPlaceholder}
              onLabel={(v) => patchApply({ linkedInLabel: v })}
              onPlaceholder={(v) => patchApply({ linkedInPlaceholder: v })}
            />
            <LabelAndPlaceholder
              labelCaption="Location label (public *)"
              placeholderCaption="Placeholder"
              label={apply.locationLabel}
              placeholder={apply.locationPlaceholder}
              onLabel={(v) => patchApply({ locationLabel: v })}
              onPlaceholder={(v) => patchApply({ locationPlaceholder: v })}
            />
          </EditorSection>

          <EditorSection title="Professional background fields">
            <LabelAndPlaceholder
              labelCaption="Company label"
              placeholderCaption="Placeholder"
              label={apply.companyLabel}
              placeholder={apply.companyPlaceholder}
              onLabel={(v) => patchApply({ companyLabel: v })}
              onPlaceholder={(v) => patchApply({ companyPlaceholder: v })}
            />
            <LabelAndPlaceholder
              labelCaption="Role label"
              placeholderCaption="Placeholder"
              label={apply.roleLabel}
              placeholder={apply.rolePlaceholder}
              onLabel={(v) => patchApply({ roleLabel: v })}
              onPlaceholder={(v) => patchApply({ rolePlaceholder: v })}
            />
            <LabelAndPlaceholder
              labelCaption="Years of experience label (public *)"
              placeholderCaption="Placeholder"
              label={apply.yearsLabel}
              placeholder={apply.yearsPlaceholder}
              onLabel={(v) => patchApply({ yearsLabel: v })}
              onPlaceholder={(v) => patchApply({ yearsPlaceholder: v })}
            />
            <LabelAndPlaceholder
              labelCaption="Commodity focus label (public *)"
              placeholderCaption="Placeholder"
              label={apply.commodityLabel}
              placeholder={apply.commodityPlaceholder}
              onLabel={(v) => patchApply({ commodityLabel: v })}
              onPlaceholder={(v) => patchApply({ commodityPlaceholder: v })}
            />
            <LabelAndPlaceholder
              labelCaption="Headline label (public *)"
              placeholderCaption="Placeholder"
              label={apply.headlineLabel}
              placeholder={apply.headlinePlaceholder}
              onLabel={(v) => patchApply({ headlineLabel: v })}
              onPlaceholder={(v) => patchApply({ headlinePlaceholder: v })}
            />
            <EditorField label="Experience label (public *)">
              <input
                className={inputClass}
                value={apply.bioLabel}
                onChange={(e) => patchApply({ bioLabel: e.target.value })}
              />
            </EditorField>
            <EditorField label="Experience placeholder">
              <textarea
                className={textareaClass}
                value={apply.bioPlaceholder}
                onChange={(e) => patchApply({ bioPlaceholder: e.target.value })}
              />
            </EditorField>
            <LabelAndPlaceholder
              labelCaption="Mentorship subjects label (public *)"
              placeholderCaption="Placeholder"
              label={apply.tagsLabel}
              placeholder={apply.tagsPlaceholder}
              onLabel={(v) => patchApply({ tagsLabel: v })}
              onPlaceholder={(v) => patchApply({ tagsPlaceholder: v })}
            />
          </EditorSection>

          <EditorSection title="Suggested topic chips" description="Tap-to-add subjects on the form">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-fg">{apply.topics.length} topics</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => patchApply({ topics: [...apply.topics, ""] })}
              >
                <Plus className="w-3.5 h-3.5" /> Add topic
              </Button>
            </div>
            <div className="space-y-2">
              {apply.topics.map((topic, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className={inputClass}
                    value={topic}
                    onChange={(e) => {
                      const topics = [...apply.topics];
                      topics[i] = e.target.value;
                      patchApply({ topics });
                    }}
                    placeholder="e.g. Risk management"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      patchApply({ topics: apply.topics.filter((_, j) => j !== i) })
                    }
                    className="text-red-400 hover:text-red-600 p-1 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </EditorSection>

          <EditorSection title="Confirm, submit, and success">
            <EditorField label="Confirmation checkbox text">
              <textarea
                className={textareaClass}
                value={apply.confirmText}
                onChange={(e) => patchApply({ confirmText: e.target.value })}
              />
            </EditorField>
            <EditorField label="Submit button">
              <input
                className={inputClass}
                value={apply.submitLabel}
                onChange={(e) => patchApply({ submitLabel: e.target.value })}
              />
            </EditorField>
            <EditorField label="Success title">
              <input
                className={inputClass}
                value={apply.successTitle}
                onChange={(e) => patchApply({ successTitle: e.target.value })}
              />
            </EditorField>
            <EditorField label="Success body">
              <textarea
                className={textareaClass}
                value={apply.successBody}
                onChange={(e) => patchApply({ successBody: e.target.value })}
              />
            </EditorField>
          </EditorSection>
        </>
      )}
    </div>
  );
}
