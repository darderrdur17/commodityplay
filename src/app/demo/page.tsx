"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { ArrowRight, Copy, Check, Shield, LogIn, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal, StaggerChildren, StaggerItem } from "@/components/animations";
import {
  DEMO_ACCOUNTS,
  DEMO_PASSWORD,
  MENTOR_FLOW_DEMO,
  getDemoAccountDisplayPersona,
} from "@/data/demo-accounts";
import { PAGE_HERO_TOP } from "@/lib/layout-constants";

export default function DemoPage() {
  const router = useRouter();
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signInAs(account: (typeof DEMO_ACCOUNTS)[0]) {
    setLoadingEmail(account.email);
    setError(null);

    const result = await signIn("credentials", {
      email: account.email,
      password: DEMO_PASSWORD,
      redirect: false,
    });

    if (result?.error) {
      setError(
        "Could not sign in. Make sure the database is set up and run: npm run db:push && npm run db:seed"
      );
      setLoadingEmail(null);
      return;
    }

    router.push(account.redirectTo);
  }

  function copyCredentials(email: string) {
    navigator.clipboard.writeText(`${email}\n${DEMO_PASSWORD}`);
    setCopied(email);
    setTimeout(() => setCopied(null), 2000);
  }

  const adminAccount = DEMO_ACCOUNTS.find((a) => a.role === "ADMIN");
  const mentorAccount = DEMO_ACCOUNTS.find((a) => a.email === "elite.mentor@demo.com");
  const tierAccounts = DEMO_ACCOUNTS.filter(
    (a) => a.role === "USER" && a.email !== mentorAccount?.email
  );

  return (
    <div className="min-h-screen bg-secondary">
      {/* Hero */}
      <section className={`bg-primary-800 section-dark ${PAGE_HERO_TOP} pb-12 sm:pb-16`}>
        <div className="page-container max-w-[900px] text-center">
          <Reveal>
            <div className="pill pill-dark mb-4 mx-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              Internal only
            </div>
            <h1 className="font-serif text-4xl font-bold text-white mb-4">
              Try every tier &amp; persona
            </h1>
            <p className="text-white/65 text-lg max-w-xl mx-auto mb-6">
              Signed-in admin only. One-click switch into pre-built demo accounts — all use the same password.
            </p>
            <div className="inline-flex items-center gap-2 glass-card px-4 py-2.5 text-sm text-white">
              <span className="text-white/50">Password for all:</span>
              <code className="font-mono font-bold text-accent">{DEMO_PASSWORD}</code>
              <button
                onClick={() => copyCredentials("password")}
                className="ml-1 p-1 rounded hover:bg-white/10 transition-colors"
                aria-label="Copy password"
              >
                {copied === "password" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      <div className="page-container max-w-[900px] py-8 sm:py-10">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Admin */}
        {adminAccount && (
          <Reveal className="mb-10">
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-500" /> Admin Account
            </h2>
            <p className="text-sm text-muted-fg mb-4">
              Opens the Admin Panel — use the <strong>Content CMS</strong> tab to edit JSON and upload files for every tier pack.
            </p>
            <DemoCard
              account={adminAccount}
              loading={loadingEmail === adminAccount.email}
              copied={copied === adminAccount.email}
              onSignIn={() => signInAs(adminAccount)}
              onCopy={() => copyCredentials(adminAccount.email)}
              highlight
            />
          </Reveal>
        )}

        {mentorAccount && (
          <Reveal className="mb-10">
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-600" /> Mentor Connect + notifications
            </h2>
            <p className="text-sm text-muted-fg mb-4">
              Full walkthrough: member questions → mentor answers → email sync → admin reminders. Sign in as
              admin to preview notifications in the Email Log tab without Resend configured.
            </p>
            <Link href="/demo/mentor-flow" className="block mb-4">
              <Button variant="outline" className="w-full sm:w-auto">
                <Mail className="w-4 h-4" /> Open guided mentor flow demo
              </Button>
            </Link>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {[
                { label: "1 · Member", account: MENTOR_FLOW_DEMO.member },
                { label: "2 · Mentor", account: MENTOR_FLOW_DEMO.mentor },
                { label: "3 · Admin", account: MENTOR_FLOW_DEMO.admin },
              ].map(({ label, account }) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => signInAs({ ...DEMO_ACCOUNTS.find((a) => a.email === account.email)!, redirectTo: account.redirectTo })}
                  disabled={loadingEmail === account.email}
                  className="text-left rounded-lg border border-border bg-white px-4 py-3 hover:border-primary-line hover:bg-primary-soft/30 transition-all disabled:opacity-60"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-fg">{label}</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{account.emoji} {account.name.split(" (")[0]}</p>
                </button>
              ))}
            </div>
            <DemoCard
              account={mentorAccount}
              loading={loadingEmail === mentorAccount.email}
              copied={copied === mentorAccount.email}
              onSignIn={() => signInAs(mentorAccount)}
              onCopy={() => copyCredentials(mentorAccount.email)}
              highlight
              highlightVariant="mentor"
            />
          </Reveal>
        )}

        {/* Tier accounts */}
        <Reveal className="mb-4">
          <h2 className="font-serif text-xl font-bold text-gray-900 mb-4">
            Sample accounts by tier
          </h2>
        </Reveal>

        <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {tierAccounts.map((account) => (
            <StaggerItem key={account.email}>
              <DemoCard
                account={account}
                loading={loadingEmail === account.email}
                copied={copied === account.email}
                onSignIn={() => signInAs(account)}
                onCopy={() => copyCredentials(account.email)}
              />
            </StaggerItem>
          ))}
        </StaggerChildren>

        <Reveal>
          <div className="bg-white rounded-xl border border-border p-6 text-center">
            <p className="text-sm text-muted-fg mb-4">
              First time? Seed the database to create these accounts:
            </p>
            <code className="block bg-secondary rounded-lg px-4 py-3 text-sm font-mono text-gray-700 mb-4">
              npm run db:push && npm run db:seed
            </code>
            <Link href="/login">
              <Button variant="outline">
                <LogIn className="w-4 h-4" /> Manual sign in
              </Button>
            </Link>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

function DemoCard({
  account,
  loading,
  copied,
  onSignIn,
  onCopy,
  highlight,
  highlightVariant = "admin",
}: {
  account: (typeof DEMO_ACCOUNTS)[0];
  loading: boolean;
  copied: boolean;
  onSignIn: () => void;
  onCopy: () => void;
  highlight?: boolean;
  highlightVariant?: "admin" | "mentor";
}) {
  const tierVariant =
    account.tier === "ELITE" ? "elite" : account.tier === "PRO" ? "pro" : "starter";
  const persona = getDemoAccountDisplayPersona(account);
  const highlightStyles =
    highlightVariant === "mentor"
      ? "border-amber-200 bg-amber-50/40"
      : "border-red-200 bg-red-50/30";

  return (
    <div
      className={`rounded-xl border p-5 h-full flex flex-col ${
        highlight ? highlightStyles : "border-border bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{account.emoji}</span>
          <div>
            <p className="font-semibold text-gray-900">{account.name}</p>
            <p className="text-xs text-muted-fg font-mono">{account.email}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {account.role === "ADMIN" && (
            <Badge variant="danger" size="sm">Admin</Badge>
          )}
          <Badge variant={tierVariant as any} size="sm">{account.tier}</Badge>
        </div>
      </div>

      <p className="text-sm text-muted-fg mb-3 flex-1">{account.description}</p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {persona && (
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: persona.bg, color: persona.color }}
          >
            {persona.label}
          </span>
        )}
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary text-muted-fg">
          {account.track} track
        </span>
        {account.mentorCredits > 0 && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">
            {account.mentorCredits} mentor credits
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <Button className="flex-1" onClick={onSignIn} loading={loading} size="sm">
          Sign in <ArrowRight className="w-3.5 h-3.5" />
        </Button>
        <Button variant="outline" size="sm" onClick={onCopy} aria-label="Copy credentials">
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
