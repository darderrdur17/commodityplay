"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { TRACK_SELECTION } from "@/data/track-selection";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Check, AlertCircle } from "lucide-react";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GradientOrbs, HeroParticles } from "@/components/animations";
import { MAIN_MIN_HEIGHT_BELOW_NAV } from "@/lib/layout-constants";
import { useGoogleSignInAvailable } from "@/hooks/use-google-sign-in";

const schema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  track: z.enum(["CAREER", "SALES"], { message: "Please select a track" }),
  gdpr: z.boolean().refine((v) => v, "Please accept the privacy policy"),
});
type FormData = z.infer<typeof schema>;

function trackFromParam(value: string | null): "CAREER" | "SALES" {
  return value?.toLowerCase() === "sales" ? "SALES" : "CAREER";
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "starter";
  const trackParam = searchParams.get("track");
  const callbackUrl = searchParams.get("callbackUrl") || "/onboarding";
  const onboardingUrl =
    callbackUrl.startsWith("/onboarding")
      ? `${callbackUrl}${callbackUrl.includes("?") ? "&" : "?"}fromSignup=1`
      : `/onboarding?fromSignup=1&callbackUrl=${encodeURIComponent(callbackUrl)}`;
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const googleAvailable = useGoogleSignInAvailable();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { gdpr: false, track: trackFromParam(trackParam) },
  });

  const password = watch("password", "");
  const selectedTrack = watch("track");

  const passwordStrength = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const strengthCount = Object.values(passwordStrength).filter(Boolean).length;
  const strengthLabel = ["", "Weak", "Good", "Strong"][strengthCount];
  const strengthColor = ["", "#ef4444", "#f59e0b", "#22c55e"][strengthCount];

  async function onSubmit(data: FormData) {
    setApiError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          plan,
          track: data.track,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        setApiError(body.error || "Something went wrong. Please try again.");
        return;
      }

      // Auto sign in after registration
      await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      router.push(onboardingUrl);
    } catch {
      setApiError("Network error. Please try again.");
    }
  }

  return (
    <div className="flex" style={{ minHeight: MAIN_MIN_HEIGHT_BELOW_NAV }}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary-800 section-dark overflow-hidden flex-col justify-between p-12 pt-10">
        <GradientOrbs />
        <HeroParticles count={10} />
        <div className="relative z-10">
          <div className="pill pill-dark mb-5 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Free to start
          </div>
          <h2 className="font-serif text-4xl font-bold text-white leading-tight mb-4">
            Your first step onto
            <br />
            <span className="text-accent italic">the desk.</span>
          </h2>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs">
            5 infographics, Chapter A preview, the Desk Glossary, and Email Digest — all free.
          </p>
        </div>
        <div className="relative z-10 space-y-3">
          {[
            "✓ No credit card required",
            "✓ Instant access on signup",
            "✓ Upgrade at any time",
          ].map((item) => (
            <p key={item} className="text-white/60 text-sm">{item}</p>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 bg-white overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <h1 className="font-serif text-3xl font-bold text-gray-900 mb-1.5">Create your account</h1>
          <p className="text-muted-fg text-sm mb-8">
            Already have one?{" "}
            <Link
              href={
                callbackUrl !== "/onboarding"
                  ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
                  : "/login"
              }
              className="text-primary-400 hover:text-primary-500 font-medium"
            >
              Sign in
            </Link>
          </p>

          {googleAvailable ? (
            <>
              <Button
                type="button"
                variant="outline"
                className="w-full mb-6"
                onClick={() => {
                  sessionStorage.setItem("signupTrack", selectedTrack);
                  signIn("google", { callbackUrl: onboardingUrl });
                }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </Button>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-fg">or with email</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            </>
          ) : null}

          {apiError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 mb-5"
            >
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{apiError}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full name"
              type="text"
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
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 characters"
                error={errors.password?.message}
                {...register("password")}
              />
              <button
                type="button"
                className="absolute right-3 top-8 text-muted-fg hover:text-gray-600 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password strength */}
            {password.length > 0 && (
              <div className="space-y-2">
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex-1 h-1 rounded-full transition-all duration-300"
                      style={{
                        background: i <= strengthCount ? strengthColor : "#e4e7ec",
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs" style={{ color: strengthColor }}>
                  {strengthLabel} password
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(passwordStrength).map(([key, met]) => (
                    <div key={key} className={`flex items-center gap-1 text-xs ${met ? "text-green-600" : "text-muted-fg"}`}>
                      <Check className={`w-3 h-3 ${met ? "opacity-100" : "opacity-30"}`} />
                      {key === "length" ? "8+ chars" : key === "upper" ? "Uppercase" : "Number"}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Track selection */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Your track</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(["CAREER", "SALES"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setValue("track", t, { shouldValidate: true })}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      selectedTrack === t
                        ? "border-primary-400 bg-primary-soft"
                        : "border-border hover:border-primary-line"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        readOnly
                        checked={selectedTrack === t}
                        className="mt-0.5 rounded border-border accent-primary-400 pointer-events-none"
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {t === "CAREER" ? TRACK_SELECTION.career.title : TRACK_SELECTION.sales.title}
                        </p>
                        <p className="text-xs text-muted-fg mt-0.5">
                          {t === "CAREER" ? TRACK_SELECTION.career.caption : TRACK_SELECTION.sales.caption}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <input type="hidden" {...register("track")} />
              {errors.track && (
                <p className="text-xs text-red-500 mt-1.5">{errors.track.message}</p>
              )}
            </div>

            {/* GDPR */}
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 rounded border-border accent-primary-400"
                {...register("gdpr")}
              />
              <span className="text-xs text-muted-fg leading-relaxed">
                I agree to the{" "}
                <Link href="/privacy" className="text-primary-400 hover:underline">Privacy Policy</Link>
                {" "}and{" "}
                <Link href="/terms" className="text-primary-400 hover:underline">Terms of Service</Link>.
                I may receive the Email Digest and onboarding emails.
              </span>
            </label>
            {errors.gdpr && (
              <p className="text-xs text-red-500">{errors.gdpr.message}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={isSubmitting}
            >
              Create Account — Free <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full" /></div>}>
      <SignupForm />
    </Suspense>
  );
}
