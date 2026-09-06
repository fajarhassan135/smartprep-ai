-- SmartPrep AI — replace every policy on profiles and quiz_sessions
--
-- 0002 enabled RLS and added own-row policies, but profiles stayed readable
-- with the anon key. Postgres combines permissive policies with OR, so a
-- pre-existing policy under a different name (Supabase's templates are called
-- things like "Enable read access for all users") keeps granting access no
-- matter what is added alongside it. 0002 could only drop the names it was
-- about to create.
--
-- This drops every policy on both tables by name, whatever they are called,
-- then puts back only the own-row ones.
--
-- Note on the leaderboard: if a public-read policy was added so the leaderboard
-- could show other students' names, that job now belongs to leaderboard_view
-- (migration 0003), which reads across users while the tables stay private.
--
-- Run in the Supabase SQL editor. Safe to run more than once.

-- ---------------------------------------------------------------------------
-- 1. Clear out whatever is currently there.
-- ---------------------------------------------------------------------------
do $$
declare
  pol record;
begin
  for pol in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles', 'quiz_sessions')
  loop
    execute format('drop policy %I on public.%I', pol.policyname, pol.tablename);
    raise notice 'dropped policy % on %', pol.policyname, pol.tablename;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Turn RLS on and keep it on. FORCE also applies it to the table owner, so
--    a query that happens to run as the owner cannot slip past the policies.
--    The service role key bypasses RLS regardless, which is why the API routes
--    still work.
-- ---------------------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.profiles       force row level security;
alter table public.quiz_sessions  enable row level security;
alter table public.quiz_sessions  force row level security;

-- ---------------------------------------------------------------------------
-- 3. Own-row access only.
-- ---------------------------------------------------------------------------
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles
  for delete to authenticated using (auth.uid() = id);

create policy "quiz_sessions_select_own" on public.quiz_sessions
  for select to authenticated using (auth.uid() = user_id);
create policy "quiz_sessions_insert_own" on public.quiz_sessions
  for insert to authenticated with check (auth.uid() = user_id);
create policy "quiz_sessions_update_own" on public.quiz_sessions
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "quiz_sessions_delete_own" on public.quiz_sessions
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 4. Signed-out visitors have no business reading either table at all.
-- ---------------------------------------------------------------------------
revoke all on public.profiles      from anon;
revoke all on public.quiz_sessions from anon;

-- ---------------------------------------------------------------------------
-- 5. Check the result. Every row below should be a policy you recognise, and
--    rowsecurity should be true for both tables.
-- ---------------------------------------------------------------------------
select tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public' and tablename in ('profiles', 'quiz_sessions')
order by tablename, policyname;

select relname as table_name, relrowsecurity as rls_enabled, relforcerowsecurity as rls_forced
from pg_class
where relname in ('profiles', 'quiz_sessions');
