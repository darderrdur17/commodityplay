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
import { cn } from "@/lib/utils";

const SUGGESTED_TOPICS = [
  "Commodity fundamentals",
  "Trading strategy",
  "Risk management",
  "Market analysis",
  "Career development",
  "Sales / BD",
  "Physical trading",
  "Derivatives",
  "LNG / Gas",
  "Oil",
  "Power",
] as const;

const schema = z.object({
  name: z.string().min(1, "Please enter your full name").max(200),
  email: z.string().email("Please enter a valid email address").max(200),
  linkedIn: z.string().min(1, "Please enter your LinkedIn profile").max(300),
  location: z.string().max(200).optional(),
  company: z.string().min(1, "Please enter your company or organisation").max(200),
  role: z.string().min(1, "Please enter your current or most recent role").max(200),
  years: z.coerce
    .number({ invalid_type_error: "Enter years of experience" })
    .int()
    .min(0, "Must be 0 or more")
    .max(80, "That seems too high"),
  commodityDesk: z.string().max(200).optional(),
  headline: z.string().min(1, "Please enter a professional headline").max(200),
  bio: z.string().max(2000).optional(),
  tagsText: z.string().min(1, "Please enter at least one mentorship subject").max(300),
  confirmAccurate: z.literal(true, {
    errorMap: () => ({ message: "Please confirm the information is accurate" }),
  }),
});
type FormData = z.infer<typeof schema>;

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-serif text-lg font-bold text-gray-900 pt-2 first:pt-0 border-t border-border first:border-t-0 mt-6 first:mt-0">
      {children}
    </h2>
  );
}

function TextAreaField({
  label,
  hint,
  error,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  error?: string;
}) {
  const inputId = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="w-full space-y-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <textarea
        id={inputId}
        className={cn(
          "flex min-h-[96px] w-full rounded-lg border border-border bg-white px-3 py-2 text-sm",
          "placeholder:text-muted-fg",
          "focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-all duration-200 resize-y leading-relaxed",
          error && "border-red-400 focus:ring-red-400"
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-muted-fg">{hint}</p>}
    </div>
  );
}

export default function MentorApplyPage() {
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const tagsText = watch("tagsText") ?? "";

  function addTopic(topic: string) {
    const existing = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (existing.some((t) => t.toLowerCase() === topic.toLowerCase())) return;
    const next = [...existing, topic].join(", ");
    setValue("tagsText", next, { shouldValidate: true, shouldDirty: true });
  }

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
          linkedIn: data.linkedIn,
          location: data.location || undefined,
          company: data.company,
          role: data.role,
          years: data.years,
          commodityDesk: data.commodityDesk || undefined,
          headline: data.headline,
          bio: data.bio?.trim() || undefined,
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
              {apiError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
                  {apiError}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <SectionHeading>Your details</SectionHeading>

                <Input
                  label="Full name *"
                  placeholder="Alex Chen"
                  error={errors.name?.message}
                  {...register("name")}
                />
                <Input
                  label="Email *"
                  type="email"
                  placeholder="you@example.com"
                  error={errors.email?.message}
                  {...register("email")}
                />
                <Input
                  label="LinkedIn profile *"
                  placeholder="https://linkedin.com/in/yourprofile"
                  hint="Helps us understand your professional background."
                  error={errors.linkedIn?.message}
                  {...register("linkedIn")}
                />
                <Input
                  label="Current location"
                  placeholder="Singapore"
                  error={errors.location?.message}
                  {...register("location")}
                />

                <SectionHeading>Professional background</SectionHeading>

                <Input
                  label="Company / organisation *"
                  placeholder="e.g. Vitol, Trafigura, Glencore"
                  error={errors.company?.message}
                  {...register("company")}
                />
                <Input
                  label="Current / most recent role *"
                  placeholder="e.g. Senior Crude Oil Trader"
                  error={errors.role?.message}
                  {...register("role")}
                />
                <Input
                  label="Years of experience *"
                  type="number"
                  min={0}
                  max={80}
                  placeholder="e.g. 12"
                  error={errors.years?.message}
                  {...register("years")}
                />
                <Input
                  label="Primary commodity / desk"
                  placeholder="e.g. LNG, Power, Metals"
                  error={errors.commodityDesk?.message}
                  {...register("commodityDesk")}
                />
                <Input
                  label="Professional headline *"
                  placeholder="e.g. Crude Oil Trader — Ex-Supermajor"
                  hint="This may be shown publicly on Mentor Connect under your anonymous mentor profile."
                  error={errors.headline?.message}
                  {...register("headline")}
                />
                <TextAreaField
                  label="Tell us about your experience"
                  placeholder="Brief overview of your commodity trading background, desks you've worked on, and what you're best placed to mentor on..."
                  error={errors.bio?.message}
                  {...register("bio")}
                />

                <SectionHeading>What can you mentor on?</SectionHeading>

                <Input
                  label="Mentorship subjects *"
                  placeholder="e.g. Crude oil, Forward curves, Physical arbitrage"
                  hint="Click a suggested topic to add it to the field, or type your own."
                  error={errors.tagsText?.message}
                  {...register("tagsText")}
                />
                <div className="flex flex-wrap gap-2 -mt-1">
                  {SUGGESTED_TOPICS.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => addTopic(topic)}
                      className="px-2.5 py-1 rounded-full text-xs font-semibold border border-border bg-secondary text-muted-fg hover:border-primary-line hover:text-primary-800 transition-colors"
                    >
                      {topic}
                    </button>
                  ))}
                </div>

                <label className="flex items-start gap-3 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-border text-primary-800 focus:ring-primary-400"
                    {...register("confirmAccurate")}
                  />
                  <span className="text-sm text-gray-700 leading-relaxed">
                    I confirm that the information provided is accurate and I&apos;m open to being contacted regarding participation as an anonymous mentor on CommodityPlay. *
                  </span>
                </label>
                {errors.confirmAccurate && (
                  <p className="text-xs text-red-500 -mt-2">{errors.confirmAccurate.message}</p>
                )}

                <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
                  <Send className="w-4 h-4" /> Submit application
                </Button>

                <p className="text-xs text-muted-fg text-center leading-relaxed pt-1">
                  Your application will be reviewed privately. Public-facing profile information should only be displayed with your approval.
                </p>
              </form>
            </div>
          </Reveal>
        )}
      </div>
    </div>
  );
}
