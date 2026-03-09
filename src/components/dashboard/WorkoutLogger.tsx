import { Plus } from "lucide-react";
import { useState } from "react";

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight: number;
}

const defaultExercises: Exercise[] = [
  { name: "Bench Press", sets: 4, reps: 8, weight: 185 },
  { name: "Squat", sets: 3, reps: 10, weight: 225 },
];

const WorkoutLogger = () => {
  const [exercises, setExercises] = useState<Exercise[]>(defaultExercises);

  const addExercise = () => {
    setExercises([...exercises, { name: "New Exercise", sets: 3, reps: 10, weight: 0 }]);
  };

  return (
    <section className="mx-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-foreground">Today's Exercises</h3>
        <button
          onClick={addExercise}
          className="inline-flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-border"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>
      <div className="space-y-2.5">
        {exercises.map((ex, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <div>
              <p className="text-sm font-semibold text-foreground">{ex.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {ex.sets} sets × {ex.reps} reps
              </p>
            </div>
            <div className="rounded-lg bg-secondary px-3 py-1.5">
              <span className="font-display text-sm font-bold text-foreground">{ex.weight}</span>
              <span className="ml-0.5 text-xs text-muted-foreground">lbs</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WorkoutLogger;
