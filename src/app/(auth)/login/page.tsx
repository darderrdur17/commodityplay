import { Suspense } from "react";
import { getContentStats } from "@/lib/content/content-stats";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const { mentorCount } = await getContentStats();
  const heroStats = ["2400+ Members", `${mentorCount} Mentors`, "Industry-Standard"];

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full" />
        </div>
      }
    >
      <LoginForm heroStats={heroStats} />
    </Suspense>
  );
}
