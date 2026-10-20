import { NextResponse } from "next/server";
import { requireSoleAdmin } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

/**
 * CSV export of the customer list — the same rows the admin "Customers" tab
 * shows (`isMentor: false`).
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

export async function GET() {
  const admin = await requireSoleAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

  // CRLF line endings (RFC 4180) and a trailing newline so the last row is
  // terminated — some spreadsheet importers drop an unterminated final line.
  const csv = `${lines.join("\r\n")}\r\n`;
  const filename = `customers-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
