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
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadDotEnvLocal();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || "exercisedb.p.rapidapi.com";

const MAX_PER_GROUP = 30;
const API_OFFSET = 30;
const FORCE_REFRESH = process.argv.includes("--force");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RAPIDAPI_KEY) {
  console.error(
    "Missing env vars. Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RAPIDAPI_KEY"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const BASE_URL = "https://exercisedb.p.rapidapi.com";

const defaultHeaders = {
  "Content-Type": "application/json",
  "x-rapidapi-key": RAPIDAPI_KEY,
  "x-rapidapi-host": RAPIDAPI_HOST,
};

function normalizeText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

async function fetchJson(url) {
  const response = await fetch(url, { method: "GET", headers: defaultHeaders });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`RapidAPI request failed (${response.status}): ${body}`);
  }
  return response.json();
}

async function fetchBodyParts() {
  return fetchJson(`${BASE_URL}/exercises/bodyPartList`);
}

async function fetchEquipmentList() {
  return fetchJson(`${BASE_URL}/exercises/equipmentList`);
}

async function fetchExercisesByBodyPart(bodyPart, limit = MAX_PER_GROUP) {
  const encoded = encodeURIComponent(bodyPart);
  return fetchJson(
    `${BASE_URL}/exercises/bodyPart/${encoded}?sortOrder=ascending&limit=${limit}&offset=${API_OFFSET}`
  );
}

function toExerciseRow(item) {
  return {
    external_id: normalizeText(item.id) || null,
    name: normalizeText(item.name),
    body_part: normalizeText(item.bodyPart),
    target: normalizeText(item.target) || null,
    equipment: normalizeText(item.equipment) || null,
    secondary_muscles: Array.isArray(item.secondaryMuscles) ? item.secondaryMuscles : [],
    instructions: Array.isArray(item.instructions) ? item.instructions : [],
    description: normalizeText(item.description),
    difficulty: normalizeText(item.difficulty) || null,
    category: normalizeText(item.category) || null,
    gif_url: normalizeText(item.gifUrl) || null,
    updated_at: new Date().toISOString(),
  };
}

async function upsertMetadata(bodyParts, equipment) {
  const bodyPartRows = bodyParts
    .map((value) => normalizeText(value))
    .filter(Boolean)
    .map((bodyPart) => ({ body_part: bodyPart }));
  const equipmentRows = equipment
    .map((value) => normalizeText(value))
    .filter(Boolean)
    .map((item) => ({ equipment: item }));

  if (bodyPartRows.length > 0) {
    const { error } = await supabase
      .from("body_parts_rapid")
      .upsert(bodyPartRows, { onConflict: "body_part" });
    if (error) throw new Error(`Supabase upsert failed for body_parts_rapid: ${error.message}`);
  }
  if (equipmentRows.length > 0) {
    const { error } = await supabase
      .from("equipment_rapid")
      .upsert(equipmentRows, { onConflict: "equipment" });
    if (error) throw new Error(`Supabase upsert failed for equipment_rapid: ${error.message}`);
  }
}

async function seedBodyPart(bodyPart) {
  if (FORCE_REFRESH) {
    const { error: deleteError } = await supabase
      .from("exercises_catalog_rapid")
      .delete()
      .eq("body_part", bodyPart);
    if (deleteError) throw new Error(`Delete failed for ${bodyPart}: ${deleteError.message}`);
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("exercises_catalog_rapid")
    .select("name")
    .eq("body_part", bodyPart);
  if (existingError) throw new Error(`Read failed for ${bodyPart}: ${existingError.message}`);

  const existingNames = new Set((existingRows ?? []).map((row) => normalizeText(row.name).toLowerCase()));
  if (!FORCE_REFRESH && existingNames.size >= MAX_PER_GROUP) {
    console.log(`${bodyPart}: already has ${MAX_PER_GROUP} exercises, skipping.`);
    return;
  }

  const needed = FORCE_REFRESH ? MAX_PER_GROUP : MAX_PER_GROUP - existingNames.size;
  const apiRows = await fetchExercisesByBodyPart(bodyPart, MAX_PER_GROUP);

  const merged = new Map();
  const seenExternalIds = new Set();
  for (const item of apiRows) {
    const row = toExerciseRow(item);
    const nameKey = row.name.toLowerCase();
    const externalIdKey = normalizeText(row.external_id).toLowerCase();
    if (
      !row.name ||
      (!FORCE_REFRESH && existingNames.has(nameKey)) ||
      merged.has(nameKey) ||
      (externalIdKey && seenExternalIds.has(externalIdKey))
    ) {
      continue;
    }
    if (externalIdKey) seenExternalIds.add(externalIdKey);
    merged.set(nameKey, row);
    if (merged.size >= needed) break;
  }

  const rows = Array.from(merged.values()).slice(0, needed);
  if (rows.length === 0) {
    console.log(`${bodyPart}: no missing exercises returned by API.`);
    return;
  }

  const { error } = await supabase
    .from("exercises_catalog_rapid")
    .upsert(rows, { onConflict: "body_part,name" });
  if (error) {
    throw new Error(`Supabase upsert failed for ${bodyPart}: ${error.message}`);
  }

  const currentTotal = FORCE_REFRESH ? rows.length : existingNames.size + rows.length;
  console.log(`Upserted ${rows.length} exercises for ${bodyPart} (${currentTotal}/${MAX_PER_GROUP})`);
}

async function run() {
  const bodyParts = await fetchBodyParts();
  const equipment = await fetchEquipmentList();
  await upsertMetadata(bodyParts, equipment);

  for (const bodyPart of bodyParts) {
    await seedBodyPart(normalizeText(bodyPart));
  }

  console.log("RapidAPI exercise import complete.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
