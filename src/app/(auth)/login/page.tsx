import { Suspense } from "react";
import { isGoogleSignInConfigured } from "@/lib/auth";
import { LoginForm } from "./login-form";

const LOGIN_HERO_STATS = ["Industry-Standard", "Your Community"];

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full" />
        </div>
      }
    >
      <LoginForm heroStats={LOGIN_HERO_STATS} googleEnabled={isGoogleSignInConfigured()} />
    </Suspense>
  );
}
