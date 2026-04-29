-- Seeds default workout plan templates from the Rapid exercise catalog.
-- Applies to existing users and new signups.

create or replace function public.seed_default_workout_plans(p_user_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
with plan_templates as (
  select *
  from (
    values
      ('Push Day (Bench Focused)', 1, 'barbell bench press', 4, 6),
      ('Push Day (Bench Focused)', 2, 'barbell incline bench press', 3, 8),
      ('Push Day (Bench Focused)', 3, 'barbell seated overhead press', 3, 8),
      ('Push Day (Bench Focused)', 4, 'cable lateral raise', 3, 12),
      ('Push Day (Bench Focused)', 5, 'barbell close-grip bench press', 3, 10),

      ('Pull Day (Back Focused)', 1, 'assisted pull-up', 4, 6),
      ('Pull Day (Back Focused)', 2, 'barbell bent over row', 4, 8),
      ('Pull Day (Back Focused)', 3, 'cable pulldown', 3, 10),
      ('Pull Day (Back Focused)', 4, 'barbell shrug', 3, 12),
      ('Pull Day (Back Focused)', 5, 'barbell curl', 3, 12),

      ('Leg Day', 1, 'barbell front squat', 4, 6),
      ('Leg Day', 2, 'barbell romanian deadlift', 3, 8),
      ('Leg Day', 3, 'barbell lunge', 3, 10),
      ('Leg Day', 4, 'barbell full squat', 3, 8),
      ('Leg Day', 5, 'barbell standing calf raise', 4, 12),

      ('Primary Squat + Secondary Bench Day (With Accessories)', 1, 'barbell front squat', 5, 3),
      ('Primary Squat + Secondary Bench Day (With Accessories)', 2, 'barbell bench press', 4, 8),
      ('Primary Squat + Secondary Bench Day (With Accessories)', 3, 'barbell lunge', 3, 10),
      ('Primary Squat + Secondary Bench Day (With Accessories)', 4, 'barbell standing calf raise', 3, 12),
      ('Primary Squat + Secondary Bench Day (With Accessories)', 5, 'barbell lying triceps extension', 3, 12),

      ('Primary Dead + Secondary Bench Day (With Accessories)', 1, 'barbell deadlift', 5, 3),
      ('Primary Dead + Secondary Bench Day (With Accessories)', 2, 'barbell bench press', 4, 8),
      ('Primary Dead + Secondary Bench Day (With Accessories)', 3, 'cable seated high row (v-bar)', 3, 10),
      ('Primary Dead + Secondary Bench Day (With Accessories)', 4, 'barbell good morning', 3, 10),
      ('Primary Dead + Secondary Bench Day (With Accessories)', 5, 'cable kneeling crunch', 3, 12),

      ('Upper Day', 1, 'barbell bench press', 4, 6),
      ('Upper Day', 2, 'barbell bent over row', 4, 8),
      ('Upper Day', 3, 'barbell seated overhead press', 3, 8),
      ('Upper Day', 4, 'cable pulldown', 3, 10),
      ('Upper Day', 5, 'barbell curl', 3, 12),
      ('Upper Day', 6, 'barbell close-grip bench press', 3, 10),

      ('Lower Day', 1, 'barbell front squat', 4, 6),
      ('Lower Day', 2, 'barbell romanian deadlift', 3, 8),
      ('Lower Day', 3, 'barbell rear lunge', 3, 10),
      ('Lower Day', 4, 'barbell good morning', 3, 10),
      ('Lower Day', 5, 'barbell standing calf raise', 4, 12),

      ('Cardio + Abs', 1, 'run', 1, 20),
      ('Cardio + Abs', 2, 'stationary bike run v. 3', 1, 15),
      ('Cardio + Abs', 3, 'mountain climber', 3, 20),
      ('Cardio + Abs', 4, 'cable kneeling crunch', 3, 15),
      ('Cardio + Abs', 5, 'air bike', 3, 20),

      ('Full Body', 1, 'barbell front squat', 3, 5),
      ('Full Body', 2, 'barbell bench press', 3, 5),
      ('Full Body', 3, 'barbell deadlift', 2, 5),
      ('Full Body', 4, 'assisted pull-up', 3, 8),
      ('Full Body', 5, 'barbell seated overhead press', 3, 8)
  ) as t(plan_name, exercise_order, exercise_name, set_count, target_reps)
),
resolved_exercises as (
  select
    pt.plan_name,
    pt.exercise_order,
    ec.id as exercise_id,
    initcap(ec.body_part) as muscle_group,
    (
      select jsonb_agg(
        jsonb_build_object(
          'targetWeight', 0,
          'targetReps', pt.target_reps
        )
        order by gs
      )
      from generate_series(1, pt.set_count) as gs
    ) as sets_json
  from plan_templates pt
  join public.exercises_catalog_rapid ec
    on lower(ec.name) = lower(pt.exercise_name)
),
plan_json as (
  select
    plan_name,
    jsonb_agg(
      jsonb_build_object(
        'exerciseId', exercise_id,
        'muscleGroup', muscle_group,
        'sets', sets_json,
        'notes', ''
      )
      order by exercise_order
    ) as exercises
  from resolved_exercises
  group by plan_name
)
insert into public.workout_plans (user_id, name, exercises)
select
  p_user_id,
  pj.plan_name,
  pj.exercises
from plan_json pj
where not exists (
  select 1
  from public.workout_plans wp
  where wp.user_id = p_user_id
    and lower(wp.name) = lower(pj.plan_name)
);
$$;

-- Seed existing users.
select public.seed_default_workout_plans(u.id)
from auth.users u;

-- Ensure future users get default plans at signup.
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

  perform public.seed_default_workout_plans(new.id);

  return new;
end;
$$;
