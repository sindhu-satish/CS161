import { useQuery } from "@tanstack/react-query";
import { TrendingUp } from "lucide-react";
import { format, parseISO, startOfWeek } from "date-fns";
import { getWorkouts } from "@/lib/supabase-db";
import type { Workout } from "@/data/mockData";

interface ProgressChartProps {
  /** Defaults to {@link getWorkouts}; override only for tests. */
  queryFn?: () => Promise<Workout[]>;
}

function lastSixWeeksBenchMax(workouts: Workout[]): { week: string; value: number }[] {
  const byWeek = new Map<string, number>();
  for (const w of workouts) {
    const weekKey = format(startOfWeek(parseISO(w.date), { weekStartsOn: 1 }), "yyyy-MM-dd");
    for (const ex of w.exercises) {
      if (ex.name !== "Bench Press") continue;
      const mx = ex.sets.length ? Math.max(...ex.sets.map((s) => s.weight)) : 0;
      byWeek.set(weekKey, Math.max(byWeek.get(weekKey) ?? 0, mx));
    }
  }
  const sortedKeys = [...byWeek.keys()].sort();
  const lastKeys = sortedKeys.slice(-6);
  if (lastKeys.length === 0) return [];
  return lastKeys.map((k) => ({
    week: format(parseISO(k), "MMM d"),
    value: byWeek.get(k) ?? 0,
  }));
}

const ProgressChart = ({ queryFn = getWorkouts }: ProgressChartProps) => {
  const { data: workouts = [] } = useQuery({
    queryKey: ["workouts"],
    queryFn,
  });

  const data = lastSixWeeksBenchMax(workouts);
  const max = data.length ? Math.max(...data.map((d) => d.value), 1) : 1;
  const latest = data.length ? data[data.length - 1].value : 0;

  if (data.length === 0) {
    return (
      <section className="mx-5 pb-8">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-base font-semibold text-foreground">Strength Progress</h3>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm text-center text-sm text-muted-foreground">
          Log sessions that include <span className="font-medium text-foreground">Bench Press</span> to see
          your weekly max here.
        </div>
      </section>
    );
  }

  return (
    <section className="mx-5 pb-8">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-foreground">Strength Progress</h3>
        <div className="flex items-center gap-1 text-success">
          <TrendingUp className="h-3.5 w-3.5" />
          <span className="text-xs font-semibold">Bench · weekly max</span>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <p className="mb-1 text-xs text-muted-foreground">Bench Press · recent weeks</p>
        <div className="mt-3 flex items-end justify-between gap-2" style={{ height: 100 }}>
          {data.map((d, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="w-full overflow-hidden rounded-md bg-secondary">
                <div
                  className="w-full rounded-md bg-primary transition-all duration-500"
                  style={{ height: `${(d.value / max) * 80}px` }}
                />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">{d.week}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="font-display text-2xl font-bold text-foreground">{latest}</span>
          <span className="text-xs text-muted-foreground">lbs max (latest week)</span>
        </div>
      </div>
    </section>
  );
};

export default ProgressChart;
