"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, AlertCircle, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAIN_MIN_HEIGHT_BELOW_NAV } from "@/lib/layout-constants";

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setError(null);
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.email }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setError(payload?.error || "Could not send a reset email. Try again.");
      return;
    }
    setSent(true);
  }

  return (
    <div className="flex items-center justify-center px-4 sm:px-6 py-12 bg-white" style={{ minHeight: MAIN_MIN_HEIGHT_BELOW_NAV }}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <h1 className="font-serif text-3xl font-bold text-gray-900 mb-1.5">Set or reset your password</h1>
        <p className="text-muted-fg text-sm mb-8">
          Enter the email on your account. We will send a link so you can choose a password and sign in.
        </p>

        {sent ? (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 mb-5">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-800">
              If that email has an account, a reset link is on its way. Check your inbox and spam folder.
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 mb-5">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register("email")}
              />
              <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
                Send reset link <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </>
        )}

        <p className="text-sm text-muted-fg mt-6">
          <Link href="/login" className="text-primary-400 hover:text-primary-500 font-medium">
            Back to sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
