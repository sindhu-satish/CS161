import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, Dumbbell, Trophy, Weight, Zap } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { EXERCISE_CATALOG } from "@/data/mockData";
import { format, parseISO } from "date-fns";
import { getWorkoutById } from "@/lib/supabase-db";

const WorkoutDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: workout, isPending, isError } = useQuery({
    queryKey: ["workout", id],
    queryFn: () => getWorkoutById(id!),
    enabled: Boolean(id),
  });

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

  const totalVolume = workout.exercises.reduce(
    (sum, ex) => sum + ex.sets.reduce((s, set) => s + set.weight * set.reps, 0),
    0
  );

  const prs = workout.exercises.filter((ex) => {
    if (!ex.sets.length) return false;
    const catalogEntry = EXERCISE_CATALOG.find((c) => c.name === ex.name);
    if (!catalogEntry || catalogEntry.pr === 0) return false;
    const maxWeight = Math.max(...ex.sets.map((s) => s.weight));
    return maxWeight >= catalogEntry.pr;
  });

  const allWeights = workout.exercises.flatMap((ex) => ex.sets.map((s) => s.weight));
  const topWeight = allWeights.length === 0 ? 0 : Math.max(...allWeights);

  const muscleGroupMap: Record<string, number> = {};
  workout.exercises.forEach((ex) => {
    const vol = ex.sets.reduce((s, set) => s + set.weight * set.reps, 0);
    muscleGroupMap[ex.muscleGroup] = (muscleGroupMap[ex.muscleGroup] || 0) + vol;
  });

  const maxGroupVol = Math.max(...Object.values(muscleGroupMap), 1);
  const radarData = Object.entries(muscleGroupMap).map(([group, vol]) => ({
    muscle: group,
    volume: Math.round((vol / maxGroupVol) * 100),
    rawVolume: vol,
  }));

  const allGroups = ["Chest", "Back", "Shoulders", "Arms", "Legs", "Core"];
  const fullRadarData = allGroups.map((group) => {
    const existing = radarData.find((d) => d.muscle === group);
    return existing || { muscle: group, volume: 0, rawVolume: 0 };
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-md">
        <header className="sticky top-0 z-40 flex items-center gap-3 bg-background/95 backdrop-blur-sm px-5 pt-5 pb-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary transition-colors hover:bg-border"
          >
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">{workout.name}</h1>
            <p className="text-xs text-muted-foreground">
              {format(parseISO(workout.date), "EEEE, MMMM d, yyyy")}
            </p>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-2.5 px-5 mb-5">
          <div className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-3.5 w-3.5 text-accent" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Duration</span>
            </div>
            <p className="font-display text-xl font-bold text-foreground">{workout.duration}</p>
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
          <h3 className="font-display text-sm font-semibold text-foreground mb-2">
            Exercises <span className="text-muted-foreground font-normal">({workout.exercises.length})</span>
          </h3>
          <div className="space-y-2.5">
            {workout.exercises.map((ex, i) => {
              const exVolume = ex.sets.reduce((s, set) => s + set.weight * set.reps, 0);
              const maxWeight = Math.max(...ex.sets.map((s) => s.weight));
              const catalogEntry = EXERCISE_CATALOG.find((c) => c.name === ex.name);
              const isPR = catalogEntry && catalogEntry.pr > 0 && maxWeight >= catalogEntry.pr;

              return (
                <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-accent" />
                      <h4 className="text-sm font-semibold text-foreground">{ex.name}</h4>
                      {isPR && (
                        <span className="flex items-center gap-0.5 rounded-md bg-success/15 px-1.5 py-0.5 text-[10px] font-semibold text-success">
                          <Trophy className="h-2.5 w-2.5" /> PR
                        </span>
                      )}
                    </div>
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {ex.muscleGroup}
                    </span>
                  </div>

                  <div className="ml-6 space-y-0.5">
                    {ex.sets.map((set, j) => (
                      <div key={j} className="flex items-center gap-4 text-xs">
                        <span className="w-10 text-muted-foreground">Set {j + 1}</span>
                        <span className="font-medium text-foreground">{set.weight} lbs</span>
                        <span className="text-muted-foreground">×</span>
                        <span className="font-medium text-foreground">{set.reps} reps</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-2 ml-6 flex gap-3 text-[10px] text-muted-foreground">
                    <span>{ex.sets.length} sets</span>
                    <span>·</span>
                    <span>{exVolume.toLocaleString()} lbs vol</span>
                  </div>
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
