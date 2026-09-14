"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowLeft, ArrowRight, BookOpen, CheckCircle, ChevronDown,
  Lock, Download, FileText, Image, Lightbulb, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedProgress } from "@/components/animations";
import { type PlaybookSection } from "@/data/playbook";
import type { PlaybookChapterRecord } from "@/lib/content/playbook-payload";
import {
  isStarterPlaybookSectionUnlocked,
  starterChapterPreviewLabel,
} from "@/data/starter-pack";
import type { ContentAttachment } from "@/lib/content/attachments";
import { attachmentHref, resolveAttachmentUrl } from "@/lib/content/attachments";
import { PlaybookText } from "@/components/playbook/playbook-text";

interface Props {
  chapter: PlaybookChapterRecord;
  sections: PlaybookSection[];
  chapters: PlaybookChapterRecord[];
  userTier?: string;
  hasPlaybookAccess?: boolean;
  assetUrls?: Record<string, string>;
  sectionAssetsMap?: Record<string, ContentAttachment[]>;
}

const ASSET_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Infographic: Image,
  Framework: FileText,
  "Worked Example": Lightbulb,
};

export function ChapterClient({ chapter, sections, chapters, userTier = "STARTER", hasPlaybookAccess = false, assetUrls = {}, sectionAssetsMap = {} }: Props) {
  const [readProgress, setReadProgress] = useState(0);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.id ?? "");
  const [openSection, setOpenSection] = useState<string | null>(sections[0]?.id ?? null);
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const { scrollYProgress } = useScroll({ target: contentRef });

  const chapterIndex = chapters.findIndex((c) => c.id === chapter.id);
  const prevChapter = chapterIndex > 0 ? chapters[chapterIndex - 1] : null;
  const nextChapter = chapterIndex < chapters.length - 1 ? chapters[chapterIndex + 1] : null;

  useEffect(() => {
    const save = async (progress: number) => {
      if (saved) return;
      const completed = progress >= 90;
      try {
        await fetch("/api/user/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chapterId: chapter.id,
            progress: Math.round(progress),
            completed,
          }),
        });
        if (completed) setSaved(true);
      } catch {}
    };

    const unsub = scrollYProgress.on("change", (v) => {
      const pct = Math.round(v * 100);
      setReadProgress(pct);
      if (pct >= 90) save(pct);
    });
    return unsub;
  }, [scrollYProgress, chapter.id, saved]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id.replace("section-", ""));
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );
    for (const id of Object.keys(sectionRefs.current)) {
      const el = sectionRefs.current[id];
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);

  const isChapterAPreview = chapter.id === "a" && !hasPlaybookAccess;
  const totalAssets = sections.reduce((n, s) => n + (sectionAssetsMap[s.id]?.length ?? 0), 0);

  function isSectionUnlocked(sectionIndex: number) {
    return isStarterPlaybookSectionUnlocked(
      chapter.id,
      sectionIndex,
      hasPlaybookAccess,
      chapter.preview
    );
  }

  function scrollToSection(sectionId: string, sectionIndex: number) {
    if (!isSectionUnlocked(sectionIndex)) return;
    setOpenSection(sectionId);
    sectionRefs.current[sectionId]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="relative">
      <motion.div
        className="fixed top-16 left-0 right-0 h-0.5 bg-primary-400 z-50 origin-left"
        style={{ scaleX: scrollYProgress }}
      />

      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-sm border-b border-border">
        <div className="page-container py-3 flex items-center justify-between gap-3 sm:gap-4">
          <Link href="/playbook" className="flex items-center gap-1.5 text-sm text-muted-fg hover:text-primary-400 transition-colors">
            <ArrowLeft className="w-4 h-4" /> {isChapterAPreview ? "Pro Pack" : "All Chapters"}
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-fg hidden sm:block">{readProgress}% read</span>
            <AnimatedProgress value={readProgress} className="w-24 hidden sm:block" />
            {readProgress >= 90 && (
              <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                <CheckCircle className="w-3.5 h-3.5" /> Complete
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chapter hero */}
      <div className="page-container py-8 sm:py-10">
        <div
          className="rounded-2xl p-8 mb-8 text-white relative overflow-hidden"
          style={{ background: chapter.color }}
        >
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center font-serif font-bold text-xl">
                  {chapter.letter}
                </div>
                <div>
                  <p className="text-white/60 text-xs uppercase tracking-widest">
                    Chapter {chapter.letter}{isChapterAPreview ? " · Free Preview" : ""}
                  </p>
                  <h1 className="font-serif text-2xl font-bold">{chapter.title}</h1>
                </div>
              </div>
              <p className="text-white/70 text-sm mb-4 max-w-xl">{chapter.subtitle}</p>
              {isChapterAPreview && (
                <p className="text-white/80 text-sm bg-white/10 rounded-lg px-4 py-3 border border-white/20 max-w-xl">
                  Starter includes {starterChapterPreviewLabel(sections.length)} in this chapter.
                  Upgrade to Pro for all {sections.length} sections and the full playbook.
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-white/60 text-sm">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                {isChapterAPreview
                  ? starterChapterPreviewLabel(sections.length)
                  : `${sections.length} sections`}
              </span>
              {totalAssets > 0 && (
                <span className="flex items-center gap-1.5"><Download className="w-4 h-4" /> {totalAssets} assets</span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-primary-soft border border-primary-line rounded-xl p-5 mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-primary-800 mb-3">Key Takeaways</p>
          <ul className="space-y-2">
            {(chapter.keyTakeaways ?? []).map((kt, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-primary-800">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary-400" />
                {kt}
              </li>
            ))}
          </ul>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8 items-start">
          {/* Sidebar */}
          <aside className="hidden lg:block sticky top-32">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-800 mb-3">
              Chapter {chapter.letter} —{" "}
              {isChapterAPreview
                ? starterChapterPreviewLabel(sections.length)
                : `${sections.length} Sections`}
            </p>
            <nav className="space-y-0.5">
              {sections.map((section, sectionIndex) => {
                const unlocked = isSectionUnlocked(sectionIndex);
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => scrollToSection(section.id, sectionIndex)}
                    disabled={!unlocked}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left text-xs font-medium transition-all border ${
                      isActive && unlocked
                        ? "bg-primary-soft text-primary-800 border-primary-line font-semibold"
                        : unlocked
                          ? "text-muted-fg hover:bg-secondary border-transparent"
                          : "text-muted-fg/50 cursor-not-allowed border-transparent"
                    }`}
                  >
                    {!unlocked ? <Lock className="w-3 h-3 flex-shrink-0" /> : null}
                    <span className="font-mono text-[10px] text-primary-400 flex-shrink-0">{section.number}</span>
                    <span className="truncate">{section.title}</span>
                  </button>
                );
              })}
            </nav>
            {nextChapter && (
              <div className="mt-5 rounded-lg p-3.5 text-white" style={{ background: chapter.color }}>
                <p className="text-[10px] uppercase tracking-widest text-white/60 mb-1">Up Next</p>
                <p className="font-serif text-sm font-semibold mb-2">Chapter {nextChapter.letter} — {nextChapter.title}</p>
                <Link href={`/playbook/${nextChapter.id}`} className="text-xs text-white/80 hover:text-white flex items-center gap-1">
                  Start Chapter {nextChapter.letter} <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </aside>

          {/* Main content */}
          <div ref={contentRef} className="space-y-6 min-w-0">
            {sections.map((section, sectionIndex) => {
              const isOpen = openSection === section.id;
              const unlocked = isSectionUnlocked(sectionIndex);
              const assets = sectionAssetsMap[section.id] ?? [];

              return (
                <article
                  key={section.id}
                  id={`section-${section.id}`}
                  ref={(el) => { sectionRefs.current[section.id] = el; }}
                  className={`rounded-xl border overflow-hidden scroll-mt-36 ${
                    unlocked ? "border-border bg-white" : "border-border bg-secondary"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => unlocked && setOpenSection(isOpen ? null : section.id)}
                    className={`w-full flex items-start gap-3 p-5 text-left transition-colors ${
                      unlocked ? "hover:bg-secondary/50" : "cursor-default"
                    }`}
                  >
                    <span className="font-mono text-xs text-primary-400 mt-1 flex-shrink-0">{section.number}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-serif font-bold text-gray-900">{section.title}</p>
                        {isChapterAPreview && (
                          <Badge variant={unlocked ? "starter" : "pro"} size="sm">
                            {unlocked ? "Free" : "Pro"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-fg">{section.desc}</p>
                    </div>
                    {!unlocked ? (
                      <Lock className="w-5 h-5 text-muted-fg flex-shrink-0" />
                    ) : (
                      <ChevronDown className={`w-5 h-5 text-muted-fg flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    )}
                  </button>

                  {unlocked && isOpen && (
                    <>
                      <div className="px-5 pb-6 border-t border-border pt-5">
                        <p className="text-gray-900 font-medium italic border-l-4 border-primary-400 pl-4 mb-5">
                          <PlaybookText text={section.hook} />
                        </p>
                        {section.paragraphs.map((p, i) => (
                          <p key={i} className="text-gray-700 leading-relaxed mb-4">
                            <PlaybookText text={p} />
                          </p>
                        ))}
                        {section.pullQuote && (
                          <blockquote className="bg-secondary rounded-xl p-5 my-5 border-l-4 border-primary-400">
                            <p className="font-serif text-gray-800 italic">
                              <PlaybookText text={section.pullQuote} />
                            </p>
                          </blockquote>
                        )}
                        {section.wtmfy && (
                          <div className="bg-primary-soft rounded-xl p-5 mt-5">
                            <p className="text-xs font-bold uppercase tracking-widest text-primary-800 mb-2">What this means for you</p>
                            <p className="text-sm text-primary-900">
                              <PlaybookText text={section.wtmfy} />
                            </p>
                          </div>
                        )}
                        {section.handoff && (
                          <p className="text-sm text-muted-fg mt-5 flex items-center gap-1">
                            <ArrowRight className="w-4 h-4" /> <PlaybookText text={section.handoff} />
                          </p>
                        )}
                      </div>

                      {assets.length > 0 && (
                        <AssetPanel
                          assets={assets}
                          locked={!hasPlaybookAccess && !(chapter.id === "a" && unlocked)}
                          assetUrls={assetUrls}
                        />
                      )}
                    </>
                  )}
                </article>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between mt-16 pt-8 border-t border-border gap-4 flex-wrap">
          {prevChapter ? (
            <Link href={`/playbook/${prevChapter.id}`}>
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4" />
                Chapter {prevChapter.letter}
              </Button>
            </Link>
          ) : <div />}
          {nextChapter && (
            <Link href={`/playbook/${nextChapter.id}`}>
              <Button>
                Chapter {nextChapter.letter}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function AssetPanel({ assets, locked, assetUrls }: { assets: ContentAttachment[]; locked: boolean; assetUrls: Record<string, string> }) {
  return (
    <div className="px-5 sm:px-8 py-5 border-t border-border bg-secondary/80">
      <p className="text-[10px] font-bold uppercase tracking-widest text-primary-800 mb-4">
        Downloadable Assets · {assets.length}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {assets.map((asset) => {
          const Icon = ASSET_ICONS[asset.type ?? ""] || FileText;
          const url = resolveAttachmentUrl(asset, assetUrls);
          const delivery = asset.delivery ?? "download";
          return (
            <div key={`${asset.title}-${asset.fileKey}`} className="rounded-lg border border-border bg-white p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-primary-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-fg">{asset.type}</span>
              </div>
              <h4 className="font-serif text-sm font-semibold text-gray-900 mb-1">{asset.title}</h4>
              <p className="text-xs text-muted-fg flex-1 leading-relaxed">{asset.description}</p>
              {locked ? (
                <span className="mt-3 inline-flex items-center gap-1 text-xs text-muted-fg">
                  <Lock className="w-3 h-3" /> Pro
                </span>
              ) : url ? (
                <a
                  href={attachmentHref(url, delivery)}
                  {...(delivery === "view-only"
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : { download: true })}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary-400 hover:text-primary-800"
                >
                  {delivery === "view-only" ? (
                    <>
                      <Eye className="w-3 h-3" /> View
                    </>
                  ) : (
                    <>
                      <Download className="w-3 h-3" /> Download
                    </>
                  )}
                </a>
              ) : (
                <span className="mt-3 inline-flex items-center gap-1 text-xs text-muted-fg">
                  Coming soon
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
