import { useState, useEffect } from "react";
import { Plus, Play, Dumbbell, Trash2, ArrowLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StartWorkoutCard from "@/components/dashboard/StartWorkoutCard";
import RecentWorkouts from "@/components/dashboard/RecentWorkouts";
import ProgressChart from "@/components/dashboard/ProgressChart";
import ActiveWorkout from "@/components/dashboard/ActiveWorkout";
import PlanWorkout, { type WorkoutPlan } from "@/components/dashboard/PlanWorkout";
import ExerciseDetailDialog from "@/components/ExerciseDetailDialog";
import { useAuth } from "@/context/AuthContext";
import type { ExerciseInfo } from "@/data/types";
import {
  fetchWorkoutPlans,
  upsertWorkoutPlan,
  deleteWorkoutPlan,
  getWorkouts,
} from "@/lib/supabase-db";
import { fetchExerciseCatalogFromDb } from "@/lib/exercise-catalog";
import { isSupabaseConfigured } from "@/lib/supabase";

type ViewMode = "dashboard" | "planning" | "plan" | "active";

const Index = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [view, setView] = useState<ViewMode>("dashboard");
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [plansReady, setPlansReady] = useState(false);
  const [activePlan, setActivePlan] = useState<WorkoutPlan | undefined>();
  const [openedPlan, setOpenedPlan] = useState<WorkoutPlan | undefined>();
  const [catalog, setCatalog] = useState<ExerciseInfo[]>([]);
  const [exerciseById, setExerciseById] = useState<Record<string, ExerciseInfo>>({});
  const [selectedExercise, setSelectedExercise] = useState<ExerciseInfo | null>(null);

  useEffect(() => {
    if (!user || !isSupabaseConfigured()) {
      setPlans([]);
      setPlansReady(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchWorkoutPlans();
        if (!cancelled) {
          setPlans(list);
          qc.invalidateQueries({ queryKey: ["workout-plans"] });
        }
      } catch {
        if (!cancelled) setPlans([]);
      } finally {
        if (!cancelled) setPlansReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, qc]);

  useEffect(() => {
    let cancelled = false;
    if (!isSupabaseConfigured()) {
      setCatalog([]);
      setExerciseById({});
      return;
    }
    fetchExerciseCatalogFromDb()
      .then((rows) => {
        if (cancelled) return;
        setCatalog(rows);
        setExerciseById(
          rows.reduce<Record<string, ExerciseInfo>>((acc, ex) => {
            acc[ex.id] = ex;
            return acc;
          }, {})
        );
      })
      .catch(() => {
        if (cancelled) return;
        setCatalog([]);
        setExerciseById({});
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSavePlan = async (plan: WorkoutPlan) => {
    const saved = await upsertWorkoutPlan(plan);
    setPlans((prev) => {
      const exists = prev.findIndex((p) => p.id === plan.id);
      if (exists >= 0) {
        const copy = [...prev];
        copy[exists] = saved;
        return copy;
      }
      return [...prev, saved];
    });
    qc.invalidateQueries({ queryKey: ["workout-plans"] });
    setView("dashboard");
  };

  const handleDeletePlan = async (id: string) => {
    await deleteWorkoutPlan(id);
    setPlans((prev) => prev.filter((p) => p.id !== id));
    qc.invalidateQueries({ queryKey: ["workout-plans"] });
  };

  const resolvePlanForUi = (plan: WorkoutPlan): WorkoutPlan => ({
    ...plan,
    exercises: plan.exercises.map((ex) => {
      const exerciseId = (ex as { exerciseId?: string }).exerciseId;
      const fromCatalog = exerciseId ? exerciseById[exerciseId] : undefined;
      return {
        ...ex,
        name: ex.name || fromCatalog?.name || "Unknown Exercise",
        muscleGroup: ex.muscleGroup || fromCatalog?.muscleGroup || "Other",
      };
    }),
  });

  const getExerciseDisplayName = (ex: WorkoutPlan["exercises"][number]) => {
    const exerciseId = (ex as { exerciseId?: string }).exerciseId;
    if (ex.name) return ex.name;
    if (exerciseId && exerciseById[exerciseId]) return exerciseById[exerciseId].name;
    if (exerciseId && catalog.length === 0) return "Loading...";
    return "Unknown Exercise";
  };

  const handleOpenPlan = (plan: WorkoutPlan) => {
    setOpenedPlan(resolvePlanForUi(plan));
    setView("plan");
  };

  const handleStartPlan = (plan: WorkoutPlan) => {
    const resolvedPlan: WorkoutPlan = {
      ...plan,
      exercises: plan.exercises.map((ex) => {
        const exerciseId = (ex as { exerciseId?: string }).exerciseId;
        const fromCatalog = exerciseId ? exerciseById[exerciseId] : undefined;
        return {
          ...ex,
          name: ex.name || fromCatalog?.name || "Unknown Exercise",
          muscleGroup: ex.muscleGroup || fromCatalog?.muscleGroup || "Other",
        };
      }),
    };
    setActivePlan(resolvedPlan);
    setView("active");
  };

  const handleStartEmpty = () => {
    setActivePlan(undefined);
    setView("active");
  };

  if (view === "planning") {
    return (
      <PlanWorkout
        onSave={handleSavePlan}
        onCancel={() => setView("dashboard")}
      />
    );
  }

  if (view === "active") {
    return (
      <ActiveWorkout
        onFinish={() => {
          setView("dashboard");
          setActivePlan(undefined);
        }}
        plan={activePlan}
      />
    );
  }

  if (view === "plan" && openedPlan) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="mx-auto max-w-md">
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-5 pt-5 pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    setView("dashboard");
                    setOpenedPlan(undefined);
                  }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary transition-colors hover:bg-border"
                >
                  <ArrowLeft className="h-4 w-4 text-foreground" />
                </button>
                <div className="min-w-0">
                  <h1 className="font-display text-lg font-bold text-foreground truncate">{openedPlan.name}</h1>
                  <p className="text-xs text-muted-foreground">
                    {openedPlan.exercises.length} exercises ·{" "}
                    {openedPlan.exercises.reduce((a, e) => a + e.sets.length, 0)} sets
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleStartPlan(openedPlan)}
                className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:brightness-105"
              >
                <Play className="h-3 w-3" />
                Start
              </button>
            </div>
          </div>

          <div className="px-5 py-4 space-y-2.5">
            {openedPlan.exercises.map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  const exerciseId = (ex as { exerciseId?: string }).exerciseId;
                  if (!exerciseId) return;
                  const found = exerciseById[exerciseId];
                  if (found) setSelectedExercise(found);
                }}
                className="w-full rounded-xl border border-border bg-card p-3 text-left shadow-sm transition-colors hover:bg-secondary/50"
              >
                <p className="text-sm font-semibold text-foreground">{getExerciseDisplayName(ex)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {ex.muscleGroup} · {ex.sets.length} sets
                </p>
              </button>
            ))}
          </div>
        </div>
        <ExerciseDetailDialog
          exercise={selectedExercise}
          open={!!selectedExercise}
          onOpenChange={(open) => {
            if (!open) setSelectedExercise(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-md">
        <DashboardHeader />
        <div className="flex flex-col gap-6 pb-6">
          <StartWorkoutCard onStart={handleStartEmpty} />

          <section className="mx-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-foreground">My Plans</h3>
              <button
                type="button"
                onClick={() => setView("planning")}
                className="inline-flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-border"
              >
                <Plus className="h-3.5 w-3.5" />
                New Plan
              </button>
            </div>

            {!plansReady ? (
              <p className="text-sm text-muted-foreground">Loading plans…</p>
            ) : plans.length === 0 ? (
              <button
                type="button"
                onClick={() => setView("planning")}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 py-6 text-sm font-semibold text-primary transition-colors hover:border-primary hover:bg-primary/10"
              >
                <Plus className="h-5 w-5" />
                Create Your First Plan
              </button>
            ) : (
              <div className="space-y-2.5">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="rounded-xl border border-border bg-card shadow-sm overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                          <Dumbbell className="h-4 w-4 text-accent" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{plan.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {plan.exercises.length} exercises ·{" "}
                            {plan.exercises.reduce((a, e) => a + e.sets.length, 0)} sets
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => void handleDeletePlan(plan.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenPlan(plan)}
                          className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:brightness-105"
                        >
                          Open Workout
                        </button>
                      </div>
                    </div>
                    <div className="border-t border-border bg-secondary/30 px-4 py-2.5">
                      <div className="flex flex-wrap gap-1.5">
                        {plan.exercises.map((ex, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              const exerciseId = (ex as { exerciseId?: string }).exerciseId;
                              if (!exerciseId) return;
                              const found = exerciseById[exerciseId];
                              if (found) setSelectedExercise(found);
                            }}
                            className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-border hover:text-foreground"
                          >
                            {getExerciseDisplayName(ex)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <RecentWorkouts />
          <ProgressChart queryFn={getWorkouts} />
        </div>
      </div>
      <ExerciseDetailDialog
        exercise={selectedExercise}
        open={!!selectedExercise}
        onOpenChange={(open) => {
          if (!open) setSelectedExercise(null);
        }}
      />
    </div>
  );
};

export default Index;
