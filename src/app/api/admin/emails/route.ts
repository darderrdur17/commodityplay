import { NextResponse } from "next/server";
import { assertSoleAdmin } from "@/lib/admin-access";
import { listDemoEmails, demoEmailKindLabel } from "@/lib/demo-email-log";
import { extractHirerReplyUrlFromLog } from "@/lib/job-chat";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await assertSoleAdmin();
  if (denied) return denied;

  const emails = await listDemoEmails(25);
  return NextResponse.json(
    emails.map((e) => ({
      id: e.id,
      kind: e.kind,
      kindLabel: demoEmailKindLabel(e.kind),
      to: e.to,
      subject: e.subject,
      bodyText: e.bodyText,
      delivered: e.delivered,
      createdAt: e.createdAt.toISOString(),
      hirerReplyUrl: extractHirerReplyUrlFromLog(e.bodyText),
    }))
  );
}
