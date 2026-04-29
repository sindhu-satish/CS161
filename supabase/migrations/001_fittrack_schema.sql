-- FitTrack Pro — run this in the Supabase SQL Editor (Dashboard → SQL → New query).
-- Creates profiles, workouts, workout_plans with RLS. Auth passwords stay in auth.users (hashed by Supabase).

create extension if not exists "pgcrypto";

-- ─── Profiles (1:1 with auth.users) ───────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  goal text not null default 'build-muscle',
  unit text not null default 'lbs',
  member_since text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- ─── Workout sessions ───────────────────────────────────────────────────────
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workout_date date not null,
  name text not null,
  duration text not null,
  exercises jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists workouts_user_created_idx
  on public.workouts (user_id, created_at desc);

alter table public.workouts enable row level security;

create policy "workouts_select_own"
  on public.workouts for select
  using (auth.uid() = user_id);

create policy "workouts_insert_own"
  on public.workouts for insert
  with check (auth.uid() = user_id);

create policy "workouts_update_own"
  on public.workouts for update
  using (auth.uid() = user_id);

create policy "workouts_delete_own"
  on public.workouts for delete
  using (auth.uid() = user_id);

-- ─── Workout templates / plans ──────────────────────────────────────────────
create table if not exists public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  exercises jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workout_plans_user_idx
  on public.workout_plans (user_id, created_at asc);

alter table public.workout_plans enable row level security;

create policy "workout_plans_select_own"
  on public.workout_plans for select
  using (auth.uid() = user_id);

create policy "workout_plans_insert_own"
  on public.workout_plans for insert
  with check (auth.uid() = user_id);

create policy "workout_plans_update_own"
  on public.workout_plans for update
  using (auth.uid() = user_id);

create policy "workout_plans_delete_own"
  on public.workout_plans for delete
  using (auth.uid() = user_id);

-- ─── Auto-create profile on signup (runs as definer; bypasses RLS) ─────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, goal, unit, member_since)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(coalesce(new.email, ''), '@', 1), 'user'),
    'build-muscle',
    'lbs',
    to_char((coalesce(new.created_at, now()) at time zone 'UTC'), 'FMMonth YYYY')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- If the line above fails on your Postgres build, use instead:
-- for each row execute procedure public.handle_new_user();
