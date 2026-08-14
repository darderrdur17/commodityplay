import { Resend } from "resend";
import { logDemoEmail, type DemoEmailKind } from "@/lib/demo-email-log";
import { BRAND_NAME, BRAND_SITE_URL, BRAND_TAGLINE } from "@/lib/brand";

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
