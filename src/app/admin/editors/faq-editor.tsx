"use client";

import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FaqContent, FaqItem } from "@/data/faq";
import { DEFAULT_FAQ_CONTENT } from "@/data/faq";
import { normalizeFaqContentPayload } from "@/lib/content/faq-schema";
import { EditorField, EditorRow, EditorSection, inputClass, textareaClass } from "./shared";

function newItem(): FaqItem {
  return { q: "", a: "" };
}

export function FaqEditor({
  payload,
  onChange,
}: {
  payload: unknown;
  onChange: (p: unknown) => void;
  moduleSlug: string;
  requiredTier: string;
}) {
  const content: FaqContent = normalizeFaqContentPayload(payload ?? DEFAULT_FAQ_CONTENT);

  function patch(next: FaqContent) {
    onChange(next);
  }

  function patchHero(field: keyof FaqContent["hero"], value: string) {
    patch({ ...content, hero: { ...content.hero, [field]: value } });
  }

  function patchFooter(field: keyof FaqContent["footerCta"], value: string) {
    patch({ ...content, footerCta: { ...content.footerCta, [field]: value } });
  }

  function patchItem(i: number, item: FaqItem) {
    const items = [...content.items];
    items[i] = item;
    patch({ ...content, items });
  }

  function deleteItem(i: number) {
    patch({ ...content, items: content.items.filter((_, j) => j !== i) });
  }

  /**
   * Shift one question up or down by one slot. Order is meaningful on the public
   * page — the accordion renders `items` in array order — so this is a plain
   * splice-and-reinsert rather than a sort. Owner request, 11 Oct 2026: she
   * wanted to rearrange questions without deleting and retyping them.
   */
  function moveItem(i: number, delta: -1 | 1) {
    const target = i + delta;
    if (target < 0 || target >= content.items.length) return;
    const items = [...content.items];
    const [moved] = items.splice(i, 1);
    items.splice(target, 0, moved);
    patch({ ...content, items });
  }

  function addItem() {
    patch({ ...content, items: [...content.items, newItem()] });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-fg">
        Edit the FAQ shown at the foot of <strong>/pricing</strong> (the footer
        &ldquo;FAQ&rdquo; link deep-links to it). Use the ▲ ▼ arrows to reorder
        questions — the page renders them in the order listed here.
      </p>

      <EditorSection title="Page hero" description="Top banner on the FAQ page" defaultOpen>
        <div className="grid gap-3 sm:grid-cols-2">
          <EditorField label="Eyebrow">
            <input
              className={inputClass}
              value={content.hero.eyebrow}
              onChange={(e) => patchHero("eyebrow", e.target.value)}
            />
          </EditorField>
          <EditorField label="Title">
            <input
              className={inputClass}
              value={content.hero.title}
              onChange={(e) => patchHero("title", e.target.value)}
            />
          </EditorField>
        </div>
        <EditorField label="Subtitle">
          <textarea
            className={textareaClass}
            value={content.hero.subtitle}
            onChange={(e) => patchHero("subtitle", e.target.value)}
          />
        </EditorField>
      </EditorSection>

      <EditorSection title="Bottom CTA" description="Footer section below the FAQ accordion" defaultOpen>
        <EditorField label="Heading">
          <input
            className={inputClass}
            value={content.footerCta.heading}
            onChange={(e) => patchFooter("heading", e.target.value)}
          />
        </EditorField>
        <EditorField label="Subtext" hint="Include the support email address in the text — it will be linked automatically.">
          <textarea
            className={textareaClass}
            value={content.footerCta.subtext}
            onChange={(e) => patchFooter("subtext", e.target.value)}
          />
        </EditorField>
        <div className="grid gap-3 sm:grid-cols-2">
          <EditorField label="Support email">
            <input
              className={inputClass}
              type="email"
              value={content.footerCta.email}
              onChange={(e) => patchFooter("email", e.target.value)}
            />
          </EditorField>
          <EditorField label="Button label">
            <input
              className={inputClass}
              value={content.footerCta.buttonLabel}
              onChange={(e) => patchFooter("buttonLabel", e.target.value)}
            />
          </EditorField>
        </div>
      </EditorSection>

      <EditorSection title="Questions & answers" description="Accordion items on the FAQ page" defaultOpen>
        <div className="flex items-center justify-between gap-3 mb-2">
          <p className="text-xs text-muted-fg">{content.items.length} items</p>
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="w-3.5 h-3.5" /> Add question
          </Button>
        </div>

        <div className="space-y-2">
          {content.items.map((item, i) => (
            <EditorRow
              key={i}
              summary={<span className="font-medium">{item.q || "(untitled question)"}</span>}
              onMoveUp={() => moveItem(i, -1)}
              onMoveDown={() => moveItem(i, 1)}
              canMoveUp={i > 0}
              canMoveDown={i < content.items.length - 1}
              onDelete={() => deleteItem(i)}
            >
              <EditorField label="Question">
                <input
                  className={inputClass}
                  value={item.q}
                  onChange={(e) => patchItem(i, { ...item, q: e.target.value })}
                />
              </EditorField>
              <EditorField label="Answer">
                <textarea
                  className={textareaClass}
                  value={item.a}
                  onChange={(e) => patchItem(i, { ...item, a: e.target.value })}
                />
              </EditorField>
            </EditorRow>
          ))}
          {content.items.length === 0 && (
            <p className="text-center text-sm text-muted-fg py-8">No FAQ items yet. Add one above.</p>
          )}
        </div>
      </EditorSection>
    </div>
  );
}
