import { Resend } from "resend";
import { logDemoEmail, type DemoEmailKind } from "@/lib/demo-email-log";
import { BRAND_NAME, BRAND_SITE_URL, BRAND_TAGLINE } from "@/lib/brand";
import { jobChatRespondUrl } from "@/lib/job-chat";
import type { JobChatMessage } from "@/lib/job-chat";

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

export type SendEmailResult =
  | { ok: true; id?: string }
  | { ok: false; skipped: true; reason: string }
  | { ok: false; error: string };

async function sendAndLog(params: {
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

export async function sendMenteeAnswerEmail(params: {
  to: string;
  memberName: string | null;
  segmentLabel: string;
  question: string;
  answer: string;
}) {
  const name = params.memberName?.split(" ")[0] || "there";
  const link = menteeMentorConnectUrl();
  const text = `Hi ${name},\n\nA practitioner has answered your ${params.segmentLabel} question on ${BRAND_NAME}.\n\nYour question:\n${params.question}\n\nAnswer:\n${params.answer}\n\nView in Mentor Connect: ${link}`;
  const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
        <p style="color:#0830a0;font-weight:700;font-size:12px;letter-spacing:0.08em;text-transform:uppercase">Mentor Connect</p>
        <h1 style="font-size:22px;margin:0 0 16px">Your question has been answered</h1>
        <p>Hi ${name},</p>
        <p>A practitioner responded to your <strong>${params.segmentLabel}</strong> question.</p>
        <div style="background:#f2f4f7;border-radius:8px;padding:16px;margin:16px 0">
          <p style="font-size:11px;font-weight:700;color:#677184;margin:0 0 8px;text-transform:uppercase">Your question</p>
          <p style="margin:0;font-size:14px;line-height:1.5">${escapeHtml(params.question)}</p>
        </div>
        <div style="background:#eeedfe;border-left:3px solid #3280ff;border-radius:8px;padding:16px;margin:16px 0">
          <p style="font-size:11px;font-weight:700;color:#0830a0;margin:0 0 8px;text-transform:uppercase">Practitioner answer</p>
          <p style="margin:0;font-size:14px;line-height:1.6;color:#0830a0">${escapeHtml(params.answer)}</p>
        </div>
        <p><a href="${link}" style="display:inline-block;background:#0830a0;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">View in Mentor Connect</a></p>
        <p style="font-size:12px;color:#677184;margin-top:24px">${BRAND_NAME} · ${BRAND_TAGLINE}</p>
      </div>
    `;

  return sendAndLog({
    kind: "mentee_answer",
    to: params.to,
    subject: "Your Mentor Connect question has been answered",
    text,
    html,
  });
}

export async function sendMentorReminderEmail(params: {
  to: string;
  segmentLabel: string;
  question: string;
  memberLabel: string;
  submittedAt: string;
}) {
  const link = mentorInboxUrl();
  const text = `A member question is awaiting your response.\n\nMember: ${params.memberLabel}\nSegment: ${params.segmentLabel}\nSubmitted: ${params.submittedAt}\n\nQuestion:\n${params.question}\n\nOpen inbox: ${link}`;
  const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
        <p style="color:#B45309;font-weight:700;font-size:12px;letter-spacing:0.08em;text-transform:uppercase">Mentor Connect · Reminder</p>
        <h1 style="font-size:22px;margin:0 0 16px">Pending member request</h1>
        <p>An Elite member question is waiting for a practitioner response.</p>
        <table style="width:100%;font-size:13px;margin:16px 0;border-collapse:collapse">
          <tr><td style="padding:6px 0;color:#677184">Member</td><td style="padding:6px 0;font-weight:600">${escapeHtml(params.memberLabel)}</td></tr>
          <tr><td style="padding:6px 0;color:#677184">Segment</td><td style="padding:6px 0;font-weight:600">${escapeHtml(params.segmentLabel)}</td></tr>
          <tr><td style="padding:6px 0;color:#677184">Submitted</td><td style="padding:6px 0">${escapeHtml(params.submittedAt)}</td></tr>
        </table>
        <div style="background:#fef3c7;border-radius:8px;padding:16px;margin:16px 0">
          <p style="font-size:11px;font-weight:700;color:#92400e;margin:0 0 8px;text-transform:uppercase">Member query</p>
          <p style="margin:0;font-size:14px;line-height:1.5">${escapeHtml(params.question)}</p>
        </div>
        <p><a href="${link}" style="display:inline-block;background:#0830a0;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Open mentor inbox</a></p>
      </div>
    `;

  return sendAndLog({
    kind: "mentor_reminder",
    to: params.to,
    subject: `[Action required] Pending Mentor Connect request — ${params.segmentLabel}`,
    text,
    html,
  });
}

export async function sendNewQuestionToMentorPoolEmail(params: {
  to: string;
  segmentLabel: string;
  question: string;
  memberLabel: string;
}) {
  const link = mentorInboxUrl();
  const text = `New member question in ${params.segmentLabel}.\n\n${params.question}\n\nOpen inbox: ${link}`;
  const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto">
        <h1 style="font-size:20px">New member question</h1>
        <p><strong>${escapeHtml(params.memberLabel)}</strong> · ${escapeHtml(params.segmentLabel)}</p>
        <p style="line-height:1.5">${escapeHtml(params.question)}</p>
        <p><a href="${link}">Open mentor inbox</a></p>
      </div>
    `;

  return sendAndLog({
    kind: "new_question",
    to: params.to,
    subject: `New Mentor Connect request — ${params.segmentLabel}`,
    text,
    html,
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
  const link = jobChatRespondUrl(params.respondToken);
  const greeting = params.hirerName?.split(" ")[0] || "there";
  const text = `Hi ${greeting},\n\nAn Elite member asked about your ${params.jobTitle} role at ${params.company}.\n\nQuestion ${params.exchangeNumber} of 3:\n${params.message}\n\nReply here: ${link}`;
  const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
        <p style="color:#0830a0;font-weight:700;font-size:12px;letter-spacing:0.08em;text-transform:uppercase">Market Job Openings · Live Chat</p>
        <h1 style="font-size:22px;margin:0 0 16px">New candidate question</h1>
        <p>Hi ${escapeHtml(greeting)},</p>
        <p>An Elite member is interested in <strong>${escapeHtml(params.jobTitle)}</strong> at ${escapeHtml(params.company)}.</p>
        <div style="background:#f2f4f7;border-radius:8px;padding:16px;margin:16px 0">
          <p style="font-size:11px;font-weight:700;color:#677184;margin:0 0 8px;text-transform:uppercase">Question ${params.exchangeNumber} of 3</p>
          <p style="margin:0;font-size:14px;line-height:1.5">${escapeHtml(params.message)}</p>
        </div>
        <p style="font-size:13px;color:#677184">From: ${escapeHtml(params.candidateLabel)}</p>
        <p><a href="${link}" style="display:inline-block;background:#0830a0;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Reply in Live Chat</a></p>
        <p style="font-size:12px;color:#677184;margin-top:24px">${BRAND_NAME} · ${BRAND_TAGLINE}</p>
      </div>
    `;

  return sendAndLog({
    kind: "job_chat_question",
    to: params.to,
    subject: `[Live Chat] Question on ${params.jobTitle} — ${params.company}`,
    text,
    html,
  });
}

export async function sendJobChatAnswerToCandidate(params: {
  to: string;
  candidateName: string | null;
  jobTitle: string;
  company: string;
  answer: string;
  exchangeCount: number;
}) {
  const name = params.candidateName?.split(" ")[0] || "there";
  const link = `${appUrl()}/job-openings`;
  const text = `Hi ${name},\n\nThe hirer replied to your question about ${params.jobTitle} at ${params.company}.\n\nAnswer:\n${params.answer}\n\nView chat: ${link}`;
  const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
        <p style="color:#0830a0;font-weight:700;font-size:12px;letter-spacing:0.08em;text-transform:uppercase">Market Job Openings · Live Chat</p>
        <h1 style="font-size:22px;margin:0 0 16px">Hirer replied (${params.exchangeCount}/3)</h1>
        <p>Hi ${escapeHtml(name)},</p>
        <p>The hiring team for <strong>${escapeHtml(params.jobTitle)}</strong> at ${escapeHtml(params.company)} responded.</p>
        <div style="background:#eeedfe;border-left:3px solid #3280ff;border-radius:8px;padding:16px;margin:16px 0">
          <p style="margin:0;font-size:14px;line-height:1.6;color:#0830a0">${escapeHtml(params.answer)}</p>
        </div>
        <p><a href="${link}" style="display:inline-block;background:#0830a0;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Continue Live Chat</a></p>
      </div>
    `;

  return sendAndLog({
    kind: "job_chat_answer",
    to: params.to,
    subject: `Hirer replied — ${params.jobTitle}`,
    text,
    html,
  });
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
  const candidateFirst = params.candidateName?.split(" ")[0] || "there";
  const hirerFirst = params.hirerName?.split(" ")[0] || "there";
  const transcript = params.messages
    .map((m) => `${m.role === "candidate" ? "Candidate" : "Hirer"}: ${m.text}`)
    .join("\n\n");

  const candidateText = `Hi ${candidateFirst},\n\nGreat news — ${params.company} would like to offer you an initial interview for ${params.jobTitle}.\n\nThey will follow up directly to schedule.\n\nYour Live Chat transcript:\n${transcript}`;
  const candidateHtml = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto">
        <h1 style="font-size:22px">Initial interview offered</h1>
        <p>Hi ${escapeHtml(candidateFirst)},</p>
        <p><strong>${escapeHtml(params.company)}</strong> would like to move forward with an initial interview for <strong>${escapeHtml(params.jobTitle)}</strong>.</p>
        <p>Expect the hiring team to reach out directly to schedule next steps.</p>
      </div>
    `;

  const hirerText = `Hi ${hirerFirst},\n\nYou offered an initial interview to a candidate for ${params.jobTitle}.\n\nCandidate: ${params.candidateEmail}\n\nTranscript:\n${transcript}`;
  const hirerHtml = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto">
        <h1 style="font-size:22px">Interview offer sent</h1>
        <p>Hi ${escapeHtml(hirerFirst)},</p>
        <p>Your interview offer for <strong>${escapeHtml(params.jobTitle)}</strong> was sent to the candidate (${escapeHtml(params.candidateEmail)}).</p>
        <p>Please follow up directly to schedule the initial interview.</p>
      </div>
    `;

  const [candidateResult, hirerResult] = await Promise.all([
    sendAndLog({
      kind: "job_interview_offer",
      to: params.candidateEmail,
      subject: `Interview offer — ${params.jobTitle} at ${params.company}`,
      text: candidateText,
      html: candidateHtml,
    }),
    sendAndLog({
      kind: "job_interview_offer",
      to: params.hirerEmail,
      subject: `Interview offer confirmed — ${params.jobTitle}`,
      text: hirerText,
      html: hirerHtml,
    }),
  ]);

  return { candidateResult, hirerResult };
}
