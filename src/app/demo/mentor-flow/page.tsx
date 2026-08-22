"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  ArrowRight, ArrowLeft, Mail, MessageSquare, Users, Shield, CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/animations";
import { DEMO_PASSWORD, MENTOR_FLOW_DEMO } from "@/data/demo-accounts";
import { PAGE_HERO_TOP } from "@/lib/layout-constants";

const STEPS = [MENTOR_FLOW_DEMO.member, MENTOR_FLOW_DEMO.mentor, MENTOR_FLOW_DEMO.admin];

export default function MentorFlowDemoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signInAs(email: string, redirectTo: string) {
    setLoading(email);
    setError(null);
    const result = await signIn("credentials", {
      email,
      password: DEMO_PASSWORD,
      redirect: false,
    });
    if (result?.error) {
      setError("Could not sign in. Run: npm run db:push && npm run db:seed");
      setLoading(null);
      return;
    }
    router.push(redirectTo);
  }

  return (
    <div className="min-h-screen bg-secondary">
      <section className={`bg-primary-800 section-dark ${PAGE_HERO_TOP} pb-10 sm:pb-14`}>
        <div className="page-container max-w-[900px]">
          <Link href="/demo" className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" /> All demo accounts
          </Link>
          <Reveal>
            <div className="pill pill-dark mb-4">
              <MessageSquare className="w-3.5 h-3.5" /> Mentor Connect flow
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-3">
              Member → Mentor → Admin
            </h1>
            <p className="text-white/65 text-lg max-w-2xl mb-6">
              Walk through the full notification loop: members ask questions, mentors answer (synced to member pages + email), and admins can monitor or nudge mentors. Sign in as admin to preview logged emails in the Email Log tab.
            </p>
          </Reveal>
        </div>
      </section>

      <div className="page-container max-w-[900px] py-8 sm:py-10">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        <div className="mb-8 rounded-xl border border-border bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-primary-800 mb-3">Suggested order</p>
          <ol className="space-y-2 text-sm text-gray-700">
            <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> Sign in as <strong>Member</strong> — check pending &amp; answered questions</li>
            <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> Sign in as <strong>Mentor</strong> — answer a pending request</li>
            <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> Sign in as <strong>Member</strong> again — answer appears under My Questions</li>
            <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> Sign in as <strong>Admin</strong> → Q&amp;A tab → notify mentor on any pending item</li>
            <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> Open the <strong>Email Log</strong> tab in the Admin Panel — see the notification that would be sent</li>
          </ol>
        </div>

        <div className="space-y-4">
          {STEPS.map((step) => {
            const Icon = step.step === 1 ? Users : step.step === 2 ? MessageSquare : Shield;
            return (
              <Reveal key={step.email}>
                <div className="rounded-xl border border-border bg-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary-soft border border-primary-line flex items-center justify-center shrink-0 font-bold text-primary-800">
                      {step.step}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-fg mb-0.5">
                        Step {step.step} · {step.title}
                      </p>
                      <h2 className="font-serif text-lg font-bold text-gray-900 flex items-center gap-2">
                        <span>{step.emoji}</span> {step.name}
                      </h2>
                      <p className="text-sm text-muted-fg mt-1">{step.description}</p>
                      <p className="text-xs font-mono text-muted-fg mt-2">{step.email}</p>
                    </div>
                  </div>
                  <Button
                    className="shrink-0 w-full sm:w-auto"
                    onClick={() => signInAs(step.email, step.redirectTo)}
                    loading={loading === step.email}
                  >
                    <Icon className="w-4 h-4" /> Sign in <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="mt-8">
          <div className="rounded-xl border border-primary-line bg-primary-soft p-5 text-center">
            <Mail className="w-8 h-8 text-primary-800 mx-auto mb-2" />
            <p className="font-serif font-bold text-gray-900 mb-1">Demo email log</p>
            <p className="text-sm text-muted-fg mb-4">
              All mentor/member notification emails are captured here — no Resend API key required for demos. Sign in as admin and open the Email Log tab.
            </p>
            <Link href="/admin?tab=emails">
              <Button variant="outline">Open Admin Panel</Button>
            </Link>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
