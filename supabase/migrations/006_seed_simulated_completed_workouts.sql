-- Seed 40 completed workouts for an existing user.
-- Uses existing workout plan payloads, distributes logs across plans,
-- and adds a few mixed "randomized" sessions.

with seed_user as (
  select 'a43b7a94-c947-496d-a575-7fa009ce38e9'::uuid as user_id
),
provided_plans as (
  select *
  from (
    values
      ('353fd298-bda3-468b-91f3-2597139132b3'::uuid, 'Lower Day', '[{"sets":[{"targetReps":6,"targetWeight":0},{"targetReps":6,"targetWeight":0},{"targetReps":6,"targetWeight":0},{"targetReps":6,"targetWeight":0}],"notes":"","exerciseId":"cfbfc1ec-ca9b-4a8d-9950-fbd5a1046cab","muscleGroup":"Upper Legs"},{"sets":[{"targetReps":8,"targetWeight":0},{"targetReps":8,"targetWeight":0},{"targetReps":8,"targetWeight":0}],"notes":"","exerciseId":"3318a44c-8ff8-41fc-97bc-53d27cd47160","muscleGroup":"Upper Legs"},{"sets":[{"targetReps":10,"targetWeight":0},{"targetReps":10,"targetWeight":0},{"targetReps":10,"targetWeight":0}],"notes":"","exerciseId":"458c1e32-b406-4774-8d84-7a474579f489","muscleGroup":"Upper Legs"},{"sets":[{"targetReps":10,"targetWeight":0},{"targetReps":10,"targetWeight":0},{"targetReps":10,"targetWeight":0}],"notes":"","exerciseId":"c97840cd-f068-44b0-96ef-957c8f650b85","muscleGroup":"Upper Legs"},{"sets":[{"targetReps":12,"targetWeight":0},{"targetReps":12,"targetWeight":0},{"targetReps":12,"targetWeight":0},{"targetReps":12,"targetWeight":0}],"notes":"","exerciseId":"fb6e03e0-2764-453c-9ecb-316393857887","muscleGroup":"Lower Legs"}]'::jsonb),
      ('6261e4e1-ff6a-40b0-83eb-955e5e8b8036'::uuid, 'Primary Squat + Secondary Bench Day (With Accessories)', '[{"sets":[{"targetReps":3,"targetWeight":0},{"targetReps":3,"targetWeight":0},{"targetReps":3,"targetWeight":0},{"targetReps":3,"targetWeight":0},{"targetReps":3,"targetWeight":0}],"notes":"","exerciseId":"cfbfc1ec-ca9b-4a8d-9950-fbd5a1046cab","muscleGroup":"Upper Legs"},{"sets":[{"targetReps":8,"targetWeight":0},{"targetReps":8,"targetWeight":0},{"targetReps":8,"targetWeight":0},{"targetReps":8,"targetWeight":0}],"notes":"","exerciseId":"f12aeb12-484b-45a0-9905-73fb7253463a","muscleGroup":"Chest"},{"sets":[{"targetReps":10,"targetWeight":0},{"targetReps":10,"targetWeight":0},{"targetReps":10,"targetWeight":0}],"notes":"","exerciseId":"1398af7f-b8c6-40d1-ae41-b6ad3deecb22","muscleGroup":"Upper Legs"},{"sets":[{"targetReps":12,"targetWeight":0},{"targetReps":12,"targetWeight":0},{"targetReps":12,"targetWeight":0}],"notes":"","exerciseId":"fb6e03e0-2764-453c-9ecb-316393857887","muscleGroup":"Lower Legs"},{"sets":[{"targetReps":12,"targetWeight":0},{"targetReps":12,"targetWeight":0},{"targetReps":12,"targetWeight":0}],"notes":"","exerciseId":"675d127a-9887-4aa5-99d1-9de94960ef94","muscleGroup":"Upper Arms"}]'::jsonb),
      ('64fa92ab-a787-43ff-90b5-76af76fee1b7'::uuid, 'Cardio + Abs', '[{"sets":[{"targetReps":20,"targetWeight":0}],"notes":"","exerciseId":"457e1d68-d859-4642-9d45-a4f17699f575","muscleGroup":"Cardio"},{"sets":[{"targetReps":15,"targetWeight":0}],"notes":"","exerciseId":"3e08b3bd-3c45-4c64-b733-59c2531feb4b","muscleGroup":"Cardio"},{"sets":[{"targetReps":20,"targetWeight":0},{"targetReps":20,"targetWeight":0},{"targetReps":20,"targetWeight":0}],"notes":"","exerciseId":"8b49aa0e-27b2-4187-ac1d-95b35098a09f","muscleGroup":"Cardio"},{"sets":[{"targetReps":15,"targetWeight":0},{"targetReps":15,"targetWeight":0},{"targetReps":15,"targetWeight":0}],"notes":"","exerciseId":"e6f1a27a-dc5e-45e7-880e-1939f4e74cb1","muscleGroup":"Waist"},{"sets":[{"targetReps":20,"targetWeight":0},{"targetReps":20,"targetWeight":0},{"targetReps":20,"targetWeight":0}],"notes":"","exerciseId":"7b6bc077-d8b3-4817-a593-ef532e1aa8cc","muscleGroup":"Waist"}]'::jsonb),
      ('83dfa3a6-8a7a-4f06-a5dc-5c113b85f1b9'::uuid, 'Full Body', '[{"sets":[{"targetReps":5,"targetWeight":0},{"targetReps":5,"targetWeight":0},{"targetReps":5,"targetWeight":0}],"notes":"","exerciseId":"cfbfc1ec-ca9b-4a8d-9950-fbd5a1046cab","muscleGroup":"Upper Legs"},{"sets":[{"targetReps":5,"targetWeight":0},{"targetReps":5,"targetWeight":0},{"targetReps":5,"targetWeight":0}],"notes":"","exerciseId":"f12aeb12-484b-45a0-9905-73fb7253463a","muscleGroup":"Chest"},{"sets":[{"targetReps":5,"targetWeight":0},{"targetReps":5,"targetWeight":0}],"notes":"","exerciseId":"e6212213-7622-455c-af00-79cc50227e25","muscleGroup":"Upper Legs"},{"sets":[{"targetReps":8,"targetWeight":0},{"targetReps":8,"targetWeight":0},{"targetReps":8,"targetWeight":0}],"notes":"","exerciseId":"ccd51d14-9d13-435b-a4e9-7eb1c5ce1974","muscleGroup":"Back"},{"sets":[{"targetReps":8,"targetWeight":0},{"targetReps":8,"targetWeight":0},{"targetReps":8,"targetWeight":0}],"notes":"","exerciseId":"730abe9a-2a6d-4af4-84ad-13035f91a5d4","muscleGroup":"Shoulders"}]'::jsonb),
      ('8c79ce58-4d34-4624-9479-4e36bbeb21d0'::uuid, 'Pull Day (Back Focused)', '[{"sets":[{"targetReps":6,"targetWeight":0},{"targetReps":6,"targetWeight":0},{"targetReps":6,"targetWeight":0},{"targetReps":6,"targetWeight":0}],"notes":"","exerciseId":"ccd51d14-9d13-435b-a4e9-7eb1c5ce1974","muscleGroup":"Back"},{"sets":[{"targetReps":8,"targetWeight":0},{"targetReps":8,"targetWeight":0},{"targetReps":8,"targetWeight":0},{"targetReps":8,"targetWeight":0}],"notes":"","exerciseId":"96772a40-1bd3-4127-b9b3-0152f08f78a8","muscleGroup":"Back"},{"sets":[{"targetReps":10,"targetWeight":0},{"targetReps":10,"targetWeight":0},{"targetReps":10,"targetWeight":0}],"notes":"","exerciseId":"df4c7611-f450-41c9-aa7a-0e296395673c","muscleGroup":"Back"},{"sets":[{"targetReps":12,"targetWeight":0},{"targetReps":12,"targetWeight":0},{"targetReps":12,"targetWeight":0}],"notes":"","exerciseId":"d8463408-0d11-4461-af69-c59f8f5a28f1","muscleGroup":"Back"},{"sets":[{"targetReps":12,"targetWeight":0},{"targetReps":12,"targetWeight":0},{"targetReps":12,"targetWeight":0}],"notes":"","exerciseId":"261a1e5b-fc3c-4713-b7b6-f8df36a2395a","muscleGroup":"Upper Arms"}]'::jsonb),
      ('ae05a375-8d4a-4416-9eea-60710617ef75'::uuid, 'Leg Day', '[{"sets":[{"targetReps":6,"targetWeight":0},{"targetReps":6,"targetWeight":0},{"targetReps":6,"targetWeight":0},{"targetReps":6,"targetWeight":0}],"notes":"","exerciseId":"cfbfc1ec-ca9b-4a8d-9950-fbd5a1046cab","muscleGroup":"Upper Legs"},{"sets":[{"targetReps":8,"targetWeight":0},{"targetReps":8,"targetWeight":0},{"targetReps":8,"targetWeight":0}],"notes":"","exerciseId":"3318a44c-8ff8-41fc-97bc-53d27cd47160","muscleGroup":"Upper Legs"},{"sets":[{"targetReps":10,"targetWeight":0},{"targetReps":10,"targetWeight":0},{"targetReps":10,"targetWeight":0}],"notes":"","exerciseId":"1398af7f-b8c6-40d1-ae41-b6ad3deecb22","muscleGroup":"Upper Legs"},{"sets":[{"targetReps":8,"targetWeight":0},{"targetReps":8,"targetWeight":0},{"targetReps":8,"targetWeight":0}],"notes":"","exerciseId":"e303502f-823c-44c4-a715-cdb84626ec14","muscleGroup":"Upper Legs"},{"sets":[{"targetReps":12,"targetWeight":0},{"targetReps":12,"targetWeight":0},{"targetReps":12,"targetWeight":0},{"targetReps":12,"targetWeight":0}],"notes":"","exerciseId":"fb6e03e0-2764-453c-9ecb-316393857887","muscleGroup":"Lower Legs"}]'::jsonb),
      ('afc80e83-833c-4c2b-bca9-8557263319f9'::uuid, 'Upper Day', '[{"sets":[{"targetReps":6,"targetWeight":0},{"targetReps":6,"targetWeight":0},{"targetReps":6,"targetWeight":0},{"targetReps":6,"targetWeight":0}],"notes":"","exerciseId":"f12aeb12-484b-45a0-9905-73fb7253463a","muscleGroup":"Chest"},{"sets":[{"targetReps":8,"targetWeight":0},{"targetReps":8,"targetWeight":0},{"targetReps":8,"targetWeight":0},{"targetReps":8,"targetWeight":0}],"notes":"","exerciseId":"96772a40-1bd3-4127-b9b3-0152f08f78a8","muscleGroup":"Back"},{"sets":[{"targetReps":8,"targetWeight":0},{"targetReps":8,"targetWeight":0},{"targetReps":8,"targetWeight":0}],"notes":"","exerciseId":"730abe9a-2a6d-4af4-84ad-13035f91a5d4","muscleGroup":"Shoulders"},{"sets":[{"targetReps":10,"targetWeight":0},{"targetReps":10,"targetWeight":0},{"targetReps":10,"targetWeight":0}],"notes":"","exerciseId":"df4c7611-f450-41c9-aa7a-0e296395673c","muscleGroup":"Back"},{"sets":[{"targetReps":12,"targetWeight":0},{"targetReps":12,"targetWeight":0},{"targetReps":12,"targetWeight":0}],"notes":"","exerciseId":"261a1e5b-fc3c-4713-b7b6-f8df36a2395a","muscleGroup":"Upper Arms"},{"sets":[{"targetReps":10,"targetWeight":0},{"targetReps":10,"targetWeight":0},{"targetReps":10,"targetWeight":0}],"notes":"","exerciseId":"a57de48b-aced-451a-91c7-a3ae37571625","muscleGroup":"Upper Arms"}]'::jsonb),
      ('bf6587e4-e849-4f0e-a7eb-d7313ee130f8'::uuid, 'Primary Dead + Secondary Bench Day (With Accessories)', '[{"sets":[{"targetReps":3,"targetWeight":0},{"targetReps":3,"targetWeight":0},{"targetReps":3,"targetWeight":0},{"targetReps":3,"targetWeight":0},{"targetReps":3,"targetWeight":0}],"notes":"","exerciseId":"e6212213-7622-455c-af00-79cc50227e25","muscleGroup":"Upper Legs"},{"sets":[{"targetReps":8,"targetWeight":0},{"targetReps":8,"targetWeight":0},{"targetReps":8,"targetWeight":0},{"targetReps":8,"targetWeight":0}],"notes":"","exerciseId":"f12aeb12-484b-45a0-9905-73fb7253463a","muscleGroup":"Chest"},{"sets":[{"targetReps":10,"targetWeight":0},{"targetReps":10,"targetWeight":0},{"targetReps":10,"targetWeight":0}],"notes":"","exerciseId":"cb15d4e4-f31c-45f7-b968-ce8a8f592e76","muscleGroup":"Back"},{"sets":[{"targetReps":10,"targetWeight":0},{"targetReps":10,"targetWeight":0},{"targetReps":10,"targetWeight":0}],"notes":"","exerciseId":"c97840cd-f068-44b0-96ef-957c8f650b85","muscleGroup":"Upper Legs"},{"sets":[{"targetReps":12,"targetWeight":0},{"targetReps":12,"targetWeight":0},{"targetReps":12,"targetWeight":0}],"notes":"","exerciseId":"e6f1a27a-dc5e-45e7-880e-1939f4e74cb1","muscleGroup":"Waist"}]'::jsonb),
      ('d3aa3ace-c1b9-4f71-9f36-239a7a92b2fb'::uuid, 'Push Day (Bench Focused)', '[{"sets":[{"targetReps":6,"targetWeight":0},{"targetReps":6,"targetWeight":0},{"targetReps":6,"targetWeight":0},{"targetReps":6,"targetWeight":0}],"notes":"","exerciseId":"f12aeb12-484b-45a0-9905-73fb7253463a","muscleGroup":"Chest"},{"sets":[{"targetReps":8,"targetWeight":0},{"targetReps":8,"targetWeight":0},{"targetReps":8,"targetWeight":0}],"notes":"","exerciseId":"22151e86-003d-4cba-a5ca-1137318d0bd3","muscleGroup":"Chest"},{"sets":[{"targetReps":8,"targetWeight":0},{"targetReps":8,"targetWeight":0},{"targetReps":8,"targetWeight":0}],"notes":"","exerciseId":"730abe9a-2a6d-4af4-84ad-13035f91a5d4","muscleGroup":"Shoulders"},{"sets":[{"targetReps":12,"targetWeight":0},{"targetReps":12,"targetWeight":0},{"targetReps":12,"targetWeight":0}],"notes":"","exerciseId":"933412cc-6284-4cc4-8890-f0e47d1667f9","muscleGroup":"Shoulders"},{"sets":[{"targetReps":10,"targetWeight":0},{"targetReps":10,"targetWeight":0},{"targetReps":10,"targetWeight":0}],"notes":"","exerciseId":"a57de48b-aced-451a-91c7-a3ae37571625","muscleGroup":"Upper Arms"}]'::jsonb)
  ) as p(plan_id, plan_name, exercises_json)
),
indexed_plans as (
  select
    row_number() over (order by plan_name) as plan_idx,
    plan_name,
    exercises_json
  from provided_plans
),
plan_count as (
  select count(*)::int as cnt from indexed_plans
),
plan_exercises as (
  select
    ip.plan_name,
    e.ordinality as ex_idx,
    ec.name as exercise_name,
    coalesce(e.item->>'muscleGroup', initcap(ec.body_part), 'General') as muscle_group,
    e.item->'sets' as target_sets
  from indexed_plans ip
  cross join lateral jsonb_array_elements(ip.exercises_json) with ordinality as e(item, ordinality)
  join public.exercises_catalog_rapid ec
    on ec.id = (e.item->>'exerciseId')::uuid
),
premade_workouts as (
  select
    gs.n as workout_n,
    ip.plan_name,
    (
      select jsonb_agg(
        jsonb_build_object(
          'name', pe.exercise_name,
          'muscleGroup', pe.muscle_group,
          'sets',
          (
            select jsonb_agg(
              jsonb_build_object(
                'weight',
                case
                  when lower(pe.muscle_group) = 'cardio' then 0
                  else round((20 + gs.n * 1.7 + pe.ex_idx * 2.5 + s.ord * 4)::numeric, 1)
                end,
                'reps',
                greatest(1, (s.set_item->>'targetReps')::int + ((gs.n + s.ord) % 3) - 1),
                'done',
                true
              )
              order by s.ord
            )
            from jsonb_array_elements(pe.target_sets) with ordinality as s(set_item, ord)
          )
        )
        order by pe.ex_idx
      )
      from plan_exercises pe
      where pe.plan_name = ip.plan_name
    ) as exercises,
    (50 + (gs.n % 26))::text || ' min' as duration,
    (current_date - ((40 - gs.n) * 2 + (gs.n % 3)))::date as workout_date
  from generate_series(1, 34) as gs(n)
  join plan_count pc on true
  join indexed_plans ip
    on ip.plan_idx = ((gs.n - 1) % pc.cnt) + 1
),
exercise_pool as (
  select distinct
    pe.exercise_name,
    pe.muscle_group
  from plan_exercises pe
),
random_workout_base as (
  select n
  from generate_series(35, 40) as g(n)
),
random_workout_exercises as (
  select
    rwb.n as workout_n,
    jsonb_agg(
      jsonb_build_object(
        'name', picked.exercise_name,
        'muscleGroup', picked.muscle_group,
        'sets',
        (
          select jsonb_agg(
            jsonb_build_object(
              'weight',
              case
                when lower(picked.muscle_group) = 'cardio' then 0
                else round((25 + rwb.n * 1.3 + picked.pick_rank * 3 + s * 4)::numeric, 1)
              end,
              'reps',
              case when lower(picked.muscle_group) = 'cardio' then 18 + ((rwb.n + s) % 8) else 6 + ((rwb.n + s) % 7) end,
              'done',
              true
            )
            order by s
          )
          from generate_series(1, 3) as s
        )
      )
      order by picked.pick_rank
    ) as exercises
  from random_workout_base rwb
  join (
    select
      rwb2.n,
      ep.exercise_name,
      ep.muscle_group,
      row_number() over (partition by rwb2.n order by md5(rwb2.n::text || ep.exercise_name)) as pick_rank
    from random_workout_base rwb2
    cross join exercise_pool ep
  ) picked
    on picked.n = rwb.n
  where picked.pick_rank <= 4
  group by rwb.n
),
all_simulated_workouts as (
  select
    pw.workout_n,
    pw.plan_name as workout_name,
    pw.duration,
    pw.workout_date,
    pw.exercises
  from premade_workouts pw
  union all
  select
    rwe.workout_n,
    'Random Mix Session #' || (rwe.workout_n - 34) as workout_name,
    (44 + (rwe.workout_n % 21))::text || ' min' as duration,
    (current_date - ((40 - rwe.workout_n) * 2 + 1))::date as workout_date,
    rwe.exercises
  from random_workout_exercises rwe
)
insert into public.workouts (user_id, workout_date, name, duration, exercises, created_at)
select
  su.user_id,
  asw.workout_date,
  asw.workout_name,
  asw.duration,
  asw.exercises,
  asw.workout_date::timestamptz + make_interval(hours => 6 + (asw.workout_n % 10))
from all_simulated_workouts asw
cross join seed_user su
order by asw.workout_n;
