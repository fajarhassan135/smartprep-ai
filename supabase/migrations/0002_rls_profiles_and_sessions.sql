-- SmartPrep AI — lock down profiles and quiz_sessions
--
-- These two tables were reachable with the anon key, which ships in the public
-- JavaScript bundle: anyone could read every profile row, and update or delete
-- them. This turns on Row Level Security and restricts every operation to the
-- row's own user, matching what the flashcards table already does.
--
-- Run in the Supabase SQL editor. Safe to run more than once.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles
  for delete using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- quiz_sessions
-- ---------------------------------------------------------------------------
alter table public.quiz_sessions enable row level security;

drop policy if exists "quiz_sessions_select_own" on public.quiz_sessions;
create policy "quiz_sessions_select_own" on public.quiz_sessions
  for select using (auth.uid() = user_id);

drop policy if exists "quiz_sessions_insert_own" on public.quiz_sessions;
create policy "quiz_sessions_insert_own" on public.quiz_sessions
  for insert with check (auth.uid() = user_id);

drop policy if exists "quiz_sessions_update_own" on public.quiz_sessions;
create policy "quiz_sessions_update_own" on public.quiz_sessions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "quiz_sessions_delete_own" on public.quiz_sessions;
create policy "quiz_sessions_delete_own" on public.quiz_sessions
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Leaderboard
--
-- The leaderboard is the one place that legitimately shows other people's
-- display_name and school. It reads leaderboard_view, not the tables directly.
-- A Postgres view runs with its owner's privileges unless it was created with
-- security_invoker, so a view owned by postgres keeps working after the
-- policies above. Check the leaderboard once this has run.
--
-- If the leaderboard comes back empty, the view was created with
-- security_invoker = true. In that case run this to restore it:
--
--   alter view public.leaderboard_view set (security_invoker = false);
--
-- Do not fix an empty leaderboard by loosening the policies above: that would
-- put the read leak straight back.
-- ---------------------------------------------------------------------------
