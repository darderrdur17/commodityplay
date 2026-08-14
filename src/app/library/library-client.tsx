"use client";

import React from "react";
import Link from "next/link";
import { Download, Eye, FileText, Lock } from "lucide-react";
import { Reveal, GradientOrbs } from "@/components/animations";
import { Button } from "@/components/ui/button";
import { PAGE_HERO_TOP } from "@/lib/layout-constants";
import { attachmentHref } from "@/lib/content/attachments";
import type { LibraryFilePublic } from "@/lib/content/accessors";
import { CAREER_PLAN_HREF } from "@/lib/pricing-routes";

export function LibraryClient({
  files,
  hasAccess,
}: {
  files: LibraryFilePublic[];
  hasAccess: boolean;
}) {
  return (
    <div className="overflow-hidden">
      <section className={`bg-primary-800 section-dark ${PAGE_HERO_TOP} pb-14 sm:pb-20 relative overflow-hidden`}>
        <GradientOrbs />
        <div className="relative z-10 page-container text-center">
          <Reveal>
            <div className="pill pill-dark mb-5 mx-auto">
              <FileText className="w-3 h-3" /> Elite Resources
            </div>
            <h1 className="font-serif text-[clamp(36px,6vw,60px)] font-bold text-white mb-4 tracking-tight">
              Resource Library
            </h1>
            <p className="text-white/65 text-lg max-w-xl mx-auto">
              Bonus guides, reference PDFs, and desk materials — curated for Elite members.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="page-container py-12 sm:py-16">
        {!hasAccess ? (
          <Reveal className="max-w-lg mx-auto text-center rounded-2xl border border-border bg-secondary/40 p-8">
            <Lock className="w-8 h-8 text-muted-fg mx-auto mb-4" />
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-2">Elite access required</h2>
            <p className="text-sm text-muted-fg mb-6">
              Upgrade to Elite to browse and download library resources.
            </p>
            <Link href={CAREER_PLAN_HREF("elite")}>
              <Button size="lg">View Elite plans</Button>
            </Link>
          </Reveal>
        ) : files.length === 0 ? (
          <Reveal className="text-center text-muted-fg py-12">
            <p>No library resources published yet.</p>
          </Reveal>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {files.map((file) => {
              const url = `/api/content/assets/${file.assetId}`;
              const delivery = file.delivery ?? "view-only";
              return (
                <Reveal key={file.id}>
                  <div className="rounded-xl border border-border bg-white p-5 h-full flex flex-col">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-serif font-semibold text-gray-900">{file.label}</h3>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-fg shrink-0">
                        {file.track} track
                      </span>
                    </div>
                    <p className="text-xs text-muted-fg mb-4 truncate">{file.fileName}</p>
                    <div className="mt-auto">
                      <a
                        href={attachmentHref(url, delivery)}
                        {...(delivery === "view-only"
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : { download: true })}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-primary-400 hover:text-primary-800"
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
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
