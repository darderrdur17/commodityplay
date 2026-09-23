import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CaseStudyNavPeer } from "@/lib/content/case-studies-payload";

interface Props {
  previousStudy: CaseStudyNavPeer | null;
}

export function CaseStudyFooterNav({ previousStudy }: Props) {
  return (
    <div className="-mx-4 sm:-mx-8 lg:-mx-12 mt-10 sm:mt-14 border-t border-border bg-secondary/80 py-6 sm:py-8 px-4 sm:px-8 lg:px-12">
      <div className="flex flex-col sm:flex-row sm:items-stretch sm:justify-between gap-4 max-w-5xl">
        {previousStudy ? (
          <Link
            href={`/case-studies/${previousStudy.slug}`}
            className="flex items-center gap-3 rounded-lg border border-border bg-white px-4 py-3 sm:max-w-[min(100%,18rem)] hover:border-primary-line hover:bg-accent/30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 shrink-0 text-primary-400" aria-hidden />
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-fg mb-1">
                Previous case study
              </p>
              <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
                {previousStudy.title}
              </p>
            </div>
          </Link>
        ) : (
          <div className="hidden sm:block sm:max-w-[min(100%,18rem)]" aria-hidden />
        )}

        <Link
          href="/case-studies"
          className="flex items-center gap-3 rounded-lg border border-border bg-white px-4 py-3 sm:max-w-[min(100%,18rem)] sm:ml-auto hover:border-primary-line hover:bg-accent/30 transition-colors"
        >
          <div className="min-w-0 flex-1 sm:text-right">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-fg mb-1">
              All case studies
            </p>
            <p className="text-sm font-semibold text-gray-900 leading-snug">Back to the full library</p>
          </div>
          <ChevronRight className="w-4 h-4 shrink-0 text-primary-400" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
