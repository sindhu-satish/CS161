import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Clock, Dumbbell, Minus, Plus, Search, Trash2, Trophy, Weight, X, Zap } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";
import { getWorkoutById, getWorkouts, updateWorkoutDetails } from "@/lib/supabase-db";
import type { WorkoutExercise } from "@/data/types";
import { fetchExerciseCatalogFromDb } from "@/lib/exercise-catalog";

function parseDurationMinutes(duration: string): number {
  const normalized = duration.trim().toLowerCase();
  const num = Number.parseInt(normalized, 10);
  if (Number.isNaN(num) || num <= 0) return 1;
  return num;
}

function formatDurationMinutes(minutes: number): string {
  return `${Math.max(1, minutes)} min`;
}

function normalizeExerciseName(name: string): string {
  return name.trim().toLowerCase();
}

function normalizeMuscleGroup(group: string): string {
  const normalized = group.trim().toLowerCase();
  if (!normalized) return "Other";
  if (normalized.includes("chest")) return "Chest";
  if (normalized.includes("back") || normalized.includes("lats")) return "Back";
  if (normalized.includes("shoulder") || normalized.includes("deltoid")) return "Shoulders";
  if (normalized.includes("arm") || normalized.includes("bicep") || normalized.includes("tricep")) return "Arms";
  if (normalized.includes("leg") || normalized.includes("glute") || normalized.includes("calf") || normalized.includes("quad") || normalized.includes("hamstring")) {
    return "Legs";
  }
  if (normalized.includes("core") || normalized.includes("waist") || normalized.includes("ab")) return "Core";
  return "Other";
}

const WorkoutDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [draftName, setDraftName] = useState("");
  const [draftDurationMinutes, setDraftDurationMinutes] = useState(1);
  const [draftExercises, setDraftExercises] = useState<WorkoutExercise[]>([]);
  const [setInputDrafts, setSetInputDrafts] = useState<Record<string, string>>({});
  const [catalogExercises, setCatalogExercises] = useState<Array<{ name: string; muscleGroup: string }>>([]);
  const [showExerciseSearch, setShowExerciseSearch] = useState(false);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const { data: workout, isPending, isError } = useQuery({
    queryKey: ["workout", id],
    queryFn: () => getWorkoutById(id!),
    enabled: Boolean(id),
  });
  const { data: allWorkouts = [] } = useQuery({
    queryKey: ["workouts"],
    queryFn: getWorkouts,
  });

  useEffect(() => {
    let cancelled = false;
    fetchExerciseCatalogFromDb()
      .then((rows) => {
        if (cancelled) return;
        setCatalogExercises(rows.map((row) => ({ name: row.name, muscleGroup: row.muscleGroup || "Other" })));
      })
      .catch(() => {
        if (cancelled) return;
        setCatalogExercises([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!workout) return;
    setDraftName(workout.name);
    setDraftDurationMinutes(parseDurationMinutes(workout.duration));
    setDraftExercises(
      workout.exercises.map((ex) => ({
        ...ex,
        sets: ex.sets.map((set) => ({ ...set })),
      }))
    );
    setSetInputDrafts({});
  }, [workout]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (isError || !workout) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-5">
        <p className="text-muted-foreground">Workout not found.</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-xl bg-secondary px-4 py-2 text-sm font-medium"
        >
          Go back
        </button>
      </div>
    );
  }

  const totalVolume = draftExercises.reduce(
    (sum, ex) => sum + ex.sets.reduce((s, set) => s + set.weight * set.reps, 0),
    0
  );

  const priorMaxByExercise = new Map<string, number>();
  const workoutDateMs = parseISO(workout.date).getTime();
  const sorted = [...allWorkouts].sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
  for (const prev of sorted) {
    if (prev.id === workout.id) continue;
    if (parseISO(prev.date).getTime() >= workoutDateMs) continue;
    for (const ex of prev.exercises) {
      if (!ex.sets.length) continue;
      const mx = Math.max(...ex.sets.map((s) => s.weight));
      const normalizedName = normalizeExerciseName(ex.name);
      if (!normalizedName) continue;
      priorMaxByExercise.set(normalizedName, Math.max(priorMaxByExercise.get(normalizedName) ?? 0, mx));
    }
  }

  const prs = draftExercises.filter((ex) => {
    if (!ex.sets.length) return false;
    const maxWeight = Math.max(...ex.sets.map((s) => s.weight));
    const priorMax = priorMaxByExercise.get(normalizeExerciseName(ex.name));
    return priorMax !== undefined && maxWeight > priorMax;
  });

  const allWeights = draftExercises.flatMap((ex) => ex.sets.map((s) => s.weight));
  const topWeight = allWeights.length === 0 ? 0 : Math.max(...allWeights);

  const muscleGroupMap: Record<string, number> = {};
  draftExercises.forEach((ex) => {
    const vol = ex.sets.reduce((s, set) => s + set.weight * set.reps, 0);
    const normalizedGroup = normalizeMuscleGroup(ex.muscleGroup);
    muscleGroupMap[normalizedGroup] = (muscleGroupMap[normalizedGroup] || 0) + vol;
  });

  const maxGroupVol = Math.max(...Object.values(muscleGroupMap), 1);
  const radarData = Object.entries(muscleGroupMap).map(([group, vol]) => ({
    muscle: group,
    volume: Math.round((vol / maxGroupVol) * 100),
    rawVolume: vol,
  }));

  const allGroups = ["Chest", "Back", "Shoulders", "Arms", "Legs", "Core", "Other"];
  const fullRadarData = allGroups.map((group) => {
    const existing = radarData.find((d) => d.muscle === group);
    return existing || { muscle: group, volume: 0, rawVolume: 0 };
  });
  const normalizedName = draftName.trim();
  const normalizedDuration = formatDurationMinutes(draftDurationMinutes);
  const isDirty =
    normalizedName !== workout.name ||
    normalizedDuration !== workout.duration ||
    JSON.stringify(draftExercises) !== JSON.stringify(workout.exercises);

  const updateExerciseName = (exerciseIndex: number, name: string) => {
    setDraftExercises((prev) => {
      const copy = [...prev];
      copy[exerciseIndex] = { ...copy[exerciseIndex], name };
      return copy;
    });
  };

  const updateSetReps = (exerciseIndex: number, setIndex: number, reps: number) => {
    setDraftExercises((prev) => {
      const copy = [...prev];
      const sets = [...copy[exerciseIndex].sets];
      sets[setIndex] = { ...sets[setIndex], reps: Math.max(0, reps) };
      copy[exerciseIndex] = { ...copy[exerciseIndex], sets };
      return copy;
    });
  };

  const updateSetWeight = (exerciseIndex: number, setIndex: number, weight: number) => {
    setDraftExercises((prev) => {
      const copy = [...prev];
      const sets = [...copy[exerciseIndex].sets];
      sets[setIndex] = { ...sets[setIndex], weight: Math.max(0, weight) };
      copy[exerciseIndex] = { ...copy[exerciseIndex], sets };
      return copy;
    });
  };

  const getSetInputKey = (exerciseIndex: number, setIndex: number, field: "weight" | "reps") =>
    `${exerciseIndex}-${setIndex}-${field}`;

  const removeExercise = (exerciseIndex: number) => {
    setDraftExercises((prev) => prev.filter((_, idx) => idx !== exerciseIndex));
  };

  const addSetToExercise = (exerciseIndex: number) => {
    setDraftExercises((prev) => {
      const copy = [...prev];
      const existingSets = copy[exerciseIndex].sets;
      const lastSet = existingSets[existingSets.length - 1];
      const nextSet = {
        weight: lastSet?.weight ?? 0,
        reps: lastSet?.reps ?? 8,
        done: false,
      };
      copy[exerciseIndex] = { ...copy[exerciseIndex], sets: [...existingSets, nextSet] };
      return copy;
    });
  };

  const removeSetFromExercise = (exerciseIndex: number, setIndex: number) => {
    setDraftExercises((prev) => {
      const copy = [...prev];
      const existingSets = copy[exerciseIndex].sets;
      if (existingSets.length <= 1) return prev;
      copy[exerciseIndex] = {
        ...copy[exerciseIndex],
        sets: existingSets.filter((_, idx) => idx !== setIndex),
      };
      return copy;
    });
  };

  const addExercise = () => {
    setShowExerciseSearch(true);
    setExerciseSearchQuery("");
  };

  const addExerciseFromCatalog = (exerciseName: string, muscleGroup: string) => {
    setDraftExercises((prev) => [
      ...prev,
      {
        name: exerciseName,
        muscleGroup: muscleGroup || "Other",
        sets: [{ weight: 0, reps: 8, done: true }],
      },
    ]);
    setShowExerciseSearch(false);
    setExerciseSearchQuery("");
  };

  const filteredCatalogExercises = catalogExercises.filter((exercise) =>
    exercise.name.toLowerCase().includes(exerciseSearchQuery.trim().toLowerCase())
  );

  const handleSaveMetadata = async () => {
    if (!normalizedName || !normalizedDuration || !id) {
      setSaveError("Name and duration are required.");
      return;
    }
    if (draftExercises.some((ex) => !ex.name.trim())) {
      setSaveError("Exercise names cannot be empty.");
      return;
    }
    setIsSaving(true);
    setSaveError("");
    try {
      await updateWorkoutDetails(id, {
        name: normalizedName,
        duration: normalizedDuration,
        exercises: draftExercises,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["workout", id] }),
        queryClient.invalidateQueries({ queryKey: ["workouts"] }),
      ]);
    } catch {
      setSaveError("Could not save workout details.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto w-full max-w-4xl">
        <header className="sticky top-0 z-40 flex items-center gap-3 bg-background/95 backdrop-blur-sm px-5 pt-5 pb-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary transition-colors hover:bg-border"
          >
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </button>
          <div className="min-w-0 flex-1">
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              className="w-full rounded-md bg-transparent px-1 py-0.5 font-display text-xl font-bold text-foreground outline-none ring-1 ring-transparent focus:ring-primary/40"
            />
            <p className="text-xs text-muted-foreground">
              {format(parseISO(workout.date), "EEEE, MMMM d, yyyy")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleSaveMetadata()}
            disabled={!isDirty || isSaving}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </header>
        {saveError && <p className="px-5 pb-2 text-xs text-destructive">{saveError}</p>}

        <div className="grid grid-cols-2 gap-2.5 px-5 mb-5">
          <div className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-3.5 w-3.5 text-accent" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Duration</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDraftDurationMinutes((prev) => Math.max(1, prev - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-foreground transition-colors hover:bg-border"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                min={1}
                step={1}
                value={draftDurationMinutes}
                onChange={(e) => {
                  const nextValue = Number.parseInt(e.target.value, 10);
                  setDraftDurationMinutes(Number.isNaN(nextValue) ? 1 : Math.max(1, nextValue));
                }}
                className="h-8 w-16 rounded-md border border-border bg-background px-2 text-center font-display text-xl font-bold tabular-nums text-foreground outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                type="button"
                onClick={() => setDraftDurationMinutes((prev) => prev + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-foreground transition-colors hover:bg-border"
              >
                <Plus className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-muted-foreground">min</span>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Weight className="h-3.5 w-3.5 text-accent" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Volume</span>
            </div>
            <p className="font-display text-xl font-bold text-foreground">
              {totalVolume.toLocaleString()}
              <span className="text-xs font-normal text-muted-foreground ml-1">lbs</span>
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-3.5 w-3.5 text-success" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">PRs Hit</span>
            </div>
            <p className="font-display text-xl font-bold text-foreground">{prs.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-3.5 w-3.5 text-accent" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Top Weight</span>
            </div>
            <p className="font-display text-xl font-bold text-foreground">
              {topWeight}
              <span className="text-xs font-normal text-muted-foreground ml-1">lbs</span>
            </p>
          </div>
        </div>

        <section className="px-5 mb-5">
          <h3 className="font-display text-sm font-semibold text-foreground mb-2">Muscle Split</h3>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={fullRadarData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="muscle"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />
                <Radar
                  name="Volume"
                  dataKey="volume"
                  stroke="hsl(48, 96%, 50%)"
                  fill="hsl(48, 96%, 55%)"
                  fillOpacity={0.35}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="px-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-foreground">
              Exercises <span className="text-muted-foreground font-normal">({draftExercises.length})</span>
            </h3>
            <button
              type="button"
              onClick={addExercise}
              className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1 text-xs font-medium text-foreground hover:bg-border"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </div>
          {showExerciseSearch && (
            <div className="mb-3 rounded-xl border border-primary bg-card shadow-sm">
              <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  autoFocus
                  value={exerciseSearchQuery}
                  onChange={(e) => setExerciseSearchQuery(e.target.value)}
                  placeholder="Search exercises..."
                  className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowExerciseSearch(false);
                    setExerciseSearchQuery("");
                  }}
                  className="text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-52 overflow-y-auto p-1">
                {filteredCatalogExercises.map((exercise) => (
                  <button
                    key={exercise.name}
                    type="button"
                    onClick={() => addExerciseFromCatalog(exercise.name, exercise.muscleGroup)}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-secondary"
                  >
                    {exercise.name}
                  </button>
                ))}
                {filteredCatalogExercises.length === 0 && (
                  <p className="px-3 py-2 text-sm text-muted-foreground">No matching exercises in catalog.</p>
                )}
              </div>
            </div>
          )}
          <div className="space-y-2.5">
            {draftExercises.map((ex, i) => {
              const exVolume = ex.sets.reduce((s, set) => s + set.weight * set.reps, 0);
              const maxWeight = Math.max(...ex.sets.map((s) => s.weight));
              const priorMax = priorMaxByExercise.get(normalizeExerciseName(ex.name));
              const isPR = priorMax !== undefined && maxWeight > priorMax;

              return (
                <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Dumbbell className="h-4 w-4 text-accent" />
                      <input
                        value={ex.name}
                        onChange={(e) => updateExerciseName(i, e.target.value)}
                        className="min-w-0 flex-1 rounded-md bg-transparent px-1 py-0.5 text-sm font-semibold text-foreground outline-none ring-1 ring-transparent focus:ring-primary/40"
                      />
                      {isPR && (
                        <span className="flex items-center gap-0.5 rounded-md bg-success/15 px-1.5 py-0.5 text-[10px] font-semibold text-success">
                          <Trophy className="h-2.5 w-2.5" /> PR
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {ex.muscleGroup}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeExercise(i)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="ml-6 space-y-0.5">
                    {ex.sets.map((set, j) => (
                      <div key={j} className="flex items-center gap-4 text-xs">
                        <span className="w-10 text-muted-foreground">Set {j + 1}</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={setInputDrafts[getSetInputKey(i, j, "weight")] ?? String(set.weight)}
                            onChange={(e) => {
                              const key = getSetInputKey(i, j, "weight");
                              setSetInputDrafts((prev) => ({ ...prev, [key]: e.target.value }));
                            }}
                            onBlur={() => {
                              const key = getSetInputKey(i, j, "weight");
                              const rawValue = setInputDrafts[key] ?? String(set.weight);
                              const parsed = Number.parseInt(rawValue, 10);
                              updateSetWeight(i, j, Number.isNaN(parsed) ? 0 : parsed);
                              setSetInputDrafts((prev) => {
                                const { [key]: _removed, ...rest } = prev;
                                return rest;
                              });
                            }}
                            className="h-7 w-20 rounded-md border border-border bg-background px-2 text-center font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                          />
                          <span className="font-medium text-foreground">lbs</span>
                        </div>
                        <span className="text-muted-foreground">×</span>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={setInputDrafts[getSetInputKey(i, j, "reps")] ?? String(set.reps)}
                          onChange={(e) => {
                            const key = getSetInputKey(i, j, "reps");
                            setSetInputDrafts((prev) => ({ ...prev, [key]: e.target.value }));
                          }}
                          onBlur={() => {
                            const key = getSetInputKey(i, j, "reps");
                            const rawValue = setInputDrafts[key] ?? String(set.reps);
                            const parsed = Number.parseInt(rawValue, 10);
                            updateSetReps(i, j, Number.isNaN(parsed) ? 0 : parsed);
                            setSetInputDrafts((prev) => {
                              const { [key]: _removed, ...rest } = prev;
                              return rest;
                            });
                          }}
                          className="h-7 w-16 rounded-md border border-border bg-background px-2 text-center font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                        />
                        <span className="font-medium text-foreground">reps</span>
                        <button
                          type="button"
                          onClick={() => removeSetFromExercise(i, j)}
                          disabled={ex.sets.length <= 1}
                          className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-2 ml-6 flex gap-3 text-[10px] text-muted-foreground">
                    <span>{ex.sets.length} sets</span>
                    <span>·</span>
                    <span>{exVolume.toLocaleString()} lbs vol</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => addSetToExercise(i)}
                    className="mt-2 ml-6 inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-border"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Set
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default WorkoutDetail;
