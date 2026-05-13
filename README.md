**Repository:** [https://github.com/sindhu-satish/CS161](https://github.com/sindhu-satish/CS161)

# FitTrack Pro

Workout logging app (Vite + React + TypeScript) backed by **Supabase** for authentication and Postgres storage. Passwords are handled by Supabase Auth (hashed server-side), not stored in the client.

## Repository structure

### Folders (high level)

| Folder | Purpose |
| ------ | ------- |
| **`public/`** | Static assets copied to the build output as-is (for example `robots.txt` and other public files the dev server serves at the site root). |
| **`scripts/`** | Node scripts run from npm (exercise catalog import from API Ninjas, RapidAPI ExerciseDB, and related image import helpers). |
| **`src/`** | Application source: React UI, routing, Supabase client usage, and tests. |
| **`supabase/migrations/`** | Ordered SQL migrations: core schema, exercise catalogs, seeds, RLS, and incremental database changes. Run these in the Supabase SQL Editor (or your migration workflow) to match the app’s expectations. |

### `src/` subfolders

| Subfolder | Purpose |
| --------- | ------- |
| **`components/`** | Reusable UI: shared primitives under `components/ui/` (shadcn-style) and feature blocks under `components/dashboard/` plus app-specific components like navigation. |
| **`pages/`** | Top-level route screens (login, dashboard, history, stats, exercises, profile, workout detail, not-found). |
| **`lib/`** | Supabase client setup, database helpers, exercise catalog utilities, and small shared helpers (`utils.ts`). |
| **`hooks/`** | React hooks (theme, mobile layout, toasts, etc.). |
| **`context/`** | React context providers (for example authentication session state). |
| **`data/`** | Shared TypeScript types and static data shapes used across the app. |
| **`test/`** | Vitest setup and example tests. |

Files at the root of **`src/`** (next to those folders): `main.tsx` mounts the React tree; `App.tsx` / `App.css` define the shell layout and routes; `index.css` holds global and Tailwind base styles; `vite-env.d.ts` augments TypeScript with Vite’s client types.

### Root files (configuration and entry)

| File | Purpose |
| ---- | ------- |
| **`index.html`** | HTML shell Vite injects the React bundle into. |
| **`package.json` / `package-lock.json` / `bun.lock` / `bun.lockb`** | npm/Bun dependencies, scripts (`dev`, `build`, `test`, seed commands), and reproducible installs. |
| **`vite.config.ts`** | Vite bundler and dev server configuration. |
| **`vitest.config.ts`** | Unit test runner configuration (used with `npm run test`). |
| **`tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`** | TypeScript compiler options for the app, tooling, and Node-side configs respectively. |
| **`tailwind.config.ts`**, **`postcss.config.js`** | Tailwind CSS theme and PostCSS pipeline for styles. |
| **`eslint.config.js`** | Lint rules (`npm run lint`). |
| **`components.json`** | shadcn/ui generator metadata (component paths and style settings). |
| **`.env.example`** | Template for required environment variable names (copy to `.env.local`). |
| **`.gitignore`** | Paths excluded from version control (for example local env files and build output). |

## Prerequisites

- Node 18+
- A [Supabase](https://supabase.com) project

## One-time Supabase setup

1. In the Supabase dashboard, open **SQL Editor** and run the full scripts in order:

   - `supabase/migrations/001_fittrack_schema.sql`
   - `supabase/migrations/002_exercises_catalog.sql`
   - `supabase/migrations/003_exercises_rapid.sql`

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
- `RAPIDAPI_KEY` — RapidAPI key for ExerciseDB
- `RAPIDAPI_HOST` — default `exercisedb.p.rapidapi.com`

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

## Seed exercise catalog (RapidAPI ExerciseDB -> Supabase)

Imports into tables suffixed with `_rapid`:

- `body_parts_rapid`
- `equipment_rapid`
- `exercises_catalog_rapid`

Command:

```sh
npm run seed:exercises:rapid
```

This imports up to **30 exercises per body part group**.
If a body part already has 30 rows, it skips API calls for that group.

Force refresh:

```sh
npm run seed:exercises:rapid:force
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
| `npm run seed:exercises:rapid` | Import RapidAPI ExerciseDB |
| `npm run seed:exercises:rapid:force` | Force refresh RapidAPI data |
