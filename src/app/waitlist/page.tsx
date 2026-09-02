"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, CheckCircle, Bell, Shield } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Reveal } from "@/components/animations";
import { TRACK_SELECTION } from "@/data/track-selection";
import { PAGE_HERO_TOP } from "@/lib/layout-constants";

export default function WaitlistPage() {
  const { data: session, status } = useSession();
  const isSignedIn = status === "authenticated";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [track, setTrack] = useState<"CAREER" | "SALES">("CAREER");
  const [gdpr, setGdpr] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadStatus() {
      try {
        const res = await fetch("/api/waitlist");
        const data = await res.json();
        if (cancelled) return;
        if (data.enrolled) setSuccess(true);
        if (data.authenticated) {
          setName(data.name || "");
          setEmail(data.email || "");
          if (data.track === "CAREER" || data.track === "SALES") setTrack(data.track);
        }
      } catch {
        // Keep the form available if status check fails
      } finally {
        if (!cancelled) setChecking(false);
      }
    }
    loadStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!gdpr) {
      setError("Please accept the privacy policy to join the waitlist.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, track, gdprOpt: gdpr }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-secondary">
      <section className={`bg-primary-800 section-dark ${PAGE_HERO_TOP} pb-16`}>
        <div className="page-container text-center">
          <Reveal>
            <div className="pill pill-dark mb-4 mx-auto">
              <Bell className="w-3 h-3" /> Coming Soon
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-4">
              Job Board Waitlist
            </h1>
            <p className="text-white/65 text-lg">
              This is not a product waitlist — signup already creates your CommodityPlay account. Join here only if you want an email when the curated job board launches.
            </p>
          </Reveal>
        </div>
      </section>

      <div className="max-w-[520px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-border p-8 text-center"
          >
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-green-500" />
            </div>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-2">You&apos;re on the list!</h2>
            <p className="text-muted-fg text-sm mb-6">
              We&apos;ll email you at <strong>{email || session?.user?.email}</strong> when the job board launches. Your member account is separate — this list is only for job alerts.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/job-openings">
                <Button variant="outline">Preview Job Openings</Button>
              </Link>
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            </div>
          </motion.div>
        ) : (
          <Reveal>
            <div className="bg-white rounded-2xl border border-border p-6 sm:p-8">
              <h2 className="font-serif text-lg font-bold text-gray-900 mb-1">
                {isSignedIn ? "Get job board alerts" : "Join the job board waitlist"}
              </h2>
              <p className="text-sm text-muted-fg mb-6">
                {isSignedIn
                  ? "You're already a member. Opt in and we'll use your account email — one launch notification, no extra signup."
                  : "No account needed for job alerts. To use Playbook and Mentor Connect, create an account from Sign up."}
              </p>

              {checking && (
                <p className="text-sm text-muted-fg mb-4">Checking your account…</p>
              )}

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignedIn ? (
                  <div className="rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm text-muted-fg">
                    Alerts will go to <strong className="text-gray-800">{email || session?.user?.email}</strong>
                    {track ? ` · ${track === "CAREER" ? TRACK_SELECTION.career.title : TRACK_SELECTION.sales.title}` : ""}
                  </div>
                ) : (
                  <>
                    <Input
                      label="Full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Chen"
                    />
                    <Input
                      label="Email address"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />

                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Your track</p>
                      <div className="grid grid-cols-2 gap-2">
                        {(["CAREER", "SALES"] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setTrack(t)}
                            className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                              track === t
                                ? "border-primary-400 bg-primary-soft text-primary-800"
                                : "border-border text-muted-fg hover:border-primary-line"
                            }`}
                          >
                            {t === "CAREER" ? TRACK_SELECTION.career.title : TRACK_SELECTION.sales.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gdpr}
                    onChange={(e) => setGdpr(e.target.checked)}
                    className="mt-0.5 rounded accent-primary-400"
                  />
                  <span className="text-xs text-muted-fg leading-relaxed">
                    I agree to receive waitlist updates and accept the{" "}
                    <Link href="/privacy" className="text-primary-400 hover:underline">Privacy Policy</Link>.
                    I can unsubscribe at any time.
                  </span>
                </label>

                <Button type="submit" className="w-full" size="lg" loading={loading} disabled={checking}>
                  <Mail className="w-4 h-4" /> {isSignedIn ? "Get job alerts with my account" : "Join Job Board Waitlist"}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-border flex items-start gap-3">
                <Shield className="w-4 h-4 text-muted-fg flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-fg">
                  GDPR-compliant. Your email is stored securely and never sold. See our{" "}
                  <Link href="/privacy" className="text-primary-400">privacy policy</Link>.
                </p>
              </div>
            </div>
          </Reveal>
        )}

        {/* Benefits */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { title: "Curated roles", desc: "Hand-picked from trading firms, not generic job boards" },
            { title: "Early access", desc: "See roles before they're posted publicly" },
            { title: "Persona-matched", desc: "Filtered to your track and experience level" },
          ].map((b) => (
            <div key={b.title} className="bg-white rounded-xl border border-border p-4 text-center">
              <p className="font-semibold text-sm text-gray-900 mb-1">{b.title}</p>
              <p className="text-xs text-muted-fg">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
