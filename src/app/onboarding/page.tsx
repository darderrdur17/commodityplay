"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { GradientOrbs } from "@/components/animations";
import { Logo } from "@/components/brand/logo";
import { BRAND_NAME } from "@/lib/brand";

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-secondary">
          <div className="animate-spin w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromSignup = searchParams.get("fromSignup") === "1";
  const { data: session, update, status } = useSession();
  const [track, setTrack] = useState<"CAREER" | "SALES">("CAREER");
  const [saving, setSaving] = useState(false);
  const [trackReady, setTrackReady] = useState(false);
  const [skipTrackStep, setSkipTrackStep] = useState(fromSignup);
  const finishStartedRef = useRef(false);

  useEffect(() => {
    if (status === "loading") return;

    let cancelled = false;

    async function initTrack() {
      let nextTrack: "CAREER" | "SALES" = session?.user?.track ?? "CAREER";
      let skipTrackStep = fromSignup;

      const stored = sessionStorage.getItem("signupTrack");
      if (stored === "CAREER" || stored === "SALES") {
        sessionStorage.removeItem("signupTrack");
        nextTrack = stored;
        skipTrackStep = true;
        try {
          await fetch("/api/user/track", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ track: stored }),
          });
          await update({ track: stored });
        } catch {
          // Continue with quiz — track saves again at finish.
        }
      }

      if (!cancelled) {
        setTrack(nextTrack);
        if (skipTrackStep) {
          setSkipTrackStep(true);
        }
        setTrackReady(true);
      }
    }

    initTrack();

    return () => {
      cancelled = true;
    };
  }, [fromSignup, session?.user?.track, status, update]);

  useEffect(() => {
    if (!trackReady || !skipTrackStep || saving || finishStartedRef.current) return;
    finishStartedRef.current = true;
    void completeOnboarding(track);
    // completeOnboarding is stable enough for signup auto-finish; track is the critical dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackReady, skipTrackStep, track]);

  async function completeOnboarding(selectedTrack: "CAREER" | "SALES") {
    if (saving) return;
    finishStartedRef.current = true;
    setSaving(true);
    try {
      if (selectedTrack === "SALES") {
        await fetch("/api/user/persona", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ track: selectedTrack, persona: "VENDOR", source: "onboarding" }),
        });
        await update({ persona: "VENDOR", track: selectedTrack, onboardingDone: true });
      } else {
        await fetch("/api/user/track", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ track: selectedTrack, completeOnboarding: true }),
        });
        await update({ track: selectedTrack, onboardingDone: true });
      }
      router.push("/dashboard");
    } catch {
      finishStartedRef.current = false;
      router.push("/dashboard");
    }
  }

  function handleContinue() {
    void completeOnboarding(track);
  }

  if (!trackReady || (skipTrackStep && saving)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <div className="animate-spin w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
      <GradientOrbs />
      <div className="relative z-10 w-full max-w-2xl">
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-muted-fg mb-2">
            <span>Step 1 of 1</span>
            <span>100% complete</span>
          </div>
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-border p-8"
        >
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo variant="horizontal" href={false} />
            </div>
            <h2 className="font-serif text-2xl font-bold text-gray-900 mb-2">
              Welcome to {BRAND_NAME}
            </h2>
            <p className="text-muted-fg text-sm max-w-sm mx-auto">
              Let&apos;s personalise your experience. Which track are you on?
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {(["CAREER", "SALES"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTrack(t)}
                className={`p-5 rounded-xl border-2 text-left transition-all duration-200 ${
                  track === t
                    ? "border-primary-400 bg-primary-soft"
                    : "border-border hover:border-primary-line"
                }`}
              >
                <div className="text-2xl mb-2">{t === "CAREER" ? "🚀" : "💼"}</div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">
                  {t === "CAREER" ? "Build a Career" : "Sell Into Firms"}
                </h3>
                <p className="text-xs text-muted-fg">
                  {t === "CAREER"
                    ? "Breaking in, moving up, or re-positioning in commodity trading"
                    : "Selling products / services into commodity trading firms"}
                </p>
                {track === t && (
                  <div className="mt-3 flex items-center gap-1 text-primary-400 text-xs font-semibold">
                    <Check className="w-3.5 h-3.5" /> Selected
                  </div>
                )}
              </button>
            ))}
          </div>

          <Button className="w-full" size="lg" onClick={handleContinue} loading={saving}>
            {track === "SALES" ? "Go to Dashboard" : "Continue"} <ArrowRight className="w-4 h-4" />
          </Button>
          {track === "CAREER" && (
            <p className="text-xs text-muted-fg text-center mt-4">
              Your resume persona is set later on Resume Templates — after you take the archetype quiz there.
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
