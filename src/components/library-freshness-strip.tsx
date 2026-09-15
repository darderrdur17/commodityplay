import { cn } from "@/lib/utils";

export function LibraryFreshnessStrip({
  lastRefreshedLabel,
  newThisMonth,
  total,
  className,
}: {
  lastRefreshedLabel: string | null;
  newThisMonth: number;
  total: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-white px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <p className="text-sm text-gray-800">
        Bank last refreshed{" "}
        <span className="font-semibold">{lastRefreshedLabel ?? "—"}</span>
      </p>
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-fg">
        <span>
          <span className="font-semibold text-gray-900">{newThisMonth}</span> new this month
        </span>
        <span>
          <span className="font-semibold text-gray-900">{total}</span> questions total
        </span>
      </div>
    </div>
  );
}
