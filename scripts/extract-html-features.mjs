/**
 * Extract interview bank, mentors, career extras, resume quiz from shared HTML.
 * Run: node scripts/extract-html-features.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { readContentFile } from "./content-sources.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "src", "data");

function read(rel) {
  return readContentFile(rel);
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

/** Safely evaluate a JS array literal from HTML (build script only). */
function evalJsArray(html, constName) {
  const re = new RegExp(`const\\s+${constName}\\s*=\\s*\\[`);
  const match = re.exec(html);
  if (!match) throw new Error(`Missing const ${constName}`);
  const arrStart = match.index + match[0].length - 1;
  let depth = 0;
  let inString = false;
  let stringChar = "";
  let escaped = false;

  for (let i = arrStart; i < html.length; i++) {
    const ch = html[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === stringChar) inString = false;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inString = true;
      stringChar = ch;
      continue;
    }
    if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (depth === 0) {
        const expr = html.slice(arrStart, i + 1);
        // eslint-disable-next-line no-eval
        return eval(`(${expr})`);
      }
    }
  }
  throw new Error(`Could not parse array ${constName}`);
}

function extractInterviewBank() {
  const html = read("Pro Pack/pro_pack_interview_question_bank.html");
  const technical = evalJsArray(html, "TECHNICAL");
  const commercial = evalJsArray(html, "COMMERCIAL");
  const behavioural = evalJsArray(html, "BEHAVIOURAL");
  const elimination = evalJsArray(html, "ELIMINATION");

  const questions = [];
  let n = 0;

  for (const q of technical) {
    n++;
    questions.push({
      id: `iv-t-${String(n).padStart(2, "0")}`,
      tab: "technical",
      category: q.topic,
      difficulty: q.diff,
      question: q.q,
      modelAnswer: q.answer,
      framework: q.framework || undefined,
      interviewTip: q.framework || undefined,
    });
  }
  for (const q of commercial) {
    n++;
    questions.push({
      id: `iv-c-${String(n).padStart(2, "0")}`,
      tab: "commercial",
      category: "Commercial judgement",
      question: q.q,
      modelAnswer: q.answer,
      framework: q.framework || undefined,
      interviewTip: q.framework || undefined,
    });
  }
  for (const q of behavioural) {
    n++;
    questions.push({
      id: `iv-b-${String(n).padStart(2, "0")}`,
      tab: "behavioural",
      category: "Behavioural",
      question: q.q,
      modelAnswer: q.answer,
    });
  }
  for (const q of elimination) {
    n++;
    questions.push({
      id: `iv-e-${String(n).padStart(2, "0")}`,
      tab: "elimination",
      category: q.firm,
      question: q.q,
      modelAnswer: q.strong,
      weakAnswer: q.weak,
      why: q.why,
    });
  }

  return {
    questions,
    tabs: [
      { id: "technical", label: "Technical", count: technical.length },
      { id: "commercial", label: "Commercial judgement", count: commercial.length },
      { id: "behavioural", label: "Behavioural", count: behavioural.length },
      { id: "elimination", label: "Elimination questions", count: elimination.length },
    ],
  };
}

function extractMentors() {
  const html = read("Elite Pack/mentor_connect_page.html");
  const segments = evalJsArray(html, "SEGMENTS");
  return segments.map((seg) => ({
    id: seg.id,
    num: seg.num,
    title: seg.title,
    blurb: seg.blurb,
    mentors: seg.mentors.map((m) => ({
      id: m.id,
      years: m.years,
      headline: m.headline,
      bio: m.bio,
      tags: m.tags,
      sampleReply: m.reply,
    })),
  }));
}

function extractCareerExtras() {
  const html = read("Pro Pack/3.Career Roadmap/career-roadmap.html");
  const matrixRows = [];
  const rowRe =
    /<tr><td>([^<]+)<\/td><td><span class="dpill[^"]*">([^<]+)<\/span><\/td><td>([^<]+)<\/td><td>([^<]+)<\/td><td>([^<]+)<\/td><\/tr>/g;
  let m;
  while ((m = rowRe.exec(html))) {
    matrixRows.push({
      role: m[1].replace(/&amp;/g, "&"),
      difficulty: m[2],
      category: m[3],
      pathToDesk: m[4],
      keySkills: m[5],
    });
  }

  const timeline = [];
  const tlRe =
    /<div class="tl-quarter">([^<]+)<\/div>\s*<div class="tl-title">([^<]+)<\/div>\s*<ul class="tl-list">([\s\S]*?)<\/ul>/g;
  while ((m = tlRe.exec(html))) {
    const items = [];
    const liRe = /<li>([\s\S]*?)<\/li>/g;
    let li;
    while ((li = liRe.exec(m[3]))) {
      items.push(li[1].replace(/&amp;/g, "&").trim());
    }
    timeline.push({ quarter: m[1], title: m[2], items });
  }

  return { functionMatrix: matrixRows, timeline12Month: timeline };
}

function extractResumeExtras() {
  const html = read(
    "Pro Pack/2.Persona Analysis Quiz_Resume Templates/commodity-playbook-resume.html"
  );

  const quizSteps = [
    {
      id: "q1",
      question: "Where is your career right now?",
      sub: "Choose the option that best describes your current professional situation.",
      options: [
        { value: "switcher", label: "I work in a related field — finance, consulting, engineering, or O&G — and want to move into commodity trading" },
        { value: "insider", label: "I already work inside a commodity trading firm — in operations, scheduling, ETRM, or a support function" },
        { value: "analyst", label: "I work in analytics, quant, or data science and want to move toward a trading or commercial role" },
        { value: "vendor", label: "I work at a vendor firm selling data, intelligence, or services to the commodity trading community" },
        { value: "fresh_grad", label: "I am a student, fresh graduate, or early in my career with limited professional experience" },
      ],
      scores: { switcher: "switcher", insider: "insider", analyst: "analyst", vendor: "vendor", fresh_grad: "fresh_grad" },
    },
    {
      id: "q2",
      question: "How many years of professional experience do you have?",
      sub: "Include all relevant work experience, including internships longer than 3 months.",
      options: [
        { value: "0-1", label: "0 – 1 year", sub: "Student, fresh graduate, or very early career" },
        { value: "1-3", label: "1 – 3 years", sub: "Early career with some professional experience" },
        { value: "3-7", label: "3 – 7 years", sub: "Mid-career professional with a clear track record" },
        { value: "7+", label: "7+ years", sub: "Senior professional with deep domain expertise" },
      ],
    },
    {
      id: "q3",
      question: "What is your target role or function in commodity trading?",
      sub: "Pick the function that is closest to your goal.",
      options: [
        { value: "front", label: "Front office — Trader, originator, or commercial manager" },
        { value: "analytics", label: "Analytics or quantitative research — market analysis, curve building, or modelling" },
        { value: "ops", label: "Scheduling, operations, or ETRM — physical cargo management and logistics" },
        { value: "risk", label: "Risk management, compliance, or trade finance" },
        { value: "open", label: "I am open to multiple functions — still exploring" },
      ],
    },
    {
      id: "q4",
      question: "Which best describes your biggest resume challenge right now?",
      sub: "Be honest — this is what the template is designed to solve.",
      options: [
        { value: "translate", label: "Translating my experience from another industry into commodity trading language", persona: "switcher" },
        { value: "commercial", label: "Making my operational experience sound commercial, not just functional", persona: "insider" },
        { value: "technical", label: "Making my technical or analytical skills relevant to a commercial role", persona: "analyst" },
        { value: "vendor", label: "Reframing vendor/sales achievements as market knowledge, not quota attainment", persona: "vendor" },
        { value: "evidence", label: "I lack professional experience and need to show commercial curiosity instead", persona: "fresh_grad" },
      ],
    },
    {
      id: "q5",
      question: "Which commodity market do you want to focus on?",
      sub: "Your template works across markets — but naming a focus helps positioning.",
      options: [
        { value: "oil", label: "Crude oil and refined products" },
        { value: "gas", label: "Natural gas, LNG, or power" },
        { value: "metals", label: "Base or precious metals" },
        { value: "ags", label: "Agriculture or soft commodities" },
        { value: "multi", label: "Multi-commodity / still deciding" },
      ],
    },
  ];

  const industryMap = [
    {
      zone: "A",
      title: "Front Office",
      color: "#0830a0",
      roles: [
        { name: "Commodity Trader", tag: "High competition" },
        { name: "Originator / Commercial Manager" },
        { name: "Structurer / Deal Origination" },
        { name: "LNG Portfolio Manager" },
      ],
    },
    {
      zone: "B",
      title: "Analytics & Quant",
      color: "#0040f5",
      roles: [
        { name: "Commodity Analyst", tag: "Strong entry point" },
        { name: "Market Intelligence Analyst" },
        { name: "Forward Curve Analyst" },
        { name: "Quantitative Researcher" },
      ],
    },
    {
      zone: "C",
      title: "Operations & Scheduling",
      color: "#0F766E",
      roles: [
        { name: "Scheduler / Cargo Coordinator", tag: "Best entry path" },
        { name: "ETRM / Systems Analyst" },
        { name: "Vessel Operations Manager" },
        { name: "Trade Operations Analyst" },
      ],
    },
    {
      zone: "D",
      title: "Risk & Finance",
      color: "#5B21B6",
      roles: [
        { name: "Market Risk Analyst" },
        { name: "Credit Risk Manager" },
        { name: "Trade Finance Manager" },
        { name: "Compliance / REMIT Officer" },
      ],
    },
    {
      zone: "E",
      title: "Market Intelligence Vendors",
      color: "#B45309",
      roles: [
        { name: "Price Reporter (Platts / Argus)" },
        { name: "Intelligence Analyst (Kpler / Vortexa)" },
        { name: "Research Analyst (Wood Mac)" },
        { name: "Client Solutions (vendor-side)" },
      ],
    },
    {
      zone: "Entry",
      title: "Which Zone First?",
      color: "#0830a0",
      muted: true,
      roles: [
        { name: "Scheduling / Ops → best entry for most", dotColor: "#0F766E" },
        { name: "Analytics → best for quant backgrounds", dotColor: "#0040f5" },
        { name: "Risk → best for finance graduates", dotColor: "#5B21B6" },
        { name: "Front office → rare direct entry", dotColor: "#0830a0" },
      ],
    },
  ];

  return { quizSteps, industryMap };
}

function addPlaybookFileKeys() {
  const assetsPath = path.join(OUT, "playbook-assets.json");
  const assets = JSON.parse(fs.readFileSync(assetsPath, "utf8"));
  for (const [chapterId, sections] of Object.entries(assets)) {
    for (const [sectionId, items] of Object.entries(sections)) {
      for (const item of items) {
        item.fileKey = `playbook/${chapterId}/${sectionId}/${slugify(item.title)}.pdf`;
      }
    }
  }
  fs.writeFileSync(assetsPath, JSON.stringify(assets, null, 2));
}

// --- main ---
fs.mkdirSync(OUT, { recursive: true });

const interview = extractInterviewBank();
fs.writeFileSync(path.join(OUT, "interview-questions-bank.json"), JSON.stringify(interview, null, 2));

const mentors = extractMentors();
fs.writeFileSync(path.join(OUT, "mentors.json"), JSON.stringify(mentors, null, 2));

const careerExtras = extractCareerExtras();
fs.writeFileSync(path.join(OUT, "career-roadmap-extras.json"), JSON.stringify(careerExtras, null, 2));

const resumeExtras = extractResumeExtras();
fs.writeFileSync(path.join(OUT, "resume-extras.json"), JSON.stringify(resumeExtras, null, 2));

addPlaybookFileKeys();

console.log("Extracted:");
console.log("  interview questions:", interview.questions.length);
console.log("  mentor segments:", mentors.length, "mentors:", mentors.reduce((n, s) => n + s.mentors.length, 0));
console.log("  career matrix rows:", careerExtras.functionMatrix.length);
console.log("  career timeline quarters:", careerExtras.timeline12Month.length);
console.log("  resume quiz steps:", resumeExtras.quizSteps.length);
