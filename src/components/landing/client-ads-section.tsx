"use client";

import React from "react";
import { Megaphone, Quote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Reveal, StaggerChildren, StaggerItem } from "@/components/animations";
import { SectionCategoryLabel } from "@/components/landing/section-category-label";
import { cn } from "@/lib/utils";
import type { ClientAdEntry, LandingClientAds } from "@/data/landing-content";
import {
  clientAdInitials,
  selectClientAds,
  type ClientAdLandingTrack,
} from "@/lib/content/client-ads";

const TRACK_LABEL_CLASS: Record<ClientAdLandingTrack, string> = {
  career: "text-primary-800",
  sales: "text-teal-700",
};

/** Deterministic placeholder gradients — same row, same tile, every render. */
const PLACEHOLDER_TINTS = [
  "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
  "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
  "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)",
  "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
];

function SampleTag() {
  return (
    <Badge variant="outline" size="sm">
      Example
    </Badge>
  );
}

/**
 * Stand-in for an uploaded banner.
 *
 * Rendered when a row has no `imageAssetId`. It is a generated tile rather than a
 * shipped image on purpose: there is no placeholder JPG to forget to delete, no
 * fake client logo in the repo, and the moment an admin uploads a real banner the
 * tile disappears.
 */
function PlaceholderAdTile({ entry, index }: { entry: ClientAdEntry; index: number }) {
  return (
    <div
      className="relative flex aspect-[16/9] w-full flex-col justify-between overflow-hidden p-4"
      style={{ background: PLACEHOLDER_TINTS[index % PLACEHOLDER_TINTS.length] }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-gray-600">
          <Megaphone className="h-3 w-3" aria-hidden />
          Ad space
        </span>
        <span className="rounded bg-white/60 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
          No image yet
        </span>
      </div>
      <div className="flex items-end gap-3">
        <span
          aria-hidden
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/80 font-serif text-base font-bold text-gray-700"
        >
          {clientAdInitials(entry.company)}
        </span>
        <span className="min-w-0 font-serif text-sm font-bold leading-tight text-gray-800">
          {entry.company}
        </span>
      </div>
    </div>
  );
}

function AdCard({ entry, index }: { entry: ClientAdEntry; index: number }) {
  return (
    <div className="card-hover flex h-full flex-col overflow-hidden rounded-xl border border-border bg-white">
      {entry.imageAssetId ? (
        // eslint-disable-next-line @next/next/no-img-element -- CMS asset of unknown dimensions
        <img
          src={`/api/content/assets/${entry.imageAssetId}`}
          alt={entry.company}
          className="aspect-[16/9] w-full object-cover"
          loading="lazy"
        />
      ) : (
        <PlaceholderAdTile entry={entry} index={index} />
      )}
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-fg">
            {entry.eyebrow}
          </span>
          {entry.sample ? <SampleTag /> : null}
        </div>
        <h3 className="font-serif text-base font-semibold leading-snug text-gray-900">
          {entry.headline}
        </h3>
        <p className="flex-1 text-sm leading-relaxed text-muted-fg">{entry.body}</p>
        <p className="pt-2 text-xs font-semibold text-gray-700">{entry.company}</p>
      </div>
    </div>
  );
}

function ShoutoutCard({ entry }: { entry: ClientAdEntry }) {
  return (
    <div className="card-hover flex h-full flex-col gap-3 rounded-xl border border-border bg-white p-6">
      <div className="flex items-center justify-between gap-2">
        <Quote className="h-5 w-5 shrink-0 text-gray-300" aria-hidden />
        {entry.sample ? <SampleTag /> : null}
      </div>
      <blockquote className="flex-1">
        <p className="font-serif text-base font-semibold italic leading-snug text-gray-900">
          &ldquo;{entry.headline}&rdquo;
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-fg">{entry.body}</p>
      </blockquote>
      <footer className="border-t border-border pt-3">
        <p className="text-sm font-semibold text-gray-800">{entry.company}</p>
        {entry.attribution ? (
          <p className="mt-0.5 text-xs text-muted-fg">{entry.attribution}</p>
        ) : (
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-fg">
            {entry.eyebrow}
          </p>
        )}
      </footer>
    </div>
  );
}

export interface ClientAdsSectionProps {
  content: LandingClientAds;
  track: ClientAdLandingTrack;
  /**
   * Sales rows read better on the tinted band, career rows on white — the sales
   * page alternates mint and white sections and this block sits between two light
   * ones there.
   */
  tinted?: boolean;
}

/**
 * "Client ads & shoutouts" — company banners and client quotes on both landing
 * pages.
 *
 * Renders NOTHING when the selected track has no visible rows, which is what makes
 * "untick everything" a safe way to retire the section. The per-row `track` filter
 * is the whole persona mechanism: one editable list, two audiences.
 */
export function ClientAdsSection({ content, track, tinted = false }: ClientAdsSectionProps) {
  const entries = selectClientAds(content, track);
  if (entries.length === 0) return null;

  return (
    <section
      className={cn("py-16 sm:py-24", tinted && "border-y border-border bg-secondary")}
      id="client-ads"
    >
      <div className="page-container">
        <Reveal className="mb-12 max-w-3xl text-center sm:mx-auto">
          <SectionCategoryLabel colorClass={TRACK_LABEL_CLASS[track]}>
            {content.eyebrow}
          </SectionCategoryLabel>
          <h2 className="mb-4 font-serif text-[clamp(28px,4vw,44px)] font-bold leading-[1.1] tracking-tight text-gray-900">
            {content.title}
          </h2>
          <p className="text-base leading-relaxed text-muted-fg sm:text-lg">{content.description}</p>
        </Reveal>

        <StaggerChildren className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry, index) => (
            <StaggerItem key={entry.id} className="h-full">
              {entry.kind === "ad" ? (
                <AdCard entry={entry} index={index} />
              ) : (
                <ShoutoutCard entry={entry} />
              )}
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}
