"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type FooterLinkItem, type SiteFooterContent } from "@/data/footer-content";
import { type FooterLegalPage } from "@/data/legal-content";
import { mergeSiteFooterContent } from "@/lib/content/footer-schema";
import { EditorField, EditorSection, inputClass, textareaClass } from "./shared";

type ColumnKey = keyof SiteFooterContent["columns"];

const COLUMN_LABELS: Record<ColumnKey, string> = {
  contents: "Contents",
  community: "Community",
  access: "Access",
};

function emptyLink(): FooterLinkItem {
  return { label: "New link", href: "/" };
}

function emptyLegalSection() {
  return { heading: "New section", body: "" };
}

function LegalPageFields({
  title,
  hint,
  page,
  onChange,
}: {
  title: string;
  hint: string;
  page: FooterLegalPage;
  onChange: (page: FooterLegalPage) => void;
}) {
  function patchSection(i: number, section: FooterLegalPage["sections"][number]) {
    const sections = [...page.sections];
    sections[i] = section;
    onChange({ ...page, sections });
  }

  return (
    <EditorSection title={title} description={hint} defaultOpen>
      <div className="grid gap-3 sm:grid-cols-2">
        <EditorField label="Footer link label">
          <input
            className={inputClass}
            value={page.label}
            onChange={(e) => onChange({ ...page, label: e.target.value })}
          />
        </EditorField>
        <EditorField label="Footer / page URL" hint="Keep /privacy or /terms unless you are changing the live URL">
          <input
            className={inputClass}
            value={page.href}
            onChange={(e) => onChange({ ...page, href: e.target.value })}
          />
        </EditorField>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <EditorField label="Page title">
          <input
            className={inputClass}
            value={page.pageTitle}
            onChange={(e) => onChange({ ...page, pageTitle: e.target.value })}
          />
        </EditorField>
        <EditorField label="Last updated">
          <input
            className={inputClass}
            value={page.lastUpdated}
            onChange={(e) => onChange({ ...page, lastUpdated: e.target.value })}
          />
        </EditorField>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-fg">{page.sections.length} section(s) — add as many as you need</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange({ ...page, sections: [...page.sections, emptyLegalSection()] })}
        >
          <Plus className="w-3.5 h-3.5" /> Add section
        </Button>
      </div>
      <div className="space-y-3">
        {page.sections.map((section, i) => (
          <div key={i} className="rounded-lg border border-border p-3 space-y-2 bg-secondary/20">
            <EditorField label={`Section ${i + 1} heading`}>
              <input
                className={inputClass}
                value={section.heading}
                onChange={(e) => patchSection(i, { ...section, heading: e.target.value })}
              />
            </EditorField>
            <EditorField
              label="Body"
              hint="Paragraphs separated by a blank line. Bullet lines start with - "
            >
              <textarea
                className={`${textareaClass} min-h-[120px]`}
                value={section.body}
                onChange={(e) => patchSection(i, { ...section, body: e.target.value })}
              />
            </EditorField>
            <button
              type="button"
              onClick={() =>
                onChange({ ...page, sections: page.sections.filter((_, j) => j !== i) })
              }
              className="text-xs text-red-500 hover:text-red-700 inline-flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Remove section
            </button>
          </div>
        ))}
      </div>
    </EditorSection>
  );
}

function LegalPagesEditor({
  privacy,
  terms,
  onChange,
}: {
  privacy: FooterLegalPage;
  terms: FooterLegalPage;
  onChange: (legal: SiteFooterContent["legal"]) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-gray-900">Terms of Use &amp; Privacy</p>
      <LegalPageFields
        title="Privacy"
        hint="Footer Privacy link and the /privacy page copy"
        page={privacy}
        onChange={(next) => onChange({ privacy: next, terms })}
      />
      <LegalPageFields
        title="Terms of Use"
        hint="Footer Terms link and the /terms page copy"
        page={terms}
        onChange={(next) => onChange({ privacy, terms: next })}
      />
    </div>
  );
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
        Shared site footer for Career and Sales tracks. Updates every page after Save. Edit{" "}
        <strong>Terms of Use</strong> and <strong>Privacy</strong> in the section below — labels, URLs, and page copy.
      </p>
      <EditorField label="Brand blurb (under logo)">
        <textarea
          className="w-full min-h-[96px] px-3 py-2 rounded-lg border border-border text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary-400 resize-y"
          value={content.blurb}
          onChange={(e) => patch({ blurb: e.target.value })}
        />
      </EditorField>
      <EditorSection
        title="Email signup strip"
        description="Footer newsletter capture for visitors not ready to create a free account"
        defaultOpen
      >
        <EditorField label="Heading">
          <input
            className={inputClass}
            value={content.newsletter.heading}
            onChange={(e) =>
              patch({ newsletter: { ...content.newsletter, heading: e.target.value } })
            }
          />
        </EditorField>
        <EditorField label="Subtext">
          <textarea
            className="w-full min-h-[72px] px-3 py-2 rounded-lg border border-border text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary-400 resize-y"
            value={content.newsletter.subtext}
            onChange={(e) =>
              patch({ newsletter: { ...content.newsletter, subtext: e.target.value } })
            }
          />
        </EditorField>
        <div className="grid gap-3 sm:grid-cols-2">
          <EditorField label="Email placeholder">
            <input
              className={inputClass}
              value={content.newsletter.placeholder}
              onChange={(e) =>
                patch({ newsletter: { ...content.newsletter, placeholder: e.target.value } })
              }
            />
          </EditorField>
          <EditorField label="Button label">
            <input
              className={inputClass}
              value={content.newsletter.buttonLabel}
              onChange={(e) =>
                patch({ newsletter: { ...content.newsletter, buttonLabel: e.target.value } })
              }
            />
          </EditorField>
        </div>
        <EditorField label="Success message">
          <input
            className={inputClass}
            value={content.newsletter.successMessage}
            onChange={(e) =>
              patch({ newsletter: { ...content.newsletter, successMessage: e.target.value } })
            }
          />
        </EditorField>
      </EditorSection>
      <LegalPagesEditor
        privacy={content.legal.privacy}
        terms={content.legal.terms}
        onChange={(legal) => patch({ legal })}
      />
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
