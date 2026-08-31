"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowRight, Download, Lock, BookOpen, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal, StaggerChildren, StaggerItem } from "@/components/animations";
import { MarketNoteStrip } from "@/components/landing/market-note-strip";
import type { StarterInfographic, StarterPackHero, StarterUpgradeCta } from "@/data/starter-pack";
import { attachmentHref, resolveAttachmentUrl } from "@/lib/content/attachments";
import { StarterPackModal } from "@/components/landing/starter-pack-modal";
import { startCheckout } from "@/lib/start-checkout";
import { PAGE_HERO_TOP, PAGE_HERO_BOTTOM, PAGE_CTA_PY } from "@/lib/layout-constants";
import { CAREER_PLAN_HREF } from "@/lib/pricing-routes";

const STARTER_PACK_HREF = "/starter-pack";

export function StarterPackClient({
  hero,
  infographics,
  marketNote,
  chapterPreview,
  assetUrls = {},
  isLoggedIn = false,
  glossaryCount,
  chapterCount,
  upgradeCta,
}: {
  hero: StarterPackHero;
  infographics: StarterInfographic[];
  marketNote: typeof import("@/data/starter-pack").STARTER_MARKET_NOTE;
  chapterPreview: typeof import("@/data/starter-pack").STARTER_CHAPTER_PREVIEW;
  assetUrls?: Record<string, string>;
  isLoggedIn?: boolean;
  glossaryCount: number;
  chapterCount: number;
  upgradeCta: StarterUpgradeCta;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingPro, setLoadingPro] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  function handleDownloadGate() {
    if (!isLoggedIn) {
      router.push(
        `/signup?plan=starter&callbackUrl=${encodeURIComponent(STARTER_PACK_HREF)}`
      );
      return;
    }
    setModalOpen(true);
  }

  async function handleUpgradePro() {
    if (!session?.user) {
      router.push(`/signup?plan=pro&callbackUrl=${encodeURIComponent(CAREER_PLAN_HREF("pro"))}`);
      return;
    }
    setLoadingPro(true);
    try {
      const url = await startCheckout("pro");
      if (url) window.location.href = url;
      else router.push(CAREER_PLAN_HREF("pro"));
    } catch {
      router.push(CAREER_PLAN_HREF("pro"));
    } finally {
      setLoadingPro(false);
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className={`bg-primary-800 section-dark ${PAGE_HERO_TOP} ${PAGE_HERO_BOTTOM} relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />
        <div className="relative z-10 page-container">
          <Reveal>
            <div className="pill pill-dark mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              {hero.eyebrow}
            </div>
            <h1 className="font-serif text-[clamp(32px,5vw,56px)] font-bold text-white mb-4 max-w-2xl leading-tight">
              {hero.title}
            </h1>
            <p className="text-white/65 text-lg max-w-xl mb-8 leading-relaxed">
              {hero.description}
            </p>
            <Button size="xl" variant="primary-dark" onClick={handleDownloadGate}>
              {hero.ctaLabel} <ArrowRight className="w-5 h-5" />
            </Button>
          </Reveal>
        </div>
      </section>

      {/* Infographics grid */}
      <section className="py-16 sm:py-24 page-container">
        <Reveal className="mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-primary-800 mb-2">5 Infographics</p>
          <h2 className="font-serif text-3xl font-bold text-gray-900">Download and keep.</h2>
        </Reveal>
        <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {infographics.map((info) => {
            const url = resolveAttachmentUrl(
              { title: info.title, fileKey: info.fileKey, assetId: info.assetId },
              assetUrls
            );
            const thumbUrl = resolveAttachmentUrl(
              { title: info.title, fileKey: info.thumbKey, assetId: info.thumbAssetId },
              assetUrls
            );
            const delivery = info.delivery ?? "download";
            return (
            <StaggerItem key={info.id}>
              <div className="rounded-xl border border-border bg-white overflow-hidden card-hover h-full flex flex-col">
                <div className="h-40 bg-secondary relative overflow-hidden">
                  {thumbUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumbUrl}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-fg">
                      Preview image
                    </div>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary-800 mb-1">{info.num}</p>
                  <h3 className="font-serif font-semibold text-gray-900 mb-2">{info.title}</h3>
                  <p className="text-sm text-muted-fg flex-1">{info.description}</p>
                  {isLoggedIn && url ? (
                    <a
                      href={attachmentHref(url, delivery)}
                      {...(delivery === "view-only"
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : { download: true })}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary-400 hover:text-primary-800 transition-colors"
                    >
                      {delivery === "view-only" ? (
                        <>
                          <Eye className="w-4 h-4" /> View
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" /> Download
                        </>
                      )}
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={handleDownloadGate}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary-400 hover:text-primary-800 transition-colors"
                    >
                      <Download className="w-4 h-4" /> {isLoggedIn ? "Get Starter Pack" : "Download free"}
                    </button>
                  )}
                </div>
              </div>
            </StaggerItem>
            );
          })}
        </StaggerChildren>
      </section>

      <MarketNoteStrip
        eyebrow={marketNote.eyebrow}
        title={marketNote.title}
        description={marketNote.description}
        topics={marketNote.topics}
        variant="tags"
        tagStyle="primary"
        subscribedNote={marketNote.subscribed}
      />

      {/* Chapter A preview */}
      <section className="py-16 sm:py-24 page-container">
        <Reveal className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-primary-800 mb-2">{chapterPreview.label}</p>
          <h2 className="font-serif text-3xl font-bold text-gray-900 mb-2">{chapterPreview.title}</h2>
          <p className="text-muted-fg">
            {chapterPreview.freeSections} of {chapterPreview.totalSections} sections free with Starter.
          </p>
        </Reveal>
        <div className="rounded-xl border border-border bg-white overflow-hidden">
          {chapterPreview.sections.map((section, i) => (
            <div
              key={section.id}
              className={`flex items-center gap-4 px-5 py-4 ${i > 0 ? "border-t border-border" : ""} ${!section.free ? "bg-secondary/50" : ""}`}
            >
              <span className="font-mono text-xs text-primary-400 w-8 flex-shrink-0">{section.number}</span>
              <p className={`text-sm flex-1 ${section.free ? "text-gray-900 font-medium" : "text-muted-fg"}`}>
                {section.title}
              </p>
              {section.free ? (
                <Link href="/playbook/a" className="text-xs font-semibold text-primary-400 hover:underline flex items-center gap-1">
                  Read <ArrowRight className="w-3 h-3" />
                </Link>
              ) : (
                <span className="flex items-center gap-1 text-xs text-muted-fg">
                  <Lock className="w-3 h-3" /> Pro
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/playbook/a">
            <Button>
              <BookOpen className="w-4 h-4" /> Start Chapter A Preview
            </Button>
          </Link>
          {isLoggedIn ? (
            <Link href="/glossary">
              <Button variant="outline">Browse Glossary ({glossaryCount} terms)</Button>
            </Link>
          ) : (
            <Button
              variant="outline"
              onClick={() =>
                router.push(
                  `/signup?plan=starter&callbackUrl=${encodeURIComponent("/glossary")}`
                )
              }
            >
              Browse Glossary ({glossaryCount} terms)
            </Button>
          )}
        </div>
      </section>

      <section className={`bg-primary-800 section-dark ${PAGE_CTA_PY}`}>
        <div className="page-container flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-3">
              {upgradeCta.title}
            </h2>
            <p className="text-white/65 text-sm sm:text-base leading-relaxed">
              {upgradeCta.description}
            </p>
          </div>
          <Button
            size="lg"
            variant="primary-dark"
            className="w-full md:w-auto shrink-0"
            onClick={handleUpgradePro}
            loading={loadingPro}
          >
            {upgradeCta.buttonLabel} <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      <StarterPackModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
