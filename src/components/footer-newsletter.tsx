"use client";

import React, { useState } from "react";

import type { SiteFooterNewsletter } from "@/data/footer-content";

interface FooterNewsletterProps {
  variant?: "light" | "dark";
  copy: SiteFooterNewsletter;
}

export function FooterNewsletter({ variant = "light", copy }: FooterNewsletterProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const isDark = variant === "dark";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
      setMessage(copy.successMessage);
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <div
      className={`py-[34px] border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-7 ${
        isDark ? "border-white/10" : "border-border"
      }`}
    >
      <div className="flex flex-col gap-1.5">
        <span
          className={`font-serif text-xl font-bold italic tracking-tight leading-tight ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          {copy.heading}
        </span>
        <span className={`text-[13.5px] leading-snug ${isDark ? "text-white/65" : "text-muted-fg"}`}>
          {copy.subtext}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col xs:flex-row gap-2.5 shrink-0 w-full sm:w-auto">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={copy.placeholder}
          disabled={status === "loading"}
          className="w-full sm:w-[236px] bg-white border border-white/20 rounded-[7px] px-[17px] py-[11px] text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition-colors disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="bg-primary-400 text-white border-none rounded-[7px] px-[22px] py-[11px] text-sm font-bold whitespace-nowrap hover:bg-primary-500 hover:-translate-y-px transition-all disabled:opacity-60"
        >
          {status === "loading" ? "…" : copy.buttonLabel}
        </button>
      </form>

      {message && (
        <p className={`text-xs mt-2 ${status === "error" ? "text-red-400" : "text-emerald-400"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
