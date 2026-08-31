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
    progress: [{ chapterId: "a", progress: 100, completed: true }],
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
    mentorProfileId: "PT-01",
    progress: [
      { chapterId: "a", progress: 100, completed: true },
      { chapterId: "b", progress: 80, completed: false },
    ],
  },
];

async function seedSalesPrepLibraryForUser(userId: string) {
  const userCreatedTopics = [
    {
      id: "pro-sales-jkm-outreach",
      title: "Timing Outreach Around JKM–TTF Spread Compression",
      category: "CURRENT_EVENT" as const,
      keyPoints: [
        "Three weeks of compression usually means desks are re-evaluating hedge coverage — not just watching",
        "Ask what changed in their cargo optionality before mentioning your coverage",
        "Good opener: reference the move, then ask how they're adjusting nominations",
      ],
      source: "From this week's Market Update",
      prepStatus: "Used it",
      usedInNote: "reopened a cold LNG desk thread",
      createdAt: new Date("2026-08-12"),
    },
    {
      id: "pro-sales-storage-brief",
      title: "European Storage Levels as a Conversation Hook",
      category: "MARKET_MECHANICS" as const,
      keyPoints: [
        "Storage draw pace matters more than the absolute level when desks plan winter coverage",
        "Frame the data around a decision they're likely facing this week, not your product breadth",
        "Pair the number with one follow-up question about their book exposure",
      ],
      source: "From Chapter B",
      prepStatus: "Learning it",
      createdAt: new Date("2026-07-28"),
    },
    {
      id: "pro-sales-credit-desk",
      title: "Re-engaging a Stalled Credit Desk Conversation",
      category: "LOGISTICS" as const,
      keyPoints: [
        "Freight economics is often the angle credit teams care about when physical flow slows",
        "Lead with a specific rate move tied to their corridor, not a generic market recap",
        "Ask what changed in their committee review before pitching anything new",
      ],
      prepStatus: "Ready to use",
      createdAt: new Date("2026-07-05"),
    },
  ];

  for (const topic of userCreatedTopics) {
    await prisma.talkingPoint.upsert({
      where: { id: topic.id },
      update: {
        userId,
        track: "SALES",
        title: topic.title,
        category: topic.category,
        keyPoints: topic.keyPoints,
        source: topic.source ?? null,
        prepStatus: topic.prepStatus,
        usedInNote: topic.usedInNote ?? null,
        canUseFor: null,
        createdAt: topic.createdAt,
      },
      create: {
        id: topic.id,
        userId,
        track: "SALES",
        title: topic.title,
        category: topic.category,
        keyPoints: topic.keyPoints,
        source: topic.source ?? null,
        prepStatus: topic.prepStatus,
        usedInNote: topic.usedInNote ?? null,
        canUseFor: null,
        createdAt: topic.createdAt,
      },
    });
  }
}

async function seedAccountIntelligenceForUser(userId: string) {
  const talkingPointSpecs = [
    {
      id: "opening-with-observation",
      title: "Opening a Meeting with a Market Observation, Not a Pitch",
      category: "OTHER" as const,
      keyPoints: [
        "Lead with something specific from your coverage beat, not your product",
        "Signals you track the market daily, not just when there's something to sell",
        "Good line: reference a number that moved this week before you mention your firm",
      ],
      canUseFor: "Meridian Energy",
      usedInNote: "opened the conversation well",
      prepStatus: "Used it",
      createdAt: new Date("2026-08-15"),
    },
    {
      id: "spread-move-framing",
      title: "Framing a Spread Move in a Client Conversation",
      category: "CURRENT_EVENT" as const,
      keyPoints: [
        "JKM–TTF has compressed 3 weeks straight – good opener with LNG-exposed accounts",
        "Ask how they're adjusting hedge coverage, don't just report the number",
      ],
      source: "From this week's Market Update",
      canUseFor: "Northbridge Gas",
      usedInNote: "used to explain the hedge angle",
      prepStatus: "Used it",
      createdAt: new Date("2026-08-10"),
    },
    {
      id: "freight-costs-conversation",
      title: "Talking About Freight Costs Without Sounding Like a Pitch",
      category: "LOGISTICS" as const,
      keyPoints: [
        "Freight cost is a real input to their cargo economics – frame it as their P&L problem, not your data point",
        "Tie a rate spike to a specific decision they're likely facing this week",
      ],
      source: "From Chapter B",
      canUseFor: "Solace Trade Finance",
      usedInNote: "used to re-open a stalled conversation",
      prepStatus: "Used it",
      createdAt: new Date("2026-07-22"),
    },
    {
      id: "desk-priorities-stress",
      title: "Reading Desk Priorities From Recent Market Stress",
      category: "RISK_PRICING" as const,
      keyPoints: [
        "Desks lean harder on external intelligence when signals disagree, not when they agree",
        "A volatile week is the moment to ask what's keeping them up at night, not to pitch a feature",
      ],
      source: "From Chapter D",
      canUseFor: "Halcyon Resources",
      usedInNote: "used during initial scoping call",
      prepStatus: "Used it",
      createdAt: new Date("2026-07-08"),
    },
    {
      id: "vendor-data-turning-points",
      title: "Why Vendor Data Matters More at Turning Points",
      category: "OTHER" as const,
      keyPoints: [
        "Don't list what you cover – describe a decision your coverage has helped a desk make",
        "Specificity beats breadth in this conversation every time",
      ],
      canUseFor: "Northbridge Gas",
      usedInNote: "helped explain timing of outreach",
      prepStatus: "Used it",
      createdAt: new Date("2026-06-04"),
    },
  ];

  for (const topic of talkingPointSpecs) {
    await prisma.talkingPoint.upsert({
      where: { id: topic.id },
      update: {
        userId,
        track: "SALES",
        title: topic.title,
        category: topic.category,
        keyPoints: topic.keyPoints,
        source: topic.source ?? null,
        prepStatus: topic.prepStatus,
        usedInNote: topic.usedInNote ?? null,
        canUseFor: topic.canUseFor ?? null,
        createdAt: topic.createdAt,
      },
      create: {
        id: topic.id,
        userId,
        track: "SALES",
        title: topic.title,
        category: topic.category,
        keyPoints: topic.keyPoints,
        source: topic.source ?? null,
        prepStatus: topic.prepStatus,
        usedInNote: topic.usedInNote ?? null,
        canUseFor: topic.canUseFor ?? null,
        createdAt: topic.createdAt,
      },
    });
  }

  const accountSpecs = [
    {
      name: "Meridian Energy",
      deskType: "LNG · Trading desk",
      status: "ACTIVE_DISCUSSION" as const,
      notes:
        "Strong interest in JKM coverage — wants to see how we frame spread moves before their Q3 hedge review.",
      lastTouch: "2 weeks ago",
      nextStep: "Follow-up call Thu",
      bookmarks: [
        { sourceType: "PREP_LIBRARY" as const, sourceId: "opening-with-observation", sourceTitle: "Opening a Meeting with a Market Observation, Not a Pitch" },
        { sourceType: "MARKET_NUDGE" as const, sourceId: "jkm-ttf-spread", sourceTitle: "JKM—TTF spread compressed sharply this week" },
      ],
    },
    {
      name: "Northbridge Gas",
      deskType: "Gas · Physical trading",
      status: "FIRST_CONTACT" as const,
      notes:
        "Intro call went well — desk lead asked for something specific on European storage before next meeting.",
      lastTouch: "1 week ago",
      nextStep: "Send storage brief",
      bookmarks: [
        { sourceType: "PREP_LIBRARY" as const, sourceId: "spread-move-framing", sourceTitle: "Framing a Spread Move in a Client Conversation" },
        { sourceType: "PREP_LIBRARY" as const, sourceId: "vendor-data-turning-points", sourceTitle: "Why Vendor Data Matters More at Turning Points" },
        { sourceType: "MARKET_NUDGE" as const, sourceId: "jkm-ttf-spread", sourceTitle: "JKM—TTF spread compressed sharply this week" },
      ],
    },
    {
      name: "Solace Trade Finance",
      deskType: "Trade finance · Credit desk",
      status: "STALLED" as const,
      notes:
        "Conversation paused after credit committee review — freight economics is the angle to reopen.",
      lastTouch: "3 weeks ago",
      nextStep: "Re-engage with VLCC note",
      bookmarks: [
        { sourceType: "PREP_LIBRARY" as const, sourceId: "freight-costs-conversation", sourceTitle: "Talking About Freight Costs Without Sounding Like a Pitch" },
        { sourceType: "MARKET_NUDGE" as const, sourceId: "vlcc-rates-spike", sourceTitle: "Gulf Coast VLCC rates spiked on an unplanned outage" },
      ],
    },
    {
      name: "Halcyon Resources",
      deskType: "Base metals · Procurement",
      status: "RESEARCHING" as const,
      notes:
        "Early scoping — procurement team mapping vendor landscape before any formal RFP.",
      lastTouch: "5 days ago",
      nextStep: "Desk priorities follow-up",
      bookmarks: [
        { sourceType: "PREP_LIBRARY" as const, sourceId: "desk-priorities-stress", sourceTitle: "Reading Desk Priorities From Recent Market Stress" },
      ],
    },
  ];

  for (const spec of accountSpecs) {
    const existing = await prisma.trackedAccount.findFirst({
      where: { userId, name: spec.name },
    });

    const account =
      existing ??
      (await prisma.trackedAccount.create({
        data: {
          userId,
          name: spec.name,
          deskType: spec.deskType,
          status: spec.status,
          notes: spec.notes,
          lastTouch: spec.lastTouch,
          nextStep: spec.nextStep,
        },
      }));

    if (existing) {
      await prisma.trackedAccount.update({
        where: { id: existing.id },
        data: {
          deskType: spec.deskType,
          status: spec.status,
          notes: spec.notes,
          lastTouch: spec.lastTouch,
          nextStep: spec.nextStep,
        },
      });
    }

    for (const bookmark of spec.bookmarks) {
      await prisma.accountBookmark.upsert({
        where: {
          userId_accountId_sourceType_sourceId: {
            userId,
            accountId: account.id,
            sourceType: bookmark.sourceType,
            sourceId: bookmark.sourceId,
          },
        },
        update: { sourceTitle: bookmark.sourceTitle },
        create: {
          userId,
          accountId: account.id,
          sourceType: bookmark.sourceType,
          sourceId: bookmark.sourceId,
          sourceTitle: bookmark.sourceTitle,
        },
      });
    }
  }
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  console.log("🌱 Seeding demo accounts...\n");

  for (const account of DEMO_ACCOUNTS) {
    const { progress, ...userData } = account as typeof account & {
      progress?: { chapterId: string; progress: number; completed: boolean }[];
      isMentor?: boolean;
      company?: string | null;
      mentorProfileId?: string | null;
    };
    const isMentor = userData.isMentor ?? false;
    const company = userData.company ?? null;
    const mentorProfileId = userData.mentorProfileId ?? null;

    const resumePersonaDone =
      userData.track === "CAREER" && userData.tier !== "STARTER";

    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        name: userData.name,
        passwordHash,
        role: userData.role,
        tier: userData.tier,
        track: userData.track,
        persona: userData.persona,
        resumePersonaDone,
        onboardingDone: true,
        mentorCredits: userData.mentorCredits,
        resumeCredits: userData.resumeCredits,
        stripeStatus: userData.tier === "STARTER" ? "inactive" : "active",
        isMentor,
        company,
        mentorProfileId,
      },
      create: {
        email: userData.email,
        name: userData.name,
        passwordHash,
        role: userData.role,
        tier: userData.tier,
        track: userData.track,
        persona: userData.persona,
        resumePersonaDone,
        onboardingDone: true,
        mentorCredits: userData.mentorCredits,
        resumeCredits: userData.resumeCredits,
        stripeStatus: userData.tier === "STARTER" ? "inactive" : "active",
        isMentor,
        company,
        mentorProfileId,
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
    memberShareOptIn: boolean;
    mentorShareOptIn: boolean;
  }[] = [
    {
      memberEmail: "elite.insider@demo.com",
      segment: "physical-trading",
      question:
        "What's the most realistic path to break into physical crude trading from a mid-office role? What skills should I prioritize in the next 6 months?",
      answer: null,
      isAnswered: false,
      memberShareOptIn: false,
      mentorShareOptIn: false,
    },
    {
      memberEmail: "pro.switcher@demo.com",
      segment: "finance",
      question:
        "I'm transitioning from banking into a commodity risk role. How do I talk about VaR limits and stress scenarios without sounding like I only know the textbook version?",
      answer:
        "Anchor every risk example to a real limit breach or near-miss you saw in banking — then map it to how a desk uses limits intraday. Hiring managers want judgment under constraint, not model recitation.",
      isAnswered: true,
      memberShareOptIn: true,
      mentorShareOptIn: true,
    },
    {
      memberEmail: "pro.analyst@demo.com",
      segment: "analytics",
      question:
        "What's the best way to show market views on a resume when my current role is purely quantitative research with no P&L ownership?",
      answer: null,
      isAnswered: false,
      memberShareOptIn: false,
      mentorShareOptIn: false,
    },
    {
      memberEmail: "elite.vendor@demo.com",
      segment: "sales",
      question:
        "I sell market data into commodity desks. How do I ask discovery questions that prove I understand their workflow without over-selling on the first call?",
      answer:
        "Open with one workflow question tied to their book — e.g. how they reconcile AIS arrivals vs. nominations — and listen for the pain in handoffs. Credibility comes from naming the operational step, not the product feature.",
      isAnswered: true,
      memberShareOptIn: true,
      mentorShareOptIn: false,
    },
    {
      memberEmail: "pro.switcher@demo.com",
      segment: "operations",
      question:
        "Moving from logistics coordinator to scheduling analyst — what does 'good' look like in the first 90 days on a refined products desk?",
      answer: null,
      isAnswered: false,
      memberShareOptIn: true,
      mentorShareOptIn: false,
    },
    {
      memberEmail: "elite.insider@demo.com",
      segment: "analytics",
      question:
        "How should an insider position themselves for a move from mid-office reporting into a commercial analyst seat on an LNG desk?",
      answer:
        "Own one recurring report the traders actually read — then propose one commercial insight per month tied to cargo optionality or netback. You're not asking for a seat; you're already doing 30% of the job.",
      isAnswered: true,
      memberShareOptIn: false,
      mentorShareOptIn: false,
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
          memberShareOptIn: sample.memberShareOptIn,
          mentorShareOptIn: sample.mentorShareOptIn,
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

  const proVendor = await prisma.user.findUnique({ where: { email: "pro.vendor@demo.com" } });
  if (proVendor) {
    await seedSalesPrepLibraryForUser(proVendor.id);
    console.log("  ✓ Sales Prep Library demo data seeded for pro.vendor@demo.com");
  }

  const eliteVendor = await prisma.user.findUnique({ where: { email: "elite.vendor@demo.com" } });
  if (eliteVendor) {
    await seedAccountIntelligenceForUser(eliteVendor.id);
    console.log("  ✓ Account Intelligence demo data seeded for elite.vendor@demo.com");
  }

  const { ensureFeedbackDemoUsers } = await import("../src/lib/feedback-demo-users");
  await ensureFeedbackDemoUsers(prisma);
  console.log("  ✓ Feedback demo users patched (Maya, Chris, Jamie)");

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
