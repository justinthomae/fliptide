-- One profile per Grudge Match account per game: each game keeps its own picture, name and stats,
-- so a picture styled for one game never shows up in another. Login (auth.users) and friends (public.friends) stay shared.
-- Applied to the shared Supabase project (zhfkcjzajazsrpqeyaea) on 2026-10-21.
create table if not exists public.gm_app_profiles(
  user_id uuid not null references auth.users(id) on delete cascade,
  app text not null check (app ~ '^[a-z0-9-]{2,24}$'),
  display_name text check (display_name is null or char_length(display_name) between 1 and 24),
  avatar text check (avatar is null or avatar ~ '^av:[a-z0-9_-]{1,40}$' or avatar ~ '^https://zhfkcjzajazsrpqeyaea\.supabase\.co/storage/v1/object/public/uploads/[0-9a-f-]{36}/[A-Za-z0-9_./-]{1,120}$'),
  stats jsonb not null default '{}'::jsonb check (jsonb_typeof(stats)='object' and pg_column_size(stats) < 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, app)
);
alter table public.gm_app_profiles enable row level security;
revoke all on public.gm_app_profiles from anon;
grant select, insert, update, delete on public.gm_app_profiles to authenticated;
create policy gm_app_profiles_read on public.gm_app_profiles for select to authenticated using (true);
create policy gm_app_profiles_insert_own on public.gm_app_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy gm_app_profiles_update_own on public.gm_app_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy gm_app_profiles_delete_own on public.gm_app_profiles for delete to authenticated using ((select auth.uid()) = user_id);
-- an uploaded picture must sit in the owner's own folder of the uploads bucket
create or replace function public.gm_app_profiles_guard() returns trigger language plpgsql set search_path = public as $$
begin
  if new.avatar like 'https://%' and split_part(split_part(new.avatar,'/public/uploads/',2),'/',1) <> new.user_id::text then
    raise exception 'avatar must be in your own uploads folder';
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger gm_app_profiles_guard before insert or update on public.gm_app_profiles for each row execute function public.gm_app_profiles_guard();
