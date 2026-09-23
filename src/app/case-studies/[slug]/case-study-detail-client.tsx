"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { caseStudyCategoryHeroStyle } from "@/lib/case-study-category-style";
import {
  CASE_STUDY_HERO_STAT_BG,
  caseStudySectionNavTitle,
  isCaseStudyComingSoon,
  shouldShowCaseStudySidebar,
  visibleCaseStudyBlocks,
  visibleCallout,
  visibleCaseStudyStats,
  visibleCaseStudyTable,
  visibleLessons,
  visibleNumberedPoints,
  visibleSelfTest,
  visibleSources,
  visibleTimeline,
} from "@/lib/content/case-studies-payload";
import type {
  CaseStudyBlock,
  CaseStudyCard,
  CaseStudySection,
  CaseStudySelfTest,
  CaseStudyTimelineTone,
} from "@/data/case-studies";
import { CaseStudyInline } from "@/components/case-studies/case-study-inline";
import { CaseStudyFooterNav } from "@/components/case-studies/case-study-footer-nav";
import type { CaseStudyNavPeer } from "@/lib/content/case-studies-payload";

interface Props {
  card: CaseStudyCard;
  sections: CaseStudySection[] | null;
  displayNumber: number;
  previousStudy: CaseStudyNavPeer | null;
  userTier: string;
}

const TIMELINE_DOT: Record<CaseStudyTimelineTone, string> = {
  negative: "bg-red-500",
  positive: "bg-emerald-500",
  neutral: "bg-primary-400",
};

function CaseStudyParagraph({ text }: { text: string }) {
  const isItalic = text.startsWith("*") && text.endsWith("*") && !text.startsWith("**");
  if (isItalic) {
    return (
      <blockquote className="border-l-4 border-primary-400 pl-4 my-4 italic text-gray-800 font-serif">
        <CaseStudyInline text={text.slice(1, -1)} />
      </blockquote>
    );
  }
  if (text.startsWith("▸")) {
    return (
      <p className="text-sm text-gray-700 leading-relaxed mb-2 pl-3 border-l-2 border-primary-line">
        <CaseStudyInline text={text.slice(1).trimStart()} />
      </p>
    );
  }
  return (
    <p className="text-gray-700 leading-relaxed mb-4 text-sm sm:text-base">
      <CaseStudyInline text={text} />
    </p>
  );
}

function CaseStudySelfTestBlock({ test }: { test: CaseStudySelfTest }) {
  const [open, setOpen] = useState(false);
  const questions = test.questions;

  return (
    <div className="rounded-2xl border border-border bg-[#f7f9fc] p-4 sm:p-6">
      {test.kicker ? (
        <p className="text-[11px] font-bold uppercase tracking-widest text-primary-400 mb-4">
          {test.kicker}
        </p>
      ) : null}
      <div className="divide-y divide-border/80">
        {questions.map((item, i) => (
          <div key={i} className="flex gap-3 sm:gap-4 py-3 first:pt-0 last:pb-0">
            <span className="text-xs font-bold text-primary-400 shrink-0 pt-0.5">Q{i + 1}</span>
            <p className="text-sm sm:text-base text-gray-800 leading-relaxed">
              <CaseStudyInline text={item.question} />
            </p>
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:border-primary-line"
        >
          {open ? (
            <>
              Hide Answers <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              Reveal Answers <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
      {open ? (
        <div className="mt-6 pt-5 border-t border-border space-y-3">
          {questions.map((item, i) => (
            <div key={i} className="rounded-xl border border-border bg-white px-4 py-3 sm:px-5 sm:py-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary-400 mb-1.5">
                Q{i + 1} Answer
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                <CaseStudyInline text={item.answer} />
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CaseStudyBlockView({ block }: { block: CaseStudyBlock }) {
  switch (block.kind) {
    case "title":
      return (
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 break-words">
          {block.text}
        </h2>
      );
    case "paragraph":
      return <CaseStudyParagraph text={block.text} />;
    case "quote":
      return (
        <blockquote className="rounded-2xl bg-primary-soft border-l-4 border-primary-400 px-4 py-3 sm:px-5 sm:py-4 my-4 italic font-serif text-gray-800">
          <CaseStudyInline text={block.text} />
        </blockquote>
      );
    case "numberedPoints": {
      const numberedPoints = visibleNumberedPoints(block.points);
      if (!numberedPoints.length) return null;
      return (
        <ol className="space-y-4 mb-4">
          {numberedPoints.map((point, i) => (
            <li key={i} className="text-sm sm:text-base text-gray-700 leading-relaxed">
              <span className="font-bold text-primary-400">{i + 1}. </span>
              {point.lead ? (
                <strong className="font-semibold text-gray-900">
                  <CaseStudyInline
                    text={point.lead.endsWith(".") ? point.lead : `${point.lead}.`}
                  />
                </strong>
              ) : null}{" "}
              <CaseStudyInline text={point.body} />
            </li>
          ))}
        </ol>
      );
    }
    case "table": {
      const table = visibleCaseStudyTable(block.table);
      if (!table) return null;
      return (
        <div className="overflow-x-auto rounded-xl border border-border mb-4">
          <table className="w-full text-left text-sm min-w-[32rem]">
            <thead>
              <tr className="bg-primary-800 text-white">
                {table.headers.map((header, i) => (
                  <th key={i} className="px-3 py-2.5 font-bold uppercase tracking-wider text-[11px]">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, ri) => (
                <tr key={ri} className="border-t border-border bg-white">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-3 text-gray-800 align-top leading-relaxed">
                      <CaseStudyInline text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case "callout": {
      const callout = visibleCallout(block.callout);
      if (!callout) return null;
      return (
        <div className="rounded-2xl bg-primary-800 text-white p-5 sm:p-6 mb-4">
          {callout.kicker ? (
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/70 mb-4">
              {callout.kicker}
            </p>
          ) : null}
          <ul>
            {callout.items.map((item, i) => (
              <li
                key={i}
                className={`flex gap-3 py-3 text-sm sm:text-base leading-relaxed text-white/90 ${
                  i > 0 ? "border-t border-white/15" : "pt-0"
                }`}
              >
                <span className="text-white/50 shrink-0">›</span>
                <span>
                  <CaseStudyInline text={item} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    case "timeline": {
      const timeline = visibleTimeline(block.timeline);
      if (!timeline) return null;
      return (
        <div className="rounded-2xl border border-border bg-[#f7f9fc] p-4 sm:p-6 mb-4">
          {timeline.kicker ? (
            <p className="text-[11px] font-bold uppercase tracking-widest text-primary-400 mb-4">
              {timeline.kicker}
            </p>
          ) : null}
          <ul className="space-y-4">
            {timeline.events.map((event, i) => (
              <li key={i} className="flex gap-3 sm:gap-4">
                <span
                  className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${TIMELINE_DOT[event.tone ?? "neutral"]}`}
                />
                <p className="min-w-[6.5rem] sm:min-w-[8rem] text-sm font-semibold text-gray-900 shrink-0">
                  {event.date}
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  <CaseStudyInline text={event.body} />
                </p>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    case "lessons": {
      const lessons = visibleLessons(block.lessons);
      if (!lessons.length) return null;
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
          {lessons.map((lesson, i) => (
            <article key={i} className="rounded-2xl border border-border bg-white p-4 sm:p-5">
              <p className="text-[11px] font-bold text-primary-400 mb-2">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="font-semibold text-gray-900 mb-2">{lesson.title}</h3>
              <p className="text-sm text-muted-fg leading-relaxed">
                <CaseStudyInline text={lesson.body} />
              </p>
            </article>
          ))}
        </div>
      );
    }
    case "selfTest": {
      const selfTest = visibleSelfTest(block.selfTest);
      if (!selfTest) return null;
      return (
        <div className="mb-4">
          <CaseStudySelfTestBlock test={selfTest} />
        </div>
      );
    }
    case "sources": {
      const sources = visibleSources(block.sources);
      const sourcesNote = block.note?.trim() ?? "";
      return (
        <>
          {sources.length ? (
            <div className="rounded-2xl border border-border bg-[#f7f9fc] px-4 sm:px-6 mb-4">
              {sources.map((source, i) => (
                <p
                  key={i}
                  className={`py-3 text-sm text-gray-700 leading-relaxed ${
                    i > 0 ? "border-t border-border/80" : ""
                  }`}
                >
                  <strong className="font-semibold text-gray-900">{source.name}</strong>
                  {source.detail ? (
                    <>
                      {" — "}
                      <CaseStudyInline text={source.detail} />
                    </>
                  ) : null}
                </p>
              ))}
            </div>
          ) : null}
          {sourcesNote ? (
            <p className="text-sm text-muted-fg leading-relaxed mb-2">
              <CaseStudyInline text={sourcesNote} />
            </p>
          ) : null}
        </>
      );
    }
  }
}

function CaseStudyArticleSection({ section, index }: { section: CaseStudySection; index: number }) {
  const blocks = visibleCaseStudyBlocks(section.blocks);

  return (
    <section key={section.id} id={section.id} className="scroll-mt-24">
      <p className="text-xs font-bold uppercase tracking-widest text-primary-400 mb-1">
        — {section.label || String(index + 1).padStart(2, "0")}
      </p>
      {blocks.map((block) => (
        <CaseStudyBlockView key={block.id} block={block} />
      ))}
    </section>
  );
}

export function CaseStudyDetailClient({ card, sections, displayNumber, previousStudy }: Props) {
  const comingSoon = isCaseStudyComingSoon(card);
  const stats = visibleCaseStudyStats(card.stats);
  const showSidebar = shouldShowCaseStudySidebar(card.showSidebar);
  const subtitle = card.subtitle?.trim() ?? "";
  const heroBody = card.heroBody?.trim() ?? "";
  const articleSections = sections ?? [];
  const hasArticle = articleSections.length > 0;
  const categoryStyle = card.category ? caseStudyCategoryHeroStyle(card.category) : null;

  return (
    <div className="page-container py-6 sm:py-10">
      <section className="rounded-2xl bg-primary-800 px-5 sm:px-8 py-8 sm:py-10 mb-6 sm:mb-8 relative overflow-hidden">
        <Link
          href="/case-studies"
          className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" /> Back to Case Studies
        </Link>
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <span className="pill pill-dark">Case Study {displayNumber}</span>
          {categoryStyle ? (
            <span
              className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide"
              style={{ backgroundColor: categoryStyle.bg, color: categoryStyle.text }}
            >
              {card.category}
            </span>
          ) : null}
          {comingSoon ? (
            <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide bg-white/15 text-white/90 border border-white/25">
              Coming soon
            </span>
          ) : null}
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white mb-4 break-words">
          {card.title}
        </h1>
        {comingSoon ? (
          <p className="text-base sm:text-lg text-white/75 max-w-3xl">
            This case study is not published yet. Check back soon — it will appear on Case Studies when ready.
          </p>
        ) : null}
        {!comingSoon && subtitle ? (
          <p className="text-base sm:text-lg italic text-white/80 mb-5 max-w-3xl break-words">
            {subtitle}
          </p>
        ) : null}
        {!comingSoon && heroBody ? (
          <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 sm:px-5 sm:py-4 text-sm sm:text-base text-white/85 leading-relaxed max-w-4xl">
            <CaseStudyInline text={heroBody} />
          </div>
        ) : null}
        {!comingSoon && stats.length ? (
          <div
            className="grid gap-3 mt-6"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 12rem), 1fr))" }}
          >
            {stats.map((stat, i) => (
              <div
                key={i}
                className="rounded-xl border border-emerald-200/80 px-4 py-3 sm:px-5 sm:py-4"
                style={{ backgroundColor: CASE_STUDY_HERO_STAT_BG }}
              >
                <p className="font-serif text-xl sm:text-2xl font-bold text-primary-800 break-words">
                  {stat.value}
                </p>
                <p className="text-xs sm:text-sm text-gray-700 mt-1 leading-snug">{stat.label}</p>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {comingSoon ? null : (
      <div
        className={
          showSidebar && hasArticle
            ? "grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_16rem] gap-8 lg:gap-10"
            : "max-w-3xl"
        }
      >
        <div>
          <p className="flex items-center gap-1.5 text-sm text-muted-fg mb-6">
            <Clock className="w-4 h-4 shrink-0" /> {card.readMinutes} min read
          </p>
          {!hasArticle ? (
            <div className="rounded-2xl border border-border bg-white p-6 sm:p-8">
              <p className="text-gray-700 leading-relaxed mb-4 text-sm sm:text-base">{card.description}</p>
              <p className="text-sm text-muted-fg">Full breakdown unavailable.</p>
            </div>
          ) : (
            <div className="space-y-10 sm:space-y-12">
              {articleSections.map((section, i) => (
                <CaseStudyArticleSection key={section.id} section={section} index={i} />
              ))}
            </div>
          )}
        </div>
        {showSidebar && hasArticle ? (
          <aside className="lg:sticky lg:top-24 h-fit rounded-2xl border border-border bg-[#f7f9fc] p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-primary-400 mb-3">
              In this case study
            </p>
            <nav className="space-y-1">
              {articleSections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="block text-sm text-gray-600 hover:text-primary-400 py-1"
                >
                  {caseStudySectionNavTitle(section)}
                </a>
              ))}
            </nav>
          </aside>
        ) : null}
      </div>
      )}

      <CaseStudyFooterNav previousStudy={previousStudy} />
    </div>
  );
}
