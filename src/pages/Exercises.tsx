import { useState } from "react";
import { Search } from "lucide-react";
import { EXERCISE_CATALOG, MUSCLE_GROUPS, type ExerciseInfo } from "@/data/mockData";
import ExerciseDetailDialog from "@/components/ExerciseDetailDialog";

const Exercises = () => {
  const [query, setQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [selectedExercise, setSelectedExercise] = useState<ExerciseInfo | null>(null);

  const filtered = EXERCISE_CATALOG.filter((ex) => {
    const matchesQuery = ex.name.toLowerCase().includes(query.toLowerCase());
    const matchesGroup = selectedGroup === "All" || ex.muscleGroup === selectedGroup;
    return matchesQuery && matchesGroup;
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-md">
        <header className="px-5 pt-6 pb-4">
          <h1 className="font-display text-2xl font-bold text-foreground">Exercise Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">{EXERCISE_CATALOG.length} exercises available</p>
        </header>

        {/* Search */}
        <div className="px-5 mb-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 shadow-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search exercises..."
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Muscle group filters */}
        <div className="flex gap-2 overflow-x-auto px-5 pb-4 scrollbar-none">
          {MUSCLE_GROUPS.map((group) => (
            <button
              key={group}
              onClick={() => setSelectedGroup(group)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedGroup === group
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground hover:bg-border"
              }`}
            >
              {group}
            </button>
          ))}
        </div>

        {/* Exercise list */}
        <div className="flex flex-col gap-2.5 px-5">
          {filtered.map((ex) => (
            <button
              key={ex.name}
              onClick={() => setSelectedExercise(ex)}
              className="rounded-xl border border-border bg-card p-4 shadow-sm text-left transition-colors hover:bg-secondary/50 active:scale-[0.99]"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground">{ex.name}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-accent">{ex.muscleGroup}</span>
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">{ex.equipment}</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{ex.description}</p>
                </div>
                {ex.pr > 0 && (
                  <div className="ml-3 shrink-0 rounded-lg bg-secondary px-2.5 py-1.5 text-center">
                    <p className="font-display text-sm font-bold text-foreground">{ex.pr}</p>
                    <p className="text-[9px] text-muted-foreground">PR lbs</p>
                  </div>
                )}
              </div>
            </button>
          ))}

          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">No exercises found.</p>
            </div>
          )}
        </div>
      </div>

      <ExerciseDetailDialog
        exercise={selectedExercise}
        open={!!selectedExercise}
        onOpenChange={(open) => { if (!open) setSelectedExercise(null); }}
      />
    </div>
  );
};

export default Exercises;
