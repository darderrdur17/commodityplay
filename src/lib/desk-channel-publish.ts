import { revalidatePath } from "next/cache";
import type { DeskCategory, DeskQA } from "@/data/desk-channel";
import { DESK_QA, deskCategoryMeta, mergeDeskCategories } from "@/data/desk-channel";
import { prisma } from "@/lib/prisma";
import { getDefaultPayload } from "@/lib/content/defaults";
import { getContentModuleRecord, updateContentModule } from "@/lib/content/repository";
import { resolveAdminModulePayload } from "@/lib/content/admin-payload";
import { toIsoDateOnly } from "@/lib/content/interview-questions-freshness";
import { MENTOR_SEGMENT_TO_DESK_CATEGORY } from "@/lib/mentor-share-consent";

type DeskPayload = {
  categories?: ReturnType<typeof mergeDeskCategories>;
  questions?: DeskQA[];
  pageCopy?: unknown;
};

function recountCategories(questions: DeskQA[], cms?: unknown): ReturnType<typeof mergeDeskCategories> {
  return mergeDeskCategories(cms, questions);
}

function deskQaFromMentor(params: {
  questionId: string;
  question: string;
  answer: string;
  category: DeskCategory;
  categories: ReturnType<typeof mergeDeskCategories>;
}): DeskQA {
  const meta = deskCategoryMeta(params.categories, params.category);
  const today = new Date();
  const date = today.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  const addedAt = toIsoDateOnly(today);
  return {
    id: `mc-${params.questionId}`,
    category: params.category,
    categoryLabel: meta.label,
    categoryColor: meta.color,
    question: params.question,
    answer: params.answer,
    attribution: "practitioner",
    author: "Anonymous practitioner",
    authorRole: "Mentor Connect · admin reviewed",
    tags: ["Mentor Connect"],
    helpful: 0,
    date,
    addedAt,
    updatedAt: addedAt,
  };
}

export function defaultDeskCategoryForSegment(segment: string): DeskCategory {
  return MENTOR_SEGMENT_TO_DESK_CATEGORY[segment] ?? "career";
}

export async function publishMentorQuestionToDeskChannel(params: {
  questionId: string;
  category: DeskCategory;
  adminUserId: string;
  /** Desk Channel copy only — does not change the private Mentor Connect record. */
  questionText?: string;
  answerText?: string;
}): Promise<{ deskChannelQaId: string }> {
  const existing = await prisma.mentorQuestion.findUnique({ where: { id: params.questionId } });
  if (!existing) throw new Error("NOT_FOUND");
  if (!existing.isAnswered || !existing.answer) throw new Error("NOT_ANSWERED");
  if (!existing.memberShareOptIn || !existing.mentorShareOptIn) throw new Error("NO_DUAL_CONSENT");
  if (existing.deskChannelStatus === "published") {
    return { deskChannelQaId: existing.deskChannelQaId ?? `mc-${existing.id}` };
  }

  const publishQuestion = (params.questionText?.trim() || existing.question).trim();
  const publishAnswer = (params.answerText?.trim() || existing.answer).trim();
  if (publishQuestion.length < 10 || publishAnswer.length < 10) {
    throw new Error("INVALID_COPY");
  }

  const record = await getContentModuleRecord("desk-channel");
  const resolved = resolveAdminModulePayload("desk-channel", record?.payload) as DeskPayload;
  const defaults = getDefaultPayload("desk-channel") as DeskPayload;
  const questions = [...(resolved.questions?.length ? resolved.questions : defaults.questions ?? DESK_QA)];
  const categories = mergeDeskCategories(resolved.categories ?? defaults.categories, questions);

  const deskQaId = `mc-${existing.id}`;
  const entry = deskQaFromMentor({
    questionId: existing.id,
    question: publishQuestion,
    answer: publishAnswer,
    category: params.category,
    categories,
  });
  const existingIdx = questions.findIndex((q) => q.id === deskQaId);
  if (existingIdx >= 0) {
    questions[existingIdx] = entry;
  } else {
    questions.unshift(entry);
  }

  await updateContentModule(
    "desk-channel",
    {
      payload: {
        ...resolved,
        questions,
        categories: recountCategories(questions, categories),
        pageCopy: resolved.pageCopy ?? defaults.pageCopy,
      },
      published: true,
    },
    params.adminUserId
  );

  await prisma.mentorQuestion.update({
    where: { id: existing.id },
    data: { deskChannelStatus: "published", deskChannelQaId: deskQaId },
  });

  revalidatePath("/desk-channel", "page");
  revalidatePath("/admin");

  return { deskChannelQaId: deskQaId };
}

export async function rejectMentorQuestionFromDeskChannel(questionId: string): Promise<void> {
  const existing = await prisma.mentorQuestion.findUnique({ where: { id: questionId } });
  if (!existing) throw new Error("NOT_FOUND");
  if (existing.deskChannelStatus === "published") throw new Error("ALREADY_PUBLISHED");

  await prisma.mentorQuestion.update({
    where: { id: questionId },
    data: { deskChannelStatus: "rejected" },
  });
  revalidatePath("/admin");
}
