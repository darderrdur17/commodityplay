import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Database } from "lucide-react";
import { auth } from "@/lib/auth";
import { getAdminDatabaseTableCounts, searchAdminDatabaseUsers } from "@/lib/admin-database";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Database" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminDatabasePage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/admin/database");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const q = (await searchParams).q?.trim() ?? "";
  const [tables, users] = await Promise.all([
    getAdminDatabaseTableCounts(),
    searchAdminDatabaseUsers(q),
  ]);

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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold">Database</h1>
              <p className="text-white/70 text-sm">
                Live Prisma tables. Passwords are stored as hashes and are not shown.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="page-container py-6 sm:py-8 space-y-8">
        <section className="bg-white rounded-xl border border-border p-4 sm:p-5">
          <h2 className="font-serif text-lg font-bold text-gray-900 mb-3">Table counts</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {tables.map((table) => (
              <div key={table.model} className="rounded-lg border border-border px-3 py-2">
                <p className="text-xs text-muted-fg">{table.model}</p>
                <p className="font-serif text-xl font-bold text-gray-900">
                  {table.count === null ? "—" : table.count}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-border p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="font-serif text-lg font-bold text-gray-900">Users</h2>
              <p className="text-sm text-muted-fg">
                Search by name or email. Showing {users.length}
                {users.length === 200 ? " (first 200)" : ""} {q ? `for “${q}”` : "accounts"}.
              </p>
            </div>
            <form action="/admin/database" method="get" className="flex gap-2">
              <input
                name="q"
                defaultValue={q}
                placeholder="frances@…"
                className="min-w-[220px] px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
              <Button type="submit" size="sm">
                Search
              </Button>
            </form>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-fg border-b border-border">
                  <th className="py-2 pr-3 font-semibold">Email</th>
                  <th className="py-2 pr-3 font-semibold">Name</th>
                  <th className="py-2 pr-3 font-semibold">Role</th>
                  <th className="py-2 pr-3 font-semibold">Tier</th>
                  <th className="py-2 pr-3 font-semibold">Track</th>
                  <th className="py-2 pr-3 font-semibold">Password</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border/70">
                    <td className="py-2 pr-3 font-medium text-gray-900">{user.email}</td>
                    <td className="py-2 pr-3 text-gray-700">{user.name || "—"}</td>
                    <td className="py-2 pr-3">{user.role}</td>
                    <td className="py-2 pr-3">{user.tier}</td>
                    <td className="py-2 pr-3">{user.track}</td>
                    <td className="py-2 pr-3">{user.hasPassword ? "Set (hashed)" : "Not set"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <p className="text-sm text-muted-fg mt-4">No users match that search.</p>
          )}
        </section>
      </div>
    </div>
  );
}
