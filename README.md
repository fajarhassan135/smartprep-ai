# SmartPrep AI

An AI study platform for Cambridge (IGCSE / A-Level) and Pakistan Board
(Matric / FSc) students preparing for their exams.

## What it does

- **AI quizzes** — generated per subject, board and difficulty, in practice or
  timed exam mode, with short answers marked by AI.
- **Flashcards** — hand-written or AI-generated per subject.
- **Past papers** — browse by subject and board.
- **Progress** — quiz history, per-subject stats, study streak, leaderboard.

## Running it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Environment

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase anon key (public, safe in the browser)
SUPABASE_SERVICE_ROLE_KEY=      # server only — never expose to the client
GROQ_API_KEY=                   # server only
```

## Adding past papers

Papers are imported from your machine, not through the site. There is no upload
page and no upload endpoint, so nothing that writes to the catalogue is exposed
to the internet.

```bash
node scripts/import-papers.mjs ./papers            # dry run — shows the plan
node scripts/import-papers.mjs ./papers --commit   # upload and catalogue
```

Cambridge filenames are parsed automatically: `9709_s23_qp_42.pdf` becomes
Mathematics, A-Level, May/June 2023, question paper, Paper 4 Variant 2. Session
letters are `s` May/June, `w` Oct/Nov, `m` Feb/March; `qp` and `ms` are question
paper and mark scheme. Syllabus codes are mapped at the top of the script —
check them against your syllabuses.

Anything else goes in a `papers.json` manifest in the same folder, which also
accepts `url` instead of `file` to catalogue a paper as a link to its official
page rather than hosting the PDF:

```json
[
  { "file": "fsc-physics-2023.pdf", "subject": "Physics", "level": "FSc",
    "year": 2023, "session": "Annual", "paperLabel": "Paper 1" },
  { "url": "https://official.example/paper.pdf", "subject": "Economics",
    "level": "A-Level", "year": 2022, "session": "Oct/Nov",
    "paperLabel": "Paper 3", "docType": "mark_scheme" }
]
```

Re-running is safe — papers already in the catalogue are reported as skipped.

Exam papers are copyright their board. Upload PDFs only where you hold the right
to distribute them; catalogue the rest as links.

## Supabase setup

Two settings live in the Supabase dashboard, not in this repo:

1. **Authentication → Sign In / Providers → Email → Confirm email** must be
   **on**. The app refuses access to accounts with an unconfirmed email, and
   without this setting no confirmation mail is ever sent.
2. **Run the migrations** in `supabase/migrations` in order, through the SQL
   editor. They create the tables and, importantly, the Row Level Security
   policies: the app talks to Supabase from the browser with the anon key, so
   those policies are the real access control.

The `past-papers` bucket is private. Papers are served through short-lived
signed URLs minted by `/api/past-paper-url` for signed-in, verified students,
so files cannot be hotlinked or crawled.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Supabase (auth, Postgres,
storage), Groq (Llama 3.3 70B) for generation and marking.
