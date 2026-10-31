import { NextResponse } from "next/server";

/**
 * JSON 404 for any unmatched `/api/*` path.
 *
 * WHY THIS EXISTS: without it, `GET /api/does-not-exist` fell through to the root
 * not-found page and returned the branded **HTML** document. Any client doing
 * `fetch(url).json()` then dies on a parse error instead of reading a usable error
 * payload, which makes a wrong URL look like a server fault.
 *
 * Specific routes always win over a catch-all, so this only ever sees paths that
 * match nothing else. `api/auth/[...nextauth]` is unaffected: Next resolves the
 * deeper, more specific segment first.
 *
 * Every verb answers the same way — a POST to an unknown API path is still "no such
 * endpoint", not a 405, and a 405 body would also have to be JSON to be useful.
 */
export const dynamic = "force-dynamic";

function notFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export {
  notFound as GET,
  notFound as POST,
  notFound as PUT,
  notFound as PATCH,
  notFound as DELETE,
  notFound as HEAD,
  notFound as OPTIONS,
};
