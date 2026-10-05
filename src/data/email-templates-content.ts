/**
 * Editable copy for the system-generated emails.
 *
 * These are the *only* strings an admin can change. Everything structural — the
 * wrapper, tables, buttons, colours, and the "Hi {name}," greeting — stays in
 * `src/lib/email.ts`, because a broken layout in a password reset or a receipt is
 * a support incident, and transactional email is the wrong place for free-form HTML.
 *
 * Two pieces of syntax are supported in every value:
 *
 *   {{placeholder}}  → substituted with a real value at send time
 *   **bold**         → rendered as bold
 *
 * `**bold**` rather than raw `<strong>` so an admin never has to write HTML, and
 * so nothing they type can inject markup. See `src/lib/content/email-copy.ts`.
 *
 * Blank a field to remove it: an empty `intro` drops the paragraph, an empty
 * `buttonLabel` drops the call-to-action button.
 *
 * Deliberately NOT editable, and why:
 *   · the password-reset email — security-critical, it must not be rewordable
 *   · the operator lead notifications — internal, already driven by `site-footer`
 *   · the "Hi {name}," greeting and the receipt's "Thank you for your subscription."
 *     courtesy line — fixed layout furniture, not message copy
 *   · anything structural — wrapper, tables, buttons, colours, the "Question N of 3"
 *     box labels, and Stripe's own renewal reminder (which Stripe sends, not us)
 *
 * One consequence worth knowing: the plain-text alternative used to be written
 * separately from the HTML and had drifted from it in several emails (e.g. the
 * mentor-answer text said "has answered your … question on CommodityPlay" while the
 * HTML said "responded to your … question"). Both now render from this one string,
 * so the wording is the HTML wording — which is the version recipients actually see.
 *
 * ⚠️ The defaults below must reproduce today's live copy exactly. They are what
 * ships when the CMS row is empty or unreadable, so any drift here silently
 * changes every email. `scripts/verify-email-copy.ts` asserts the placeholder
 * names actually passed by `email.ts` all exist.
 */

export interface EmailCopy {
  subject: string;
  heading: string;
  /** Paragraph under the heading. Blank removes the paragraph entirely. */
  intro: string;
  /** Call-to-action button. Blank removes the button entirely. */
  buttonLabel: string;
}

export type EmailTemplateKey =
  | "mentee_answer"
  | "mentor_reminder"
  | "new_question"
  | "job_chat_question"
  | "job_chat_answer"
  | "job_interview_offer_candidate"
  | "job_interview_offer_hirer"
  | "billing_receipt";

export interface EmailTemplatesContent {
  emails: Record<EmailTemplateKey, EmailCopy>;
}

/** Order and human labels for the admin editor. */
export const EMAIL_TEMPLATE_GROUPS: {
  title: string;
  description: string;
  keys: { key: EmailTemplateKey; label: string; audience: string }[];
}[] = [
  {
    title: "Mentor Connect",
    description: "Sent when a member question is answered, or a mentor has one waiting.",
    keys: [
      { key: "mentee_answer", label: "Answer sent to member", audience: "Member" },
      { key: "mentor_reminder", label: "Admin reminder to mentor", audience: "Mentor" },
      { key: "new_question", label: "New question for mentor pool", audience: "Mentor" },
    ],
  },
  {
    title: "Job Live Chat",
    description: "Sent between a member and the hiring team on a job opening.",
    keys: [
      { key: "job_chat_question", label: "Question to hirer", audience: "Hirer" },
      { key: "job_chat_answer", label: "Hirer reply to member", audience: "Member" },
      { key: "job_interview_offer_candidate", label: "Interview offer — member", audience: "Member" },
      { key: "job_interview_offer_hirer", label: "Interview offer — hirer", audience: "Hirer" },
    ],
  },
  {
    title: "Billing",
    description: "Our own receipt email. Stripe's renewal reminder is separate and not editable here.",
    keys: [{ key: "billing_receipt", label: "Subscription receipt", audience: "Member" }],
  },
];

/** Placeholders each email actually supplies, shown as a hint in the editor. */
export const EMAIL_TEMPLATE_PLACEHOLDERS: Record<EmailTemplateKey, string[]> = {
  mentee_answer: ["segmentLabel"],
  mentor_reminder: ["segmentLabel"],
  new_question: ["segmentLabel", "memberLabel"],
  job_chat_question: ["jobTitle", "company"],
  job_chat_answer: ["jobTitle", "company", "exchangeCount"],
  job_interview_offer_candidate: ["jobTitle", "company"],
  job_interview_offer_hirer: ["jobTitle", "candidateEmail"],
  billing_receipt: ["brandName", "invoiceNumber", "amount", "planLabel"],
};

export const DEFAULT_EMAIL_TEMPLATES: EmailTemplatesContent = {
  emails: {
    mentee_answer: {
      subject: "Your Mentor Connect question has been answered",
      heading: "Your question has been answered",
      intro: "A practitioner responded to your **{{segmentLabel}}** question.",
      buttonLabel: "View in Mentor Connect",
    },
    mentor_reminder: {
      subject: "[Action required] Pending Mentor Connect request — {{segmentLabel}}",
      heading: "Pending member request",
      intro: "An Elite member question is waiting for a practitioner response.",
      buttonLabel: "Open mentor inbox",
    },
    new_question: {
      subject: "New Mentor Connect request — {{segmentLabel}}",
      heading: "New member question",
      intro: "",
      buttonLabel: "Open mentor inbox",
    },
    job_chat_question: {
      subject: "[Live Chat] Question on {{jobTitle}} — {{company}}",
      heading: "New candidate question",
      intro: "An Elite member is interested in **{{jobTitle}}** at {{company}}.",
      buttonLabel: "Reply in Live Chat",
    },
    job_chat_answer: {
      subject: "Hirer replied — {{jobTitle}}",
      heading: "Hirer replied ({{exchangeCount}}/3)",
      intro: "The hiring team for **{{jobTitle}}** at {{company}} responded.",
      buttonLabel: "Continue Live Chat",
    },
    job_interview_offer_candidate: {
      subject: "Interview offer — {{jobTitle}} at {{company}}",
      heading: "Initial interview offered",
      intro:
        "**{{company}}** would like to move forward with an initial interview for **{{jobTitle}}**.\n\nExpect the hiring team to reach out directly to schedule next steps.",
      buttonLabel: "",
    },
    job_interview_offer_hirer: {
      subject: "Interview offer confirmed — {{jobTitle}}",
      heading: "Interview offer sent",
      intro:
        "Your interview offer for **{{jobTitle}}** was sent to the candidate ({{candidateEmail}}).\n\nPlease follow up directly to schedule the initial interview.",
      buttonLabel: "",
    },
    billing_receipt: {
      subject: "Your receipt from {{brandName}} {{invoiceNumber}}",
      heading: "Your receipt from {{brandName}} {{invoiceNumber}}",
      intro: "We received your payment of **{{amount}}** for **{{planLabel}}**.",
      buttonLabel: "View receipt",
    },
  },
};
