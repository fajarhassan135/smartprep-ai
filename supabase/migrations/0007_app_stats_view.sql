-- SmartPrep AI — aggregate counts for the landing page
--
-- /api/stats was pulling every row of quiz_sessions into the API route just to
-- add up total_questions, and listing users a thousand at a time to count them.
-- Both are fine at six users and get worse in direct proportion to success:
-- at fifty thousand sessions that is fifty thousand rows over the wire every
-- time the cache expires, to produce one number.
--
-- Postgres can do the counting where the data already is. This view returns a
-- single row, so the route reads one row no matter how large the tables get.
--
-- Run in the Supabase SQL editor. Safe to run more than once.

create or replace view public.app_stats as
select
  (select count(*) from auth.users)                                  as students,
  (select count(*) from public.quiz_sessions)                        as quizzes,
  (select coalesce(sum(total_questions), 0) from public.quiz_sessions) as questions,
  (select count(*) from public.past_papers)                          as papers,
  (select count(*) from public.flashcards)                           as flashcards;

-- Only the service role reads this. The route is public, but it is the server
-- that queries the view and it returns bare totals -- never a row belonging to
-- anyone. Leaving it ungranted to anon and authenticated keeps it that way.
revoke all on public.app_stats from anon, authenticated;

select * from public.app_stats;
