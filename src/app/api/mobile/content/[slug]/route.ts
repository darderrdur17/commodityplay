import { NextRequest, NextResponse } from "next/server";
import {
  getCareerRoles,
  getCaseStudiesList,
  getCaseStudyBySlug,
  getDeskChannelData,
  getGlossaryTerms,
  getInterviewQuestionsData,
  getJobOpeningsData,
  getKnowledgeTestQuestions,
  getPlaybookChapters,
  getResumeTemplateAssetUrls,
  getResumeTemplatesData,
} from "@/lib/content/accessors";
import type { ContentSlug } from "@/lib/content/modules";
import { getModuleMeta } from "@/lib/content/modules";
import { getPublishedPayload } from "@/lib/content/repository";
import { resolvePlaybookPayload } from "@/lib/content/playbook-payload";
import { requireMobileContentAccess } from "@/lib/mobile-content";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Handler = (req: NextRequest) => Promise<NextResponse>;

const HANDLERS: Partial<Record<ContentSlug, Handler>> = {
  glossary: async () => {
    const terms = await getGlossaryTerms();
    return NextResponse.json({ terms });
  },
  playbook: async () => {
    const chapters = await getPlaybookChapters();
    const payload = await getPublishedPayload<unknown>("playbook");
    const resolved = resolvePlaybookPayload(payload);
    return NextResponse.json({
      chapters,
      sections: resolved.sections,
    });
  },
  "resume-templates": async () => {
    const [data, assetUrls] = await Promise.all([
      getResumeTemplatesData(),
      getResumeTemplateAssetUrls(),
    ]);
    return NextResponse.json({ ...data, assetUrls });
  },
  "career-roadmap": async () => {
    const roles = await getCareerRoles();
    return NextResponse.json({ roles });
  },
  "interview-questions": async () => {
    const data = await getInterviewQuestionsData();
    return NextResponse.json(data);
  },
  "knowledge-test": async () => {
    const questions = await getKnowledgeTestQuestions();
    return NextResponse.json({ questions });
  },
  "case-studies": async (req) => {
    const detailSlug = req.nextUrl.searchParams.get("detail");
    if (detailSlug) {
      const study = await getCaseStudyBySlug(detailSlug);
      if (!study) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(study);
    }
    const studies = await getCaseStudiesList();
    return NextResponse.json({ studies });
  },
  "desk-channel": async () => {
    const data = await getDeskChannelData();
    return NextResponse.json(data);
  },
  "job-openings": async () => {
    const data = await getJobOpeningsData();
    return NextResponse.json(data);
  },
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!getModuleMeta(slug)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const access = await requireMobileContentAccess(req, slug);
  if (access.error) return access.error;

  const handler = HANDLERS[slug as ContentSlug];
  if (!handler) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const response = await handler(req);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
