import { getSupabase } from "@/lib/supabase";
import type { ExerciseInfo } from "@/data/mockData";

const RAPID_IMAGE_BUCKET = "exercise-images-rapid";

type ExerciseCatalogRow = {
  name: string;
  body_part: string;
  equipment: string | null;
  instructions: string[] | null;
  secondary_muscles: string[] | null;
  description: string | null;
  target: string | null;
  image_path: string | null;
  gif_url: string | null;
};

const toTitleCase = (value: string) =>
  value
    .split(" ")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");

export async function fetchExerciseCatalogFromDb(): Promise<ExerciseInfo[]> {
  const supabase = getSupabase();
  const {
    data: { publicUrl: bucketPublicUrl },
  } = supabase.storage.from(RAPID_IMAGE_BUCKET).getPublicUrl("");
  const { data, error } = await supabase
    .from("exercises_catalog_rapid")
    .select("name, body_part, target, equipment, secondary_muscles, instructions, description, image_path, gif_url")
    .order("body_part", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;

  return ((data as ExerciseCatalogRow[] | null) ?? []).map((row) => ({
    name: row.name,
    muscleGroup: toTitleCase(row.body_part || "Unknown"),
    equipment: row.equipment || "Unknown",
    description: row.description || "No description available.",
    pr: 0,
    instructions: Array.isArray(row.instructions) ? row.instructions : [],
    secondaryMuscles: Array.isArray(row.secondary_muscles) ? row.secondary_muscles : [],
    target: row.target || undefined,
    imageUrl: row.image_path
      ? `${bucketPublicUrl.replace(/\/$/, "")}/${row.image_path}`
      : row.gif_url || undefined,
  }));
}
