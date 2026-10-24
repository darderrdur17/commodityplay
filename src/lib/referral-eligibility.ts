/**
 * Referral eligibility — decided from the member's EMAIL DOMAIN.
 *
 * The product rule (agreed with the owner): university and corporate accounts are
 * eligible for a referral code; consumer mailboxes are not; everything else is
 * rejected. There is no account-type column on `User` and none is being added —
 * the domain already carries the information, and deriving it keeps a member from
 * self-declaring "corporate" at signup to unlock a discount.
 *
 * This module is deliberately PURE: no Prisma, no React, no `process.env`. That is
 * what lets `scripts/verify-feedback-changes.ts` exercise every rule directly.
 *
 * ⚠️ Server-side only in practice. The UI may hide the input for an ineligible
 * member, but that is presentation — `/api/referral/validate` and
 * `/api/stripe/checkout` both re-derive eligibility from the stored email. Never
 * trust a client-supplied "eligible" flag.
 */

/** The three buckets a member's email domain can fall into. */
export type ReferralAccountType = "UNIVERSITY" | "CORPORATE" | "PERSONAL";

/**
 * Consumer mailbox providers. A domain here is ALWAYS `PERSONAL`, even when it
 * looks academic at a glance, so the list is checked before the university rules.
 *
 * Kept as data (not a regex) so it can be asserted and extended in one place.
 */
export const CONSUMER_EMAIL_DOMAINS: readonly string[] = [
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "hotmail.co.uk",
  "live.com",
  "msn.com",
  "yahoo.com",
  "yahoo.co.uk",
  "ymail.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "proton.me",
  "protonmail.com",
  "pm.me",
  "aol.com",
  "gmx.com",
  "gmx.net",
  "mail.com",
  "zoho.com",
  "yandex.com",
  "fastmail.com",
  "qq.com",
  "163.com",
  "126.com",
  "sina.com",
  "foxmail.com",
  "naver.com",
];

/**
 * Academic suffixes. Each entry starts with the dot so a plain
 * `domain.endsWith(suffix)` cannot match a lookalike such as `notedu` — and so
 * subdomains (`mail.ac.uk`, `student.edu.sg`) are covered for free.
 *
 * `.edu.sg` is the important one: this product is Singapore-based, so NUS / NTU /
 * SMU addresses are the single most likely cohort to hold a referral code.
 */
export const UNIVERSITY_DOMAIN_SUFFIXES: readonly string[] = [
  ".edu",
  ".edu.sg",
  ".edu.au",
  ".edu.my",
  ".edu.hk",
  ".edu.cn",
  ".edu.tw",
  ".edu.in",
  ".edu.pk",
  ".edu.ph",
  ".ac.uk",
  ".ac.nz",
  ".ac.jp",
  ".ac.id",
  ".ac.kr",
  ".ac.th",
  ".ac.in",
  ".ac.za",
];

/**
 * Generic `.edu.<cc>` / `.ac.<cc>` for any two-letter country code, so a country
 * missing from the explicit list above still classifies correctly. The explicit
 * list is still worth keeping: it documents the cases we actually expect and is
 * what the tests assert against.
 */
const UNIVERSITY_COUNTRY_PATTERN = /\.(?:edu|ac)\.[a-z]{2}$/;

/**
 * Extract the lowercased domain from an email address.
 *
 * @returns the domain, or `null` when the input cannot be read as `local@domain`.
 */
function extractDomain(email: string): string | null {
  if (typeof email !== "string") return null;

  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");

  // Reject a missing `@`, an empty local part, or more than one `@`.
  if (at <= 0 || at !== trimmed.indexOf("@")) return null;

  const domain = trimmed.slice(at + 1);
  // An empty domain, or one with no dot, cannot belong to a real organisation.
  if (!domain || !domain.includes(".")) return null;

  return domain;
}

/** True when `domain` is (or is a subdomain of) a consumer mailbox provider. */
function isConsumerDomain(domain: string): boolean {
  return CONSUMER_EMAIL_DOMAINS.some(
    (entry) => domain === entry || domain.endsWith(`.${entry}`)
  );
}

/** True when `domain` is (or is a subdomain of) an academic domain. */
function isUniversityDomain(domain: string): boolean {
  if (UNIVERSITY_COUNTRY_PATTERN.test(domain)) return true;

  return UNIVERSITY_DOMAIN_SUFFIXES.some(
    (suffix) => domain === suffix.slice(1) || domain.endsWith(suffix)
  );
}

/**
 * Classify a member's account from their email address.
 *
 * Order matters:
 *   1. consumer mailbox -> PERSONAL (checked first, so `mail.gmail.com` cannot
 *      fall through and be read as a corporate domain)
 *   2. academic suffix  -> UNIVERSITY
 *   3. anything else    -> CORPORATE
 *
 * A malformed address is `PERSONAL` — fail closed, never eligible.
 */
export function classifyReferralAccount(email: string): ReferralAccountType {
  const domain = extractDomain(email);
  if (!domain) return "PERSONAL";
  if (isConsumerDomain(domain)) return "PERSONAL";
  if (isUniversityDomain(domain)) return "UNIVERSITY";
  return "CORPORATE";
}

/** True when this member is allowed to redeem a referral code at all. */
export function isReferralEligible(email: string): boolean {
  const accountType = classifyReferralAccount(email);
  return accountType === "UNIVERSITY" || accountType === "CORPORATE";
}
