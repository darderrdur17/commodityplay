"use client";

import { type FormEvent } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Send, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PublicMentorProfile } from "@/data/mentors";

interface SelectedMentor extends PublicMentorProfile {
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
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary-800/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ duration: 0.25 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`mentor-ask-title-${mentor.id}`}
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {submitted ? (
          <div className="text-center py-10 px-6 sm:px-8">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-muted-fg hover:bg-secondary transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
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
        ) : (
          <>
            <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-border">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-accent border border-primary-line flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-primary-800" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-400 mb-1">
                      Ask a question
                    </p>
                    <p className="text-[10px] font-bold text-primary-800 tracking-wider mb-1">
                      {mentor.id} · {mentor.years} yrs
                    </p>
                    <h3
                      id={`mentor-ask-title-${mentor.id}`}
                      className="font-serif font-bold text-lg sm:text-xl text-gray-900 leading-snug"
                    >
                      {mentor.headline}
                    </h3>
                    <p className="text-xs text-muted-fg mt-0.5">{mentor.segmentTitle}</p>
                    {mentor.bio && (
                      <p className="text-xs text-gray-600 mt-2 leading-relaxed">{mentor.bio}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-muted-fg hover:bg-secondary transition-colors shrink-0"
                  aria-label="Close question form"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <form onSubmit={onSubmit}>
              <div className="px-5 sm:px-6 py-5">
                <label htmlFor={`mentor-question-${mentor.id}`} className="text-sm font-medium text-gray-700 block mb-3">
                  Your question <span className="text-muted-fg font-normal">(min. 20 characters)</span>
                </label>
                <div className="rounded-xl border border-border bg-white p-1 shadow-sm">
                  <textarea
                    id={`mentor-question-${mentor.id}`}
                    value={question}
                    onChange={(e) => onQuestionChange(e.target.value)}
                    placeholder="Ask one specific question. Be specific — give context, name the commodity or function, ask the question only they can answer."
                    rows={6}
                    maxLength={500}
                    autoFocus
                    className="w-full min-h-[140px] px-4 py-3.5 rounded-lg border-0 bg-transparent text-sm leading-relaxed resize-y focus:outline-none focus:ring-0 placeholder:text-muted-fg"
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
                <p className="text-xs text-center text-muted-fg pb-4 px-5">
                  No credits remaining. Credits refresh monthly.
                </p>
              )}
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
