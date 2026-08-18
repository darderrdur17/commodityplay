"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const PACK_ITEMS = [
  "Ecosystem Map",
  "Crack Spread Guide",
  "Trade Finance Flow",
  "LNG Cargo Flow",
  "Price Benchmarks 101",
  "Biweekly email digest",
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function StarterPackModal({ open, onClose }: Props) {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary-800/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
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
                  <Button type="submit" className="w-full" size="lg">
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
                <Link href="/signup" onClick={onClose}>
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
