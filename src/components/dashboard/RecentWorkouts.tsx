import { Calendar, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getWorkouts } from "@/lib/supabase-db";

const RecentWorkouts = () => {
  const navigate = useNavigate();
  const { data: workouts = [], isPending } = useQuery({
    queryKey: ["workouts"],
    queryFn: getWorkouts,
  });

  const recent = workouts.slice(0, 3);

  return (
    <section className="mx-5">
      <h3 className="mb-3 font-display text-base font-semibold text-foreground">Recent Workouts</h3>
      {isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : recent.length === 0 ? (
        <p className="text-sm text-muted-foreground">No workouts yet. Start one from the card above.</p>
      ) : (
        <div className="space-y-2.5">
          {recent.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => navigate(`/workout/${w.id}`)}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-secondary/50 cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
                  <Calendar className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{w.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {w.date} · {w.exercises.length} exercises · {w.duration}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

export default RecentWorkouts;
