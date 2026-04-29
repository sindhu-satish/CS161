-- Seed body weight logs for the same simulated user used in workout seeds.
-- Generates entries in the 125-130 lbs range over recent weeks.

with seed_user as (
  select 'a43b7a94-c947-496d-a575-7fa009ce38e9'::uuid as user_id
),
simulated_logs as (
  select
    su.user_id,
    (current_date - (n * 3))::date as logged_date,
    round(
      (
        127.2
        + sin(n::numeric / 2.2) * 1.8
        + ((n % 4) - 1.5) * 0.25
      )::numeric,
      1
    ) as weight
  from generate_series(0, 19) as g(n)
  cross join seed_user su
)
insert into public.body_weight (user_id, logged_date, weight, created_at)
select
  sl.user_id,
  sl.logged_date,
  least(130.0::numeric, greatest(125.0::numeric, sl.weight)) as weight,
  sl.logged_date::timestamptz + interval '7 hours'
from simulated_logs sl
on conflict (user_id, logged_date)
do update set
  weight = excluded.weight,
  created_at = excluded.created_at;
