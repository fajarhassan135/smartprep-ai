-- SmartPrep AI — let the signup trigger create profile rows again
--
-- 0004 set FORCE ROW LEVEL SECURITY on profiles. ENABLE applies policies to
-- everyone except the table owner; FORCE removes that exemption too.
--
-- public.profiles is written by the on_auth_user_created trigger on auth.users,
-- which runs handle_new_user as its owner. Under FORCE that insert has to
-- satisfy the insert policy like anyone else, and during signup there is no
-- auth.uid() to match, so new users can end up with no profile row at all --
-- with nothing failing visibly in the app.
--
-- FORCE was not buying anything here. The service role key bypasses RLS
-- through the BYPASSRLS role attribute, which FORCE does not touch, so the only
-- caller FORCE actually constrained was this trigger: the one caller that has
-- to be allowed. ENABLE alone still blocks anon and other signed-in users,
-- which is the property that matters.
--
-- quiz_sessions keeps FORCE: nothing owner-side writes to it, its rows are
-- inserted by the signed-in student, so there is no trigger to break.
--
-- Run in the Supabase SQL editor. Safe to run more than once.

alter table public.profiles no force row level security;

-- ---------------------------------------------------------------------------
-- Check: profiles should read rls_enabled = true, rls_forced = false.
-- quiz_sessions should still read true / true.
-- ---------------------------------------------------------------------------
select relname as table_name, relrowsecurity as rls_enabled, relforcerowsecurity as rls_forced
from pg_class
where relname in ('profiles', 'quiz_sessions');

-- How the trigger function is defined. security_definer = true means it runs as
-- its owner, which is the case the note above is about.
select proname as function, prosecdef as security_definer, proowner::regrole as owner
from pg_proc
where proname = 'handle_new_user';
