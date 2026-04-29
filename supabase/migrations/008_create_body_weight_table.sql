create table if not exists public.body_weight (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  logged_date date not null,
  weight numeric(5, 1) not null check (weight > 0),
  created_at timestamptz not null default now()
);

create unique index if not exists body_weight_user_date_unique_idx
  on public.body_weight (user_id, logged_date);

create index if not exists body_weight_user_logged_date_idx
  on public.body_weight (user_id, logged_date desc);

alter table public.body_weight enable row level security;

create policy "body_weight_select_own"
  on public.body_weight for select
  using (auth.uid() = user_id);

create policy "body_weight_insert_own"
  on public.body_weight for insert
  with check (auth.uid() = user_id);

create policy "body_weight_update_own"
  on public.body_weight for update
  using (auth.uid() = user_id);

create policy "body_weight_delete_own"
  on public.body_weight for delete
  using (auth.uid() = user_id);
