"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Send, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Reveal } from "@/components/animations";
import { PAGE_HERO_TOP } from "@/lib/layout-constants";

/** Asterisk marks fields shown publicly on Mentor Connect (anonymous profile). */
const PUBLIC_LABEL_SUFFIX = " *";

const schema = z.object({
  name: z.string().min(1, "Please enter your name").max(200),
  email: z.string().email("Please enter a valid email address").max(200),
  company: z.string().max(200).optional(),
  headline: z.string().min(1, "Please enter a professional headline").max(200),
  years: z.coerce
    .number({ invalid_type_error: "Enter years of experience" })
    .int()
    .min(0, "Must be 0 or more")
    .max(80, "That seems too high"),
  tagsText: z.string().min(1, "Please enter at least one subject").max(300),
});
type FormData = z.infer<typeof schema>;

export default function MentorApplyPage() {
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setApiError(null);
    const tags = data.tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/mentor-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          company: data.company || undefined,
          headline: data.headline,
          years: data.years,
          tags,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setApiError(body.error || "Something went wrong. Please try again.");
        return;
      }
      setSuccess(true);
    } catch {
      setApiError("Network error. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-secondary">
      <section className={`bg-primary-800 section-dark ${PAGE_HERO_TOP} pb-16`}>
        <div className="page-container">
          <Reveal>
            <div className="pill pill-dark mb-4 inline-flex">
              <ShieldCheck className="w-3 h-3" /> Invitation only
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-4">
              Mentor sign-up
            </h1>
            <p className="text-white/65 text-lg max-w-2xl">
              Fill in your details below and our team will review your profile. Once approved, you will receive an email to access your account.
            </p>
          </Reveal>
        </div>
      </section>

      <div className="max-w-[560px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-border p-8 text-center"
          >
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-green-500" />
            </div>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-2">Application submitted</h2>
            <p className="text-muted-fg text-sm">
              Thanks — your details have been sent for review. We&apos;ll reach out directly if your profile is approved for Mentor Connect.
            </p>
          </motion.div>
        ) : (
          <Reveal>
            <div className="bg-white rounded-2xl border border-border p-6 sm:p-8">
              <h2 className="font-serif text-lg font-bold text-gray-900 mb-1">Your details</h2>
              <p className="text-sm text-muted-fg mb-6">
                Fields marked with <span className="text-primary-800 font-semibold">*</span> are shown publicly on Mentor Connect under your anonymous mentor ID. Name and email stay internal.
              </p>

              {apiError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
                  {apiError}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Name"
                  placeholder="Alex Chen"
                  error={errors.name?.message}
                  {...register("name")}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  error={errors.email?.message}
                  {...register("email")}
                />
                <Input
                  label="Company name"
                  placeholder="e.g. Vitol, Trafigura, Glencore"
                  error={errors.company?.message}
                  {...register("company")}
                />
                <Input
                  label={`Professional headline${PUBLIC_LABEL_SUFFIX}`}
                  placeholder="e.g. Crude Oil Trader — Ex-Supermajor"
                  hint="One line describing your role and background — shown on Mentor Connect."
                  error={errors.headline?.message}
                  {...register("headline")}
                />
                <Input
                  label={`Years of experience${PUBLIC_LABEL_SUFFIX}`}
                  type="number"
                  min={0}
                  max={80}
                  placeholder="e.g. 12"
                  error={errors.years?.message}
                  {...register("years")}
                />
                <Input
                  label={`Subjects (tags)${PUBLIC_LABEL_SUFFIX}`}
                  placeholder="e.g. Crude oil, Forward curves, Physical arbitrage"
                  hint="Comma-separated — match the specialty tags shown on existing mentor profiles."
                  error={errors.tagsText?.message}
                  {...register("tagsText")}
                />

                <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
                  <Send className="w-4 h-4" /> Submit application
                </Button>
              </form>
            </div>
          </Reveal>
        )}
      </div>
    </div>
  );
}
