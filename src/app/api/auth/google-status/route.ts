import { NextResponse } from "next/server";
import { isGoogleSignInConfigured } from "@/lib/auth";

export async function GET() {
  return NextResponse.json({ available: isGoogleSignInConfigured() });
}
