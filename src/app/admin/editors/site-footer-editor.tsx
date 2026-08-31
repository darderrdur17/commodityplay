"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type FooterLinkItem, type SiteFooterContent } from "@/data/footer-content";
import { mergeSiteFooterContent } from "@/lib/content/footer-schema";
import { EditorField, EditorSection, inputClass } from "./shared";

type ColumnKey = keyof SiteFooterContent["columns"];

const COLUMN_LABELS: Record<ColumnKey, string> = {
  contents: "Contents",
  community: "Community",
  access: "Access",
};

function emptyLink(): FooterLinkItem {
  return { label: "New link", href: "/" };
}

function ColumnEditor({
  title,
  links,
  onChange,
}: {
  title: string;
  links: FooterLinkItem[];
  onChange: (links: FooterLinkItem[]) => void;
}) {
  function patchLink(i: number, link: FooterLinkItem) {
    const next = [...links];
    next[i] = link;
    onChange(next);
  }

  return (
    <EditorSection title={title} description={`${links.length} link(s)`}>
      <div className="space-y-3">
        {links.map((link, i) => (
          <div key={i} className="rounded-lg border border-border p-3 space-y-2 bg-secondary/20">
            <div className="grid gap-2 sm:grid-cols-2">
              <EditorField label="Label">
                <input
                  className={inputClass}
                  value={link.label}
                  onChange={(e) => patchLink(i, { ...link, label: e.target.value })}
                />
              </EditorField>
              <EditorField label="Href">
                <input
                  className={inputClass}
                  value={link.href}
                  onChange={(e) => patchLink(i, { ...link, href: e.target.value })}
                  placeholder="/path, mailto:..., or #contact"
                />
              </EditorField>
            </div>
            <EditorField label="Action" hint="Use contact for modal, mailto for email links">
              <select
                className={inputClass}
                value={link.action ?? "link"}
                onChange={(e) =>
                  patchLink(i, {
                    ...link,
                    action: e.target.value as FooterLinkItem["action"],
                  })
                }
              >
                <option value="link">Normal link</option>
                <option value="contact">Open contact modal</option>
                <option value="mailto">Mailto link</option>
              </select>
            </EditorField>
            <button
              type="button"
              onClick={() => onChange(links.filter((_, j) => j !== i))}
              className="text-xs text-red-500 hover:text-red-700 inline-flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Remove link
            </button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => onChange([...links, emptyLink()])}>
          <Plus className="w-3.5 h-3.5" /> Add link
        </Button>
      </div>
    </EditorSection>
  );
}

export function SiteFooterEditor({
  payload,
  onChange,
}: {
  payload: unknown;
  onChange: (p: unknown) => void;
}) {
  const content = mergeSiteFooterContent(payload as Partial<SiteFooterContent> | null);

  function patch(updates: Partial<SiteFooterContent>) {
    onChange({ ...content, ...updates });
  }

  function patchColumn(key: ColumnKey, links: FooterLinkItem[]) {
    patch({ columns: { ...content.columns, [key]: links } });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-fg bg-secondary/50 rounded-lg px-3 py-2">
        Shared site footer for Career and Sales tracks. Updates every page after Save.
      </p>
      <EditorField label="Brand blurb (under logo)">
        <textarea
          className="w-full min-h-[96px] px-3 py-2 rounded-lg border border-border text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary-400 resize-y"
          value={content.blurb}
          onChange={(e) => patch({ blurb: e.target.value })}
        />
      </EditorField>
      {(Object.keys(COLUMN_LABELS) as ColumnKey[]).map((key) => (
        <ColumnEditor
          key={key}
          title={COLUMN_LABELS[key]}
          links={content.columns[key]}
          onChange={(links) => patchColumn(key, links)}
        />
      ))}
    </div>
  );
}
