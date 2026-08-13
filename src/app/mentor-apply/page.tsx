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
import { Logo } from "@/components/brand/logo";
import { MENTOR_SEGMENTS } from "@/data/mentors";
import { PAGE_HERO_TOP } from "@/lib/layout-constants";

const NOT_SURE_SEGMENT = "unassigned";

const schema = z.object({
  name: z.string().min(1, "Please enter your name").max(200),
  email: z.string().email("Please enter a valid email address").max(200),
  company: z.string().max(200).optional(),
  headline: z.string().min(1, "Please enter a headline").max(200),
  years: z.coerce
    .number({ invalid_type_error: "Enter years of experience" })
    .int()
    .min(0, "Must be 0 or more")
    .max(80, "That seems too high"),
  tagsText: z.string().max(300).optional(),
  track: z.enum(["career", "sales", "both"], {
    errorMap: () => ({ message: "Please choose a track" }),
  }),
  segmentId: z.string().min(1),
  bio: z.string().max(600, "Keep it under 600 characters").optional(),
});
type FormData = z.infer<typeof schema>;

export default function MentorApplyPage() {
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { track: "career", segmentId: NOT_SURE_SEGMENT },
  });

  async function onSubmit(data: FormData) {
    setApiError(null);
    const tags = (data.tagsText || "")
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
          track: data.track,
          segmentId: data.segmentId === NOT_SURE_SEGMENT ? undefined : data.segmentId,
          bio: data.bio || undefined,
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
        <div className="page-container text-center">
          <Reveal>
            <Logo variant="white" href="/" className="mx-auto mb-6" />
            <div className="pill pill-dark mb-4 mx-auto">
              <ShieldCheck className="w-3 h-3" /> Mentor Application
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-4">
              Become a Commodity Playbook mentor
            </h1>
            <p className="text-white/65 text-lg max-w-2xl mx-auto">
              Thanks for considering it — fill in a few details below and our team will review your application.
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
              Thanks — your application has been submitted for review. Our team will reach out directly if it&apos;s a fit.
            </p>
          </motion.div>
        ) : (
          <Reveal>
            <div className="bg-white rounded-2xl border border-border p-6 sm:p-8">
              <h2 className="font-serif text-lg font-bold text-gray-900 mb-1">Mentor application</h2>
              <p className="text-sm text-muted-fg mb-6">
                A couple of minutes — this goes straight to our team for review.
              </p>

              {apiError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
                  {apiError}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Full name"
                  placeholder="Alex Chen"
                  error={errors.name?.message}
                  {...register("name")}
                />
                <Input
                  label="Email address"
                  type="email"
                  placeholder="you@example.com"
                  error={errors.email?.message}
                  {...register("email")}
                />
                <Input
                  label="Company (optional)"
                  placeholder="e.g. Vitol"
                  error={errors.company?.message}
                  {...register("company")}
                />
                <Input
                  label="Headline"
                  placeholder="e.g. Crude Oil Trader — Ex-Supermajor"
                  hint="How we'd describe your background in one line."
                  error={errors.headline?.message}
                  {...register("headline")}
                />
                <Input
                  label="Years of experience"
                  type="number"
                  min={0}
                  max={80}
                  placeholder="e.g. 12"
                  error={errors.years?.message}
                  {...register("years")}
                />
                <Input
                  label="Specialties / tags (optional)"
                  placeholder="Comma-separated, e.g. Crude, Arbitrage, Physical"
                  error={errors.tagsText?.message}
                  {...register("tagsText")}
                />

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Which track fits best?</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["career", "sales", "both"] as const).map((t) => (
                      <label
                        key={t}
                        className="cursor-pointer"
                      >
                        <input type="radio" value={t} className="sr-only peer" {...register("track")} />
                        <div className="p-2.5 rounded-lg border-2 text-sm font-medium text-center capitalize transition-all border-border text-muted-fg peer-checked:border-primary-400 peer-checked:bg-primary-soft peer-checked:text-primary-800 hover:border-primary-line">
                          {t}
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.track && <p className="text-xs text-red-500 mt-1.5">{errors.track.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Which segment fits best?</label>
                  <select
                    className="w-full h-10 rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                    {...register("segmentId")}
                  >
                    <option value={NOT_SURE_SEGMENT}>Not sure — let admin decide</option>
                    {MENTOR_SEGMENTS.map((seg) => (
                      <option key={seg.id} value={seg.id}>
                        {seg.num} {seg.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">A bit about your background (optional)</label>
                  <textarea
                    className="w-full text-sm border border-border rounded-lg p-3 resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    placeholder="A sentence or two on what you'd bring as a mentor..."
                    {...register("bio")}
                  />
                  {errors.bio && <p className="text-xs text-red-500">{errors.bio.message}</p>}
                </div>

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
