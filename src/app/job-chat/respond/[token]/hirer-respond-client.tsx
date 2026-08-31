"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, CheckCircle, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/animations";
import { MAX_JOB_CHAT_EXCHANGES, type JobChatMessage } from "@/lib/job-chat";

interface HirerThread {
  id: string;
  jobTitle: string;
  company: string;
  hirerName: string | null;
  candidateLabel: string;
  messages: JobChatMessage[];
  exchangeCount: number;
  interviewOffered: boolean;
  canReply: boolean;
  canOfferInterview: boolean;
  isComplete: boolean;
}

export function JobHirerRespondClient({ token }: { token: string }) {
  const [thread, setThread] = useState<HirerThread | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadThread() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/job-chat/hirer/${token}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Chat not found");
        setThread(null);
        return;
      }
      setThread(data.thread);
    } catch {
      setError("Network error loading chat");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadThread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!thread || reply.length < 10) return;
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/job-chat/hirer/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reply", message: reply }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not send reply");
        return;
      }
      setThread(data.thread);
      setReply("");
      setSuccess("Reply sent — the candidate was notified by email.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOfferInterview() {
    if (!thread?.canOfferInterview) return;
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/job-chat/hirer/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "offer_interview" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not offer interview");
        return;
      }
      setThread(data.thread);
      setSuccess("Interview offer sent to both parties by email.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="page-container py-16 text-center text-muted-fg text-sm">Loading conversation…</div>
    );
  }

  if (!thread) {
    return (
      <div className="page-container py-16 text-center">
        <p className="text-red-600 mb-4">{error || "This chat link is invalid or expired."}</p>
        <Link href="/login" className="text-primary-400 text-sm font-medium hover:underline">
          Sign in to CommodityPlay
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container py-8 sm:py-10 max-w-3xl">
      <section className="rounded-2xl bg-primary-800 px-6 sm:px-8 py-10 mb-8 relative overflow-hidden">
        <Reveal className="relative z-10">
          <div className="pill pill-dark mb-4">
            <MessageSquare className="w-3.5 h-3.5" /> Hirer Live Chat
          </div>
          <h1 className="font-serif text-3xl font-bold text-white mb-2">{thread.jobTitle}</h1>
          <p className="text-white/65 flex items-center gap-2">
            <Building2 className="w-4 h-4" /> {thread.company}
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline" className="border-white/20 text-white bg-white/10">
              Candidate: {thread.candidateLabel}
            </Badge>
            <Badge variant="outline" className="border-white/20 text-white bg-white/10">
              {thread.exchangeCount}/{MAX_JOB_CHAT_EXCHANGES} exchanges
            </Badge>
          </div>
        </Reveal>
      </section>

      <div className="bg-white rounded-xl border border-border p-5 sm:p-6 mb-6 space-y-3 max-h-[420px] overflow-y-auto">
        {thread.messages.map((msg, i) => (
          <div
            key={`${msg.createdAt}-${i}`}
            className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === "candidate"
                ? "bg-secondary/50 border border-border mr-6"
                : "bg-primary-soft border border-primary-line ml-6"
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-fg mb-1">
              {msg.role === "candidate" ? thread.candidateLabel : "You"}
            </p>
            <p className="text-gray-800">{msg.text}</p>
          </div>
        ))}
      </div>

      {success && (
        <div className="mb-4 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      {thread.interviewOffered ? (
        <div className="text-center py-10 px-6 bg-white rounded-xl border border-border">
          <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <h2 className="font-serif text-xl font-bold text-gray-900 mb-2">Interview offer sent</h2>
          <p className="text-sm text-muted-fg">Both parties received confirmation emails from CommodityPlay.</p>
        </div>
      ) : thread.canReply ? (
        <form onSubmit={handleReply} className="bg-white rounded-xl border border-border p-5 sm:p-6">
          <label htmlFor="hirer-reply" className="text-sm font-medium text-gray-700 block mb-3">
            Your reply <span className="text-muted-fg font-normal">(min. 10 characters)</span>
          </label>
          <textarea
            id="hirer-reply"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={5}
            maxLength={800}
            className="w-full px-4 py-3 rounded-lg border border-border text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary-400"
            placeholder="Answer the candidate's question directly and concisely."
          />
          <div className="mt-4 flex justify-end">
            <Button type="submit" loading={submitting} disabled={reply.length < 10}>
              <Send className="w-4 h-4" /> Send reply
            </Button>
          </div>
        </form>
      ) : thread.canOfferInterview ? (
        <div className="bg-white rounded-xl border border-primary-line p-6 text-center">
          <h2 className="font-serif text-xl font-bold text-gray-900 mb-2">Offer initial interview?</h2>
          <p className="text-sm text-muted-fg mb-6 max-w-md mx-auto">
            All {MAX_JOB_CHAT_EXCHANGES} exchanges are complete. Offer an initial interview to notify both parties by email.
          </p>
          <Button size="lg" onClick={handleOfferInterview} loading={submitting}>
            Offer Interview
          </Button>
        </div>
      ) : (
        <div className="bg-secondary rounded-xl p-6 text-center text-sm text-muted-fg">
          {thread.isComplete
            ? "Conversation complete. Refresh if you need to offer an interview."
            : "Waiting for the candidate's next question."}
        </div>
      )}
    </div>
  );
}
