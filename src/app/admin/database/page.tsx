import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Database } from "lucide-react";
import { auth } from "@/lib/auth";
import {
  getAdminDatabaseTableCounts,
  prepareAdminDatabase,
  searchAdminDatabaseContacts,
  searchAdminDatabaseSubscribers,
  searchAdminDatabaseUsers,
  type AdminDatabaseTableCount,
} from "@/lib/admin-database";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const metadata = { title: "Database" };
export const dynamic = "force-dynamic";

const VIEWS = [
  { id: "overview", label: "Overview" },
  { id: "members", label: "Members" },
  { id: "newsletter", label: "Newsletter" },
  { id: "messages", label: "Contact Us" },
] as const;

type ViewId = (typeof VIEWS)[number]["id"];

interface PageProps {
  searchParams: Promise<{ q?: string; view?: string }>;
}

function tierVariant(tier: string): "starter" | "pro" | "elite" | "secondary" {
  if (tier === "STARTER") return "starter";
  if (tier === "PRO") return "pro";
  if (tier === "ELITE") return "elite";
  return "secondary";
}

function viewHref(view: ViewId, q: string) {
  const params = new URLSearchParams();
  if (view !== "overview") params.set("view", view);
  if (q) params.set("q", q);
  const query = params.toString();
  return query ? `/admin/database?${query}` : "/admin/database";
}

function CountGrid({ tables }: { tables: AdminDatabaseTableCount[] }) {
  const groups = ["Accounts", "Content", "Leads", "Activity"] as const;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {groups.map((group) => (
        <section key={group} className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-secondary">
            <h2 className="text-sm font-semibold text-gray-900">{group}</h2>
          </div>
          <ul className="divide-y divide-border">
            {tables
              .filter((table) => table.group === group)
              .map((table) => (
                <li key={table.model} className="flex items-center justify-between px-4 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{table.label}</p>
                    <p className="text-xs text-muted-fg">{table.model}</p>
                  </div>
                  <p className="font-serif text-lg font-bold text-gray-900">
                    {table.count === null ? "Unavailable" : table.count}
                  </p>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default async function AdminDatabasePage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/admin/database");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const view = (VIEWS.some((item) => item.id === params.view) ? params.view : "overview") as ViewId;

  await prepareAdminDatabase();
  const [tables, users, subscribers, contacts] = await Promise.all([
    getAdminDatabaseTableCounts(),
    searchAdminDatabaseUsers(q),
    searchAdminDatabaseSubscribers(q),
    searchAdminDatabaseContacts(q),
  ]);

  const missing = tables.filter((table) => table.count === null);
  const memberCount = tables.find((table) => table.model === "User")?.count ?? users.length;

  return (
    <div className="min-h-screen bg-secondary">
      <div className="bg-primary-800 text-white">
        <div className="page-container py-6 sm:py-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Admin Panel
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-bold">Database</h1>
                <p className="text-white/70 text-sm">
                  Supported viewer for members, newsletter signups, and Contact Us. Passwords stay hashed.
                </p>
              </div>
            </div>
            <Badge variant="dark">{memberCount} members</Badge>
          </div>
        </div>
      </div>

      <div className="page-container py-6 sm:py-8 space-y-6">
        {missing.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {missing.length} table{missing.length === 1 ? "" : "s"} could not be read after schema repair.
            Try refresh. If this stays, the live database still needs a schema sync.
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {VIEWS.map((item) => (
            <Link
              key={item.id}
              href={viewHref(item.id, q)}
              className={cn(
                "inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                view === item.id
                  ? "bg-primary-400 text-white"
                  : "bg-white text-muted-fg border border-border hover:border-primary-line"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {view !== "overview" && (
          <form action="/admin/database" method="get" className="flex flex-col sm:flex-row gap-2">
            <input type="hidden" name="view" value={view} />
            <input
              name="q"
              defaultValue={q}
              placeholder={
                view === "members"
                  ? "Search name, email, or company"
                  : view === "newsletter"
                    ? "Search newsletter email"
                    : "Search Contact Us name, email, or message"
              }
              className="flex-1 px-3 py-2 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
            <Button type="submit">Search</Button>
          </form>
        )}

        {view === "overview" && <CountGrid tables={tables} />}

        {view === "members" && (
          <section className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-secondary">
              <p className="text-sm text-muted-fg">
                Showing {users.length}
                {users.length === 200 ? " of first 200" : ""} {q ? `matching “${q}”` : "members"}. Edit a person from
                Customers if you need to change tier or role.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[880px]">
                <thead>
                  <tr className="border-b border-border bg-secondary text-left">
                    <th className="px-4 py-3 font-semibold text-muted-fg">Member</th>
                    <th className="px-4 py-3 font-semibold text-muted-fg">Role</th>
                    <th className="px-4 py-3 font-semibold text-muted-fg">Tier</th>
                    <th className="px-4 py-3 font-semibold text-muted-fg">Track</th>
                    <th className="px-4 py-3 font-semibold text-muted-fg">Password</th>
                    <th className="px-4 py-3 font-semibold text-muted-fg">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-fg">
                        No members match that search.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="border-b border-border hover:bg-secondary/50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{user.name || "Unnamed"}</p>
                          <p className="text-xs text-muted-fg">{user.email}</p>
                          {user.company && <p className="text-xs text-muted-fg">{user.company}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={user.role === "ADMIN" ? "danger" : "outline"}>{user.role}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={tierVariant(user.tier)}>{user.tier}</Badge>
                        </td>
                        <td className="px-4 py-3">{user.track}</td>
                        <td className="px-4 py-3">{user.hasPassword ? "Set" : "Not set"}</td>
                        <td className="px-4 py-3 text-muted-fg">{formatDate(user.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {view === "newsletter" && (
          <section className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-secondary">
              <p className="text-sm text-muted-fg">
                Showing {subscribers.length}
                {subscribers.length === 200 ? " of first 200" : ""} newsletter rows.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="border-b border-border bg-secondary text-left">
                    <th className="px-4 py-3 font-semibold text-muted-fg">Email</th>
                    <th className="px-4 py-3 font-semibold text-muted-fg">Name</th>
                    <th className="px-4 py-3 font-semibold text-muted-fg">Source</th>
                    <th className="px-4 py-3 font-semibold text-muted-fg">Status</th>
                    <th className="px-4 py-3 font-semibold text-muted-fg">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-fg">
                        No newsletter signups match that search.
                      </td>
                    </tr>
                  ) : (
                    subscribers.map((row) => (
                      <tr key={row.id} className="border-b border-border hover:bg-secondary/50">
                        <td className="px-4 py-3 font-medium text-gray-900">{row.email}</td>
                        <td className="px-4 py-3">{row.name || "—"}</td>
                        <td className="px-4 py-3 text-muted-fg">{row.source || "—"}</td>
                        <td className="px-4 py-3">
                          <Badge variant={row.subscribed ? "success" : "secondary"}>
                            {row.subscribed ? "Subscribed" : "Unsubscribed"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-fg">{formatDate(row.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {view === "messages" && (
          <section className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-secondary">
              <p className="text-sm text-muted-fg">
                Showing {contacts.length}
                {contacts.length === 100 ? " of first 100" : ""} Contact Us messages.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="border-b border-border bg-secondary text-left">
                    <th className="px-4 py-3 font-semibold text-muted-fg">From</th>
                    <th className="px-4 py-3 font-semibold text-muted-fg">Message</th>
                    <th className="px-4 py-3 font-semibold text-muted-fg">Received</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-muted-fg">
                        No Contact Us messages match that search.
                      </td>
                    </tr>
                  ) : (
                    contacts.map((row) => (
                      <tr key={row.id} className="border-b border-border hover:bg-secondary/50 align-top">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{row.name}</p>
                          <p className="text-xs text-muted-fg">{row.email}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-700 whitespace-pre-wrap">{row.message}</td>
                        <td className="px-4 py-3 text-muted-fg whitespace-nowrap">{formatDate(row.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
