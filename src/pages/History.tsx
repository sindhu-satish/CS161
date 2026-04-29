import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, ChevronRight, Dumbbell as DumbbellIcon, Trash2 } from "lucide-react";
import { getWorkouts, deleteWorkout } from "@/lib/supabase-db";
import type { Workout } from "@/data/types";
import { format, parseISO } from "date-fns";

const History = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: workouts = [], isPending } = useQuery({
    queryKey: ["workouts"],
    queryFn: getWorkouts,
  });

  const totalVolume = (w: Workout) =>
    w.exercises.reduce(
      (sum, ex) => sum + ex.sets.reduce((s, set) => s + set.weight * set.reps, 0),
      0
    );

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteWorkout(id);
    await qc.invalidateQueries({ queryKey: ["workouts"] });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto w-full max-w-4xl">
        <header className="px-5 pt-6 pb-4">
          <h1 className="font-display text-2xl font-bold text-foreground">Workout History</h1>
          <p className="mt-1 text-sm text-muted-foreground">{workouts.length} workouts logged</p>
        </header>

        {isPending ? (
          <p className="px-5 text-sm text-muted-foreground">Loading…</p>
        ) : workouts.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-sm text-muted-foreground">No workouts logged yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">Finish a workout to see it here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 px-5">
            {workouts.map((w) => (
              <div
                key={w.id}
                className="rounded-xl border border-border bg-card shadow-sm overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => navigate(`/workout/${w.id}`)}
                  className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-secondary/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
                      <Calendar className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{w.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(w.date), "MMM d, yyyy")} · {w.duration}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-xs font-semibold text-foreground">{w.exercises.length} exercises</p>
                      <p className="text-[10px] text-muted-foreground">{totalVolume(w).toLocaleString()} lbs vol</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => void handleDelete(w.id, e)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>

                <div className="border-t border-border bg-secondary/20 px-4 py-3 space-y-3">
                  {w.exercises.map((ex, i) => (
                    <div key={i}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <DumbbellIcon className="h-3.5 w-3.5 text-accent" />
                        <span className="text-xs font-semibold text-foreground">{ex.name}</span>
                        <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {ex.muscleGroup}
                        </span>
                      </div>
                      <div className="ml-5 space-y-0.5">
                        {ex.sets.map((set, j) => (
                          <p key={j} className="text-xs text-muted-foreground">
                            Set {j + 1}:{" "}
                            <span className="font-medium text-foreground">{set.weight} lbs</span> ×{" "}
                            <span className="font-medium text-foreground">{set.reps} reps</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
