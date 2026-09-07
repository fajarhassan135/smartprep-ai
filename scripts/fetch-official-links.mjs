#!/usr/bin/env node
/**
 * Build papers/papers.json from what Cambridge actually publishes.
 *
 * Reads each syllabus's past-papers page, pulls out the PDF links it offers,
 * and turns them into catalogue entries pointing at cambridgeinternational.org.
 * Nothing is downloaded or rehosted -- these are links to the official files.
 *
 *   node scripts/fetch-official-links.mjs             # writes papers/papers.json
 *   node scripts/fetch-official-links.mjs --from 2022 # only this year onward
 *
 * Re-run it after each exam session: Cambridge publishes the most recent
 * session and replaces it, so the links move.
 */

import { writeFileSync, mkdirSync } from "node:fs";

const ORIGIN = "https://www.cambridgeinternational.org";
const BASE = `${ORIGIN}/programmes-and-qualifications`;

const SYLLABUSES = [
  { subject: "Mathematics",      level: "IGCSE",   code: "0580", slug: "cambridge-igcse-mathematics-0580" },
  { subject: "Physics",          level: "IGCSE",   code: "0625", slug: "cambridge-igcse-physics-0625" },
  { subject: "Computer Science", level: "IGCSE",   code: "0478", slug: "cambridge-igcse-computer-science-0478" },
  { subject: "Economics",        level: "IGCSE",   code: "0455", slug: "cambridge-igcse-economics-0455" },
  { subject: "Business Studies", level: "IGCSE",   code: "0450", slug: "cambridge-igcse-business-studies-0450" },
  // Note the word order: english-first-language, not first-language-english.
  { subject: "English",          level: "IGCSE",   code: "0500", slug: "cambridge-igcse-english-first-language-0500" },
  { subject: "Mathematics",      level: "A-Level", code: "9709", slug: "cambridge-international-as-and-a-level-mathematics-9709" },
  { subject: "Physics",          level: "A-Level", code: "9702", slug: "cambridge-international-as-and-a-level-physics-9702" },
  { subject: "Computer Science", level: "A-Level", code: "9618", slug: "cambridge-international-as-and-a-level-computer-science-9618" },
  { subject: "Economics",        level: "A-Level", code: "9708", slug: "cambridge-international-as-and-a-level-economics-9708" },
  { subject: "Business Studies", level: "A-Level", code: "9609", slug: "cambridge-international-as-and-a-level-business-9609" },
  { subject: "English",          level: "A-Level", code: "9093", slug: "cambridge-international-as-and-a-level-english-language-9093" },
];

const MONTH_SESSIONS = { june: "May/June", november: "Oct/Nov", march: "Feb/March" };

const fromYear = (() => {
  const i = process.argv.indexOf("--from");
  return i > -1 ? Number(process.argv[i + 1]) : 2022;
})();

/** "11" -> "Paper 1 Variant 1"; "1" -> "Paper 1". */
function paperLabel(digits) {
  return digits.length >= 2 ? `Paper ${digits[0]} Variant ${digits.slice(1)}` : `Paper ${digits}`;
}

/**
 * Filenames look like:
 *   567870-june-2024-question-paper-11.pdf
 *   567865-june-2024-mark-scheme-paper-11.pdf
 *   751262-2022-specimen-paper-1.pdf
 *   751268-2022-specimen-mark-scheme-paper-1.pdf
 * Examiner reports, confidential instructions and syllabuses are not papers.
 */
function parsePdf(href) {
  const name = href.split("/").pop();
  if (/examiner-report|confidential-instructions|syllabus|faq/i.test(name)) return null;

  let m = name.match(/-(june|november|march)-(\d{4})-(question-paper|mark-scheme)-(?:paper-)?(\d{1,2})\.pdf$/i);
  if (m) {
    return {
      session: MONTH_SESSIONS[m[1].toLowerCase()],
      year: Number(m[2]),
      docType: m[3].toLowerCase() === "mark-scheme" ? "mark_scheme" : "question_paper",
      paperLabel: paperLabel(m[4]),
    };
  }

  m = name.match(/-(\d{4})-specimen-(mark-scheme-)?paper-(\d{1,2})\.pdf$/i);
  if (m) {
    return {
      session: "Specimen",
      year: Number(m[1]),
      docType: m[2] ? "mark_scheme" : "question_paper",
      paperLabel: paperLabel(m[3]),
    };
  }

  return null;
}

const entries = [];
const summary = [];

for (const s of SYLLABUSES) {
  const url = `${BASE}/${s.slug}/past-papers/`;
  let html;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) {
      summary.push(`${s.code} ${s.subject} (${s.level}): page returned ${res.status}`);
      continue;
    }
    html = await res.text();
  } catch (e) {
    summary.push(`${s.code} ${s.subject} (${s.level}): ${e.message}`);
    continue;
  }

  const hrefs = [...new Set([...html.matchAll(/href="(\/Images\/[^"]+\.pdf)"/gi)].map((m) => m[1]))];
  let kept = 0;

  for (const href of hrefs) {
    const parsed = parsePdf(href);
    if (!parsed || parsed.year < fromYear) continue;
    entries.push({
      url: ORIGIN + href,
      subject: s.subject,
      level: s.level,
      year: parsed.year,
      session: parsed.session,
      paperLabel: `${parsed.paperLabel} (${s.code})`,
      docType: parsed.docType,
    });
    kept++;
  }

  summary.push(`${s.code} ${s.subject.padEnd(17)} ${s.level.padEnd(8)} ${String(kept).padStart(3)} papers from ${hrefs.length} PDFs on the page`);
}

// Same paper twice would trip the catalogue's unique constraint.
const seen = new Set();
const unique = entries.filter((e) => {
  const key = [e.subject, e.level, e.year, e.session, e.paperLabel, e.docType].join("|");
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

mkdirSync("papers", { recursive: true });
writeFileSync("papers/papers.json", JSON.stringify(unique, null, 2) + "\n");

console.log("\n" + summary.join("\n"));
const years = [...new Set(unique.map((e) => e.year))].sort();
console.log(`\n  ${unique.length} entries written to papers/papers.json`);
console.log(`  years: ${years.join(", ") || "none"}`);
console.log(`\n  Next: node scripts/import-papers.mjs ./papers --commit\n`);
