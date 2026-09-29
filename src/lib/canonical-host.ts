/** Public site members should use. Every other host redirects here. */
export const CANONICAL_PUBLIC_HOST = "www.commodityplay.ai";

/**
 * Hosts that must never serve as a second public site.
 *
 * `commodityplay.ai` is the APEX. Vercel's "Primary Domain" setting redirects it
 * at the edge, but that is dashboard state which can drift — and while the apex
 * `A` record pointed at GoDaddy parking, nothing in the app rejected the bare
 * host either. Listing it here means the app itself refuses to render a
 * duplicate site, so `CANONICAL_PUBLIC_HOST` stays truthful regardless of
 * dashboard configuration.
 *
 * The two `*.vercel.app` entries are the deployment's own hostnames.
 *
 * `www.commodityplay.ai` must NEVER be added here — it is the canonical host,
 * and matching it would produce a redirect loop.
 */
export const NON_CANONICAL_HOSTS = [
  "commodityplay.ai",
  "commodityplay.vercel.app",
  "commodity-playbook-app.vercel.app",
] as const;

/**
 * True when `host` is a non-canonical host that must be redirected.
 *
 * Strips the port and a trailing FQDN dot, so `commodityplay.ai:443` and
 * `commodityplay.ai.` both match.
 *
 * Never pass `req.nextUrl.hostname`: on Vercel that is the deployment's internal
 * hostname, not the host the visitor typed. See the note in `src/proxy.ts`.
 */
export function isNonCanonicalHost(host: string | null | undefined): boolean {
  const normalized = host?.split(":")[0]?.replace(/\.$/, "").toLowerCase() ?? "";
  return (NON_CANONICAL_HOSTS as readonly string[]).includes(normalized);
}

export function canonicalPublicUrl(requestUrl: string): URL {
  const url = new URL(requestUrl);
  url.protocol = "https:";
  url.hostname = CANONICAL_PUBLIC_HOST;
  url.port = "";
  return url;
}
