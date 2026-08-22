import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "USER" | "ADMIN";
      tier: "STARTER" | "PRO" | "ELITE";
      track: "CAREER" | "SALES";
      persona: string | null;
      onboardingDone: boolean;
      isMentor: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: "USER" | "ADMIN";
    tier?: "STARTER" | "PRO" | "ELITE";
    track?: "CAREER" | "SALES";
    persona?: string | null;
    onboardingDone?: boolean;
    isMentor?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "USER" | "ADMIN";
    tier?: "STARTER" | "PRO" | "ELITE";
    track?: "CAREER" | "SALES";
    persona?: string | null;
    onboardingDone?: boolean;
    isMentor?: boolean;
  }
}
