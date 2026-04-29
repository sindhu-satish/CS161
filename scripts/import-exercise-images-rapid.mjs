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
const RAPIDAPI_IMAGE_BUCKET = process.env.RAPIDAPI_IMAGE_BUCKET || "exercise-images-rapid";

const FORCE_REFRESH = process.argv.includes("--force");
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const LIMIT = Number.parseInt(limitArg?.split("=")[1] ?? "", 10);

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
  return String(value || "").trim();
}

async function fetchExerciseImage(externalId) {
  const encodedId = encodeURIComponent(externalId);
  const url = `${BASE_URL}/image?exerciseId=${encodedId}&resolution=180`;
  const response = await fetch(url, { method: "GET", headers: defaultHeaders });

  if (response.status === 404) return null;

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`RapidAPI image request failed (${response.status}) for ${externalId}: ${body}`);
  }

  const data = await response.arrayBuffer();
  if (!data || data.byteLength === 0) return null;
  return Buffer.from(data);
}

async function ensureBucketExists(bucketName) {
  const { data, error } = await supabase.storage.getBucket(bucketName);
  if (!error && data) return;

  const { error: createError } = await supabase.storage.createBucket(bucketName, {
    public: true,
    fileSizeLimit: "5MB",
    allowedMimeTypes: ["image/gif"],
  });

  if (createError) {
    throw new Error(`Failed to ensure storage bucket '${bucketName}': ${createError.message}`);
  }
}

async function uploadGifToStorage(externalId, imageBuffer) {
  const objectPath = `${externalId}.gif`;
  const { error } = await supabase.storage
    .from(RAPIDAPI_IMAGE_BUCKET)
    .upload(objectPath, imageBuffer, {
      contentType: "image/gif",
      upsert: true,
    });

  if (error) {
    throw new Error(`Storage upload failed for ${externalId}: ${error.message}`);
  }

  return objectPath;
}

async function fetchRowsNeedingImages() {
  let query = supabase
    .from("exercises_catalog_rapid")
    .select("id, external_id, image_path")
    .not("external_id", "is", null)
    .neq("external_id", "");

  if (!FORCE_REFRESH) {
    query = query.is("image_path", null);
  }

  if (Number.isInteger(LIMIT) && LIMIT > 0) {
    query = query.limit(LIMIT);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to read exercises_catalog_rapid: ${error.message}`);
  }
  return data ?? [];
}

async function run() {
  await ensureBucketExists(RAPIDAPI_IMAGE_BUCKET);
  const rows = await fetchRowsNeedingImages();
  if (rows.length === 0) {
    console.log("No rows need image updates.");
    return;
  }

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    const externalId = normalizeText(row.external_id);
    if (!externalId) {
      skipped += 1;
      continue;
    }

    try {
      const imageBuffer = await fetchExerciseImage(externalId);
      if (!imageBuffer) {
        skipped += 1;
        continue;
      }

      const imagePath = await uploadGifToStorage(externalId, imageBuffer);

      const { error } = await supabase
        .from("exercises_catalog_rapid")
        .update({
          image_path: imagePath,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);

      if (error) {
        throw new Error(error.message);
      }

      updated += 1;
      console.log(`Updated image for external_id=${externalId}`);
    } catch (error) {
      failed += 1;
      console.error(`Failed image update for external_id=${externalId}:`, error.message);
    }
  }

  console.log(`RapidAPI image import complete. updated=${updated}, skipped=${skipped}, failed=${failed}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
