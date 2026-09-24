import { BRAND_EMAIL_SUPPORT } from "@/lib/brand";
import { isAdmin } from "@/lib/utils";

/** Frances's operator inbox — also allowed if her CMS account is not yet marked ADMIN. */
export const INTERNAL_DEMO_EMAILS = [BRAND_EMAIL_SUPPORT.toLowerCase()];

export function canAccessInternalDemo(user?: {
  role?: string | null;
  email?: string | null;
} | null): boolean {
  if (!user) return false;
  if (isAdmin(user.role)) return true;
  const email = user.email?.trim().toLowerCase();
  return Boolean(email && INTERNAL_DEMO_EMAILS.includes(email));
}
