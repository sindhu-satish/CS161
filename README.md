# FitTrack Pro

Workout logging app (Vite + React + TypeScript) backed by **Supabase** for authentication and Postgres storage. Passwords are handled by Supabase Auth (hashed server-side), not stored in the client.

## Prerequisites

- Node 18+
- A [Supabase](https://supabase.com) project

## One-time Supabase setup

1. In the Supabase dashboard, open **SQL Editor** and run the full scripts in order:

   - `supabase/migrations/001_fittrack_schema.sql`
   - `supabase/migrations/002_exercises_catalog.sql`

   That creates `profiles`, `workouts`, `workout_plans`, row-level security policies, and a trigger to create a profile row when a user signs up.

2. **Authentication → Providers**: ensure **Email** is enabled.

3. For local development, under **Authentication → Providers → Email**, consider turning **“Confirm email”** off so new accounts can sign in immediately.

4. **Do not** put your database `postgres` password in this app. The web client only needs the **project URL** and the **anon / publishable** public key (Settings → API). The connection string password is for direct Postgres tools only.

## Environment variables

```sh
cp .env.example .env.local
```

Set:

- `VITE_SUPABASE_URL` — Project URL (e.g. `https://xxxx.supabase.co`)
- `VITE_SUPABASE_ANON_KEY` — **Publishable** key (`sb_publishable_...`) or legacy **anon** JWT from the API settings
- `SUPABASE_SERVICE_ROLE_KEY` — used only for exercise import script (never expose in client code)
- `API_NINJAS_KEY` — API key from API Ninjas Exercise API

`.env.local` is gitignored.

## Run locally

```sh
npm i
npm run dev
```

Then register a user, log workouts, and open **History** / **Stats** — data is read from your Supabase project.

## Seed exercise catalog (API Ninjas -> Supabase)

Run once (or anytime you want to refresh):

```sh
npm run seed:exercises
```

This calls API Ninjas by muscle group and upserts data into `exercises_catalog` with a max of **30 exercises per muscle group**.
If data already exists in `exercises_catalog`, it skips all API calls and uses Supabase data only.

To re-import deliberately:

```sh
npm run seed:exercises:force
```

## Scripts

| Command        | Description           |
| -------------- | --------------------- |
| `npm run dev`  | Vite dev server       |
| `npm run build`| Production build      |
| `npm run test` | Vitest                |
| `npm run lint` | ESLint                |
| `npm run seed:exercises` | Import exercise catalog |
| `npm run seed:exercises:force` | Re-import exercise catalog |
