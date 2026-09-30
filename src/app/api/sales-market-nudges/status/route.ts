import { NextResponse } from "next/server";
import { requireProSession } from "@/lib/prep-library-auth";

export async function GET() {
  const gate = await requireProSession();
  if ("error" in gate) return gate.error;
  return NextResponse.json({ statuses: {} });
}

export async function PUT() {
  return NextResponse.json(
    { error: "Member status updates are disabled. Admin manages nudge status." },
    { status: 410 }
  );
}
