import { z } from "zod";
import {
  DEFAULT_DESK_CHANNEL_PAGE_COPY,
  mergeDeskChannelPageCopy,
  type DeskChannelPageCopy,
} from "@/data/desk-channel-content";

const heroSchema = z.object({
  badge: z.string().min(1).max(120),
  headline: z.string().min(1).max(200),
  headlineAccent: z.string().max(200),
  description: z.string().min(1).max(800),
  searchPlaceholder: z.string().min(1).max(200),
});

const submitSchema = z.object({
  eyebrow: z.string().min(1).max(80),
  headline: z.string().min(1).max(200),
  headlineAccent: z.string().max(200),
  description: z.string().min(1).max(800),
  bullets: z.array(z.string().min(1).max(300)).min(1).max(6),
  formTitle: z.string().min(1).max(120),
  formSubtitle: z.string().min(1).max(200),
  formButton: z.string().min(1).max(80),
  formHref: z.string().min(1).max(200),
});

export const deskChannelPageCopySchema = z.object({
  hero: heroSchema,
  submit: submitSchema,
});

export function normalizeDeskChannelPageCopy(payload: unknown): DeskChannelPageCopy {
  const partial = payload as Partial<DeskChannelPageCopy> | null;
  const parsed = deskChannelPageCopySchema.safeParse(partial?.hero && partial?.submit ? partial : null);
  if (parsed.success) return parsed.data;
  return mergeDeskChannelPageCopy(partial ?? undefined, DEFAULT_DESK_CHANNEL_PAGE_COPY);
}
