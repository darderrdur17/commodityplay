import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { requireSoleAdmin } from "@/lib/admin-access";
import {
  getContentModuleRecord,
  hasContentModuleRevision,
  resetContentModule,
  revertContentModuleToPrevious,
  updateContentModule,
} from "@/lib/content/repository";
import { getModuleMeta } from "@/lib/content/modules";
import { prepareLandingContentForSave, formatLandingValidationErrors } from "@/lib/content/landing-schema";
import { prepareFaqContentForSave, formatFaqValidationErrors } from "@/lib/content/faq-schema";
import {
  parseMemberDashboardPayload,
  formatMemberDashboardValidationErrors,
} from "@/lib/content/member-dashboard-schema";
import {
  parseSalesMarketNudgesPayload,
  formatSalesMarketNudgesValidationErrors,
} from "@/lib/content/sales-market-nudges-schema";
import {
  parseAccountIntelligencePayload,
  formatAccountIntelligenceValidationErrors,
} from "@/lib/content/account-intelligence-schema";
import {
  parseMentorConnectPayload,
  formatMentorConnectValidationErrors,
  normalizeMentorConnectPayload,
} from "@/lib/content/mentor-connect-schema";
import {
  prepareSiteFooterForSave,
  formatSiteFooterValidationErrors,
} from "@/lib/content/footer-schema";
import { z } from "zod";
import type { Tier } from "@prisma/client";

const updateSchema = z.object({
  payload: z.unknown().optional(),
  requiredTier: z.enum(["STARTER", "PRO", "ELITE"]).optional(),
  published: z.boolean().optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  reset: z.boolean().optional(),
  revertToPrevious: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const admin = await requireSoleAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { slug } = await params;
  if (!getModuleMeta(slug)) {
    return NextResponse.json({ error: "Unknown module" }, { status: 404 });
  }

  const record = await getContentModuleRecord(slug);
  const canRevert = await hasContentModuleRevision(slug);
  return NextResponse.json({ ...record, canRevert });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const admin = await requireSoleAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
    const row = await resetContentModule(slug, admin.user.id);
    if (slug === "landing") {
      revalidatePath("/");
      revalidatePath("/mentor-connect");
    }
    if (slug === "mentor-connect") {
      revalidatePath("/mentor-connect");
      revalidatePath("/mentor-apply");
    }
    return NextResponse.json({ ok: true, version: row.version, canRevert: await hasContentModuleRevision(slug) });
  }

  if (parsed.data.revertToPrevious) {
    try {
      const previousVersion = (await getContentModuleRecord(slug))?.version ?? 0;
      const row = await revertContentModuleToPrevious(slug, admin.user.id);
      if (slug === "landing") {
        revalidatePath("/");
        revalidatePath("/mentor-connect");
      }
      if (slug === "mentor-connect") {
        revalidatePath("/mentor-connect");
        revalidatePath("/mentor-apply");
      }
      return NextResponse.json({
        ok: true,
        version: row.version,
        revertedTo: previousVersion - 1,
        canRevert: await hasContentModuleRevision(slug),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Revert failed";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  if (parsed.data.payload !== undefined) {
    try {
      JSON.stringify(parsed.data.payload);
    } catch {
      return NextResponse.json({ error: "Payload must be JSON-serializable" }, { status: 400 });
    }

    if (slug === "landing") {
      const landingValidation = prepareLandingContentForSave(parsed.data.payload);
      if (!landingValidation.success) {
        return NextResponse.json(
          {
            error: "Invalid landing content",
            details: formatLandingValidationErrors(landingValidation),
          },
          { status: 400 }
        );
      }
      const raw = parsed.data.payload as Record<string, unknown>;
      parsed.data.payload = {
        ...raw,
        ...landingValidation.data,
      };
    }

    if (slug === "faq") {
      const faqValidation = prepareFaqContentForSave(parsed.data.payload);
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

    if (slug === "member-dashboard") {
      const dashboardValidation = parseMemberDashboardPayload(parsed.data.payload);
      if (!dashboardValidation.success) {
        return NextResponse.json(
          {
            error: "Invalid member dashboard content",
            details: formatMemberDashboardValidationErrors(dashboardValidation),
          },
          { status: 400 }
        );
      }
      parsed.data.payload = dashboardValidation.data;
    }

    if (slug === "sales-market-nudges") {
      const nudgesValidation = parseSalesMarketNudgesPayload(parsed.data.payload);
      if (!nudgesValidation.success) {
        return NextResponse.json(
          {
            error: "Invalid sales market nudges content",
            details: formatSalesMarketNudgesValidationErrors(nudgesValidation),
          },
          { status: 400 }
        );
      }
      parsed.data.payload = nudgesValidation.data;
    }

    if (slug === "account-intelligence") {
      const aiValidation = parseAccountIntelligencePayload(parsed.data.payload);
      if (!aiValidation.success) {
        return NextResponse.json(
          {
            error: "Invalid account intelligence content",
            details: formatAccountIntelligenceValidationErrors(aiValidation),
          },
          { status: 400 }
        );
      }
      parsed.data.payload = aiValidation.data;
    }

    if (slug === "mentor-connect") {
      const mentorValidation = parseMentorConnectPayload(parsed.data.payload);
      if (!mentorValidation.success) {
        return NextResponse.json(
          {
            error: "Invalid mentor connect content",
            details: formatMentorConnectValidationErrors(mentorValidation),
          },
          { status: 400 }
        );
      }
      parsed.data.payload = normalizeMentorConnectPayload(parsed.data.payload);
    }

    if (slug === "site-footer") {
      const footerValidation = prepareSiteFooterForSave(parsed.data.payload);
      if (!footerValidation.success) {
        return NextResponse.json(
          {
            error: "Invalid site footer content",
            details: formatSiteFooterValidationErrors(footerValidation),
          },
          { status: 400 }
        );
      }
      parsed.data.payload = footerValidation.data;
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
    admin.user.id
  );

  if (slug === "landing") {
    revalidatePath("/", "page");
    revalidatePath("/mentor-connect", "page");
  }
  if (slug === "member-dashboard") {
    revalidatePath("/dashboard", "page");
  }
  if (slug === "account-intelligence") {
    revalidatePath("/dashboard/account-intelligence", "page");
  }
  if (slug === "mentor-connect") {
    revalidatePath("/mentor-connect", "page");
    revalidatePath("/mentor-apply", "page");
  }
  if (slug === "site-footer") {
    revalidatePath("/", "layout");
    revalidatePath("/privacy", "page");
    revalidatePath("/terms", "page");
  }
  if (slug === "library") {
    revalidatePath("/library", "page");
    revalidatePath("/dashboard", "page");
  }
  if (slug === "desk-channel") {
    revalidatePath("/desk-channel", "page");
  }
  if (slug === "job-openings") {
    revalidatePath("/job-openings", "page");
  }
  if (slug === "starter-pack") {
    revalidatePath("/starter-pack", "page");
    revalidatePath("/dashboard", "page");
  }
  if (slug === "playbook") {
    revalidatePath("/playbook", "layout");
  }
  if (slug === "interview-questions") {
    revalidatePath("/interview-questions", "page");
  }
  if (slug === "knowledge-test") {
    revalidatePath("/knowledge-test", "page");
  }

  return NextResponse.json({
    ok: true,
    slug: row.slug,
    version: row.version,
    updatedAt: row.updatedAt.toISOString(),
    canRevert: await hasContentModuleRevision(slug),
  });
}
