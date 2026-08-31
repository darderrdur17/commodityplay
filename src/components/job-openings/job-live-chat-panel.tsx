"use client";

import { type FormEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2, CheckCircle, MessageSquare, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MAX_JOB_CHAT_EXCHANGES, type JobChatMessage } from "@/lib/job-chat";
import type { JobOpening } from "@/data/job-openings";

interface JobChatThreadState {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  messages: JobChatMessage[];
  exchangeCount: number;
  interviewOffered: boolean;
  canSend: boolean;
}

interface Props {
  job: JobOpening;
  onClose: () => void;
}

export function JobLiveChatPanel({ job, onClose }: Props) {
  const [thread, setThread] = useState<JobChatThreadState | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/job-chat?jobId=${encodeURIComponent(job.id)}`);
        const data = await res.json();
        if (!res.ok) {
          if (!cancelled) setError(data.error || "Could not load chat");
          return;
        }
        if (!cancelled) setThread(data.thread ?? null);
      } catch {
        if (!cancelled) setError("Network error loading chat");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [job.id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (message.length < 10) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/job-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not send message");
        return;
      }
      setThread(data.thread);
      setMessage("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const questionCount = thread?.messages.filter((m) => m.role === "candidate").length ?? 0;
  const awaitingReply = thread?.messages.at(-1)?.role === "candidate";
  const isComplete = (thread?.exchangeCount ?? 0) >= MAX_JOB_CHAT_EXCHANGES;
  const canSend = thread?.canSend ?? true;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22 }}
      role="region"
      aria-label={`Live chat for ${job.title}`}
      className="mt-4 rounded-2xl border border-primary-line bg-white shadow-[0_16px_48px_-12px_rgba(8,48,160,0.18)] overflow-hidden"
    >
      <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-border">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-accent border border-primary-line flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4 text-primary-800" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-800 mb-1">
                Live Chat · Elite
              </p>
              <h3 className="font-serif font-bold text-lg sm:text-xl text-gray-900 leading-snug">
                {job.title}
              </h3>
              <p className="text-xs text-muted-fg mt-0.5 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> {job.company}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-fg hover:text-gray-900 shrink-0 p-1 rounded-md hover:bg-secondary transition-colors"
            aria-label="Close live chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-muted-fg leading-relaxed mt-4">
          Ask up to {MAX_JOB_CHAT_EXCHANGES} short questions directly to the hiring team. Replies arrive here and by email.
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="outline" size="sm">
            {questionCount}/{MAX_JOB_CHAT_EXCHANGES} questions
          </Badge>
          {thread?.interviewOffered && (
            <Badge variant="success" size="sm">Interview offered</Badge>
          )}
          {isComplete && !thread?.interviewOffered && (
            <Badge variant="secondary" size="sm">Conversation complete</Badge>
          )}
        </div>
      </div>

      <div className="px-5 sm:px-6 py-5 bg-muted max-h-[320px] overflow-y-auto space-y-3">
        {loading ? (
          <p className="text-sm text-muted-fg text-center py-6">Loading conversation…</p>
        ) : !thread?.messages.length ? (
          <p className="text-sm text-muted-fg text-center py-6">
            No messages yet. Introduce yourself and ask your first question below.
          </p>
        ) : (
          thread.messages.map((msg, i) => (
            <div
              key={`${msg.createdAt}-${i}`}
              className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "candidate"
                  ? "bg-white border border-border ml-4"
                  : "bg-primary-soft border border-primary-line mr-4"
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-fg mb-1">
                {msg.role === "candidate" ? "You" : job.hirerName || "Hiring team"}
              </p>
              <p className="text-gray-800">{msg.text}</p>
            </div>
          ))
        )}
      </div>

      {thread?.interviewOffered ? (
        <div className="px-5 sm:px-6 py-8 text-center border-t border-border bg-white">
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-green-500" />
          </div>
          <h4 className="font-serif text-lg font-bold text-gray-900 mb-2">Interview offered</h4>
          <p className="text-sm text-muted-fg max-w-md mx-auto">
            The hiring team would like to move forward. Expect them to reach out directly to schedule an initial interview.
          </p>
        </div>
      ) : isComplete && awaitingReply === false ? (
        <div className="px-5 sm:px-6 py-6 border-t border-border bg-white text-center">
          <p className="text-sm text-muted-fg">
            All {MAX_JOB_CHAT_EXCHANGES} exchanges are complete. The hirer may offer an initial interview from their side.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="px-5 sm:px-6 py-5 sm:py-6 bg-muted border-t border-border">
            {awaitingReply && thread && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                Waiting for the hirer to reply before you can ask another question.
              </p>
            )}
            <label htmlFor={`job-chat-${job.id}`} className="text-sm font-medium text-gray-700 block mb-3">
              Your message{" "}
              <span className="text-muted-fg font-normal">(min. 10 characters)</span>
            </label>
            <div className="rounded-xl border border-border bg-white p-1 shadow-sm">
              <textarea
                id={`job-chat-${job.id}`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask one focused question about the role, team, or hiring process."
                rows={4}
                maxLength={500}
                disabled={!canSend || submitting}
                className="w-full min-h-[120px] px-4 py-3.5 rounded-lg border-0 bg-transparent text-sm leading-relaxed resize-y focus:outline-none focus:ring-0 placeholder:text-muted-fg disabled:opacity-60"
              />
              <p className={`px-4 pb-3 text-xs ${message.length >= 10 ? "text-green-600" : "text-muted-fg"}`}>
                {message.length}/500 characters
              </p>
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mt-4">{error}</p>
            )}
          </div>
          <div className="px-5 sm:px-6 py-4 border-t border-border bg-white flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onClose}>
              Close
            </Button>
            <Button
              type="submit"
              className="w-full sm:min-w-[200px]"
              size="lg"
              loading={submitting}
              disabled={!canSend || message.length < 10}
            >
              <Send className="w-4 h-4" />
              Send to hirer
            </Button>
          </div>
        </form>
      )}
    </motion.div>
  );
}
