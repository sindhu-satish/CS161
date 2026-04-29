import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Plus, X, Pause, Play, Square } from "lucide-react";
import type { WorkoutPlan } from "./PlanWorkout";
import { saveWorkout } from "@/lib/supabase-db";
import type { Workout } from "@/data/mockData";

const EXERCISE_LIST = [
  "Bench Press", "Squat", "Deadlift", "Overhead Press", "Barbell Row",
  "Pull Up", "Push Up", "Dumbbell Curl", "Tricep Dip", "Leg Press",
  "Lat Pulldown", "Cable Fly", "Lunges", "Romanian Deadlift", "Calf Raise",
  "Face Pull", "Lateral Raise", "Front Raise", "Hammer Curl", "Skull Crusher",
];

interface SetEntry {
  weight: number;
  reps: number;
  done: boolean;
}

interface LoggedExercise {
  name: string;
  muscleGroup: string;
  sets: SetEntry[];
}

const MUSCLE_GROUP_MAP: Record<string, string> = {
  "Bench Press": "Chest", "Incline Bench Press": "Chest", "Cable Fly": "Chest", "Push Up": "Chest",
  "Squat": "Legs", "Romanian Deadlift": "Legs", "Leg Press": "Legs", "Lunges": "Legs", "Calf Raise": "Legs",
  "Deadlift": "Back", "Barbell Row": "Back", "Pull Up": "Back", "Lat Pulldown": "Back",
  "Overhead Press": "Shoulders", "Lateral Raise": "Shoulders", "Front Raise": "Shoulders", "Face Pull": "Shoulders",
  "Dumbbell Curl": "Arms", "Hammer Curl": "Arms", "Tricep Dip": "Arms", "Skull Crusher": "Arms",
  "Plank": "Core", "Cable Crunch": "Core", "Hanging Leg Raise": "Core",
};

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h > 0 ? `${h}:` : ""}${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
};

interface ActiveWorkoutProps {
  onFinish: () => void;
  plan?: WorkoutPlan;
}

const ActiveWorkout = ({ onFinish, plan }: ActiveWorkoutProps) => {
  const qc = useQueryClient();
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [exercises, setExercises] = useState<LoggedExercise[]>(() => {
    if (plan) {
      return plan.exercises.map((ex) => ({
        name: ex.name,
        muscleGroup: MUSCLE_GROUP_MAP[ex.name] || "Other",
        sets: ex.sets.map((s) => ({ weight: s.targetWeight, reps: s.targetReps, done: false })),
      }));
    }
    return [];
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!paused) {
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused]);

  const filtered = EXERCISE_LIST.filter((e) =>
    e.toLowerCase().includes(query.toLowerCase())
  );

  const addExercise = (name: string) => {
    setExercises((prev) => [
      ...prev,
      { name, muscleGroup: MUSCLE_GROUP_MAP[name] || "Other", sets: [{ weight: 0, reps: 0, done: false }] },
    ]);
    setShowSearch(false);
    setQuery("");
  };

  const addSet = (exIdx: number) => {
    setExercises((prev) => {
      const copy = [...prev];
      const lastSet = copy[exIdx].sets[copy[exIdx].sets.length - 1];
      copy[exIdx] = {
        ...copy[exIdx],
        sets: [...copy[exIdx].sets, { weight: lastSet?.weight || 0, reps: lastSet?.reps || 0, done: false }],
      };
      return copy;
    });
  };

  const updateSet = (exIdx: number, setIdx: number, field: "weight" | "reps", value: string) => {
    setExercises((prev) => {
      const copy = [...prev];
      const sets = [...copy[exIdx].sets];
      sets[setIdx] = { ...sets[setIdx], [field]: Number(value) || 0 };
      copy[exIdx] = { ...copy[exIdx], sets };
      return copy;
    });
  };

  const toggleDone = (exIdx: number, setIdx: number) => {
    setExercises((prev) => {
      const copy = [...prev];
      const sets = [...copy[exIdx].sets];
      sets[setIdx] = { ...sets[setIdx], done: !sets[setIdx].done };
      copy[exIdx] = { ...copy[exIdx], sets };
      return copy;
    });
  };

  const removeExercise = (exIdx: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== exIdx));
  };

  const handleFinish = async () => {
    if (exercises.length === 0) {
      onFinish();
      return;
    }
    const workout: Workout = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split("T")[0],
      name: plan?.name || "Quick Workout",
      duration: formatDuration(elapsed),
      exercises: exercises.map((ex) => ({
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        sets: ex.sets.map((s) => ({ weight: s.weight, reps: s.reps, done: s.done })),
      })),
    };
    try {
      await saveWorkout(workout);
      await qc.invalidateQueries({ queryKey: ["workouts"] });
      onFinish();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save workout");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md">
        <div className="sticky top-0 z-10 bg-foreground px-5 pb-4 pt-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-primary">Workout in progress</p>
              <p className="font-display text-3xl font-bold tabular-nums text-background">
                {formatTime(elapsed)}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaused(!paused)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-background/10 transition-colors hover:bg-background/20"
              >
                {paused ? (
                  <Play className="h-4 w-4 text-background" />
                ) : (
                  <Pause className="h-4 w-4 text-background" />
                )}
              </button>
              <button
                type="button"
                onClick={() => void handleFinish()}
                className="flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 font-display text-sm font-semibold text-primary-foreground transition-colors hover:brightness-105"
              >
                <Square className="h-3.5 w-3.5" />
                Finish
              </button>
            </div>
          </div>
          <div className="mt-3 flex gap-4 text-xs text-background/60">
            <span>{exercises.length} exercises</span>
            <span>{exercises.reduce((a, e) => a + e.sets.filter((s) => s.done).length, 0)} sets done</span>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-5 py-5">
          {exercises.map((ex, exIdx) => (
            <div key={exIdx} className="rounded-xl border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{ex.name}</h4>
                  <span className="text-[10px] text-muted-foreground">{ex.muscleGroup}</span>
                </div>
                <button type="button" onClick={() => removeExercise(exIdx)} className="text-muted-foreground hover:text-destructive">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Set</span>
                <span>Weight (lbs)</span>
                <span>Reps</span>
                <span></span>
              </div>
              {ex.sets.map((set, setIdx) => (
                <div
                  key={setIdx}
                  className={`grid grid-cols-[2rem_1fr_1fr_2.5rem] items-center gap-2 px-4 py-1.5 ${set.done ? "opacity-50" : ""}`}
                >
                  <span className="text-xs font-semibold text-muted-foreground">{setIdx + 1}</span>
                  <input
                    type="number"
                    value={set.weight || ""}
                    onChange={(e) => updateSet(exIdx, setIdx, "weight", e.target.value)}
                    placeholder="0"
                    className="h-9 rounded-lg border border-border bg-secondary px-3 text-sm font-medium text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <input
                    type="number"
                    value={set.reps || ""}
                    onChange={(e) => updateSet(exIdx, setIdx, "reps", e.target.value)}
                    placeholder="0"
                    className="h-9 rounded-lg border border-border bg-secondary px-3 text-sm font-medium text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => toggleDone(exIdx, setIdx)}
                    className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold transition-colors ${
                      set.done
                        ? "bg-green-500 text-white"
                        : "bg-secondary text-muted-foreground hover:bg-border"
                    }`}
                  >
                    ✓
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addSet(exIdx)}
                className="mx-4 my-3 flex w-fit items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-border"
              >
                <Plus className="h-3 w-3" />
                Add Set
              </button>
            </div>
          ))}

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
                <button type="button" onClick={() => { setShowSearch(false); setQuery(""); }} className="text-muted-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-52 overflow-y-auto p-1">
                {filtered.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => addExercise(name)}
                    className="w-full rounded-lg px-4 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                  >
                    {name}
                  </button>
                ))}
                {filtered.length === 0 && (
                  <button
                    type="button"
                    onClick={() => addExercise(query)}
                    className="w-full rounded-lg px-4 py-2.5 text-left text-sm text-foreground hover:bg-secondary"
                  >
                    Add "<span className="font-semibold">{query}</span>" as custom exercise
                  </button>
                )}
              </div>
            </div>
          ) : (
            <button
              type="button"
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

export default ActiveWorkout;
