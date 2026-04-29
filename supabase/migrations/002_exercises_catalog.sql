-- Exercise catalog seeded from API Ninjas.
-- Stores up to 30 exercises per app muscle group.

create table if not exists public.exercises_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  muscle_group text not null,
  api_muscle text not null,
  type text,
  equipment text,
  difficulty text,
  instructions text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercises_catalog_name_group_unique unique (muscle_group, name)
);

create index if not exists exercises_catalog_group_idx
  on public.exercises_catalog (muscle_group, name);

alter table public.exercises_catalog enable row level security;

create policy "exercises_catalog_read_all"
  on public.exercises_catalog for select
  using (true);
