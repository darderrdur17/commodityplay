import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  sendMenteeAnswerEmail,
  sendMentorReminderEmail,
  sendNewQuestionToMentorPoolEmail,
} from "@/lib/email";
import { MENTOR_DEMO_EMAIL, MENTOR_SEGMENT_LABELS, memberDisplayId } from "@/lib/mentor-demo";
import { formatDate } from "@/lib/utils";

export async function mentorNotifyEmails(): Promise<string[]> {
  const mentors = await prisma.user.findMany({
    where: { isMentor: true },
    select: { email: true },
  });
  const fromDb = mentors.map((m) => m.email).filter(Boolean);
  const extra = process.env.MENTOR_NOTIFY_EMAIL?.trim();
  const unique = [...new Set([...fromDb, extra].filter((e): e is string => Boolean(e)))];
  return unique.length ? unique : [MENTOR_DEMO_EMAIL];
}

export function mentorNotifyEmail(): string {
  return process.env.MENTOR_NOTIFY_EMAIL || MENTOR_DEMO_EMAIL;
}

export type AnswerMentorQuestionResult = {
  question: {
    id: string;
    answer: string | null;
    isAnswered: boolean;
    memberShareOptIn: boolean;
    mentorShareOptIn: boolean;
    answeredAt: Date | null;
    answeredByEmail: string | null;
    menteeNotifiedAt: Date | null;
  };
  email: { sent: boolean; skipped?: boolean; error?: string };
};

export async function answerMentorQuestion(params: {
  questionId: string;
  answer: string;
  mentorShareOptIn?: boolean;
  answeredByEmail: string;
}): Promise<AnswerMentorQuestionResult> {
  const existing = await prisma.mentorQuestion.findUnique({
    where: { id: params.questionId },
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
  });

  if (!existing) {
    throw new Error("NOT_FOUND");
  }
  if (existing.isAnswered) {
    throw new Error("ALREADY_ANSWERED");
  }

  const answeredAt = new Date();

  const question = await prisma.mentorQuestion.update({
    where: { id: params.questionId },
    data: {
      answer: params.answer,
      isAnswered: true,
      mentorShareOptIn: params.mentorShareOptIn ?? false,
      answeredAt,
      answeredByEmail: params.answeredByEmail,
    },
  });

  const segmentLabel = MENTOR_SEGMENT_LABELS[existing.segment] ?? existing.segment;
  const emailResult = await sendMenteeAnswerEmail({
    to: existing.user.email,
    memberName: existing.user.name,
    segmentLabel,
    question: existing.question,
    answer: params.answer,
  });

  let menteeNotifiedAt: Date | null = null;
  if (emailResult.ok) {
    menteeNotifiedAt = new Date();
    await prisma.mentorQuestion.update({
      where: { id: params.questionId },
      data: { menteeNotifiedAt },
    });
  }

  revalidatePath("/mentor-connect");
  revalidatePath("/mentor-connect/inbox");
  revalidatePath("/admin");

  return {
    question: {
      id: question.id,
      answer: question.answer,
      isAnswered: question.isAnswered,
      memberShareOptIn: question.memberShareOptIn,
      mentorShareOptIn: question.mentorShareOptIn,
      answeredAt: question.answeredAt,
      answeredByEmail: question.answeredByEmail,
      menteeNotifiedAt,
    },
    email: emailResult.ok
      ? { sent: true }
      : "skipped" in emailResult && emailResult.skipped
        ? { sent: false, skipped: true }
        : { sent: false, error: "error" in emailResult ? emailResult.error : "Unknown error" },
  };
}

export type NotifyMentorResult = {
  mentorReminderSentAt: Date;
  email: { sent: boolean; skipped?: boolean; error?: string };
};

export async function notifyMentorPendingQuestion(questionId: string): Promise<NotifyMentorResult> {
  const question = await prisma.mentorQuestion.findUnique({
    where: { id: questionId },
    include: {
      user: { select: { id: true, tier: true, persona: true } },
    },
  });

  if (!question) throw new Error("NOT_FOUND");
  if (question.isAnswered) throw new Error("ALREADY_ANSWERED");

  const segmentLabel = MENTOR_SEGMENT_LABELS[question.segment] ?? question.segment;
  const recipients = await mentorNotifyEmails();
  let lastResult: { sent: boolean; skipped?: boolean; error?: string } = { sent: false };
  for (const to of recipients) {
    const emailResult = await sendMentorReminderEmail({
      to,
      segmentLabel,
      question: question.question,
      memberLabel: memberDisplayId(question.user.id),
      submittedAt: formatDate(question.createdAt.toISOString()),
    });
    lastResult = emailResult.ok
      ? { sent: true }
      : "skipped" in emailResult && emailResult.skipped
        ? { sent: false, skipped: true }
        : { sent: false, error: "error" in emailResult ? emailResult.error : "Unknown error" };
  }

  const mentorReminderSentAt = new Date();
  await prisma.mentorQuestion.update({
    where: { id: questionId },
    data: { mentorReminderSentAt },
  });

  return {
    mentorReminderSentAt,
    email: lastResult,
  };
}

export async function notifyMentorPoolNewQuestion(questionId: string): Promise<void> {
  const question = await prisma.mentorQuestion.findUnique({
    where: { id: questionId },
    include: { user: { select: { id: true } } },
  });
  if (!question) return;

  const segmentLabel = MENTOR_SEGMENT_LABELS[question.segment] ?? question.segment;
  // Targeted questions notify only the mentor they were addressed to. Legacy
  // (unaddressed) rows keep the old behaviour and notify the whole pool.
  const recipients = question.mentorProfileId
    ? await mentorEmailsForProfile(question.mentorProfileId)
    : await mentorNotifyEmails();
  for (const to of recipients) {
    await sendNewQuestionToMentorPoolEmail({
      to,
      segmentLabel,
      question: question.question,
      memberLabel: memberDisplayId(question.user.id),
    });
  }
}

/** Emails of the mentor account(s) linked to an anonymous Mentor Connect profile. */
async function mentorEmailsForProfile(mentorProfileId: string): Promise<string[]> {
  const mentors = await prisma.user.findMany({
    where: { isMentor: true, mentorProfileId },
    select: { email: true },
  });
  return mentors.map((m) => m.email).filter((e): e is string => Boolean(e));
}
