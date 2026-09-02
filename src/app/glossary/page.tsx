import { getGlossaryPageContent, getGlossaryTerms } from "@/lib/content/accessors";
export const dynamic = "force-dynamic";
export const revalidate = 0;
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { GlossaryClient } from "./glossary-client";

export const metadata = { title: "Desk Glossary" };

export default async function GlossaryPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signup?plan=starter&callbackUrl=/glossary");
  }

  const [terms, pageContent] = await Promise.all([getGlossaryTerms(), getGlossaryPageContent()]);
  return (
    <GlossaryClient
      terms={terms}
      persona={session.user.persona ?? null}
      hero={pageContent.hero}
      upgradeCta={pageContent.upgradeCta}
    />
  );
}
