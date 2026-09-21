import type { MentorRewardProgress } from "@/lib/mentor-reward-ladder";

interface Props {
  progress: MentorRewardProgress;
  /** Compact row for admin tables; default card for mentor inbox. */
  variant?: "card" | "compact";
}

export function MentorRewardProgressDisplay({ progress, variant = "card" }: Props) {
  const { answeredCount, unlockedRung, nextRung, progressPercent } = progress;

  if (variant === "compact") {
    return (
      <div className="space-y-1 min-w-[140px]">
        <p className="text-xs font-semibold text-gray-800">{answeredCount} answered</p>
        {unlockedRung ? (
          <p className="text-[11px] text-muted-fg">
            Unlocked: {unlockedRung.label} · {unlockedRung.reward}
          </p>
        ) : (
          <p className="text-[11px] text-muted-fg">No reward rung yet</p>
        )}
        {nextRung ? (
          <p className="text-[11px] text-primary-800">
            Next: {nextRung.label} ({nextRung.minQuestions - answeredCount} to go) · {nextRung.reward}
          </p>
        ) : unlockedRung ? (
          <p className="text-[11px] text-green-700">Top rung reached</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">
            Reward ladder
          </p>
          <p className="font-serif text-2xl font-bold">{answeredCount}</p>
          <p className="text-xs text-white/60">questions answered</p>
        </div>
        <div className="text-right">
          {unlockedRung ? (
            <>
              <p className="text-[10px] font-bold uppercase tracking-widest text-accent mb-0.5">
                Latest unlock
              </p>
              <p className="text-sm font-semibold">{unlockedRung.label}</p>
              <p className="text-xs text-white/70">{unlockedRung.reward}</p>
            </>
          ) : (
            <p className="text-xs text-white/60 max-w-[180px]">
              Answer questions to unlock the first reward rung.
            </p>
          )}
        </div>
      </div>
      {nextRung ? (
        <div>
          <div className="flex items-center justify-between text-[11px] text-white/60 mb-1.5">
            <span>Progress to {nextRung.label}</span>
            <span>{answeredCount} / {nextRung.minQuestions}</span>
          </div>
          <div className="h-2 rounded-full bg-white/15 overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-white/55 mt-1.5">
            Next reward: {nextRung.reward} · tracking only in v1 (no auto payout)
          </p>
        </div>
      ) : unlockedRung ? (
        <p className="text-xs text-accent">You&apos;ve reached the top configured reward rung.</p>
      ) : null}
    </div>
  );
}
