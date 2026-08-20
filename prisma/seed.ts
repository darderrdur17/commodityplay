import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Demo1234!";

const DEMO_ACCOUNTS = [
  {
    email: "admin@demo.com",
    name: "Admin User",
    role: "ADMIN" as const,
    tier: "ELITE" as const,
    track: "CAREER" as const,
    persona: "INSIDER" as const,
    mentorCredits: 10,
    resumeCredits: 10,
  },
  {
    email: "starter.fresh@demo.com",
    name: "Maya Tan (Starter)",
    role: "USER" as const,
    tier: "STARTER" as const,
    track: "CAREER" as const,
    persona: "FRESH_GRAD" as const,
    mentorCredits: 0,
    resumeCredits: 0,
  },
  {
    email: "starter.vendor@demo.com",
    name: "Chris Lim (Starter)",
    role: "USER" as const,
    tier: "STARTER" as const,
    track: "SALES" as const,
    persona: "VENDOR" as const,
    mentorCredits: 0,
    resumeCredits: 0,
  },
  {
    email: "pro.vendor@demo.com",
    name: "Jamie Chen (Pro – Sales)",
    role: "USER" as const,
    tier: "PRO" as const,
    track: "SALES" as const,
    persona: "VENDOR" as const,
    mentorCredits: 0,
    resumeCredits: 2,
  },
  {
    email: "pro.switcher@demo.com",
    name: "Sarah Wong (Pro)",
    role: "USER" as const,
    tier: "PRO" as const,
    track: "CAREER" as const,
    persona: "CAREER_SWITCHER" as const,
    mentorCredits: 0,
    resumeCredits: 3,
  },
  {
    email: "pro.analyst@demo.com",
    name: "James Park (Pro)",
    role: "USER" as const,
    tier: "PRO" as const,
    track: "CAREER" as const,
    persona: "ANALYST_TRADER" as const,
    mentorCredits: 0,
    resumeCredits: 2,
    progress: [
      { chapterId: "a", progress: 100, completed: true },
      { chapterId: "b", progress: 45, completed: false },
    ],
  },
  {
    email: "elite.insider@demo.com",
    name: "Priya Sharma (Elite)",
    role: "USER" as const,
    tier: "ELITE" as const,
    track: "CAREER" as const,
    persona: "INSIDER" as const,
    mentorCredits: 3,
    resumeCredits: 5,
    progress: [
      { chapterId: "a", progress: 100, completed: true },
      { chapterId: "b", progress: 100, completed: true },
      { chapterId: "c", progress: 60, completed: false },
    ],
  },
  {
    email: "elite.vendor@demo.com",
    name: "Marcus Lee (Elite)",
    role: "USER" as const,
    tier: "ELITE" as const,
    track: "SALES" as const,
    persona: "VENDOR" as const,
    mentorCredits: 2,
    resumeCredits: 3,
    progress: [
      { chapterId: "a", progress: 100, completed: true },
    ],
  },
  {
    email: "elite.mentor@demo.com",
    name: "Raj Patel (Mentor)",
    role: "USER" as const,
    tier: "ELITE" as const,
    track: "CAREER" as const,
    persona: "INSIDER" as const,
    mentorCredits: 5,
    resumeCredits: 4,
    isMentor: true,
    company: "Vitol",
    progress: [
      { chapterId: "a", progress: 100, completed: true },
      { chapterId: "b", progress: 80, completed: false },
    ],
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  console.log("🌱 Seeding demo accounts...\n");

  for (const account of DEMO_ACCOUNTS) {
    const { progress, ...userData } = account as typeof account & {
      progress?: { chapterId: string; progress: number; completed: boolean }[];
      isMentor?: boolean;
      company?: string | null;
    };
    const isMentor = userData.isMentor ?? false;
    const company = userData.company ?? null;

    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        name: userData.name,
        passwordHash,
        role: userData.role,
        tier: userData.tier,
        track: userData.track,
        persona: userData.persona,
        onboardingDone: true,
        mentorCredits: userData.mentorCredits,
        resumeCredits: userData.resumeCredits,
        stripeStatus: userData.tier === "STARTER" ? "inactive" : "active",
        isMentor,
        company,
      },
      create: {
        email: userData.email,
        name: userData.name,
        passwordHash,
        role: userData.role,
        tier: userData.tier,
        track: userData.track,
        persona: userData.persona,
        onboardingDone: true,
        mentorCredits: userData.mentorCredits,
        resumeCredits: userData.resumeCredits,
        stripeStatus: userData.tier === "STARTER" ? "inactive" : "active",
        isMentor,
        company,
      },
    });

    if (progress?.length) {
      for (const p of progress) {
        await prisma.chapterProgress.upsert({
          where: { userId_chapterId: { userId: user.id, chapterId: p.chapterId } },
          update: { progress: p.progress, completed: p.completed },
          create: {
            userId: user.id,
            chapterId: p.chapterId,
            progress: p.progress,
            completed: p.completed,
            ...(p.completed && { completedAt: new Date() }),
          },
        });
      }
    }

    console.log(`  ✓ ${userData.email} (${userData.role} · ${userData.tier} · ${userData.persona})`);
  }

  // Member requests for mentor inbox demo (from other accounts — not the mentor user)
  const memberRequestSamples: {
    memberEmail: string;
    segment: string;
    question: string;
    answer: string | null;
    isAnswered: boolean;
    isPublic: boolean;
  }[] = [
    {
      memberEmail: "elite.insider@demo.com",
      segment: "physical-trading",
      question:
        "What's the most realistic path to break into physical crude trading from a mid-office role? What skills should I prioritize in the next 6 months?",
      answer: null,
      isAnswered: false,
      isPublic: false,
    },
    {
      memberEmail: "pro.switcher@demo.com",
      segment: "finance",
      question:
        "I'm transitioning from banking into a commodity risk role. How do I talk about VaR limits and stress scenarios without sounding like I only know the textbook version?",
      answer:
        "Anchor every risk example to a real limit breach or near-miss you saw in banking — then map it to how a desk uses limits intraday. Hiring managers want judgment under constraint, not model recitation.",
      isAnswered: true,
      isPublic: true,
    },
    {
      memberEmail: "pro.analyst@demo.com",
      segment: "analytics",
      question:
        "What's the best way to show market views on a resume when my current role is purely quantitative research with no P&L ownership?",
      answer: null,
      isAnswered: false,
      isPublic: false,
    },
    {
      memberEmail: "elite.vendor@demo.com",
      segment: "sales",
      question:
        "I sell market data into commodity desks. How do I ask discovery questions that prove I understand their workflow without over-selling on the first call?",
      answer:
        "Open with one workflow question tied to their book — e.g. how they reconcile AIS arrivals vs. nominations — and listen for the pain in handoffs. Credibility comes from naming the operational step, not the product feature.",
      isAnswered: true,
      isPublic: true,
    },
    {
      memberEmail: "pro.switcher@demo.com",
      segment: "operations",
      question:
        "Moving from logistics coordinator to scheduling analyst — what does 'good' look like in the first 90 days on a refined products desk?",
      answer: null,
      isAnswered: false,
      isPublic: false,
    },
    {
      memberEmail: "elite.insider@demo.com",
      segment: "analytics",
      question:
        "How should an insider position themselves for a move from mid-office reporting into a commercial analyst seat on an LNG desk?",
      answer:
        "Own one recurring report the traders actually read — then propose one commercial insight per month tied to cargo optionality or netback. You're not asking for a seat; you're already doing 30% of the job.",
      isAnswered: true,
      isPublic: false,
    },
  ];

  for (const sample of memberRequestSamples) {
    const member = await prisma.user.findUnique({ where: { email: sample.memberEmail } });
    if (!member) continue;

    const exists = await prisma.mentorQuestion.findFirst({
      where: { userId: member.id, question: sample.question },
    });
    if (!exists) {
      await prisma.mentorQuestion.create({
        data: {
          userId: member.id,
          segment: sample.segment,
          question: sample.question,
          answer: sample.answer,
          isAnswered: sample.isAnswered,
          isPublic: sample.isPublic,
          ...(sample.isAnswered && { answeredAt: new Date() }),
        },
      });
    }
  }
  console.log("  ✓ Mentor inbox member requests seeded");

  // Remove legacy samples where the mentor demo user was the asker
  const mentorDemo = await prisma.user.findUnique({ where: { email: "elite.mentor@demo.com" } });
  if (mentorDemo) {
    await prisma.mentorQuestion.deleteMany({ where: { userId: mentorDemo.id } });
  }

  // Sample waitlist entry
  await prisma.jobWaitlistEntry.upsert({
    where: { email: "waitlist.demo@example.com" },
    update: {},
    create: {
      email: "waitlist.demo@example.com",
      name: "Demo Waitlist User",
      track: "CAREER",
      gdprOpt: true,
    },
  });
  console.log("  ✓ Sample waitlist entry created");

  const { seedContentModulesIfEmpty, syncGlossaryFromDefaults } = await import(
    "../src/lib/content/repository"
  );
  const contentResult = await seedContentModulesIfEmpty();
  if (contentResult.seeded) {
    console.log(`  ✓ Seeded ${contentResult.count} content modules`);
  }
  const glossarySync = await syncGlossaryFromDefaults();
  console.log(`  ✓ Glossary synced (${glossarySync.termCount} terms, trader explanations)`);

  const { syncResumeTemplateAssets } = await import("../src/lib/content/resume-template-seed");
  const resumeSync = await syncResumeTemplateAssets();
  console.log(
    `  ✓ Resume templates synced (${resumeSync.synced}/${resumeSync.total} .docx files${resumeSync.missing ? `, ${resumeSync.missing} missing from shared folder` : ""})`
  );

  const { seedContentAssetsIfMissing } = await import("./seed-assets");
  const assetResult = await seedContentAssetsIfMissing();
  console.log(
    `  ✓ Content assets: ${assetResult.created} created, ${assetResult.skipped} existing (${assetResult.total} expected)`
  );

  console.log(`\n✅ Done! All accounts use password: ${DEMO_PASSWORD}`);
  console.log("   Try them at http://localhost:3000/demo\n");
}

export async function seedDatabase() {
  await main();
}

if (require.main === module) {
  seedDatabase()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
