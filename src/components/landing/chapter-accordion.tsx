"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ChapterCoverage } from "@/data/landing-content";

interface ChapterAccordionProps {
  chapters: ChapterCoverage[];
}

function ChapterAccordionItem({
  chapter,
  isOpen,
  onToggle,
  panelId,
  pinnedOpen = false,
}: {
  chapter: ChapterCoverage;
  isOpen: boolean;
  onToggle: () => void;
  panelId: string;
  /** Chapter A stays expanded — not collapsible (landing hero preview). */
  pinnedOpen?: boolean;
}) {
  const buttonId = `chapter-${chapter.letter}-btn`;
  const isExpanded = pinnedOpen || isOpen;

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden hover:border-primary-300 transition-colors self-start w-full min-w-0">
      <button
        type="button"
        id={buttonId}
        onClick={pinnedOpen ? undefined : onToggle}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        className={cn(
          "w-full flex items-start gap-3.5 px-4 sm:px-5 py-4 text-left transition-colors",
          pinnedOpen ? "cursor-default" : "hover:bg-secondary/60"
        )}
      >
        <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary-800 text-white font-serif font-bold text-base sm:text-lg flex items-center justify-center shrink-0">
          {chapter.letter}
        </span>
        <span className="flex-1 min-w-0 pt-1.5">
          <span className="block font-serif font-semibold text-gray-900 text-sm sm:text-base">
            {chapter.title}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-fg shrink-0 mt-2 transition-transform duration-200",
            isExpanded && "rotate-180"
          )}
          aria-hidden
        />
      </button>
      {pinnedOpen ? (
        <div
          id={panelId}
          role="region"
          aria-labelledby={buttonId}
          className="overflow-hidden"
        >
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 pl-[3.75rem] sm:pl-[4.25rem] border-t border-border/60">
            <p className="text-sm text-muted-fg leading-relaxed pt-3">{chapter.desc}</p>
          </div>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-4 sm:px-5 pb-4 sm:pb-5 pl-[3.75rem] sm:pl-[4.25rem] border-t border-border/60">
                <p className="text-sm text-muted-fg leading-relaxed pt-3">{chapter.desc}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

export function ChapterAccordion({ chapters }: ChapterAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="grid w-full min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
      {chapters.map((chapter, index) => (
        <ChapterAccordionItem
          key={chapter.letter}
          chapter={chapter}
          panelId={`chapter-${chapter.letter}-panel`}
          pinnedOpen={chapter.letter === "A"}
          isOpen={openIndex === index}
          onToggle={() => setOpenIndex((prev) => (prev === index ? null : index))}
        />
      ))}
    </div>
  );
}
