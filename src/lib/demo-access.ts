import { BRAND_EMAIL_SUPPORT } from "@/lib/brand";
import { isAdmin } from "@/lib/utils";

/** Frances's live login — she opens /demo with this email, then switches into Maya/Chris/etc. */
export const FRANCES_DEMO_LOGIN_EMAIL = "francestho@gmail.com";

/** Extra operator inboxes that may also open the internal demo switcher. */
export const INTERNAL_DEMO_EMAILS = [
  FRANCES_DEMO_LOGIN_EMAIL,
  BRAND_EMAIL_SUPPORT.toLowerCase(),
];

export function canAccessInternalDemo(user?: {
  role?: string | null;
  email?: string | null;
} | null): boolean {
  if (!user) return false;
  if (isAdmin(user.role)) return true;
  const email = user.email?.trim().toLowerCase();
  return Boolean(email && INTERNAL_DEMO_EMAILS.includes(email));
}
