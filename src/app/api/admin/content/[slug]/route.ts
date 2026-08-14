import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  getContentModuleRecord,
  resetContentModule,
  updateContentModule,
} from "@/lib/content/repository";
import { getModuleMeta } from "@/lib/content/modules";
import { parseLandingContentPayload, formatLandingValidationErrors } from "@/lib/content/landing-schema";
import { parseFaqContentPayload, formatFaqValidationErrors } from "@/lib/content/faq-schema";
import { z } from "zod";
import type { Tier } from "@prisma/client";

const updateSchema = z.object({
  payload: z.unknown().optional(),
  requiredTier: z.enum(["STARTER", "PRO", "ELITE"]).optional(),
  published: z.boolean().optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  reset: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { slug } = await params;
  if (!getModuleMeta(slug)) {
    return NextResponse.json({ error: "Unknown module" }, { status: 404 });
  }

  const record = await getContentModuleRecord(slug);
  return NextResponse.json(record);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { slug } = await params;
  if (!getModuleMeta(slug)) {
    return NextResponse.json({ error: "Unknown module" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.reset) {
    const row = await resetContentModule(slug, session.user.id);
    return NextResponse.json({ ok: true, version: row.version });
  }

  if (parsed.data.payload !== undefined) {
    try {
      JSON.stringify(parsed.data.payload);
    } catch {
      return NextResponse.json({ error: "Payload must be JSON-serializable" }, { status: 400 });
    }

    if (slug === "landing") {
      const landingValidation = parseLandingContentPayload(parsed.data.payload);
      if (!landingValidation.success) {
        return NextResponse.json(
          {
            error: "Invalid landing content",
            details: formatLandingValidationErrors(landingValidation),
          },
          { status: 400 }
        );
      }
      parsed.data.payload = landingValidation.data;
    }

    if (slug === "faq") {
      const faqValidation = parseFaqContentPayload(parsed.data.payload);
      if (!faqValidation.success) {
        return NextResponse.json(
          {
            error: "Invalid FAQ content",
            details: formatFaqValidationErrors(faqValidation),
          },
          { status: 400 }
        );
      }
      parsed.data.payload = faqValidation.data;
    }
  }

  const row = await updateContentModule(
    slug,
    {
      payload: parsed.data.payload,
      requiredTier: parsed.data.requiredTier as Tier | undefined,
      published: parsed.data.published,
      title: parsed.data.title,
      description: parsed.data.description,
    },
    session.user.id
  );

  return NextResponse.json({
    ok: true,
    slug: row.slug,
    version: row.version,
    updatedAt: row.updatedAt.toISOString(),
  });
}
