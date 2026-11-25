-- Daily Fliptide: one shared deal per day (Mountain Time), one official score per device (and per signed-in user) per day.
-- Applied to the shared Supabase project. Clients only reach the table through these validated functions.
create table if not exists public.gm_daily_scores (
  app text not null, day date not null, device_id text not null, user_id uuid references auth.users(id) on delete set null,
  name text not null default 'Anonymous', avatar text, score int not null, won boolean not null default false,
  duration_s int, created_at timestamptz not null default now(),
  primary key (app, day, device_id));
create unique index if not exists gm_daily_scores_user on public.gm_daily_scores(app, day, user_id) where user_id is not null;
alter table public.gm_daily_scores enable row level security;
revoke all on public.gm_daily_scores from anon, authenticated;
-- gm_daily_submit(p_app, p_day, p_device, p_name, p_avatar, p_score, p_won, p_duration, p_min_score=-20, p_max_score=45) -> {ok, already, total, rank}
--   checks: day is today or yesterday (America/Denver), score in range, 60s..24h long, name cleaned to 20 chars, avatar 'av:key' or an uploads URL.
-- gm_daily_board(p_app, p_day, p_device, p_limit=20) -> {total, rows:[{name,avatar,score,won,mine}], mine:{score,rank}}
-- gm_admin_ai(p_app, p_days=30) -> [{detail, finished, won}]  (admins only: players' wins vs each AI level)
-- (function bodies as applied: see the project's migration "gm_daily_challenge")
