/**
 * Renders an email template for the admin preview, using sample data.
 *
 * Deliberately pure and synchronous: no database read, no Resend call, no CMS
 * lookup. It only dispatches to the *same* builders the live senders use
 * (`src/lib/email.ts`), pairing the caller-supplied copy with the matching
 * sample from `src/data/email-template-samples.ts`.
 *
 * That purity is the whole point. It means the preview cannot diverge from the
 * real email — it is the real email, rendered from the editor's copy instead of
 * the saved copy — and it means `scripts/verify-email-copy.ts` can render every
 * template with no server and no database.
 */
import type { EmailTemplateKey, EmailTemplatesContent } from "@/data/email-templates-content";
import { EMAIL_TEMPLATE_SAMPLES } from "@/data/email-template-samples";
import {
  buildBillingReceiptEmail,
  buildJobChatAnswerEmail,
  buildJobChatQuestionEmail,
  buildJobInterviewOfferEmails,
  buildMenteeAnswerEmail,
  buildMentorReminderEmail,
  buildNewQuestionEmail,
  type RenderedEmail,
} from "@/lib/email";

export type { RenderedEmail } from "@/lib/email";

export function buildEmailPreview(
  key: EmailTemplateKey,
  copy: EmailTemplatesContent
): RenderedEmail {
  const samples = EMAIL_TEMPLATE_SAMPLES;

  switch (key) {
    case "mentee_answer":
      return buildMenteeAnswerEmail(copy.emails.mentee_answer, samples.mentee_answer);
    case "mentor_reminder":
      return buildMentorReminderEmail(copy.emails.mentor_reminder, samples.mentor_reminder);
    case "new_question":
      return buildNewQuestionEmail(copy.emails.new_question, samples.new_question);
    case "job_chat_question":
      return buildJobChatQuestionEmail(copy.emails.job_chat_question, samples.job_chat_question);
    case "job_chat_answer":
      return buildJobChatAnswerEmail(copy.emails.job_chat_answer, samples.job_chat_answer);
    // The two interview-offer keys are halves of one builder; the sample is
    // shared between them (see `email-template-samples.ts`).
    case "job_interview_offer_candidate":
      return buildJobInterviewOfferEmails(
        copy.emails.job_interview_offer_candidate,
        copy.emails.job_interview_offer_hirer,
        samples.job_interview_offer_candidate
      ).candidate;
    case "job_interview_offer_hirer":
      return buildJobInterviewOfferEmails(
        copy.emails.job_interview_offer_candidate,
        copy.emails.job_interview_offer_hirer,
        samples.job_interview_offer_hirer
      ).hirer;
    case "billing_receipt":
      return buildBillingReceiptEmail(copy.emails.billing_receipt, samples.billing_receipt);
  }
}
