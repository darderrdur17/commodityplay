import type { ReactNode } from "react";
import { requireSoleAdminPage } from "@/lib/admin-access";

export const dynamic = "force-dynamic";

/**
 * Single gate for every /admin/* surface.
 *
 * Refused callers get a 404 (never a redirect or 403): a 403 confirms both that
 * the admin surface exists and that the caller is excluded from it, while a 404
 * discloses nothing.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireSoleAdminPage();
  return <>{children}</>;
}
