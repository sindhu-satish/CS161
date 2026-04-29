import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

function loadDotEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadDotEnvLocal();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_NINJAS_KEY = process.env.API_NINJAS_KEY;
const MAX_PER_GROUP = 30;
const FORCE_REFRESH = process.argv.includes("--force");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !API_NINJAS_KEY) {
  console.error(
    "Missing env vars. Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, API_NINJAS_KEY"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const API_MUSCLES = [
  "abdominals",
  "abductors",
  "adductors",
  "biceps",
  "calves",
  "chest",
  "forearms",
  "glutes",
  "hamstrings",
  "lats",
  "lower_back",
  "middle_back",
  "neck",
  "quadriceps",
  "traps",
  "triceps",
];

const MUSCLE_MAP = {
  Chest: ["chest"],
  Back: ["lats", "middle_back", "lower_back", "traps"],
  Shoulders: ["neck"],
  Arms: ["biceps", "triceps", "forearms"],
  Legs: ["quadriceps", "hamstrings", "glutes", "calves", "adductors", "abductors"],
  Core: ["abdominals"],
};

function normalizeText(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

async function fetchExercisesForApiMuscle(apiMuscle, limit) {
  const url = `https://api.api-ninjas.com/v1/exercises?muscle=${encodeURIComponent(apiMuscle)}&limit=${limit}`;
  const response = await fetch(url, {
    headers: {
      "X-Api-Key": API_NINJAS_KEY,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API Ninjas request failed (${response.status}) for ${apiMuscle}: ${body}`);
  }

  return response.json();
}

function toRow(item, muscleGroup, apiMuscle) {
  return {
    name: normalizeText(item.name),
    muscle_group: muscleGroup,
    api_muscle: apiMuscle,
    type: normalizeText(item.type) || null,
    equipment: normalizeText(item.equipment) || "Unknown",
    difficulty: normalizeText(item.difficulty) || null,
    instructions: normalizeText(item.instructions),
    updated_at: new Date().toISOString(),
  };
}

async function seedGroup(muscleGroup, apiMuscles, existingNamesInGroup, forceRefresh) {
  const merged = new Map();
  const existingSet = new Set(Array.from(existingNamesInGroup).map((name) => name.toLowerCase()));
  const missingCount = forceRefresh ? MAX_PER_GROUP : Math.max(0, MAX_PER_GROUP - existingSet.size);

  if (missingCount === 0) {
    console.log(`${muscleGroup}: already has ${MAX_PER_GROUP} exercises, skipping API calls.`);
    return;
  }

  for (const apiMuscle of apiMuscles) {
    if (!API_MUSCLES.includes(apiMuscle)) {
      throw new Error(`Unsupported API muscle in MUSCLE_MAP: ${apiMuscle}`);
    }
    const results = await fetchExercisesForApiMuscle(apiMuscle, missingCount);
    for (const item of results) {
      const name = normalizeText(item.name);
      if (!name) continue;
      const key = name.toLowerCase();
      if (!forceRefresh && existingSet.has(key)) continue;
      if (!merged.has(key)) {
        merged.set(key, toRow(item, muscleGroup, apiMuscle));
      }
      if (merged.size >= missingCount) break;
    }
    if (merged.size >= missingCount) break;
  }

  const rows = Array.from(merged.values()).slice(0, missingCount);
  if (rows.length === 0) {
    console.warn(`No missing rows fetched for group: ${muscleGroup}`);
    return;
  }

  const { error } = await supabase
    .from("exercises_catalog")
    .upsert(rows, { onConflict: "muscle_group,name" });

  if (error) {
    throw new Error(`Supabase upsert failed for ${muscleGroup}: ${error.message}`);
  }

  console.log(
    `Upserted ${rows.length} exercises for ${muscleGroup} (${Math.min(
      MAX_PER_GROUP,
      existingSet.size + rows.length
    )}/${MAX_PER_GROUP})`
  );
}

async function run() {
  const { data: existingRows, error: existingError } = await supabase
    .from("exercises_catalog")
    .select("name, muscle_group");

  if (existingError) {
    throw new Error(`Failed to check existing exercise data: ${existingError.message}`);
  }

  const existingByGroup = new Map(Object.keys(MUSCLE_MAP).map((group) => [group, new Set()]));
  for (const row of existingRows ?? []) {
    if (!existingByGroup.has(row.muscle_group)) continue;
    existingByGroup.get(row.muscle_group).add(normalizeText(row.name));
  }

  for (const [muscleGroup, apiMuscles] of Object.entries(MUSCLE_MAP)) {
    await seedGroup(
      muscleGroup,
      apiMuscles,
      existingByGroup.get(muscleGroup) ?? new Set(),
      FORCE_REFRESH
    );
  }
  console.log("Exercise import complete.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
