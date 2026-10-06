/**
 * Sample parameters used to render an email preview.
 *
 * The admin "Preview" button must show what an email *looks like* without
 * reaching for a real member's data — no real name, question, invoice, or
 * address ever reaches this file. So every value below is deliberately,
 * unmistakably fake: "Sample Member", `@example.com`, "#SAMPLE-0001". If any of
 * these strings ever turns up in a real inbox, the bug is here.
 *
 * ⚠️ The invariant this file exists to protect: it is typed so that the sample
 * for a given template must match that template's *builder* parameter shape.
 * The samples are handed straight to the builders in `src/lib/email-preview.ts`,
 * so renaming or adding a builder parameter stops type-checking here until the
 * sample is updated to match. That is on purpose — a preview that silently
 * renders the wrong field is worse than no preview at all.
 *
 * `satisfies` (not `: Record<EmailTemplateKey, unknown>`) is used so each entry
 * keeps its precise inferred type — that is what lets the builder call
 * type-check — while still forcing all eight keys to be present.
 */
import type { EmailTemplateKey } from "@/data/email-templates-content";

/**
 * One sample serves both interview-offer templates: they are two halves of a
 * single builder (`buildJobInterviewOfferEmails`), so they share one parameter
 * object. Two divergent samples here would let the two halves drift apart.
 */
const INTERVIEW_OFFER_SAMPLE = {
  candidateEmail: "sample.member@example.com",
  candidateName: "Sample Member",
  hirerName: "Sample Hirer",
  jobTitle: "Sample Junior Trader",
  company: "Sample Commodities Ltd",
  messages: [
    {
      role: "candidate" as const,
      text: "Sample candidate question about the role.",
      createdAt: "2026-01-05T09:00:00.000Z",
    },
    {
      role: "hirer" as const,
      text: "Sample hirer reply to the candidate.",
      createdAt: "2026-01-05T14:30:00.000Z",
    },
    {
      role: "candidate" as const,
      text: "Sample candidate follow-up question.",
      createdAt: "2026-01-06T08:15:00.000Z",
    },
  ],
};

export const EMAIL_TEMPLATE_SAMPLES = {
  mentee_answer: {
    memberName: "Sample Member",
    segmentLabel: "Sample Segment",
    question: "Sample question from a member, shown only in a preview.",
    answer: "Sample answer from a practitioner, shown only in a preview.",
  },
  mentor_reminder: {
    segmentLabel: "Sample Segment",
    question: "Sample question awaiting a practitioner response.",
    memberLabel: "Sample Member",
    submittedAt: "2026-01-05T09:00:00.000Z",
  },
  new_question: {
    segmentLabel: "Sample Segment",
    question: "Sample question sent to the mentor pool.",
    memberLabel: "Sample Member",
  },
  job_chat_question: {
    hirerName: "Sample Hirer",
    jobTitle: "Sample Junior Trader",
    company: "Sample Commodities Ltd",
    candidateLabel: "Sample Member",
    message: "Sample candidate question about the job opening.",
    respondToken: "sample-respond-token",
    exchangeNumber: 1,
  },
  job_chat_answer: {
    candidateName: "Sample Member",
    jobTitle: "Sample Junior Trader",
    company: "Sample Commodities Ltd",
    answer: "Sample reply from the hiring team.",
    exchangeCount: 2,
  },
  job_interview_offer_candidate: INTERVIEW_OFFER_SAMPLE,
  job_interview_offer_hirer: INTERVIEW_OFFER_SAMPLE,
  billing_receipt: {
    memberName: "Sample Member",
    invoiceNumber: "#SAMPLE-0001",
    amountCents: 9900,
    currency: "SGD",
    planLabel: "Pro (sample)",
    periodStart: new Date("2026-01-01T00:00:00.000Z"),
    periodEnd: new Date("2026-02-01T00:00:00.000Z"),
    invoicePdfUrl: "https://example.com/sample-invoice.pdf",
    hostedInvoiceUrl: "https://example.com/sample-invoice",
  },
} satisfies Record<EmailTemplateKey, unknown>;
