"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Send, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LandingMentorSection } from "@/data/landing-content";

/**
 * The "Try it — pick a mentor" interactive preview.
 *
 * A self-contained three-view demo (roster → ask form → sent) that mirrors the
 * product's mentor modal. **Nothing is sent anywhere** — there is no network call
 * and no state leaves this component, which is why the copy underneath says so.
 */

const MIN_QUESTION = 20;
const MAX_QUESTION = 500;

export interface MentorTheme {
  accent: string;
  deep: string;
  tint: string;
  line: string;
  soft: string;
  ink: string;
  sub: string;
  mute: string;
  btn: string;
  btnHover: string;
}

type View = "roster" | "form" | "sent";

export function MentorDemoCard({
  content,
  theme,
  askDisabled = false,
}: {
  content: LandingMentorSection;
  theme: MentorTheme;
  /**
   * Renders the "Ask a question" affordances inert. Set on the CAREER landing,
   * where the preview is illustrative only and the owner asked that the buttons
   * not be clickable. The Sales landing keeps the interactive demo.
   */
  askDisabled?: boolean;
}) {
  const [view, setView] = useState<View>("roster");
  const [mentorIndex, setMentorIndex] = useState(0);
  const [text, setText] = useState("");
  const [consent, setConsent] = useState(false);
  const [sentQuestion, setSentQuestion] = useState("");
  const [sentConsent, setSentConsent] = useState(false);
  const [typing, setTyping] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const askRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const rosterHeadingRef = useRef<HTMLParagraphElement>(null);
  const previousViewRef = useRef<View>("roster");

  const mentor = content.mentors[mentorIndex];
  const trimmed = text.trim();
  const canSend = trimmed.length >= MIN_QUESTION;

  // Return focus to the roster when the form closes, so keyboard users are not
  // dropped back at the top of the document. Skipped on the first render: `view`
  // starts as "roster", and focusing on load would scroll the card into view and
  // silently teleport keyboard / screen-reader users into it with no context.
  useEffect(() => {
    const previousView = previousViewRef.current;
    previousViewRef.current = view;
    if (previousView === "roster" || view !== "roster") return;
    rosterHeadingRef.current?.focus({ preventScroll: true });
  }, [view]);

  function openForm(index: number) {
    setMentorIndex(index);
    setView("form");
    window.setTimeout(() => textareaRef.current?.focus({ preventScroll: true }), 0);
  }

  function closeForm() {
    setView("roster");
    window.setTimeout(
      () => askRefs.current[mentorIndex]?.focus({ preventScroll: true }),
      0
    );
  }

  function send() {
    if (!canSend) return;
    setSentQuestion(trimmed);
    setSentConsent(consent);
    setView("sent");
  }

  async function useSampleQuestion() {
    if (typing) return;
    const sample = content.sampleQuestion;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      setText(sample);
      textareaRef.current?.focus();
      return;
    }

    setTyping(true);
    setText("");
    textareaRef.current?.focus();
    for (let i = 1; i <= sample.length; i++) {
      await new Promise((resolve) => window.setTimeout(resolve, 12));
      setText(sample.slice(0, i));
    }
    setTyping(false);
  }

  useEffect(() => {
    if (view !== "form") return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeForm();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, mentorIndex]);

  const avatar = (
    <span
      className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 border"
      style={{ backgroundColor: theme.tint, borderColor: theme.line, color: theme.deep }}
      aria-hidden
    >
      <Users className="w-5 h-5" />
    </span>
  );

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden flex flex-col border min-h-0 sm:min-h-[600px]"
      style={{
        borderColor: theme.line,
        boxShadow: "0 22px 50px -26px rgba(8,40,30,0.35)",
      }}
    >
      {view === "roster" && (
        <div className="flex flex-col flex-1">
          <div
            className="flex items-center justify-between gap-3 px-[22px] py-[18px] border-b"
            style={{ borderColor: theme.line }}
          >
            <div>
              <p
                ref={rosterHeadingRef}
                tabIndex={-1}
                className="text-base font-bold outline-none"
                style={{ color: theme.ink }}
              >
                {content.rosterTitle}
              </p>
              <p className="text-[12.5px] mt-0.5" style={{ color: theme.mute }}>
                {content.rosterSub}
              </p>
            </div>
            <span
              className="text-[11.5px] font-semibold rounded-full px-2.5 py-1.5 whitespace-nowrap"
              style={{ backgroundColor: theme.tint, color: theme.deep }}
            >
              {content.creditPill}
            </span>
          </div>

          <div className="flex flex-col flex-1 px-[22px] pt-2">
            {content.mentors.map((m, index) => (
              <article
                key={m.id}
                className="grid grid-cols-[44px_1fr] sm:grid-cols-[44px_1fr_auto] gap-3.5 items-start py-[18px] border-b last:border-b-0"
                style={{ borderColor: theme.line }}
              >
                {avatar}
                <div className="min-w-0">
                  <p className="text-[11.5px] font-bold tracking-[0.02em]" style={{ color: theme.deep }}>
                    {m.id} · {m.years} yrs
                  </p>
                  <h3 className="text-[16.5px] font-bold leading-[1.3] mt-[3px] mb-0.5" style={{ color: theme.ink }}>
                    {m.title}
                  </h3>
                  <p className="text-[13px] mb-1.5" style={{ color: theme.mute }}>
                    {m.category}
                  </p>
                  <p className="text-[13.5px] leading-[1.5]" style={{ color: theme.sub }}>
                    {m.bio}
                  </p>
                </div>
                <button
                  type="button"
                  ref={(el) => {
                    askRefs.current[index] = el;
                  }}
                  onClick={() => openForm(index)}
                  disabled={askDisabled}
                  aria-disabled={askDisabled}
                  className={cn(
                    "col-start-2 justify-self-start sm:col-start-auto sm:justify-self-auto text-[12.5px] font-semibold rounded-lg px-3.5 py-2.5 border bg-white whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
                    askDisabled && "opacity-55 cursor-not-allowed"
                  )}
                  style={{ color: theme.deep, borderColor: theme.line }}
                >
                  Ask a question
                </button>
              </article>
            ))}
          </div>

          <p
            className="px-[22px] py-[14px] text-[12.5px] border-t"
            style={{ color: theme.mute, borderColor: theme.line, backgroundColor: theme.soft }}
          >
            {content.rosterNote}
          </p>
        </div>
      )}

      {view === "form" && mentor && (
        <div className="flex flex-col flex-1">
          <div
            className="relative grid grid-cols-[50px_1fr] gap-3.5 pl-[22px] pr-14 pt-6 pb-5 border-b"
            style={{ borderColor: theme.line }}
          >
            <span
              className="w-[50px] h-[50px] rounded-full flex items-center justify-center border"
              style={{ backgroundColor: theme.tint, borderColor: theme.line, color: theme.deep }}
              aria-hidden
            >
              <Users className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11.5px] font-bold uppercase tracking-[0.14em]" style={{ color: theme.accent }}>
                Ask a question
              </p>
              <p className="text-[12.5px] font-bold my-[3px] mb-1.5" style={{ color: theme.deep }}>
                {mentor.id} · {mentor.years} yrs
              </p>
              <h3 className="text-[22px] font-bold leading-[1.2] tracking-[-0.01em]" style={{ color: theme.ink }}>
                {mentor.title}
              </h3>
              <p className="text-[13.5px] my-[3px] mb-2" style={{ color: theme.mute }}>
                {mentor.category}
              </p>
              <p className="text-[13.5px] leading-[1.5]" style={{ color: theme.sub }}>
                {mentor.bio}
              </p>
            </div>
            <button
              type="button"
              onClick={closeForm}
              aria-label="Close"
              className="absolute top-[18px] right-4 w-8 h-8 rounded-lg flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ color: theme.sub }}
            >
              <X className="w-4 h-4" aria-hidden />
            </button>
          </div>

          <div className="px-[22px] pt-5 pb-1.5 flex-1">
            <div className="flex justify-between items-baseline gap-3 mb-2.5">
              <label htmlFor="mentor-question" className="text-[15px] font-semibold" style={{ color: theme.ink }}>
                Your question{" "}
                <small className="font-normal" style={{ color: theme.mute }}>
                  (min. {MIN_QUESTION} characters)
                </small>
              </label>
              <button
                type="button"
                onClick={useSampleQuestion}
                className="text-[12.5px] font-semibold underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ color: theme.accent }}
              >
                Use a sample question
              </button>
            </div>

            <div
              className="rounded-[14px] border px-4 pt-3.5 pb-3 focus-within:ring-[3px]"
              style={{ borderColor: theme.line }}
            >
              <textarea
                id="mentor-question"
                ref={textareaRef}
                value={text}
                maxLength={MAX_QUESTION}
                onChange={(event) => setText(event.target.value)}
                placeholder="Ask one specific question. Be specific — give context, name the commodity or function, ask the question only they can answer."
                className="w-full min-h-[124px] border-none outline-none resize-y text-[15.5px] leading-[1.55] bg-transparent block"
                style={{ color: theme.ink }}
              />
              <p aria-live="polite" className="mt-2.5 text-[12.5px]" style={{ color: theme.mute }}>
                {text.length}/{MAX_QUESTION} characters · This question uses 1 credit once sent.
              </p>
            </div>

            <label className="flex gap-[11px] items-start my-[18px] mb-3.5 text-[14.5px] leading-[1.5] cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="w-[17px] h-[17px] mt-[3px] shrink-0 cursor-pointer"
                style={{ accentColor: theme.btn }}
              />
              <span style={{ color: theme.ink }}>
                I consent to anonymous sharing of this Q&amp;A on Desk Channel if my mentor also
                agrees (admin review before publication)
              </span>
            </label>
          </div>

          <div className="flex gap-3 px-[22px] pt-4 pb-5 border-t" style={{ borderColor: theme.line }}>
            <button
              type="button"
              onClick={closeForm}
              className="text-[15px] font-semibold rounded-[10px] px-[22px] py-3.5 border bg-white focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ color: theme.ink, borderColor: theme.line }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={send}
              disabled={!canSend}
              className="flex-1 flex items-center justify-center gap-2.5 text-[15px] font-bold text-white rounded-[10px] px-4 py-3.5 disabled:opacity-45 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ backgroundColor: theme.btn }}
            >
              <Send className="w-4 h-4" aria-hidden />
              Send to Mentor (1 credit)
            </button>
          </div>
        </div>
      )}

      {view === "sent" && (
        <div className="flex flex-col flex-1">
          <div className="px-[22px] pt-[30px] pb-2 flex-1">
            <div className="flex gap-3.5 items-center mb-[22px]">
              <span
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: theme.tint, color: theme.deep }}
                aria-hidden
              >
                <Check className="w-5 h-5" />
              </span>
              <div>
                <p className="text-[19px] font-bold leading-[1.25]" style={{ color: theme.ink }}>
                  Question sent to {mentor?.id}
                </p>
                <p className="text-[13.5px] mt-0.5" style={{ color: theme.mute }}>
                  1 credit used
                  {sentConsent
                    ? " · Anonymous Desk Channel sharing is subject to your mentor's agreement and admin review"
                    : ""}
                </p>
              </div>
            </div>

            <p
              className="text-[10.5px] font-bold uppercase tracking-[0.12em] mb-2"
              style={{ color: theme.mute }}
            >
              Your question
            </p>
            <div
              className="rounded-xl border px-[15px] py-[13px] text-[14.5px] leading-[1.55] mb-6 break-words"
              style={{ backgroundColor: theme.soft, borderColor: theme.line, color: theme.ink }}
            >
              {sentQuestion}
            </div>

            <p
              className="text-[10.5px] font-bold uppercase tracking-[0.12em] mb-2 flex items-center gap-2"
              style={{ color: theme.mute }}
            >
              What a reply looks like
              <span
                className="rounded-full px-2 py-[3px] tracking-[0.06em]"
                style={{ backgroundColor: theme.tint, color: theme.deep }}
              >
                Sample
              </span>
            </p>
            <p className="text-[13px] leading-[1.5] mb-2.5" style={{ color: theme.mute }}>
              Sample question: “{content.sampleQuestion}”
            </p>
            <p className="text-[11.5px] font-bold mb-1.5" style={{ color: theme.deep }}>
              {mentor?.id} · {mentor?.category}
            </p>
            <div
              className="rounded-xl rounded-tl-[4px] px-4 py-3.5 text-[14.5px] leading-[1.6] text-white"
              style={{ backgroundColor: theme.deep }}
            >
              {content.sampleAnswer}
            </div>
          </div>

          <div className="px-[22px] pt-4 pb-5">
            <button
              type="button"
              onClick={() => {
                setView("roster");
                setText("");
                setConsent(false);
              }}
              disabled={askDisabled}
              aria-disabled={askDisabled}
              className={cn(
                "text-[14px] font-semibold rounded-[10px] px-4 py-3 border bg-white focus-visible:outline-2 focus-visible:outline-offset-2",
                askDisabled && "opacity-55 cursor-not-allowed"
              )}
              style={{ color: theme.deep, borderColor: theme.line }}
            >
              Ask another question
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
