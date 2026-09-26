import { requireSoleAdminPage } from "@/lib/admin-access";
import { AdminClient } from "./admin-client";

export const metadata = { title: "Admin Panel" };
export const dynamic = "force-dynamic";

interface AdminPageProps {
  searchParams: Promise<{ tab?: string; track?: string; slug?: string }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  // Allowlist gate — `User.role` is ignored on purpose.
  const admin = await requireSoleAdminPage();

  const params = await searchParams;

  return (
    <AdminClient
      adminName={admin.user.email.split("@")[0] || "Admin"}
      adminId={admin.user.id}
      initialTab={params.tab}
      initialTrack={params.track}
      initialSlug={params.slug}
    />
  );
}
