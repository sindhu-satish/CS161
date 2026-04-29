-- RapidAPI ExerciseDB catalog tables.
-- Keeps metadata tables + exercise rows, all suffixed with _rapid.

create table if not exists public.body_parts_rapid (
  id uuid primary key default gen_random_uuid(),
  body_part text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.equipment_rapid (
  id uuid primary key default gen_random_uuid(),
  equipment text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.exercises_catalog_rapid (
  id uuid primary key default gen_random_uuid(),
  external_id text,
  name text not null,
  body_part text not null,
  target text,
  equipment text,
  secondary_muscles jsonb not null default '[]'::jsonb,
  instructions jsonb not null default '[]'::jsonb,
  description text not null default '',
  difficulty text,
  category text,
  gif_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercises_catalog_rapid_unique unique (body_part, name)
);

create index if not exists exercises_catalog_rapid_body_part_idx
  on public.exercises_catalog_rapid (body_part, name);

alter table public.body_parts_rapid enable row level security;
alter table public.equipment_rapid enable row level security;
alter table public.exercises_catalog_rapid enable row level security;

create policy "body_parts_rapid_read_all"
  on public.body_parts_rapid for select
  using (true);

create policy "equipment_rapid_read_all"
  on public.equipment_rapid for select
  using (true);

create policy "exercises_catalog_rapid_read_all"
  on public.exercises_catalog_rapid for select
  using (true);
