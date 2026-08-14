/**
 * Extracts structured content from CommodityPlay. shared HTML into src/data JSON.
 * Run: node scripts/extract-shared-content.mjs
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

function stripHtml(html) {
  return html
    .replace(/<span class='key-term'>/g, "**")
    .replace(/<\/span>/g, "**")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractPlaybookChapter(ch) {
  const html = read(
    `Pro Pack/1a.Full Playbook Access_all chapts content/pro pack-playbook-chapter-${ch}.html`
  );
  const sections = [];

  for (const block of html.split(/<div id="section-/).slice(1)) {
    const idMatch = block.match(/^([a-z]\d+)"/);
    if (!idMatch) continue;
    const id = idMatch[1];

    const title = block.match(/class="sb-title">([^<]+)/)?.[1]?.trim() ?? "";
    const desc = block.match(/class="sb-desc">([^<]+)/)?.[1]?.trim() ?? "";
    const hook = block.match(/class="read-hook">([^<]+)/)?.[1]?.trim() ?? "";
    const handoff = block.match(/class="rh-text">([^<]+)/)?.[1]?.trim();

    const readingMatch = block.match(
      /<div class="reading-content">([\s\S]*?)<\/div>\s*<div class="asset-panel">/
    );
    const bodyHtml = readingMatch?.[1] ?? block;

    const paragraphs = [];
    const pRe = /<p>([\s\S]*?)<\/p>/g;
    let pm;
    while ((pm = pRe.exec(bodyHtml))) {
      const t = stripHtml(pm[1]);
      if (t.length > 20) paragraphs.push(t);
    }

    const pullQuote = block.match(/<div class="pull-quote"><p>([\s\S]*?)<\/p><\/div>/)?.[1];
    const pullText = pullQuote ? stripHtml(pullQuote) : undefined;
    if (pullText && !paragraphs.includes(pullText)) paragraphs.push(pullText);

    const wtmfyBlock = block.match(/<div class="wtmfy">([\s\S]*?)<\/div>/);
    const wtmfyText = wtmfyBlock?.[1]?.match(/<p>([\s\S]*?)<\/p>/)?.[1];
    const wtmfy = wtmfyText ? stripHtml(wtmfyText) : undefined;

    sections.push({
      id,
      number: id.toUpperCase().replace(/([a-z])(\d)/, "$1.$2"),
      title,
      desc,
      hook,
      paragraphs: paragraphs.slice(0, 5),
      ...(pullText && { pullQuote: pullText }),
      ...(wtmfy && { wtmfy }),
      ...(handoff && { handoff }),
    });
  }

  return sections;
}

function extractCaseStudies() {
  const html = read("Elite Pack/case-studies_page.html");
  const cards = [];
  const re =
    /CASE (\d+)[\s\S]*?cc-category[^>]*>([^<]+)<[\s\S]*?cc-title">([^<]+)<[\s\S]*?cc-catch">([^<]+)<[\s\S]*?cc-desc">([^<]+)<[\s\S]*?cc-tag">(\d+) min/g;
  let m;
  while ((m = re.exec(html))) {
    cards.push({
      id: m[1].padStart(2, "0"),
      category: m[2].trim(),
      title: m[3].trim(),
      catchLine: m[4].trim(),
      description: m[5].trim(),
      readMinutes: parseInt(m[6], 10),
      status: "published",
    });
  }
  // coming soon
  const comingRe = /coming-soon[\s\S]*?cc-title">([^<]+)<[\s\S]*?cc-catch">([^<]+)/g;
  while ((m = comingRe.exec(html))) {
    cards.push({
      id: String(cards.length + 1).padStart(2, "0"),
      category: "Coming Soon",
      title: m[1].trim(),
      catchLine: m[2].trim(),
      description: "",
      readMinutes: 0,
      status: "coming-soon",
    });
  }
  return cards;
}

// --- main ---
const playbook = {};
for (const ch of ["a", "b", "c", "d", "e"]) {
  playbook[ch] = extractPlaybookChapter(ch);
}

const caseStudies = extractCaseStudies();

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "playbook-sections.json"), JSON.stringify(playbook, null, 2));
fs.writeFileSync(path.join(OUT, "case-studies-index.json"), JSON.stringify(caseStudies, null, 2));

console.log("Extracted:");
console.log("  playbook sections:", Object.fromEntries(Object.entries(playbook).map(([k, v]) => [k, v.length])));
console.log("  case studies:", caseStudies.length);
