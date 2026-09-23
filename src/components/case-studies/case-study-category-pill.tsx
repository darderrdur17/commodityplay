import { cn } from "@/lib/utils";
import { caseStudyCategoryPreviewStyle } from "@/lib/case-study-category-style";
import type { CaseStudyTrackTone } from "@/lib/case-study-category-style";

interface Props {
  category: string;
  track?: CaseStudyTrackTone | string | null;
  className?: string;
}

export function CaseStudyCategoryPill({ category, track, className }: Props) {
  const style = caseStudyCategoryPreviewStyle(category, track);
  return (
    <span
      className={cn(
        "inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide",
        className
      )}
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {category}
    </span>
  );
}
