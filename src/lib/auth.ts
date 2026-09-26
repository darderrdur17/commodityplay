import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { isAdminEmail, normalizeEmail, requireSoleAdmin } from "@/lib/admin-access";
import { isDemoAccountEmail, isProductionRuntime } from "@/lib/demo-guard";
import { RATE_LIMITS, checkRateLimit, getClientIp, rateLimitKey } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

/**
 * A real bcrypt hash of a throwaway string, used to equalise the cost of the
 * "no such account" and "wrong password" branches. See `authorize()` below.
 */
const DUMMY_PASSWORD_HASH = "$2a$12$dJtHRrHeskhRbdk2lfp.G.imGUJX3xSCEYEQsbTAuG3Bx1djU8bti";

export function isGoogleSignInConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  // 7 days instead of the 30-day default: a shorter window shrinks the blast
  // radius of an issued token whose email has since left the admin allowlist.
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
  },
  providers: [
    ...(isGoogleSignInConfigured()
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        // Emails are stored lowercased, so every lookup must be normalised or
        // `Foo@X.com` would silently miss the account it belongs to.
        const email = normalizeEmail(parsed.data.email);

        // 5 attempts / 15 min per (ip + email). Refusal is reported as a generic
        // credential failure so it cannot be used to probe for accounts.
        const limit = checkRateLimit(
          rateLimitKey("login", getClientIp(request), email),
          RATE_LIMITS.login
        );
        if (!limit.allowed) {
          console.warn("[auth] credentials sign-in rate limited");
          return null;
        }

        // Seeded demo inboxes carry a publicly documented password. They may
        // only authenticate outside production. The failure below is the same
        // generic failure as a bad password — a distinct "demo disabled" message
        // would confirm that the account exists.
        if (isProductionRuntime() && isDemoAccountEmail(email)) {
          return null;
        }

        // Reconcile the schema before touching `User`. `findUnique` below has no
        // `select`, so Prisma returns every scalar field and the emitted SQL
        // includes `"tokenVersion"`. If that column is missing the query throws
        // and sign-in breaks for every member, so this must run first.
        //
        // Imported lazily on purpose: `auth.ts` is pulled into the Edge
        // middleware bundle via `src/proxy.ts`, and `setup-database` reaches
        // into Prisma and the seed script. Loading it only when a credentials
        // sign-in actually executes keeps it out of that bundle.
        const { ensureCoreInfrastructure } = await import("@/lib/setup-database");
        await ensureCoreInfrastructure();

        const user = await prisma.user.findUnique({ where: { email } });

        // Always spend exactly one bcrypt comparison. Returning early when the
        // account is missing (or has no password) made "no such user" measurably
        // faster than "wrong password" — a timing oracle for enumeration.
        const passwordHash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
        const valid = await bcrypt.compare(parsed.data.password, passwordHash);
        if (!user || !user.passwordHash || !valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          tier: user.tier,
          track: user.track,
          persona: user.persona,
          onboardingDone: user.onboardingDone,
          isMentor: user.isMentor,
        };
      },
    }),
  ],
  callbacks: {
    /**
     * Provider-wide demo lockdown.
     *
     * `authorize()` above only guards the credentials provider, so a @demo.com
     * address could still arrive through Google OAuth (or any provider added
     * later). Refusing here closes the gap for every sign-in path at once.
     */
    async signIn({ user }) {
      if (isProductionRuntime() && isDemoAccountEmail(user.email)) {
        return false;
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        // Derive the role from the email allowlist, not from the writable
        // `User.role` column. This keeps every client-side `role` check in the
        // nav, landing page and dashboard consistent with the real invariant.
        token.role = isAdminEmail(user.email) ? "ADMIN" : "USER";
        token.tier = user.tier;
        token.track = user.track;
        token.persona = user.persona;
        token.onboardingDone = user.onboardingDone;
        token.isMentor = user.isMentor;
      }

      if (trigger === "update" && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            email: true,
            role: true,
            tier: true,
            track: true,
            persona: true,
            onboardingDone: true,
            isMentor: true,
          },
        });
        if (dbUser) {
          token.email = dbUser.email;
          // Same allowlist-derived role as the initial block above, so a session
          // refresh cannot reintroduce a stale database role into the token.
          token.role = isAdminEmail(dbUser.email) ? "ADMIN" : "USER";
          token.tier = dbUser.tier;
          token.track = dbUser.track;
          token.persona = dbUser.persona;
          token.onboardingDone = dbUser.onboardingDone;
          token.isMentor = dbUser.isMentor;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "USER" | "ADMIN";
        session.user.tier = token.tier as "STARTER" | "PRO" | "ELITE";
        session.user.track = token.track as "CAREER" | "SALES";
        session.user.persona = (token.persona as string | null | undefined) ?? null;
        session.user.onboardingDone = Boolean(token.onboardingDone);
        session.user.isMentor = Boolean(token.isMentor);
      }
      return session;
    },
  },
});

/**
 * @deprecated Kept only so the existing call sites keep compiling; the body now
 * delegates to {@link requireSoleAdmin} in `src/lib/admin-access.ts`.
 *
 * Authority comes from the `ADMIN_EMAILS` allowlist, not from `User.role`, so
 * flipping a row's role to ADMIN no longer grants anything. Reverting this one
 * function restores the previous role-based behaviour.
 */
export async function requireAdmin() {
  return requireSoleAdmin();
}
