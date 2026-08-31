import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

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
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
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
          token.role = dbUser.role;
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

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}
