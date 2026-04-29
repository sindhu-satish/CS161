-- Adds storage path for RapidAPI exercise image files.
alter table public.exercises_catalog_rapid
  add column if not exists image_path text;
