import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus, X, Search, GripVertical } from "lucide-react";
import type { ExerciseInfo } from "@/data/types";
import { fetchExerciseCatalogFromDb } from "@/lib/exercise-catalog";
import { isSupabaseConfigured } from "@/lib/supabase";

export interface PlannedSet {
  targetWeight: number;
  targetReps: number;
}

export interface PlannedExercise {
  name: string;
  muscleGroup: string;
  sets: PlannedSet[];
  notes: string;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  exercises: PlannedExercise[];
}

interface PlanWorkoutProps {
  onSave: (plan: WorkoutPlan) => void;
  onCancel: () => void;
  initialPlan?: WorkoutPlan;
}

const PlanWorkout = ({ onSave, onCancel, initialPlan }: PlanWorkoutProps) => {
  const [name, setName] = useState(initialPlan?.name || "");
  const [exercises, setExercises] = useState<PlannedExercise[]>(initialPlan?.exercises || []);
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState<ExerciseInfo[]>([]);

  useEffect(() => {
    let mounted = true;
    if (!isSupabaseConfigured()) {
      setCatalog([]);
      return;
    }

    fetchExerciseCatalogFromDb()
      .then((rows) => {
        if (!mounted) return;
        setCatalog(rows);
      })
      .catch(() => {
        if (!mounted) return;
        setCatalog([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const exerciseNames = useMemo(() => catalog.map((e) => e.name), [catalog]);
  const catalogById = useMemo(
    () => catalog.reduce<Record<string, ExerciseInfo>>((acc, ex) => ({ ...acc, [ex.id]: ex }), {}),
    [catalog]
  );

  useEffect(() => {
    if (catalog.length === 0) return;
    setExercises((prev) =>
      prev.map((ex) => {
        const exerciseId = (ex as { exerciseId?: string }).exerciseId;
        const fromCatalog = exerciseId ? catalogById[exerciseId] : undefined;
        if (!fromCatalog) return ex;
        return {
          ...ex,
          name: ex.name || fromCatalog.name,
          muscleGroup: ex.muscleGroup || fromCatalog.muscleGroup || "Other",
        };
      })
    );
  }, [catalog, catalogById]);

  const filtered = exerciseNames.filter(
    (e) =>
      e.toLowerCase().includes(query.toLowerCase()) &&
      !exercises.some((ex) => ex.name === e)
  );

  const addExercise = (exerciseName: string) => {
    const catalogEntry = catalog.find((e) => e.name === exerciseName);
    setExercises((prev) => [
      ...prev,
      {
        name: exerciseName,
        muscleGroup: catalogEntry?.muscleGroup || "Other",
        sets: [{ targetWeight: 0, targetReps: 0 }],
        notes: "",
      },
    ]);
    setShowSearch(false);
    setQuery("");
  };

  const removeExercise = (idx: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id: initialPlan?.id || `plan-${Date.now()}`,
      name: name.trim(),
      exercises,
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-5 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onCancel}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary transition-colors hover:bg-border"
              >
                <ArrowLeft className="h-4 w-4 text-foreground" />
              </button>
              <h1 className="font-display text-xl font-bold text-foreground">
                {initialPlan ? "Edit Plan" : "Plan Workout"}
              </h1>
            </div>
            <button
              onClick={handleSave}
              disabled={!name.trim() || exercises.length === 0}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-5">
          {/* Workout name */}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Workout name (e.g. Push Day)"
            className="h-12 rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
          />

          {/* Exercises */}
          {exercises.map((ex, exIdx) => (
            <div key={exIdx} className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50" />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{ex.name || "Unknown Exercise"}</h4>
                    <span className="text-[10px] text-muted-foreground">{ex.muscleGroup}</span>
                  </div>
                </div>
                <button onClick={() => removeExercise(exIdx)} className="text-muted-foreground hover:text-destructive">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Add exercise */}
          {showSearch ? (
            <div className="rounded-xl border border-primary bg-card shadow-sm">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search exercises..."
                  className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
                <button onClick={() => { setShowSearch(false); setQuery(""); }} className="text-muted-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-52 overflow-y-auto p-1">
                {filtered.map((exerciseName) => (
                  <button
                    key={exerciseName}
                    onClick={() => addExercise(exerciseName)}
                    className="w-full rounded-lg px-4 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                  >
                    {exerciseName}
                  </button>
                ))}
                {filtered.length === 0 && query && (
                  <p className="px-4 py-2.5 text-sm text-muted-foreground">No matching exercises in catalog.</p>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
              Add Exercise
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanWorkout;
