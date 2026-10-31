import { NextResponse } from "next/server";
import { requireSoleAdmin } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";
import { searchAdminDatabaseUsers } from "@/lib/admin-database";

/**
 * CSV export of the admin people lists.
 *
 * Two scopes, because there are two lists in the admin panel and they are NOT
 * the same set of people:
 *
 *   - `customers` (default) — `isMentor: false`, i.e. the "Customers" tab.
 *   - `members` — everything the Database → Members view shows, INCLUDING
 *     mentors, capped at the same 200 rows and honouring the same `q` search.
 *     It reuses `searchAdminDatabaseUsers`, so the file can never disagree with
 *     the table it was downloaded from.
 *
 * The scope is explicit rather than inferred so a downloaded file always
 * matches the list the admin was looking at.
 *
 * Gated exactly like the other admin routes: `requireSoleAdmin()` returns `null`
 * for anonymous or non-allowlisted callers, and we answer 403. No bespoke auth
 * mechanism is invented here.
 *
 * `Content-Disposition: attachment` makes the browser download the file rather
 * than render it, which is why the admin panel can link to this with a plain
 * anchor.
 */

/**
 * Escape a single CSV field. RFC 4180: a field containing a comma, a double
 * quote, or a line break must be wrapped in double quotes, and any embedded
 * double quote is doubled. A naive `join(",")` corrupts any name or company
 * that contains one of those characters.
 */
function csvEscape(value: unknown): string {
  const text = value == null ? "" : String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/** One CSV record from an ordered list of cell values. */
function csvRow(cells: unknown[]): string {
  return cells.map(csvEscape).join(",");
}

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await requireSoleAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const scope = url.searchParams.get("scope") === "members" ? "members" : "customers";
  const query = url.searchParams.get("q") ?? "";

  // Database → Members: reuse the exact loader the view renders with, so the
  // file matches the table (same 200-row cap, same search filter, mentors
  // included). Only the password *presence* is exported, never the hash.
  if (scope === "members") {
    const rows = await searchAdminDatabaseUsers(query);
    const header = [
      "Name",
      "Email",
      "Company",
      "Country",
      "Role",
      "Tier",
      "Track",
      "Mentor",
      "Has password",
      "Joined",
    ];
    const lines = [
      csvRow(header),
      ...rows.map((row) =>
        csvRow([
          row.name ?? "",
          row.email,
          row.company ?? "",
          row.country ?? "",
          row.role,
          row.tier,
          row.track,
          row.isMentor ? "yes" : "no",
          row.hasPassword ? "yes" : "no",
          row.createdAt.toISOString(),
        ])
      ),
    ];

    return csvResponse(lines, `members-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  const users = await prisma.user.findMany({
    where: { isMentor: false },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      company: true,
      profession: true,
      country: true,
      role: true,
      tier: true,
      track: true,
      persona: true,
      createdAt: true,
    },
  });

  const header = [
    "Name",
    "Email",
    "Company",
    "Profession",
    "Country",
    "Role",
    "Tier",
    "Track",
    "Persona",
    "Joined",
  ];

  const lines = [
    csvRow(header),
    ...users.map((user) =>
      csvRow([
        user.name ?? "",
        user.email,
        user.company ?? "",
        user.profession ?? "",
        user.country ?? "",
        user.role,
        user.tier,
        user.track,
        user.persona ?? "",
        user.createdAt.toISOString(),
      ])
    ),
  ];

  return csvResponse(lines, `customers-${new Date().toISOString().slice(0, 10)}.csv`);
}

/** Build the download response from already-escaped rows. */
function csvResponse(lines: string[], filename: string): NextResponse {
  // CRLF line endings (RFC 4180) and a trailing newline so the last row is
  // terminated — some spreadsheet importers drop an unterminated final line.
  const csv = `${lines.join("\r\n")}\r\n`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
