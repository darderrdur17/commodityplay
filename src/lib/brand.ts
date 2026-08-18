/** Product name — always displayed with trailing period: CommodityPlay. */
export const BRAND_NAME = "CommodityPlay.";

export const BRAND_LEGAL_NAME = "CommodityPlay. Pte. Ltd.";

export const BRAND_DOMAIN = "commodityplay.com";

export const BRAND_SITE_URL = `https://${BRAND_DOMAIN}`;

export const BRAND_EMAIL_HELLO = `hello@${BRAND_DOMAIN}`;

export const BRAND_EMAIL_SUPPORT = `support@${BRAND_DOMAIN}`;

export const BRAND_EMAIL_LEGAL = `legal@${BRAND_DOMAIN}`;

export const BRAND_EMAIL_PRIVACY = `privacy@${BRAND_DOMAIN}`;

export const BRAND_TAGLINE = "Break in. Move up. Stay sharp.";

export const BRAND_EDITORIAL = `${BRAND_NAME} editorial` as const;

/** Rewrite legacy CommodityPlaybook naming in CMS or copy text. */
export function normalizeBrandReferences(text: string): string {
  return text
    .replace(/Commodity Playbook/g, BRAND_NAME)
    .replace(/CommodityPlaybook/g, "CommodityPlay.")
    .replace(/@commodityplaybook\.com/g, `@${BRAND_DOMAIN}`)
    .replace(/https?:\/\/commodityplaybook\.com/g, BRAND_SITE_URL)
    .replace(/commodityplaybook\.com/g, BRAND_DOMAIN);
}
