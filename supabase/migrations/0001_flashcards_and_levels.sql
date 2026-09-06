-- SmartPrep AI — flashcards storage and exam levels
-- Run this in the Supabase SQL editor (Database -> SQL Editor -> New query).
-- It is safe to run more than once.

-- ---------------------------------------------------------------------------
-- 1. Flashcards, owned by the student who made them.
-- ---------------------------------------------------------------------------
create table if not exists public.flashcards (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  subject     text not null,
  board       text not null,           -- 'Cambridge' | 'Pakistan Board'
  level       text not null,           -- 'IGCSE' | 'A-Level' | 'Matric' | 'FSc'
  topic       text not null default 'General',
  front       text not null,
  back        text not null,
  source      text not null default 'manual' check (source in ('manual', 'ai')),
  created_at  timestamptz not null default now()
);

-- Browsing is always "my cards, newest first", usually filtered down the
-- subject / board / level / topic path.
create index if not exists flashcards_user_idx
  on public.flashcards (user_id, subject, board, level, topic, created_at desc);

-- ---------------------------------------------------------------------------
-- 2. Row Level Security: a student can only ever see and change their own rows.
-- ---------------------------------------------------------------------------
alter table public.flashcards enable row level security;

drop policy if exists "flashcards_select_own" on public.flashcards;
create policy "flashcards_select_own" on public.flashcards
  for select using (auth.uid() = user_id);

drop policy if exists "flashcards_insert_own" on public.flashcards;
create policy "flashcards_insert_own" on public.flashcards
  for insert with check (auth.uid() = user_id);

drop policy if exists "flashcards_update_own" on public.flashcards;
create policy "flashcards_update_own" on public.flashcards
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "flashcards_delete_own" on public.flashcards;
create policy "flashcards_delete_own" on public.flashcards
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 3. Quizzes now record the exam level as well as the board.
--    Existing rows keep board strings like 'Cambridge IGCSE/A-Level' and get a
--    null level; the app renders those unchanged.
-- ---------------------------------------------------------------------------
alter table public.quiz_sessions
  add column if not exists level text;
