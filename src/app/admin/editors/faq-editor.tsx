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

  function patchItem(i: number, item: FaqItem) {
    const items = [...content.items];
    items[i] = item;
    patch({ ...content, items });
  }

  function deleteItem(i: number) {
    patch({ ...content, items: content.items.filter((_, j) => j !== i) });
  }

  function addItem() {
    patch({ ...content, items: [...content.items, newItem()] });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-fg">
        Edit FAQ page copy shown at <strong>/faq</strong>. Footer link only — not in main nav.
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
