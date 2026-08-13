import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminClient } from "./admin-client";

export const metadata = { title: "Admin Dashboard" };
export const dynamic = "force-dynamic";

interface AdminPageProps {
  searchParams: Promise<{ tab?: string; track?: string }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const params = await searchParams;

  return (
    <AdminClient
      adminName={session.user.name || "Admin"}
      adminId={session.user.id}
      initialTab={params.tab}
      initialTrack={params.track}
    />
  );
}
