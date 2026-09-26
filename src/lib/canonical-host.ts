/** Public site members should use. Vercel *.vercel.app aliases redirect here. */
export const CANONICAL_PUBLIC_HOST = "www.commodityplay.ai";

/** Production Vercel aliases that must not stay as a second public site. */
export const BLOCKED_VERCEL_ALIASES = [
  "commodityplay.vercel.app",
  "commodity-playbook-app.vercel.app",
] as const;

export function isBlockedVercelAlias(host: string | null | undefined): boolean {
  const normalized = host?.split(":")[0]?.toLowerCase() ?? "";
  return (BLOCKED_VERCEL_ALIASES as readonly string[]).includes(normalized);
}

export function canonicalPublicUrl(requestUrl: string): URL {
  const url = new URL(requestUrl);
  url.protocol = "https:";
  url.hostname = CANONICAL_PUBLIC_HOST;
  url.port = "";
  return url;
}
