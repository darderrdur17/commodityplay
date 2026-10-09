import { Resend } from "resend";
import { logDemoEmail, type DemoEmailKind } from "@/lib/demo-email-log";
import type { SiteFooterContent } from "@/data/footer-content";
import { tryReadPublishedPayload } from "@/lib/content/repository";
import { mergeSiteFooterContent, normalizeOperatorNotifyEmails } from "@/lib/content/footer-schema";
import { BRAND_NAME, BRAND_SITE_URL, BRAND_TAGLINE, BRAND_EMAIL_SUPPORT } from "@/lib/brand";
import { jobChatRespondUrl } from "@/lib/job-chat";
import type { JobChatMessage } from "@/lib/job-chat";
import {
  DEFAULT_EMAIL_TEMPLATES,
  type EmailCopy,
  type EmailTemplatesContent,
} from "@/data/email-templates-content";
import { mergeEmailTemplates } from "@/lib/content/email-templates-schema";
import {
  isBlankCopy,
  joinTextBlocks,
  renderCopyParagraphsHtml,
  renderCopyText,
} from "@/lib/content/email-copy";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

function fromAddress() {
  return process.env.RESEND_FROM_EMAIL || `${BRAND_NAME} <onboarding@resend.dev>`;
}

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || BRAND_SITE_URL;
}

/**
 * Reads the admin-editable copy for the system emails.
 *
 * Never throws, and never returns a partial: an unreadable or absent CMS row
 * yields the bundled defaults, which reproduce the original copy exactly. An
 * email must not fail to send because the CMS did — a member locked out of a
 * password reset is a far worse outcome than unstyled copy.
 */
export async function readEmailCopy(): Promise<EmailTemplatesContent> {
  try {
    const data = await tryReadPublishedPayload<Partial<EmailTemplatesContent>>("email-templates");
    return mergeEmailTemplates(data);
  } catch (err) {
    console.warn("[email] falling back to bundled copy — CMS read failed", err);
    return DEFAULT_EMAIL_TEMPLATES;
  }
}

/**
 * The plain-text stand-in for a call-to-action button.
 *
 * The HTML omits the button entirely when the label is blanked, but a text-only
 * reader still needs the URL — so a blank label degrades to the bare link rather
 * than to nothing, and no fallback wording is hardcoded where an admin cannot see it.
 */
function ctaTextLine(label: string, link: string): string {
  return isBlankCopy(label) ? link : `${label}: ${link}`;
}

/** Operator inboxes for leads — CMS Footer list, then ADMIN_NOTIFY_EMAIL extras, then Frances. */
export async function getOperatorNotifyEmails(): Promise<string[]> {
  let cmsEmails: string[] = [BRAND_EMAIL_SUPPORT];
  try {
    const data = await tryReadPublishedPayload<Partial<SiteFooterContent>>("site-footer");
    const footer = mergeSiteFooterContent(data);
    cmsEmails = normalizeOperatorNotifyEmails(footer.operatorNotifyEmails);
  } catch {
    cmsEmails = [BRAND_EMAIL_SUPPORT];
  }
  const envExtras = (process.env.ADMIN_NOTIFY_EMAIL ?? "")
    .split(/[,;\s]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  return normalizeOperatorNotifyEmails([...cmsEmails, ...envExtras]);
}

export type OperatorLeadKind =
  | "operator_newsletter"
  | "operator_contact"
  | "operator_mentor_apply"
  | "operator_member_signup"
  | "operator_upgrade"
  | "operator_billing_lapse";

/**
 * Renders a notification value, showing an explicit placeholder when it is blank.
 *
 * Operator emails list every field of a submission on purpose, so that a blank row
 * reads as "the applicant left this empty" rather than "the field was not captured".
 * An em dash is used instead of an empty string so the row stays visible in HTML.
 */
function displayValue(value: string | null | undefined): string {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed.length > 0 ? trimmed : "—";
}

export async function notifyOperatorLead(params: {
  kind: OperatorLeadKind;
  subject: string;
  lines: { label: string; value: string | null | undefined }[];
}): Promise<SendEmailResult> {
  const to = await getOperatorNotifyEmails();
  const toLabel = to.join(", ");
  const textBody = params.lines.map((line) => `${line.label}: ${displayValue(line.value)}`).join("\n");
  const text = `${params.subject}\n\n${textBody}\n\nReview in Admin if needed.`;
  const rows = params.lines
    .map(
      (line) =>
        `<tr><td style="padding:6px 0;color:#677184;vertical-align:top">${escapeHtml(line.label)}</td><td style="padding:6px 0;font-weight:600">${escapeHtml(displayValue(line.value))}</td></tr>`
    )
    .join("");
  const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
        <p style="color:#0830a0;font-weight:700;font-size:12px;letter-spacing:0.08em;text-transform:uppercase">${BRAND_NAME}</p>
        <h1 style="font-size:20px;margin:0 0 16px">${escapeHtml(params.subject)}</h1>
        <table style="width:100%;font-size:14px;border-collapse:collapse">${rows}</table>
        <p style="font-size:12px;color:#677184;margin-top:24px">Sent to ${escapeHtml(toLabel)}</p>
      </div>
    `;
  return sendAndLog({
    kind: params.kind,
    to,
    subject: params.subject,
    text,
    html,
  });
}

export async function sendPasswordResetEmail(params: { to: string; resetUrl: string }) {
  const text = `Reset your ${BRAND_NAME} password\n\nUse this link within 1 hour:\n${params.resetUrl}\n\nIf you did not ask for this, you can ignore the email.`;
  const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
        <p style="color:#0830a0;font-weight:700;font-size:12px;letter-spacing:0.08em;text-transform:uppercase">${BRAND_NAME}</p>
        <h1 style="font-size:22px;margin:0 0 16px">Reset your password</h1>
        <p>Use the button below within 1 hour to set a new password.</p>
        <p><a href="${params.resetUrl}" style="display:inline-block;background:#0830a0;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Set password</a></p>
        <p style="font-size:12px;color:#677184;margin-top:24px">If you did not ask for this, you can ignore the email.</p>
      </div>
    `;
  return sendAndLog({
    kind: "password_reset",
    to: params.to,
    subject: `Reset your ${BRAND_NAME} password`,
    text,
    html,
  });
}

export type SendEmailResult =
  | { ok: true; id?: string }
  | { ok: false; skipped: true; reason: string }
  | { ok: false; error: string };

/**
 * The three parts of a rendered email, as produced by a pure builder.
 *
 * Splitting the *rendering* (`build*Email`, pure) from the *sending* (`send*`,
 * which reads the CMS and talks to Resend) is what lets the admin preview and
 * the live send share one code path: both call the same builder, one passes the
 * saved copy and the other passes the editor's unsaved copy. A second,
 * parallel HTML implementation for the preview would drift from the real email
 * and give the owner false confidence — worse than no preview at all.
 */
export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

export async function sendAndLog(params: {
  kind: DemoEmailKind;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}): Promise<SendEmailResult> {
  let result: SendEmailResult;

  if (!resend || !process.env.RESEND_FROM_EMAIL) {
    console.warn("[email] Skipped — RESEND_API_KEY or RESEND_FROM_EMAIL not configured");
    result = { ok: false, skipped: true, reason: "Email not configured" };
  } else {
    try {
      const { data, error } = await resend.emails.send({
        from: fromAddress(),
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });

      if (error) {
        console.error("[email] Resend error:", error);
        result = { ok: false, error: error.message };
      } else {
        result = { ok: true, id: data?.id };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Send failed";
      console.error("[email]", message);
      result = { ok: false, error: message };
    }
  }

  await logDemoEmail({
    kind: params.kind,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
    delivered: result.ok === true,
  });

  return result;
}

export function mentorInboxUrl() {
  return `${appUrl()}/mentor-connect/inbox`;
}

export function menteeMentorConnectUrl() {
  return `${appUrl()}/mentor-connect`;
}

export interface MenteeAnswerEmailParams {
  memberName: string | null;
  segmentLabel: string;
  question: string;
  answer: string;
}

export function buildMenteeAnswerEmail(
  copy: EmailCopy,
  params: MenteeAnswerEmailParams
): RenderedEmail {
  const name = params.memberName?.split(" ")[0] || "there";
  const link = menteeMentorConnectUrl();
  const vars = { segmentLabel: params.segmentLabel };
  const text = joinTextBlocks(
    `Hi ${name},`,
    renderCopyText(copy.intro, vars),
    `Your question:\n${params.question}`,
    `Answer:\n${params.answer}`,
    ctaTextLine(copy.buttonLabel, link)
  );
  const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
        <p style="color:#0830a0;font-weight:700;font-size:12px;letter-spacing:0.08em;text-transform:uppercase">Mentor Connect</p>
        <h1 style="font-size:22px;margin:0 0 16px">${escapeHtml(renderCopyText(copy.heading, vars))}</h1>
        <p>Hi ${name},</p>
        ${renderCopyParagraphsHtml(copy.intro, vars)}
        <div style="background:#f2f4f7;border-radius:8px;padding:16px;margin:16px 0">
          <p style="font-size:11px;font-weight:700;color:#677184;margin:0 0 8px;text-transform:uppercase">Your question</p>
          <p style="margin:0;font-size:14px;line-height:1.5">${escapeHtml(params.question)}</p>
        </div>
        <div style="background:#eeedfe;border-left:3px solid #3280ff;border-radius:8px;padding:16px;margin:16px 0">
          <p style="font-size:11px;font-weight:700;color:#0830a0;margin:0 0 8px;text-transform:uppercase">Practitioner answer</p>
          <p style="margin:0;font-size:14px;line-height:1.6;color:#0830a0">${escapeHtml(params.answer)}</p>
        </div>
        ${isBlankCopy(copy.buttonLabel) ? "" : `<p><a href="${link}" style="display:inline-block;background:#0830a0;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">${escapeHtml(copy.buttonLabel)}</a></p>`}
        <p style="font-size:12px;color:#677184;margin-top:24px">${BRAND_NAME} · ${BRAND_TAGLINE}</p>
      </div>
    `;

  return { subject: renderCopyText(copy.subject, vars), text, html };
}

export async function sendMenteeAnswerEmail(params: {
  to: string;
  memberName: string | null;
  segmentLabel: string;
  question: string;
  answer: string;
}) {
  const copy = (await readEmailCopy()).emails.mentee_answer;
  return sendAndLog({
    kind: "mentee_answer",
    to: params.to,
    ...buildMenteeAnswerEmail(copy, params),
  });
}

export interface MentorReminderEmailParams {
  segmentLabel: string;
  question: string;
  memberLabel: string;
  submittedAt: string;
}

export function buildMentorReminderEmail(
  copy: EmailCopy,
  params: MentorReminderEmailParams
): RenderedEmail {
  const link = mentorInboxUrl();
  const vars = { segmentLabel: params.segmentLabel };
  const text = joinTextBlocks(
    renderCopyText(copy.intro, vars),
    `Member: ${params.memberLabel}\nSegment: ${params.segmentLabel}\nSubmitted: ${params.submittedAt}`,
    `Question:\n${params.question}`,
    ctaTextLine(copy.buttonLabel, link)
  );
  const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
        <p style="color:#B45309;font-weight:700;font-size:12px;letter-spacing:0.08em;text-transform:uppercase">Mentor Connect · Reminder</p>
        <h1 style="font-size:22px;margin:0 0 16px">${escapeHtml(renderCopyText(copy.heading, vars))}</h1>
        ${renderCopyParagraphsHtml(copy.intro, vars)}
        <table style="width:100%;font-size:13px;margin:16px 0;border-collapse:collapse">
          <tr><td style="padding:6px 0;color:#677184">Member</td><td style="padding:6px 0;font-weight:600">${escapeHtml(params.memberLabel)}</td></tr>
          <tr><td style="padding:6px 0;color:#677184">Segment</td><td style="padding:6px 0;font-weight:600">${escapeHtml(params.segmentLabel)}</td></tr>
          <tr><td style="padding:6px 0;color:#677184">Submitted</td><td style="padding:6px 0">${escapeHtml(params.submittedAt)}</td></tr>
        </table>
        <div style="background:#fef3c7;border-radius:8px;padding:16px;margin:16px 0">
          <p style="font-size:11px;font-weight:700;color:#92400e;margin:0 0 8px;text-transform:uppercase">Member query</p>
          <p style="margin:0;font-size:14px;line-height:1.5">${escapeHtml(params.question)}</p>
        </div>
        ${isBlankCopy(copy.buttonLabel) ? "" : `<p><a href="${link}" style="display:inline-block;background:#0830a0;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">${escapeHtml(copy.buttonLabel)}</a></p>`}
      </div>
    `;

  return { subject: renderCopyText(copy.subject, vars), text, html };
}

export async function sendMentorReminderEmail(params: {
  to: string;
  segmentLabel: string;
  question: string;
  memberLabel: string;
  submittedAt: string;
}) {
  const copy = (await readEmailCopy()).emails.mentor_reminder;
  return sendAndLog({
    kind: "mentor_reminder",
    to: params.to,
    ...buildMentorReminderEmail(copy, params),
  });
}

export interface NewQuestionEmailParams {
  segmentLabel: string;
  question: string;
  memberLabel: string;
}

export function buildNewQuestionEmail(
  copy: EmailCopy,
  params: NewQuestionEmailParams
): RenderedEmail {
  const link = mentorInboxUrl();
  const vars = { segmentLabel: params.segmentLabel, memberLabel: params.memberLabel };
  const text = joinTextBlocks(
    renderCopyText(copy.intro, vars),
    `${params.memberLabel} · ${params.segmentLabel}`,
    params.question,
    ctaTextLine(copy.buttonLabel, link)
  );
  const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto">
        <h1 style="font-size:20px">${escapeHtml(renderCopyText(copy.heading, vars))}</h1>
        ${renderCopyParagraphsHtml(copy.intro, vars)}
        <p><strong>${escapeHtml(params.memberLabel)}</strong> · ${escapeHtml(params.segmentLabel)}</p>
        <p style="line-height:1.5">${escapeHtml(params.question)}</p>
        ${isBlankCopy(copy.buttonLabel) ? "" : `<p><a href="${link}">${escapeHtml(copy.buttonLabel)}</a></p>`}
      </div>
    `;

  return { subject: renderCopyText(copy.subject, vars), text, html };
}

export async function sendNewQuestionToMentorPoolEmail(params: {
  to: string;
  segmentLabel: string;
  question: string;
  memberLabel: string;
}) {
  const copy = (await readEmailCopy()).emails.new_question;
  return sendAndLog({
    kind: "new_question",
    to: params.to,
    ...buildNewQuestionEmail(copy, params),
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface JobChatQuestionEmailParams {
  hirerName: string | null;
  jobTitle: string;
  company: string;
  candidateLabel: string;
  message: string;
  respondToken: string;
  exchangeNumber: number;
}

export function buildJobChatQuestionEmail(
  copy: EmailCopy,
  params: JobChatQuestionEmailParams
): RenderedEmail {
  const link = jobChatRespondUrl(params.respondToken);
  const greeting = params.hirerName?.split(" ")[0] || "there";
  const vars = { jobTitle: params.jobTitle, company: params.company };
  const text = joinTextBlocks(
    `Hi ${greeting},`,
    renderCopyText(copy.intro, vars),
    `Question ${params.exchangeNumber} of 3:\n${params.message}`,
    ctaTextLine(copy.buttonLabel, link)
  );
  const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
        <p style="color:#0830a0;font-weight:700;font-size:12px;letter-spacing:0.08em;text-transform:uppercase">Market Job Openings · Live Chat</p>
        <h1 style="font-size:22px;margin:0 0 16px">${escapeHtml(renderCopyText(copy.heading, vars))}</h1>
        <p>Hi ${escapeHtml(greeting)},</p>
        ${renderCopyParagraphsHtml(copy.intro, vars)}
        <div style="background:#f2f4f7;border-radius:8px;padding:16px;margin:16px 0">
          <p style="font-size:11px;font-weight:700;color:#677184;margin:0 0 8px;text-transform:uppercase">Question ${params.exchangeNumber} of 3</p>
          <p style="margin:0;font-size:14px;line-height:1.5">${escapeHtml(params.message)}</p>
        </div>
        <p style="font-size:13px;color:#677184">From: ${escapeHtml(params.candidateLabel)}</p>
        ${isBlankCopy(copy.buttonLabel) ? "" : `<p><a href="${link}" style="display:inline-block;background:#0830a0;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">${escapeHtml(copy.buttonLabel)}</a></p>`}
        <p style="font-size:12px;color:#677184;margin-top:24px">${BRAND_NAME} · ${BRAND_TAGLINE}</p>
      </div>
    `;

  return { subject: renderCopyText(copy.subject, vars), text, html };
}

export async function sendJobChatQuestionToHirer(params: {
  to: string;
  hirerName: string | null;
  jobTitle: string;
  company: string;
  candidateLabel: string;
  message: string;
  respondToken: string;
  exchangeNumber: number;
}) {
  const copy = (await readEmailCopy()).emails.job_chat_question;
  return sendAndLog({
    kind: "job_chat_question",
    to: params.to,
    ...buildJobChatQuestionEmail(copy, params),
  });
}

export interface JobChatAnswerEmailParams {
  candidateName: string | null;
  jobTitle: string;
  company: string;
  answer: string;
  exchangeCount: number;
}

export function buildJobChatAnswerEmail(
  copy: EmailCopy,
  params: JobChatAnswerEmailParams
): RenderedEmail {
  const name = params.candidateName?.split(" ")[0] || "there";
  const link = `${appUrl()}/job-openings`;
  const vars = {
    jobTitle: params.jobTitle,
    company: params.company,
    exchangeCount: params.exchangeCount,
  };
  const text = joinTextBlocks(
    `Hi ${name},`,
    renderCopyText(copy.intro, vars),
    `Answer:\n${params.answer}`,
    ctaTextLine(copy.buttonLabel, link)
  );
  const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
        <p style="color:#0830a0;font-weight:700;font-size:12px;letter-spacing:0.08em;text-transform:uppercase">Market Job Openings · Live Chat</p>
        <h1 style="font-size:22px;margin:0 0 16px">${escapeHtml(renderCopyText(copy.heading, vars))}</h1>
        <p>Hi ${escapeHtml(name)},</p>
        ${renderCopyParagraphsHtml(copy.intro, vars)}
        <div style="background:#eeedfe;border-left:3px solid #3280ff;border-radius:8px;padding:16px;margin:16px 0">
          <p style="margin:0;font-size:14px;line-height:1.6;color:#0830a0">${escapeHtml(params.answer)}</p>
        </div>
        ${isBlankCopy(copy.buttonLabel) ? "" : `<p><a href="${link}" style="display:inline-block;background:#0830a0;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">${escapeHtml(copy.buttonLabel)}</a></p>`}
      </div>
    `;

  return { subject: renderCopyText(copy.subject, vars), text, html };
}

export async function sendJobChatAnswerToCandidate(params: {
  to: string;
  candidateName: string | null;
  jobTitle: string;
  company: string;
  answer: string;
  exchangeCount: number;
}) {
  const copy = (await readEmailCopy()).emails.job_chat_answer;
  return sendAndLog({
    kind: "job_chat_answer",
    to: params.to,
    ...buildJobChatAnswerEmail(copy, params),
  });
}

export interface JobInterviewOfferEmailParams {
  candidateEmail: string;
  candidateName: string | null;
  hirerName: string | null;
  jobTitle: string;
  company: string;
  messages: JobChatMessage[];
}

/** Both halves of the interview-offer pair, rendered together from one call. */
export interface JobInterviewOfferEmails {
  candidate: RenderedEmail;
  hirer: RenderedEmail;
}

/**
 * Builds both interview-offer emails from one parameter set.
 *
 * The pair shares one builder on purpose: the candidate's copy and the hirer's
 * copy describe the same event, so the preview for either key must render
 * through this function rather than a hand-written stand-in.
 */
export function buildJobInterviewOfferEmails(
  candidateCopy: EmailCopy,
  hirerCopy: EmailCopy,
  params: JobInterviewOfferEmailParams
): JobInterviewOfferEmails {
  const candidateFirst = params.candidateName?.split(" ")[0] || "there";
  const hirerFirst = params.hirerName?.split(" ")[0] || "there";
  const transcript = params.messages
    .map((m) => `${m.role === "candidate" ? "Candidate" : "Hirer"}: ${m.text}`)
    .join("\n\n");

  const candidateVars = { jobTitle: params.jobTitle, company: params.company };
  const hirerVars = { jobTitle: params.jobTitle, candidateEmail: params.candidateEmail };

  const candidateText = joinTextBlocks(
    `Hi ${candidateFirst},`,
    renderCopyText(candidateCopy.intro, candidateVars),
    `Your Live Chat transcript:\n${transcript}`
  );
  const candidateHtml = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto">
        <h1 style="font-size:22px">${escapeHtml(renderCopyText(candidateCopy.heading, candidateVars))}</h1>
        <p>Hi ${escapeHtml(candidateFirst)},</p>
        ${renderCopyParagraphsHtml(candidateCopy.intro, candidateVars)}
      </div>
    `;

  const hirerText = joinTextBlocks(
    `Hi ${hirerFirst},`,
    renderCopyText(hirerCopy.intro, hirerVars),
    `Transcript:\n${transcript}`
  );
  const hirerHtml = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto">
        <h1 style="font-size:22px">${escapeHtml(renderCopyText(hirerCopy.heading, hirerVars))}</h1>
        <p>Hi ${escapeHtml(hirerFirst)},</p>
        ${renderCopyParagraphsHtml(hirerCopy.intro, hirerVars)}
      </div>
    `;

  return {
    candidate: { subject: renderCopyText(candidateCopy.subject, candidateVars), text: candidateText, html: candidateHtml },
    hirer: { subject: renderCopyText(hirerCopy.subject, hirerVars), text: hirerText, html: hirerHtml },
  };
}

export async function sendJobInterviewOfferEmails(params: {
  candidateEmail: string;
  candidateName: string | null;
  hirerEmail: string;
  hirerName: string | null;
  jobTitle: string;
  company: string;
  messages: JobChatMessage[];
}) {
  // One CMS read serves both recipients — this sender mails the candidate and the
  // hirer in the same call, and the copy lives under two separate keys.
  const templates = (await readEmailCopy()).emails;
  const { candidate, hirer } = buildJobInterviewOfferEmails(
    templates.job_interview_offer_candidate,
    templates.job_interview_offer_hirer,
    params
  );

  const [candidateResult, hirerResult] = await Promise.all([
    sendAndLog({
      kind: "job_interview_offer",
      to: params.candidateEmail,
      ...candidate,
    }),
    sendAndLog({
      kind: "job_interview_offer",
      to: params.hirerEmail,
      ...hirer,
    }),
  ]);

  return { candidateResult, hirerResult };
}

function formatStripeAmount(amountCents: number, currency: string): string {
  const amount = amountCents / 100;
  const code = currency.toUpperCase();
  // Explicit branches for the currencies the site actually prices in, so receipts read
  // exactly like the pricing page ("S$19.00"). The Intl fallback below stays for any
  // other code — the en-SG locale renders SGD as "SGD 19.00" and USD as "US$19.00",
  // neither of which matches the `S$` form the pricing page uses.
  if (code === "SGD") {
    return `S$${amount.toFixed(2)}`;
  }
  if (code === "USD") {
    return `USD ${amount.toFixed(2)}`;
  }
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: code,
  }).format(amount);
}

export interface BillingReceiptEmailParams {
  memberName: string | null;
  invoiceNumber: string;
  amountCents: number;
  currency: string;
  planLabel: string;
  periodStart?: Date | null;
  periodEnd?: Date | null;
  invoicePdfUrl?: string | null;
  hostedInvoiceUrl?: string | null;
}

export function buildBillingReceiptEmail(
  copy: EmailCopy,
  params: BillingReceiptEmailParams
): RenderedEmail {
  const name = params.memberName?.split(" ")[0] || "there";
  const amount = formatStripeAmount(params.amountCents, params.currency);
  const invoiceRef = params.invoiceNumber.startsWith("#")
    ? params.invoiceNumber
    : `#${params.invoiceNumber}`;
  const periodLine =
    params.periodStart && params.periodEnd
      ? `\nBilling period: ${params.periodStart.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })} – ${params.periodEnd.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}`
      : "";
  const receiptLink = params.hostedInvoiceUrl || params.invoicePdfUrl || `${appUrl()}/account`;
  const vars = {
    brandName: BRAND_NAME,
    invoiceNumber: invoiceRef,
    amount,
    planLabel: params.planLabel,
  };
  // The heading doubles as the plain-text summary line, matching the original body.
  const text = joinTextBlocks(
    `Hi ${name},`,
    renderCopyText(copy.heading, vars),
    `Amount paid: ${amount}\nPlan: ${params.planLabel}${periodLine}`,
    ctaTextLine(copy.buttonLabel, receiptLink),
    `Questions? Reply to this email or contact ${BRAND_EMAIL_SUPPORT}.`
  );

  const periodHtml =
    params.periodStart && params.periodEnd
      ? `<tr><td style="padding:8px 0;color:#677184">Billing period</td><td style="padding:8px 0;font-weight:600;text-align:right">${escapeHtml(params.periodStart.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" }))} – ${escapeHtml(params.periodEnd.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" }))}</td></tr>`
      : "";

  const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
        <p style="color:#0830a0;font-weight:700;font-size:12px;letter-spacing:0.08em;text-transform:uppercase">${BRAND_NAME}</p>
        <h1 style="font-size:22px;margin:0 0 8px">${escapeHtml(renderCopyText(copy.heading, vars))}</h1>
        <p style="color:#677184;font-size:14px;margin:0 0 20px">Thank you for your subscription.</p>
        <p>Hi ${escapeHtml(name)},</p>
        ${renderCopyParagraphsHtml(copy.intro, vars)}
        <table style="width:100%;font-size:14px;margin:20px 0;border-collapse:collapse;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb">
          <tr><td style="padding:8px 0;color:#677184">Amount paid</td><td style="padding:8px 0;font-weight:700;text-align:right">${escapeHtml(amount)}</td></tr>
          <tr><td style="padding:8px 0;color:#677184">Plan</td><td style="padding:8px 0;font-weight:600;text-align:right">${escapeHtml(params.planLabel)}</td></tr>
          <tr><td style="padding:8px 0;color:#677184">Receipt</td><td style="padding:8px 0;font-weight:600;text-align:right">${escapeHtml(invoiceRef)}</td></tr>
          ${periodHtml}
        </table>
        ${isBlankCopy(copy.buttonLabel) ? "" : `<p><a href="${receiptLink}" style="display:inline-block;background:#0830a0;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">${escapeHtml(copy.buttonLabel)}</a></p>`}
        <p style="font-size:12px;color:#677184;margin-top:24px">${BRAND_NAME} · ${BRAND_TAGLINE}<br/>${BRAND_EMAIL_SUPPORT}</p>
      </div>
    `;

  return { subject: renderCopyText(copy.subject, vars), text, html };
}

export async function sendBillingReceiptEmail(params: {
  to: string;
  memberName: string | null;
  invoiceNumber: string;
  amountCents: number;
  currency: string;
  planLabel: string;
  periodStart?: Date | null;
  periodEnd?: Date | null;
  invoicePdfUrl?: string | null;
  hostedInvoiceUrl?: string | null;
}) {
  const copy = (await readEmailCopy()).emails.billing_receipt;
  return sendAndLog({
    kind: "billing_receipt",
    to: params.to,
    ...buildBillingReceiptEmail(copy, params),
  });
}
