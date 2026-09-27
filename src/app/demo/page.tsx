import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { isAdminEmail, requireSoleAdminPage } from "@/lib/admin-access";
import { isDemoAccountEmail, isProductionRuntime } from "@/lib/demo-guard";
import { DemoSwitcher } from "./demo-switcher";

export const dynamic = "force-dynamic";

/**
 * Gate for the internal demo switcher.
 *
 * In production only the allowlisted operator may reach it — demo accounts are
 * refused at sign-in anyway, so this page would otherwise be an unauthenticated
 * map of every seeded inbox and the shared password. Outside production an
 * allowlisted operator or a demo account itself may open it.
 *
 * Refusals render as 404: a 403 or a redirect would confirm that the surface
 * exists and that the caller is excluded from it.
 */
export default async function DemoPage() {
  if (isProductionRuntime()) {
    await requireSoleAdminPage();
    return <DemoSwitcher />;
  }

  const session = await auth();
  const email = session?.user?.email ?? null;
  if (!email) notFound();

  const allowed = isAdminEmail(email) || isDemoAccountEmail(email);
  if (!allowed) notFound();

  return <DemoSwitcher />;
}
