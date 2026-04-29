import { getSupabase } from "@/lib/supabase";
import type { Workout } from "@/data/types";
import type { WorkoutPlan } from "@/components/dashboard/PlanWorkout";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  goal: string;
  unit: string;
  memberSince: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Inserts a profile row if missing (e.g. trigger did not run). */
export async function ensureProfileRow(userId: string, email: string, nameHint: string): Promise<void> {
  const supabase = getSupabase();
  const { data } = await supabase.from("profiles").select("id").eq("id", userId).maybeSingle();
  if (data) return;
  const memberSince = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const { error } = await supabase.from("profiles").insert({
    id: userId,
    name: nameHint || email.split("@")[0] || "Athlete",
    goal: "build-muscle",
    unit: "lbs",
    member_since: memberSince,
  });
  if (error && !/duplicate|unique/i.test(error.message)) throw error;
}

export async function fetchProfile(userId: string, email: string): Promise<UserProfile> {
  const supabase = getSupabase();
  let { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  if (!data) {
    await ensureProfileRow(userId, email, email.split("@")[0] || "Athlete");
    ({ data, error } = await supabase.from("profiles").select("*").eq("id", userId).single());
    if (error) throw error;
    if (!data) throw new Error("Could not load profile");
  }
  return {
    id: data.id,
    name: data.name ?? "",
    email,
    goal: data.goal ?? "build-muscle",
    unit: data.unit ?? "lbs",
    memberSince: data.member_since ?? "",
  };
}

export async function updateProfileInDb(
  userId: string,
  updates: Partial<Pick<UserProfile, "name" | "goal" | "unit">>
): Promise<void> {
  const supabase = getSupabase();
  const row: Record<string, string> = {};
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.goal !== undefined) row.goal = updates.goal;
  if (updates.unit !== undefined) row.unit = updates.unit;
  if (Object.keys(row).length === 0) return;
  row.updated_at = new Date().toISOString();
  const { error } = await supabase.from("profiles").update(row).eq("id", userId);
  if (error) throw error;
}

// ─── Workouts ───────────────────────────────────────────────────────────────

type WorkoutRow = {
  id: string;
  workout_date: string;
  name: string;
  duration: string;
  exercises: Workout["exercises"];
};

const mapWorkout = (row: WorkoutRow): Workout => ({
  id: row.id,
  date: row.workout_date,
  name: row.name,
  duration: row.duration,
  exercises: row.exercises ?? [],
});

export async function getWorkouts(): Promise<Workout[]> {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("workouts")
    .select("id, workout_date, name, duration, exercises")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as WorkoutRow[] | null)?.map(mapWorkout) ?? [];
}

export async function getWorkoutById(id: string): Promise<Workout | null> {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("workouts")
    .select("id, workout_date, name, duration, exercises")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapWorkout(data as WorkoutRow);
}

export async function saveWorkout(workout: Workout): Promise<void> {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { error } = await supabase.from("workouts").insert({
    id: workout.id,
    user_id: user.id,
    workout_date: workout.date,
    name: workout.name,
    duration: workout.duration,
    exercises: workout.exercises,
  });
  if (error) throw error;
}

export async function deleteWorkout(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("workouts").delete().eq("id", id);
  if (error) throw error;
}

// ─── Workout plans ───────────────────────────────────────────────────────────

export async function fetchWorkoutPlans(): Promise<WorkoutPlan[]> {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("workout_plans")
    .select("id, name, exercises")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (
    data?.map((row) => ({
      id: row.id,
      name: row.name,
      exercises: row.exercises as WorkoutPlan["exercises"],
    })) ?? []
  );
}

export async function upsertWorkoutPlan(plan: WorkoutPlan): Promise<WorkoutPlan> {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  if (UUID_RE.test(plan.id)) {
    const { data: existing } = await supabase
      .from("workout_plans")
      .select("id")
      .eq("id", plan.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (existing) {
      const { error } = await supabase
        .from("workout_plans")
        .update({
          name: plan.name,
          exercises: plan.exercises,
          updated_at: new Date().toISOString(),
        })
        .eq("id", plan.id)
        .eq("user_id", user.id);
      if (error) throw error;
      return plan;
    }
  }

  const { data, error } = await supabase
    .from("workout_plans")
    .insert({
      user_id: user.id,
      name: plan.name,
      exercises: plan.exercises,
    })
    .select("id")
    .single();
  if (error) throw error;
  return { ...plan, id: data.id };
}

export async function deleteWorkoutPlan(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("workout_plans").delete().eq("id", id);
  if (error) throw error;
}

