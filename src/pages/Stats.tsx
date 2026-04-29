import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Trophy, Flame, Scale, BarChart3 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar } from "recharts";
import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  subWeeks,
  startOfDay,
  subDays,
} from "date-fns";
import { getWorkouts } from "@/lib/supabase-db";
import type { Workout, WorkoutExercise } from "@/data/types";

const CARDIO_KEYWORDS = ["cardio", "run", "running", "bike", "cycling", "treadmill", "elliptical", "row"];

function isCardioExercise(exercise: WorkoutExercise): boolean {
  const group = exercise.muscleGroup?.toLowerCase() ?? "";
  const name = exercise.name?.toLowerCase() ?? "";
  return CARDIO_KEYWORDS.some((keyword) => group.includes(keyword) || name.includes(keyword));
}

function sessionVolume(w: Workout): number {
  return w.exercises.reduce(
    (sum, ex) => sum + ex.sets.reduce((t, st) => t + st.weight * st.reps, 0),
    0
  );
}

function computeStreak(workouts: Workout[]): number {
  if (workouts.length === 0) return 0;
  const daySet = new Set(workouts.map((w) => w.date.slice(0, 10)));
  let check = startOfDay(new Date());
  if (!daySet.has(format(check, "yyyy-MM-dd"))) {
    check = subDays(check, 1);
    if (!daySet.has(format(check, "yyyy-MM-dd"))) return 0;
  }
  let streak = 0;
  while (daySet.has(format(check, "yyyy-MM-dd"))) {
    streak++;
    check = subDays(check, 1);
  }
  return streak;
}

function countPRHits(workouts: Workout[]): number {
  const sorted = [...workouts].sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
  const seenMax = new Map<string, number>();
  let hits = 0;

  for (const w of sorted) {
    for (const ex of w.exercises) {
      if (isCardioExercise(ex) || !ex.sets.length) continue;
      const currentMax = Math.max(...ex.sets.map((s) => s.weight));
      const previousMax = seenMax.get(ex.name);
      if (previousMax !== undefined && currentMax > previousMax) {
        hits += 1;
      }
      seenMax.set(ex.name, Math.max(previousMax ?? 0, currentMax));
    }
  }
  return hits;
}

function weeklyVolumeSeries(workouts: Workout[]): { week: string; volume: number }[] {
  const now = new Date();
  const out: { week: string; volume: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const ref = subWeeks(now, i);
    const start = startOfWeek(ref, { weekStartsOn: 1 });
    const end = endOfWeek(ref, { weekStartsOn: 1 });
    let vol = 0;
    for (const w of workouts) {
      const d = parseISO(w.date);
      if (isWithinInterval(d, { start, end })) vol += sessionVolume(w);
    }
    out.push({ week: format(start, "MMM d"), volume: Math.round(vol) });
  }
  return out;
}

function exerciseMaxByWeek(
  workouts: Workout[],
  exerciseName: string
): { week: string; value: number }[] {
  const byWeek = new Map<string, number>();
  for (const w of workouts) {
    const weekKey = format(startOfWeek(parseISO(w.date), { weekStartsOn: 1 }), "yyyy-MM-dd");
    for (const ex of w.exercises) {
      if (isCardioExercise(ex) || ex.name !== exerciseName || !ex.sets.length) continue;
      const mx = Math.max(...ex.sets.map((s) => s.weight));
      byWeek.set(weekKey, Math.max(byWeek.get(weekKey) ?? 0, mx));
    }
  }
  const keys = [...byWeek.keys()].sort().slice(-6);
  return keys.map((k) => ({
    week: format(parseISO(k), "MMM d"),
    value: byWeek.get(k) ?? 0,
  }));
}

const Stats = () => {
  const { data: workouts = [], isPending } = useQuery({
    queryKey: ["workouts"],
    queryFn: getWorkouts,
  });

  const exerciseOptions = useMemo(
    () =>
      Array.from(
        new Set(
          workouts.flatMap((w) =>
            w.exercises.filter((ex) => !isCardioExercise(ex) && ex.sets.length > 0).map((ex) => ex.name).filter(Boolean)
          )
        )
      ).sort((a, b) => a.localeCompare(b)),
    [workouts]
  );
  const [exerciseName, setExerciseName] = useState<string | null>(null);
  const [exerciseSearch, setExerciseSearch] = useState("");

  useEffect(() => {
    if (exerciseOptions.length === 0) {
      setExerciseName(null);
      setExerciseSearch("");
      return;
    }
    if (!exerciseName || !exerciseOptions.includes(exerciseName)) {
      setExerciseName(exerciseOptions[0]);
      setExerciseSearch(exerciseOptions[0]);
    }
  }, [exerciseOptions, exerciseName]);

  const normalizedSearch = exerciseSearch.trim().toLowerCase();
  const selectedExercise = useMemo(() => {
    if (!exerciseName) return null;
    if (!normalizedSearch) return exerciseName;
    const exact = exerciseOptions.find((name) => name.toLowerCase() === normalizedSearch);
    if (exact) return exact;
    return exerciseOptions.find((name) => name.toLowerCase().includes(normalizedSearch)) ?? null;
  }, [exerciseName, exerciseOptions, normalizedSearch]);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const workoutsThisWeek = workouts.filter((w) => {
    const d = parseISO(w.date);
    return isWithinInterval(d, { start: weekStart, end: weekEnd });
  }).length;

  const currentStreak = useMemo(() => computeStreak(workouts), [workouts]);
  const totalPRs = useMemo(() => countPRHits(workouts), [workouts]);
  const weeklyVolume = useMemo(() => weeklyVolumeSeries(workouts), [workouts]);
  const prSeries = useMemo(
    () => (selectedExercise ? exerciseMaxByWeek(workouts, selectedExercise) : []),
    [workouts, selectedExercise]
  );

  const volFirst = weeklyVolume[0]?.volume ?? 0;
  const volLast = weeklyVolume[weeklyVolume.length - 1]?.volume ?? 0;
  const volDeltaPct =
    volFirst > 0 ? Math.round(((volLast - volFirst) / volFirst) * 100) : volLast > 0 ? 100 : 0;

  const selectedPRData = prSeries.length
    ? prSeries
    : [{ week: "—", value: 0 }];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-md">
        <header className="px-5 pt-6 pb-4">
          <h1 className="font-display text-2xl font-bold text-foreground">Statistics</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your training performance at a glance</p>
        </header>

        {isPending ? (
          <p className="px-5 text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2.5 px-5 mb-5">
              {[
                { icon: Flame, label: "This Week", value: workoutsThisWeek, suffix: "workouts", color: "text-accent" },
                { icon: Trophy, label: "Streak", value: currentStreak, suffix: "days", color: "text-success" },
                { icon: BarChart3, label: "Total PRs", value: totalPRs, suffix: "hits", color: "text-accent" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-border bg-card p-3 shadow-sm text-center">
                  <stat.icon className={`mx-auto h-4 w-4 ${stat.color} mb-1`} />
                  <p className="font-display text-xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.suffix}</p>
                </div>
              ))}
            </div>

            <section className="px-5 mb-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display text-sm font-semibold text-foreground">Weekly Volume</h3>
                <div className={`flex items-center gap-1 ${volDeltaPct >= 0 ? "text-success" : "text-destructive"}`}>
                  {volDeltaPct >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  <span className="text-xs font-semibold">
                    {volDeltaPct >= 0 ? "+" : ""}
                    {volDeltaPct}%
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                {weeklyVolume.every((w) => w.volume === 0) ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">Log workouts to see weekly volume.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={140}>
                    <AreaChart data={weeklyVolume}>
                      <defs>
                        <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(48, 96%, 60%)" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="hsl(48, 96%, 60%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="week"
                        tick={{ fontSize: 10, fill: "hsl(220, 10%, 46%)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{
                          fontSize: 12,
                          borderRadius: 8,
                          border: "1px solid hsl(40, 18%, 88%)",
                          background: "hsl(40, 30%, 99%)",
                        }}
                        formatter={(v: number) => [`${v.toLocaleString()} lbs`, "Volume"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="volume"
                        stroke="hsl(48, 96%, 60%)"
                        strokeWidth={2}
                        fill="url(#volumeGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            <section className="px-5 mb-5">
              <h3 className="font-display text-sm font-semibold text-foreground mb-2">PR Progress (logged)</h3>
              {exerciseOptions.length > 0 ? (
                <div className="mb-3">
                  <input
                    type="text"
                    list="pr-exercise-options"
                    value={exerciseSearch}
                    onChange={(e) => {
                      const next = e.target.value;
                      setExerciseSearch(next);
                      const exact = exerciseOptions.find((name) => name.toLowerCase() === next.trim().toLowerCase());
                      if (exact) setExerciseName(exact);
                    }}
                    placeholder="Search exercise for PR progress"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <datalist id="pr-exercise-options">
                    {exerciseOptions.map((name) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                </div>
              ) : (
                <p className="mb-3 text-xs text-muted-foreground">Log workouts with sets to see PR progress by exercise.</p>
              )}
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={selectedPRData}>
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 10, fill: "hsl(220, 10%, 46%)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: "1px solid hsl(40, 18%, 88%)",
                        background: "hsl(40, 30%, 99%)",
                      }}
                      formatter={(v: number) => [`${v} lbs`, "Max"]}
                    />
                    <Bar dataKey="value" fill="hsl(48, 96%, 60%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-display text-2xl font-bold text-foreground">
                    {selectedPRData[selectedPRData.length - 1]?.value ?? 0}
                  </span>
                  <span className="text-xs text-muted-foreground">lbs max ({selectedExercise ?? "No exercise"})</span>
                </div>
              </div>
            </section>

            <section className="px-5 mb-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display text-sm font-semibold text-foreground">Body Weight</h3>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Scale className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Not tracked</span>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm text-center text-sm text-muted-foreground">
                Body weight logging can be added in a future release. Volume and PR charts above use your saved
                workouts.
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default Stats;
