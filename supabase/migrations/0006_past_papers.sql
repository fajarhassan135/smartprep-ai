-- SmartPrep AI — past paper catalogue
--
-- The past papers page was fifteen hard-coded rows with no files behind them,
-- and the admin uploader wrote to a bucket that did not exist. This adds the
-- catalogue the page reads and the uploader writes.
--
-- Files live in the private "past-papers" storage bucket. Nothing is served
-- straight from the bucket: the app hands out short-lived signed URLs through
-- /api/past-paper-url, so a paper cannot be hotlinked or crawled.
--
-- Run in the Supabase SQL editor. Safe to run more than once.

create table if not exists public.past_papers (
  id            uuid primary key default gen_random_uuid(),
  subject       text not null,
  board         text not null,                    -- 'Cambridge' | 'Pakistan Board'
  level         text not null,                    -- 'IGCSE' | 'A-Level' | 'Matric' | 'FSc'
  year          int  not null check (year between 2000 and 2100),
  session       text not null default 'Annual',   -- 'May/June', 'Oct/Nov', 'Feb/March', 'Annual'
  paper_label   text not null,                    -- 'Paper 1', 'Paper 4 Variant 2', ...
  doc_type      text not null default 'question_paper'
                  check (doc_type in ('question_paper', 'mark_scheme')),

  -- Exactly one of these: a file in the bucket, or a link to the official page.
  storage_path  text,
  external_url  text,

  uploaded_by   uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),

  constraint past_papers_has_one_source check (
    (storage_path is not null) <> (external_url is not null)
  ),
  constraint past_papers_unique_entry unique (subject, board, level, year, session, paper_label, doc_type)
);

create index if not exists past_papers_browse_idx
  on public.past_papers (subject, board, level, year desc, session, paper_label);

-- ---------------------------------------------------------------------------
-- Any signed-in student may read the catalogue. Nobody writes to it from the
-- browser: uploads go through /api/upload-past-paper, which checks the admin
-- allowlist server side and then writes with the service role.
-- ---------------------------------------------------------------------------
alter table public.past_papers enable row level security;

drop policy if exists "past_papers_select_authenticated" on public.past_papers;
create policy "past_papers_select_authenticated" on public.past_papers
  for select to authenticated using (true);

revoke all on public.past_papers from anon;

-- ---------------------------------------------------------------------------
-- Storage: the bucket is private, so no policy grants direct object access.
-- Reads happen through signed URLs minted by the API with the service role.
-- ---------------------------------------------------------------------------
select relname as table_name, relrowsecurity as rls_enabled
from pg_class where relname = 'past_papers';
