"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const PACK_ITEMS = [
  "Ecosystem Map",
  "Crack Spread Guide",
  "Trade Finance Flow",
  "LNG Cargo Flow",
  "Price Benchmarks 101",
  "Biweekly email digest",
];

type Track = "CAREER" | "SALES";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function StarterPackModal({ open, onClose }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [track, setTrack] = useState<Track | null>(null);

  function resetForm() {
    setSubmitted(false);
    setSubmitting(false);
    setError(null);
    setTrack(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!track) {
      setError("Please select a track");
      return;
    }

    const form = e.currentTarget;
    const firstName = (form.elements.namedItem("firstName") as HTMLInputElement).value.trim();
    const lastName = (form.elements.namedItem("lastName") as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();

    setSubmitting(true);
    try {
      const res = await fetch("/api/starter-pack/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, track }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary-800/50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-muted-fg hover:bg-secondary transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {!submitted ? (
              <>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-400 mb-2">
                  Free Starter Pack
                </p>
                <h2 className="font-serif text-2xl font-bold text-gray-900 mb-2">
                  Get 5 Infographics Free
                </h2>
                <p className="text-sm text-muted-fg mb-5">
                  Download instantly. No credit card. Plus the biweekly email digest to your inbox.
                </p>

                <ul className="grid grid-cols-2 gap-x-3 gap-y-2 mb-6">
                  {PACK_ITEMS.map((item) => (
                    <li key={item} className="flex items-center gap-1.5 text-xs text-gray-700">
                      <Check className="w-3 h-3 text-primary-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>

                {error && (
                  <div className="flex items-center gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 mb-4">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        placeholder="Wei Ming"
                        className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        placeholder="Tan"
                        className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Work Email</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="you@company.com"
                      className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                      required
                    />
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">Your track</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(["CAREER", "SALES"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setTrack(t);
                            if (error === "Please select a track") setError(null);
                          }}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            track === t
                              ? "border-primary-400 bg-primary-soft"
                              : "border-border hover:border-primary-line"
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <input
                              type="checkbox"
                              readOnly
                              checked={track === t}
                              className="mt-0.5 rounded border-border accent-primary-400 pointer-events-none"
                            />
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {t === "CAREER" ? "Build a Career" : "Sell into Firms"}
                              </p>
                              <p className="text-xs text-muted-fg mt-0.5">
                                {t === "CAREER"
                                  ? "Breaking in or moving up on the desk"
                                  : "Selling products and services into trading firms"}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button type="submit" className="w-full" size="lg" loading={submitting}>
                    <Download className="w-4 h-4" />
                    Send Me the Free Pack →
                  </Button>
                  <p className="text-[11px] text-muted-fg text-center">No spam. Unsubscribe anytime.</p>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-primary-soft flex items-center justify-center mx-auto mb-4">
                  <Check className="w-7 h-7 text-primary-400" />
                </div>
                <h3 className="font-serif text-xl font-bold text-gray-900 mb-2">Check your inbox.</h3>
                <p className="text-sm text-muted-fg mb-6 max-w-xs mx-auto">
                  Your free infographic pack is on its way. While you wait — explore the Playbook below.
                </p>
                <Link href="/signup" onClick={handleClose}>
                  <Button className="w-full">Create Your Account</Button>
                </Link>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
