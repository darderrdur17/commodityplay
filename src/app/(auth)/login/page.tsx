"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, AlertCircle, Sparkles } from "lucide-react";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GradientOrbs, HeroParticles } from "@/components/animations";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/data/demo-accounts";
import { MAIN_MIN_HEIGHT_BELOW_NAV } from "@/lib/layout-constants";

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type FormData = z.infer<typeof schema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function quickDemoLogin(email: string, redirectTo: string) {
    setAuthError(null);
    const result = await signIn("credentials", {
      email,
      password: DEMO_PASSWORD,
      redirect: false,
    });
    if (result?.error) {
      setAuthError("Demo account not found. Run: npm run db:push && npm run db:seed");
    } else {
      router.push(redirectTo);
    }
  }

  function fillDemo(email: string) {
    setValue("email", email);
    setValue("password", DEMO_PASSWORD);
  }

  async function onSubmit(data: FormData) {
    setAuthError(null);
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setAuthError("Invalid email or password. Please try again.");
    } else {
      router.push(callbackUrl);
    }
  }

  async function handleGoogleSignIn() {
    await signIn("google", { callbackUrl });
  }

  return (
    <div className="flex" style={{ minHeight: MAIN_MIN_HEIGHT_BELOW_NAV }}>
      {/* Left panel — dark hero */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-navy section-dark overflow-hidden flex-col justify-between p-12 pt-10">
        <GradientOrbs />
        <HeroParticles count={10} />
        <div className="relative z-10">
          <div className="pill pill-dark mb-5 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Welcome back
          </div>
          <h2 className="font-serif text-4xl font-bold text-white leading-tight mb-4">
            Good to see you
            <br />
            <span className="text-accent italic">back on the desk.</span>
          </h2>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs">
            Your progress - all waiting for you.
          </p>
        </div>
        <div className="relative z-10 flex gap-6">
          {["2400+ Members", "25 Mentors", "Industry-Standard"].map((s) => (
            <div key={s} className="glass-card px-4 py-2.5">
              <p className="text-white text-xs font-semibold">{s}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 bg-white">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <h1 className="font-serif text-3xl font-bold text-gray-900 mb-1.5">Sign in</h1>
          <p className="text-muted-fg text-sm mb-8">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary-400 hover:text-primary-500 font-medium">
              Create one free
            </Link>
          </p>

          {/* Google OAuth */}
          <Button
            type="button"
            variant="outline"
            className="w-full mb-6"
            onClick={handleGoogleSignIn}
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
            <span className="text-xs text-muted-fg">or continue with email</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Error */}
          {authError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 mb-5"
            >
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{authError}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                placeholder="••••••••"
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

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                <input type="checkbox" className="rounded border-border" />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-primary-400 hover:text-primary-500 min-h-[44px] flex items-center">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={isSubmitting}
            >
              Sign in <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-fg flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Demo accounts
              </p>
              <Link href="/demo" className="text-xs text-primary-400 hover:text-primary-500 font-medium">
                View all →
              </Link>
            </div>
            <p className="text-xs text-muted-fg mb-3">
              Password: <code className="font-mono bg-secondary px-1.5 py-0.5 rounded">{DEMO_PASSWORD}</code>
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {DEMO_ACCOUNTS.map((account) => (
                <div
                  key={account.email}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-border hover:border-primary-line hover:bg-primary-soft/30 transition-all"
                >
                  <span className="text-lg">{account.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{account.name}</p>
                    <p className="text-[10px] text-muted-fg font-mono truncate">{account.email}</p>
                  </div>
                  <Badge
                    variant={
                      account.role === "ADMIN"
                        ? "danger"
                        : account.tier === "ELITE"
                          ? "elite"
                          : account.tier === "PRO"
                            ? "pro"
                            : "starter"
                    }
                    size="sm"
                  >
                    {account.role === "ADMIN" ? "Admin" : account.tier}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => fillDemo(account.email)}
                    className="text-[10px] text-muted-fg hover:text-primary-400 px-1.5 py-1"
                  >
                    Fill
                  </button>
                  <button
                    type="button"
                    onClick={() => quickDemoLogin(account.email, account.redirectTo)}
                    className="text-[10px] font-semibold text-primary-400 hover:text-primary-500 px-1.5 py-1"
                  >
                    Go
                  </button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
