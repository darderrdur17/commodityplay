"use client";

import { type FormEvent } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Send, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MentorProfile } from "@/data/mentors";

interface SelectedMentor extends MentorProfile {
  segmentId: string;
  segmentTitle: string;
}

interface Props {
  mentor: SelectedMentor;
  question: string;
  memberShareOptIn: boolean;
  submitting: boolean;
  submitted: boolean;
  error: string;
  mentorCredits: number;
  onQuestionChange: (value: string) => void;
  onMemberShareOptInChange: (value: boolean) => void;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  onAskAnother: () => void;
}

export function MentorAskPanel({
  mentor,
  question,
  memberShareOptIn,
  submitting,
  submitted,
  error,
  mentorCredits,
  onQuestionChange,
  onMemberShareOptInChange,
  onClose,
  onSubmit,
  onAskAnother,
}: Props) {
  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="mt-4 rounded-2xl border border-primary-line bg-white shadow-[0_16px_48px_-12px_rgba(8,48,160,0.18)] overflow-hidden"
      >
        <div className="text-center py-10 px-6 sm:px-8">
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-green-500" />
          </div>
          <h3 className="font-serif text-xl font-bold text-gray-900 mb-2">Question sent!</h3>
          <p className="text-muted-fg text-sm mb-6 max-w-md mx-auto">
            Your question has been anonymously routed to a practitioner in {mentor.segmentTitle}.
          </p>
          <Button variant="outline" onClick={onAskAnother}>
            Ask another mentor
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22 }}
      role="region"
      aria-label={`Ask ${mentor.headline}`}
      className="mt-4 rounded-2xl border border-primary-line bg-white shadow-[0_16px_48px_-12px_rgba(8,48,160,0.18)] overflow-hidden"
    >
      {/* Header — mockup modal-head */}
      <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-border">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-accent border border-primary-line flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-primary-800" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-800 mb-1">
                {mentor.id} · {mentor.years} yrs
              </p>
              <h3 className="font-serif font-bold text-lg sm:text-xl text-gray-900 leading-snug">
                {mentor.headline}
              </h3>
              <p className="text-xs text-muted-fg mt-0.5">{mentor.segmentTitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-fg hover:text-gray-900 shrink-0 p-1 rounded-md hover:bg-secondary transition-colors"
            aria-label="Close question form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-muted-fg leading-relaxed mt-4">{mentor.bio}</p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {mentor.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2.5 py-0.5 rounded-full border border-border bg-secondary text-secondary-fg"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Compose — mockup modal-body */}
      <form onSubmit={onSubmit}>
        <div className="px-5 sm:px-6 py-5 sm:py-6 bg-muted">
          <label htmlFor={`mentor-question-${mentor.id}`} className="text-sm font-medium text-gray-700 block mb-3">
            Your question <span className="text-muted-fg font-normal">(min. 20 characters)</span>
          </label>
          <div className="rounded-xl border border-border bg-white p-1 shadow-sm">
            <textarea
              id={`mentor-question-${mentor.id}`}
              value={question}
              onChange={(e) => onQuestionChange(e.target.value)}
              placeholder="Ask one specific question. Be specific — give context, name the commodity or function, ask the question only they can answer."
              rows={7}
              maxLength={500}
              autoFocus
              className="w-full min-h-[168px] sm:min-h-[192px] px-4 py-3.5 rounded-lg border-0 bg-transparent text-sm sm:text-base leading-relaxed resize-y focus:outline-none focus:ring-0 placeholder:text-muted-fg"
            />
            <p className={`px-4 pb-3 text-xs ${question.length >= 20 ? "text-green-600" : "text-muted-fg"}`}>
              {question.length}/500 characters · This question uses 1 credit once sent.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mt-4">{error}</p>
          )}

          <label className="flex items-start gap-2.5 cursor-pointer mt-4 px-1">
            <input
              type="checkbox"
              checked={memberShareOptIn}
              onChange={(e) => onMemberShareOptInChange(e.target.checked)}
              className="rounded accent-primary-400 mt-0.5"
            />
            <span className="text-sm text-gray-700 leading-snug">
              I consent to anonymous sharing of this Q&amp;A on Desk Channel if my mentor also agrees (admin review before publication)
            </span>
          </label>
        </div>

        {/* Footer — mockup modal-foot */}
        <div className="px-5 sm:px-6 py-4 border-t border-border bg-white flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="w-full sm:min-w-[220px]"
            size="lg"
            loading={submitting}
            disabled={question.length < 20 || mentorCredits < 1}
          >
            <Send className="w-4 h-4" />
            Send to Mentor (1 credit)
          </Button>
        </div>
        {mentorCredits < 1 && (
          <p className="text-xs text-center text-muted-fg pb-4 px-5">No credits remaining. Credits refresh monthly.</p>
        )}
      </form>
    </motion.div>
  );
}
