/** Product name — always displayed with trailing period: CommodityPlay. */
export const BRAND_NAME = "CommodityPlay.";

export const BRAND_LEGAL_NAME = "CommodityPlay. Pte. Ltd.";

/** Apex used for public email addresses. The live site is the www host. */
export const BRAND_DOMAIN = "commodityplay.ai";

export const BRAND_SITE_URL = "https://www.commodityplay.ai";

/**
 * The single public contact inbox.
 *
 * On 11 Oct 2026 the owner retired `frances@commodityplay.ai` and
 * `support@commodityplay.ai` as contact addresses and consolidated every
 * support, legal and privacy contact onto this one address, so there is exactly
 * one inbox to monitor. This is the only literal; `BRAND_EMAIL_SUPPORT`,
 * `BRAND_EMAIL_LEGAL` and `BRAND_EMAIL_PRIVACY` all alias it rather than
 * spelling out their own addresses.
 */
export const BRAND_EMAIL_HELLO = `hello@${BRAND_DOMAIN}`;

/** Support contact — aliases {@link BRAND_EMAIL_HELLO} (see note above). */
export const BRAND_EMAIL_SUPPORT = BRAND_EMAIL_HELLO;

/** Legal contact — aliases {@link BRAND_EMAIL_HELLO} (see note above). */
export const BRAND_EMAIL_LEGAL = BRAND_EMAIL_HELLO;

/** Privacy contact — aliases {@link BRAND_EMAIL_HELLO} (see note above). */
export const BRAND_EMAIL_PRIVACY = BRAND_EMAIL_HELLO;

export const BRAND_TAGLINE = "Break in. Move up. Stay sharp.";

export const BRAND_EDITORIAL = `${BRAND_NAME} editorial` as const;

/** Rewrite legacy CommodityPlaybook naming in CMS or copy text. */
export function normalizeBrandReferences(text: string): string {
  return text
    .replace(/Commodity Playbook/g, BRAND_NAME)
    .replace(/CommodityPlaybook/g, "CommodityPlay.")
    .replace(/@commodityplaybook\.com/g, `@${BRAND_DOMAIN}`)
    .replace(/https?:\/\/commodityplaybook\.com/g, BRAND_SITE_URL)
    .replace(/commodityplaybook\.com/g, BRAND_DOMAIN)
    .replace(/https?:\/\/(www\.)?commodityplay\.com/g, BRAND_SITE_URL)
    .replace(/@commodityplay\.com/g, `@${BRAND_DOMAIN}`);
}
