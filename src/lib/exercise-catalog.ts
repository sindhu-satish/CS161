import { getSupabase } from "@/lib/supabase";
import type { ExerciseInfo } from "@/data/mockData";

export const MUSCLE_GROUPS = ["All", "Chest", "Back", "Shoulders", "Arms", "Legs", "Core"] as const;

type ExerciseCatalogRow = {
  name: string;
  muscle_group: string;
  equipment: string | null;
  instructions: string | null;
};

export async function fetchExerciseCatalogFromDb(): Promise<ExerciseInfo[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("exercises_catalog")
    .select("name, muscle_group, equipment, instructions")
    .order("muscle_group", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;

  return ((data as ExerciseCatalogRow[] | null) ?? []).map((row) => ({
    name: row.name,
    muscleGroup: row.muscle_group,
    equipment: row.equipment || "Unknown",
    description: row.instructions || "No instructions available.",
    pr: 0,
  }));
}
