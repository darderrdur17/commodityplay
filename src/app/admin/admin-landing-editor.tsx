"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { LandingContent } from "@/data/landing-content";

interface Props {
  content: LandingContent;
  onChange: (content: LandingContent) => void;
  trackFilter?: "career" | "sales" | "both";
}

function Section({
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

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-gray-700">{label}</span>
      {hint && <span className="block text-[11px] text-muted-fg">{hint}</span>}
      {children}
    </label>
  );
}

const inputClass =
  "w-full h-9 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary-400";
const textareaClass =
  "w-full min-h-[72px] px-3 py-2 rounded-lg border border-border text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary-400 resize-y";

function TextInput({
  value,
  onChange,
  multiline,
  rows = 3,
}: {
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
}) {
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className={textareaClass}
      />
    );
  }
  return <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />;
}

function FeaturesList({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <textarea
      value={value.join("\n")}
      onChange={(e) =>
        onChange(
          e.target.value
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
        )
      }
      rows={6}
      className={textareaClass}
      placeholder="One feature per line"
    />
  );
}

export function AdminLandingEditor({ content, onChange, trackFilter = "both" }: Props) {
  function patch<K extends keyof LandingContent>(key: K, value: LandingContent[K]) {
    onChange({ ...content, [key]: value });
  }

  const showCareer = trackFilter === "both" || trackFilter === "career";
  const showSales = trackFilter === "both" || trackFilter === "sales";

  return (
    <div className="p-4 space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto">
      <p className="text-xs text-muted-fg bg-secondary/50 rounded-lg px-3 py-2">
        Edit landing page wording only. Layout and structure stay in code. Changes go live after Save.
      </p>

      {showCareer && (
      <>
      <Section title="Career Track — Hero" description="Track 1 hero section" defaultOpen>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eyebrow">
            <TextInput value={content.career.eyebrow} onChange={(v) => patch("career", { ...content.career, eyebrow: v })} />
          </Field>
          <Field label="Headline (line 1)">
            <TextInput value={content.career.headline} onChange={(v) => patch("career", { ...content.career, headline: v })} />
          </Field>
          <Field label="Headline accent (italic)">
            <TextInput
              value={content.career.headlineAccent}
              onChange={(v) => patch("career", { ...content.career, headlineAccent: v })}
            />
          </Field>
          <Field label="Primary CTA">
            <TextInput
              value={content.career.ctaPrimary}
              onChange={(v) => patch("career", { ...content.career, ctaPrimary: v })}
            />
          </Field>
          <Field label="Secondary CTA">
            <TextInput
              value={content.career.ctaSecondary}
              onChange={(v) => patch("career", { ...content.career, ctaSecondary: v })}
            />
          </Field>
        </div>
        <Field label="Description">
          <TextInput
            value={content.career.description}
            onChange={(v) => patch("career", { ...content.career, description: v })}
            multiline
            rows={4}
          />
        </Field>
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-700">Hero stats</p>
          {content.career.heroStats.map((stat, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-3 p-3 rounded-lg bg-secondary/40">
              <input
                type="number"
                value={stat.value}
                onChange={(e) => {
                  const heroStats = [...content.career.heroStats];
                  heroStats[i] = { ...stat, value: Number(e.target.value) };
                  patch("career", { ...content.career, heroStats });
                }}
                className={inputClass}
                placeholder="Value"
              />
              <TextInput
                value={stat.suffix}
                onChange={(v) => {
                  const heroStats = [...content.career.heroStats];
                  heroStats[i] = { ...stat, suffix: v };
                  patch("career", { ...content.career, heroStats });
                }}
              />
              <TextInput
                value={stat.label}
                onChange={(v) => {
                  const heroStats = [...content.career.heroStats];
                  heroStats[i] = { ...stat, label: v };
                  patch("career", { ...content.career, heroStats });
                }}
              />
            </div>
          ))}
        </div>
      </Section>

      <Section title="What's Inside" description="Career track resource grid">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title line 1">
            <TextInput
              value={content.whatsInside.titleLine1}
              onChange={(v) => patch("whatsInside", { ...content.whatsInside, titleLine1: v })}
            />
          </Field>
          <Field label="Title line 2 (italic)">
            <TextInput
              value={content.whatsInside.titleLine2}
              onChange={(v) => patch("whatsInside", { ...content.whatsInside, titleLine2: v })}
            />
          </Field>
        </div>
        <Field label="Description">
          <TextInput
            value={content.whatsInside.description}
            onChange={(v) => patch("whatsInside", { ...content.whatsInside, description: v })}
            multiline
          />
        </Field>
        <div className="space-y-4">
          {content.whatsInside.features.map((feature, i) => (
            <div key={feature.title} className="p-3 rounded-lg border border-border space-y-2">
              <p className="text-xs font-bold text-muted-fg uppercase">{feature.title}</p>
              <Field label="Card title">
                <TextInput
                  value={feature.title}
                  onChange={(v) => {
                    const features = [...content.whatsInside.features];
                    features[i] = { ...feature, title: v };
                    patch("whatsInside", { ...content.whatsInside, features });
                  }}
                />
              </Field>
              <Field label="Description">
                <TextInput
                  value={feature.desc}
                  onChange={(v) => {
                    const features = [...content.whatsInside.features];
                    features[i] = { ...feature, desc: v };
                    patch("whatsInside", { ...content.whatsInside, features });
                  }}
                  multiline
                />
              </Field>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Chapter Coverage" description="Playbook chapters A–I accordion">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Section eyebrow">
            <TextInput
              value={content.chapterCoverage.eyebrow}
              onChange={(v) => patch("chapterCoverage", { ...content.chapterCoverage, eyebrow: v })}
            />
          </Field>
          <Field label="Section title">
            <TextInput
              value={content.chapterCoverage.title}
              onChange={(v) => patch("chapterCoverage", { ...content.chapterCoverage, title: v })}
            />
          </Field>
        </div>
        <Field label="Section description">
          <TextInput
            value={content.chapterCoverage.description}
            onChange={(v) => patch("chapterCoverage", { ...content.chapterCoverage, description: v })}
            multiline
          />
        </Field>
        <div className="space-y-4">
          {content.chapterCoverage.chapters.map((chapter, i) => (
            <div key={chapter.letter} className="p-3 rounded-lg border border-border space-y-2">
              <p className="text-xs font-bold text-primary-400">Chapter {chapter.letter}</p>
              <Field label="Title">
                <TextInput
                  value={chapter.title}
                  onChange={(v) => {
                    const chapters = [...content.chapterCoverage.chapters];
                    chapters[i] = { ...chapter, title: v };
                    patch("chapterCoverage", { ...content.chapterCoverage, chapters });
                  }}
                />
              </Field>
              <Field label="Description">
                <TextInput
                  value={chapter.desc}
                  onChange={(v) => {
                    const chapters = [...content.chapterCoverage.chapters];
                    chapters[i] = { ...chapter, desc: v };
                    patch("chapterCoverage", { ...content.chapterCoverage, chapters });
                  }}
                  multiline
                  rows={4}
                />
              </Field>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Career Pricing" description="Track 1 pricing band">
        <Field label="Section title">
          <TextInput
            value={content.pricing.title}
            onChange={(v) => patch("pricing", { ...content.pricing, title: v })}
          />
        </Field>
        <Field label="Subtitle">
          <TextInput
            value={content.pricing.subtitle}
            onChange={(v) => patch("pricing", { ...content.pricing, subtitle: v })}
            multiline
          />
        </Field>
        <div className="space-y-4">
          {content.pricing.tiers.map((tier, i) => (
            <div key={tier.name} className="p-3 rounded-lg border border-border space-y-2">
              <p className="text-xs font-bold text-muted-fg uppercase">{tier.name} tier</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Price label">
                  <TextInput
                    value={tier.price}
                    onChange={(v) => {
                      const tiers = [...content.pricing.tiers];
                      tiers[i] = { ...tier, price: v };
                      patch("pricing", { ...content.pricing, tiers });
                    }}
                  />
                </Field>
                <Field label="Billing">
                  <TextInput
                    value={tier.billing}
                    onChange={(v) => {
                      const tiers = [...content.pricing.tiers];
                      tiers[i] = { ...tier, billing: v };
                      patch("pricing", { ...content.pricing, tiers });
                    }}
                  />
                </Field>
                <Field label="Tooltip / tagline">
                  <TextInput
                    value={tier.tooltip}
                    onChange={(v) => {
                      const tiers = [...content.pricing.tiers];
                      tiers[i] = { ...tier, tooltip: v };
                      patch("pricing", { ...content.pricing, tiers });
                    }}
                  />
                </Field>
                <Field label="CTA button">
                  <TextInput
                    value={tier.cta}
                    onChange={(v) => {
                      const tiers = [...content.pricing.tiers];
                      tiers[i] = { ...tier, cta: v };
                      patch("pricing", { ...content.pricing, tiers });
                    }}
                  />
                </Field>
              </div>
              <Field label="Tier description">
                <TextInput
                  value={tier.description}
                  onChange={(v) => {
                    const tiers = [...content.pricing.tiers];
                    tiers[i] = { ...tier, description: v };
                    patch("pricing", { ...content.pricing, tiers });
                  }}
                  multiline
                />
              </Field>
              <Field label="Features" hint="One per line">
                <FeaturesList
                  value={tier.features}
                  onChange={(features) => {
                    const tiers = [...content.pricing.tiers];
                    tiers[i] = { ...tier, features };
                    patch("pricing", { ...content.pricing, tiers });
                  }}
                />
              </Field>
            </div>
          ))}
        </div>
      </Section>
      </>
      )}

      {showSales && (
      <>
      <Section title="Sales Track — Hero" description="Track 2 hero section">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eyebrow">
            <TextInput
              value={content.sales.eyebrow}
              onChange={(v) => patch("sales", { ...content.sales, eyebrow: v })}
            />
          </Field>
          <Field label="Headline (line 1)">
            <TextInput
              value={content.sales.headline}
              onChange={(v) => patch("sales", { ...content.sales, headline: v })}
            />
          </Field>
          <Field label="Headline accent">
            <TextInput
              value={content.sales.headlineAccent}
              onChange={(v) => patch("sales", { ...content.sales, headlineAccent: v })}
            />
          </Field>
          <Field label="Primary CTA">
            <TextInput
              value={content.sales.ctaPrimary}
              onChange={(v) => patch("sales", { ...content.sales, ctaPrimary: v })}
            />
          </Field>
          <Field label="Secondary CTA">
            <TextInput
              value={content.sales.ctaSecondary}
              onChange={(v) => patch("sales", { ...content.sales, ctaSecondary: v })}
            />
          </Field>
        </div>
        <Field label="Description">
          <TextInput
            value={content.sales.description}
            onChange={(v) => patch("sales", { ...content.sales, description: v })}
            multiline
            rows={4}
          />
        </Field>
      </Section>

      <Section title="Sales — Commercial Case (ROI)" description="Dark ROI section on sales track">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eyebrow">
            <TextInput
              value={content.sales.roi.eyebrow}
              onChange={(v) => patch("sales", { ...content.sales, roi: { ...content.sales.roi, eyebrow: v } })}
            />
          </Field>
          <Field label="Title line 1">
            <TextInput
              value={content.sales.roi.title}
              onChange={(v) => patch("sales", { ...content.sales, roi: { ...content.sales.roi, title: v } })}
            />
          </Field>
          <Field label="Title accent">
            <TextInput
              value={content.sales.roi.titleAccent}
              onChange={(v) => patch("sales", { ...content.sales, roi: { ...content.sales.roi, titleAccent: v } })}
            />
          </Field>
        </div>
        <Field label="Description">
          <TextInput
            value={content.sales.roi.description}
            onChange={(v) => patch("sales", { ...content.sales, roi: { ...content.sales.roi, description: v } })}
            multiline
          />
        </Field>
        <Field label="Testimonial quote">
          <TextInput
            value={content.sales.roi.quote}
            onChange={(v) => patch("sales", { ...content.sales, roi: { ...content.sales.roi, quote: v } })}
            multiline
            rows={3}
          />
        </Field>
        <Field label="Quote author">
          <TextInput
            value={content.sales.roi.quoteAuthor}
            onChange={(v) => patch("sales", { ...content.sales, roi: { ...content.sales.roi, quoteAuthor: v } })}
          />
        </Field>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-700">ROI stats</p>
          {content.sales.roi.stats.map((stat, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-2 p-3 rounded-lg bg-secondary/40">
              <TextInput
                value={stat.value}
                onChange={(v) => {
                  const stats = [...content.sales.roi.stats];
                  stats[i] = { ...stat, value: v };
                  patch("sales", { ...content.sales, roi: { ...content.sales.roi, stats } });
                }}
              />
              <TextInput
                value={stat.label}
                onChange={(v) => {
                  const stats = [...content.sales.roi.stats];
                  stats[i] = { ...stat, label: v };
                  patch("sales", { ...content.sales, roi: { ...content.sales.roi, stats } });
                }}
              />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Sales Pricing" description="Pro and Elite tiers on sales track">
        <div className="space-y-4">
          {content.sales.pricing.map((tier, i) => (
            <div key={tier.name} className="p-3 rounded-lg border border-border space-y-2">
              <p className="text-xs font-bold text-muted-fg uppercase">{tier.name}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Price">
                  <TextInput
                    value={tier.price}
                    onChange={(v) => {
                      const pricing = [...content.sales.pricing];
                      pricing[i] = { ...tier, price: v };
                      patch("sales", { ...content.sales, pricing });
                    }}
                  />
                </Field>
                <Field label="Billing">
                  <TextInput
                    value={tier.billing}
                    onChange={(v) => {
                      const pricing = [...content.sales.pricing];
                      pricing[i] = { ...tier, billing: v };
                      patch("sales", { ...content.sales, pricing });
                    }}
                  />
                </Field>
                <Field label="CTA">
                  <TextInput
                    value={tier.cta}
                    onChange={(v) => {
                      const pricing = [...content.sales.pricing];
                      pricing[i] = { ...tier, cta: v };
                      patch("sales", { ...content.sales, pricing });
                    }}
                  />
                </Field>
              </div>
              <Field label="Description">
                <TextInput
                  value={tier.description}
                  onChange={(v) => {
                    const pricing = [...content.sales.pricing];
                    pricing[i] = { ...tier, description: v };
                    patch("sales", { ...content.sales, pricing });
                  }}
                  multiline
                />
              </Field>
              <Field label="Features" hint="One per line">
                <FeaturesList
                  value={tier.features}
                  onChange={(features) => {
                    const pricing = [...content.sales.pricing];
                    pricing[i] = { ...tier, features };
                    patch("sales", { ...content.sales, pricing });
                  }}
                />
              </Field>
            </div>
          ))}
        </div>
      </Section>
      </>
      )}

      <Section title="Members Strip" description="Trusted-by company names in hero">
        <Field label="Label">
          <TextInput
            value={content.membersStrip.label}
            onChange={(v) => patch("membersStrip", { ...content.membersStrip, label: v })}
          />
        </Field>
        <Field label="Companies" hint="One company name per line">
          <FeaturesList
            value={content.membersStrip.companies}
            onChange={(companies) => patch("membersStrip", { ...content.membersStrip, companies })}
          />
        </Field>
      </Section>

      <Section title="Footer Tagline" description="Reserved for footer copy">
        <Field label="Tagline">
          <TextInput
            value={content.footerTagline}
            onChange={(v) => patch("footerTagline", v)}
            multiline
            rows={3}
          />
        </Field>
      </Section>
    </div>
  );
}
