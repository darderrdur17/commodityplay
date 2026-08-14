/** Career landing pricing anchors — replaces standalone /pricing page */
export const CAREER_PRICING_HREF = "/?track=career#pricing";
export const CAREER_PLAN_HREF = (plan: "pro" | "elite") => `/?track=career#plan-${plan}`;

/** Sales landing pricing anchors */
export const SALES_PRICING_HREF = "/?track=sales#pricing";
export const SALES_PLAN_HREF = (plan: "pro" | "elite") => `/?track=sales#plan-${plan}`;

/** Path-only URLs for server redirects and signup callbacks (hash applied client-side) */
export const CAREER_PRICING_PATH = "/?track=career";
export const SALES_PRICING_PATH = "/?track=sales";
