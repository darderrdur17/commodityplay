import React from "react";
import {
  formatCaseStudySourceLabel,
  parseCaseStudyInline,
} from "@/lib/content/case-studies-payload";

export function CaseStudyInline({ text }: { text: string }) {
  return (
    <>
      {parseCaseStudyInline(text).map((part, i) => {
        if (part.kind === "source") {
          return (
            <em key={i} className="italic text-primary-400">
              {formatCaseStudySourceLabel(part.text)}
            </em>
          );
        }
        if (part.kind === "strong") {
          return (
            <strong key={i} className="font-semibold text-gray-900">
              {part.text}
            </strong>
          );
        }
        return <React.Fragment key={i}>{part.text}</React.Fragment>;
      })}
    </>
  );
}
