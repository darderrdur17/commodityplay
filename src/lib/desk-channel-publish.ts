import { revalidatePath } from "next/cache";
import type { DeskCategory, DeskQA } from "@/data/desk-channel";
import { DESK_CATEGORIES, DESK_QA } from "@/data/desk-channel";
import { prisma } from "@/lib/prisma";
import { getDefaultPayload } from "@/lib/content/defaults";
import { getContentModuleRecord, updateContentModule } from "@/lib/content/repository";
import { resolveAdminModulePayload } from "@/lib/content/admin-payload";
import { MENTOR_SEGMENT_TO_DESK_CATEGORY } from "@/lib/mentor-share-consent";

const DESK_CAT_META: Record<DeskCategory, { label: string; color: string }> = {
  trading: { label: "Trading & Market Analysis", color: "#3280ff" },
  ops: { label: "Operations & Scheduling", color: "#B45309" },
  risk: { label: "Risk & Compliance", color: "#5B21B6" },
  tools: { label: "Market Intelligence & Tools", color: "#0F766E" },
  career: { label: "Career Positioning", color: "#0040f5" },
};

type DeskPayload = {
  categories?: typeof DESK_CATEGORIES;
  questions?: DeskQA[];
  pageCopy?: unknown;
};

function recountCategories(questions: DeskQA[]): typeof DESK_CATEGORIES {
  const byCat: Record<string, number> = {};
  for (const q of questions) {
    byCat[q.category] = (byCat[q.category] ?? 0) + 1;
  }
  return DESK_CATEGORIES.map((c) =>
    c.id === "all" ? { ...c, count: questions.length } : { ...c, count: byCat[c.id] ?? 0 }
  );
}

function deskQaFromMentor(params: {
  questionId: string;
  question: string;
  answer: string;
  category: DeskCategory;
}): DeskQA {
  const meta = DESK_CAT_META[params.category];
  const date = new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" });
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
  };
}

export function defaultDeskCategoryForSegment(segment: string): DeskCategory {
  return MENTOR_SEGMENT_TO_DESK_CATEGORY[segment] ?? "career";
}

export async function publishMentorQuestionToDeskChannel(params: {
  questionId: string;
  category: DeskCategory;
  adminUserId: string;
}): Promise<{ deskChannelQaId: string }> {
  const existing = await prisma.mentorQuestion.findUnique({ where: { id: params.questionId } });
  if (!existing) throw new Error("NOT_FOUND");
  if (!existing.isAnswered || !existing.answer) throw new Error("NOT_ANSWERED");
  if (!existing.memberShareOptIn || !existing.mentorShareOptIn) throw new Error("NO_DUAL_CONSENT");
  if (existing.deskChannelStatus === "published") {
    return { deskChannelQaId: existing.deskChannelQaId ?? `mc-${existing.id}` };
  }

  const record = await getContentModuleRecord("desk-channel");
  const resolved = resolveAdminModulePayload("desk-channel", record?.payload) as DeskPayload;
  const defaults = getDefaultPayload("desk-channel") as DeskPayload;
  const questions = [...(resolved.questions?.length ? resolved.questions : defaults.questions ?? DESK_QA)];

  const deskQaId = `mc-${existing.id}`;
  const already = questions.find((q) => q.id === deskQaId);
  if (!already) {
    questions.unshift(
      deskQaFromMentor({
        questionId: existing.id,
        question: existing.question,
        answer: existing.answer,
        category: params.category,
      })
    );
  }

  await updateContentModule(
    "desk-channel",
    {
      payload: {
        ...resolved,
        questions,
        categories: recountCategories(questions),
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
