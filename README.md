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
ADMIN_EMAILS=                   # comma-separated emails allowed to use /admin
```

## Supabase setup

Two settings live in the Supabase dashboard, not in this repo:

1. **Authentication → Sign In / Providers → Email → Confirm email** must be
   **on**. The app refuses access to accounts with an unconfirmed email, and
   without this setting no confirmation mail is ever sent.
2. **Row Level Security** must be enabled on `profiles` and `quiz_sessions`,
   and the `avatars` and `past-papers` storage buckets need policies. The app
   talks to Supabase from the browser with the anon key, so these policies are
   the real access control.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Supabase (auth, Postgres,
storage), Groq (Llama 3.3 70B) for generation and marking.
