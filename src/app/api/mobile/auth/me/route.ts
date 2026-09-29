import { NextRequest, NextResponse } from "next/server";
import { getMobileUser } from "@/lib/mobile-auth";
import { resolveAccessTier } from "@/lib/entitlements";

export async function GET(req: NextRequest) {
  const user = await getMobileUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // `user.tier` is the STORED billing column. Every authorisation decision on the
  // server already goes through `hasResolvedAccess()`, which applies the
  // `ADMIN_EMAILS` administrator override — so an allowlisted admin can stream
  // paid content. But the app gates its own UI on the `tier` in this response, so
  // returning the raw column told an admin they were STARTER and locked them out
  // of the paid surfaces on mobile while the web app let them straight in.
  //
  // Resolve it here so mobile and web agree. `storedTier` is returned alongside
  // so a client can still distinguish "paid for Elite" from "administrator".
  return NextResponse.json({
    user: {
      ...user,
      tier: resolveAccessTier(user),
      storedTier: user.tier,
    },
  });
}
