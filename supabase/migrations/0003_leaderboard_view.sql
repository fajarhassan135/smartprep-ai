-- SmartPrep AI — leaderboard
--
-- app/leaderboard/page.tsx selects from public.leaderboard_view, which did not
-- exist. The page treats the resulting error as "no data" and shows its empty
-- state, so the leaderboard has never displayed anything.
--
-- This is the one place the app deliberately shows other students their peers'
-- display name and school. It is a view rather than direct table access so the
-- own-row policies in 0002 stay in force everywhere else: the view is owned by
-- the role that runs this script (postgres in the SQL editor) and is not
-- security_invoker, so it can aggregate across users while the base tables stay
-- locked down.
--
-- Run in the Supabase SQL editor. Safe to run more than once.

create or replace view public.leaderboard_view as
select
  s.user_id,
  p.display_name,
  p.school,
  count(*)::int                                                as total_quizzes,
  round(avg(s.score::numeric / nullif(s.total_questions, 0) * 100))::int as avg_score,
  round(max(s.score::numeric / nullif(s.total_questions, 0) * 100))::int as best_score
from public.quiz_sessions s
left join public.profiles p on p.id = s.user_id
where s.total_questions > 0
group by s.user_id, p.display_name, p.school
-- One quiz at 100% should not outrank a term's worth of work.
having count(*) >= 3;

-- Signed-in students may read the leaderboard. Anonymous visitors may not:
-- there is no reason for names and schools to be readable without an account.
revoke all on public.leaderboard_view from anon;
grant select on public.leaderboard_view to authenticated;
