#!/usr/bin/env node
/**
 * Bulk import past papers into the catalogue.
 *
 * Runs on your machine with the service role key, which is why there is no
 * upload endpoint on the site any more. Nothing here is reachable from the
 * internet.
 *
 *   node scripts/import-papers.mjs ./papers            # dry run, shows the plan
 *   node scripts/import-papers.mjs ./papers --commit   # actually upload
 *
 * Two ways to describe a paper:
 *
 * 1. Cambridge filenames, parsed automatically. The standard form is
 *    <code>_<session><year>_<type>_<paper>.pdf, e.g. 9709_s23_qp_42.pdf
 *    = Mathematics, A-Level, May/June 2023, question paper, Paper 4 Variant 2.
 *    Subject codes are mapped in SUBJECT_CODES below -- check them against your
 *    syllabuses and edit as needed.
 *
 * 2. A papers.json manifest in the folder, for anything that does not follow
 *    that convention (Pakistani board papers, or links instead of files):
 *
 *    [
 *      { "file": "fsc-physics-2023.pdf", "subject": "Physics", "level": "FSc",
 *        "year": 2023, "session": "Annual", "paperLabel": "Paper 1" },
 *      { "url": "https://official.example/paper.pdf", "subject": "Economics",
 *        "level": "A-Level", "year": 2022, "session": "Oct/Nov",
 *        "paperLabel": "Paper 3", "docType": "mark_scheme" }
 *    ]
 *
 * Re-running is safe: the catalogue has a unique constraint, so papers already
 * imported are reported as skipped rather than duplicated.
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, extname, basename, relative } from "node:path";
import { createClient } from "@supabase/supabase-js";

// --- config -----------------------------------------------------------------

/** Cambridge syllabus code -> subject and level. Verify against your syllabuses. */
const SUBJECT_CODES = {
  "0580": { subject: "Mathematics", level: "IGCSE" },
  "9709": { subject: "Mathematics", level: "A-Level" },
  "0500": { subject: "English", level: "IGCSE" },
  "9093": { subject: "English", level: "A-Level" },
  "0478": { subject: "Computer Science", level: "IGCSE" },
  "9618": { subject: "Computer Science", level: "A-Level" },
  "0625": { subject: "Physics", level: "IGCSE" },
  "9702": { subject: "Physics", level: "A-Level" },
  "0450": { subject: "Business Studies", level: "IGCSE" },
  "9609": { subject: "Business Studies", level: "A-Level" },
  "0455": { subject: "Economics", level: "IGCSE" },
  "9708": { subject: "Economics", level: "A-Level" },
};

const SESSION_LETTERS = { s: "May/June", w: "Oct/Nov", m: "Feb/March" };
const DOC_TYPES = { qp: "question_paper", ms: "mark_scheme" };
const LEVEL_BOARDS = {
  IGCSE: "Cambridge",
  "A-Level": "Cambridge",
  Matric: "Pakistan Board",
  FSc: "Pakistan Board",
};

// --- helpers ----------------------------------------------------------------

function loadEnv() {
  const path = ".env.local";
  if (!existsSync(path)) fail("No .env.local found. Run this from the project root.");
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const i = line.indexOf("=");
    if (i > 0 && !line.trimStart().startsWith("#")) {
      process.env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
}

function fail(message) {
  console.error("\n  " + message + "\n");
  process.exit(1);
}

const slug = (v) => String(v).replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");

/** "42" -> "Paper 4 Variant 2"; "4" -> "Paper 4". */
function paperLabelFrom(digits) {
  if (digits.length >= 2) return `Paper ${digits[0]} Variant ${digits.slice(1)}`;
  return `Paper ${digits}`;
}

/** Parses 9709_s23_qp_42.pdf and friends. Returns null if it doesn't match. */
function parseCambridgeName(filename) {
  const stem = basename(filename, extname(filename));
  const m = stem.match(/^(\d{4})_([swm])(\d{2})_(qp|ms)_(\d{1,2})$/i);
  if (!m) return null;

  const [, code, sessionLetter, yy, type, paper] = m;
  const known = SUBJECT_CODES[code];
  if (!known) return { unknownCode: code };

  const year = 2000 + Number(yy);
  return {
    subject: known.subject,
    level: known.level,
    year,
    session: SESSION_LETTERS[sessionLetter.toLowerCase()],
    paperLabel: paperLabelFrom(paper),
    docType: DOC_TYPES[type.toLowerCase()],
  };
}

function walk(dir, found = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, found);
    else if (extname(full).toLowerCase() === ".pdf") found.push(full);
  }
  return found;
}

function validate(entry, source) {
  const problems = [];
  if (!entry.subject) problems.push("subject");
  if (!entry.level) problems.push("level");
  if (!LEVEL_BOARDS[entry.level]) problems.push(`level "${entry.level}" is not one of ${Object.keys(LEVEL_BOARDS).join(", ")}`);
  if (!Number.isInteger(entry.year)) problems.push("year");
  if (!entry.paperLabel) problems.push("paperLabel");
  if (entry.docType && !["question_paper", "mark_scheme"].includes(entry.docType)) {
    problems.push(`docType "${entry.docType}"`);
  }
  return problems.length ? `${source}: missing or invalid ${problems.join(", ")}` : null;
}

// --- main -------------------------------------------------------------------

const [, , folder, ...flags] = process.argv;
const commit = flags.includes("--commit");

if (!folder) {
  fail("Usage: node scripts/import-papers.mjs <folder> [--commit]");
}
if (!existsSync(folder)) fail(`No such folder: ${folder}`);

loadEnv();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) fail("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be in .env.local");

const supabase = createClient(url, key);

// Build the work list: manifest entries first, then any PDF not named in one.
const plan = [];
const skipped = [];
const manifestPath = join(folder, "papers.json");
const claimed = new Set();

if (existsSync(manifestPath)) {
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (e) {
    fail(`papers.json is not valid JSON: ${e.message}`);
  }
  if (!Array.isArray(manifest)) fail("papers.json must be a JSON array.");

  for (const [i, raw] of manifest.entries()) {
    const entry = { docType: "question_paper", session: "Annual", ...raw };
    const problem = validate(entry, `papers.json[${i}]`);
    if (problem) {
      skipped.push(problem);
      continue;
    }
    if (entry.file) {
      const full = join(folder, entry.file);
      if (!existsSync(full)) {
        skipped.push(`papers.json[${i}]: file not found: ${entry.file}`);
        continue;
      }
      claimed.add(full);
      plan.push({ ...entry, path: full });
    } else if (entry.url) {
      plan.push({ ...entry, url: entry.url });
    } else {
      skipped.push(`papers.json[${i}]: needs either "file" or "url"`);
    }
  }
}

for (const file of walk(folder)) {
  if (claimed.has(file)) continue;
  const parsed = parseCambridgeName(file);
  if (!parsed) {
    skipped.push(`${relative(folder, file)}: filename not recognised — add it to papers.json`);
    continue;
  }
  if (parsed.unknownCode) {
    skipped.push(`${relative(folder, file)}: unknown syllabus code ${parsed.unknownCode} — add it to SUBJECT_CODES`);
    continue;
  }
  plan.push({ ...parsed, path: file });
}

console.log(`\n  ${plan.length} paper${plan.length === 1 ? "" : "s"} to import` +
  (skipped.length ? `, ${skipped.length} skipped` : "") +
  (commit ? "" : "   (dry run — nothing will be written)") + "\n");

for (const p of plan.slice(0, commit ? plan.length : 40)) {
  const what = p.url ? "link" : relative(folder, p.path);
  console.log(`    ${p.level.padEnd(8)} ${String(p.year)} ${p.session.padEnd(10)} ${p.subject.padEnd(18)} ${p.paperLabel.padEnd(20)} ${p.docType === "mark_scheme" ? "MS" : "QP"}   ${what}`);
}
if (!commit && plan.length > 40) console.log(`    ... and ${plan.length - 40} more`);

if (skipped.length) {
  console.log("\n  Skipped:");
  for (const s of skipped.slice(0, 20)) console.log(`    ${s}`);
  if (skipped.length > 20) console.log(`    ... and ${skipped.length - 20} more`);
}

if (!commit) {
  console.log("\n  Re-run with --commit to upload.\n");
  process.exit(0);
}

let added = 0, duplicate = 0, failed = 0;

for (const p of plan) {
  const board = LEVEL_BOARDS[p.level];
  let storagePath = null;

  try {
    if (p.path) {
      storagePath = [
        slug(board), slug(p.level), slug(p.subject), String(p.year),
        `${slug(p.session)}-${slug(p.paperLabel)}-${p.docType}.pdf`,
      ].join("/");

      const { error: upErr } = await supabase.storage
        .from("past-papers")
        .upload(storagePath, readFileSync(p.path), {
          contentType: "application/pdf",
          upsert: true,
        });
      if (upErr) throw new Error(`upload: ${upErr.message}`);
    }

    const { error: insErr } = await supabase.from("past_papers").insert({
      subject: p.subject,
      board,
      level: p.level,
      year: p.year,
      session: p.session,
      paper_label: p.paperLabel,
      doc_type: p.docType,
      storage_path: storagePath,
      external_url: storagePath ? null : p.url,
    });

    if (insErr) {
      if (insErr.code === "23505") { duplicate++; continue; }
      throw new Error(`catalogue: ${insErr.message}`);
    }
    added++;
    process.stdout.write(`\r  uploaded ${added}/${plan.length}   `);
  } catch (e) {
    failed++;
    console.log(`\n    FAILED ${p.path ? relative(folder, p.path) : p.url}: ${e.message}`);
  }
}

console.log(`\n\n  Done. ${added} added, ${duplicate} already present, ${failed} failed.\n`);
