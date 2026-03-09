import { useState } from "react";
import { Plus, Play, Dumbbell, ChevronRight, Trash2 } from "lucide-react";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StartWorkoutCard from "@/components/dashboard/StartWorkoutCard";
import RecentWorkouts from "@/components/dashboard/RecentWorkouts";
import ProgressChart from "@/components/dashboard/ProgressChart";
import ActiveWorkout from "@/components/dashboard/ActiveWorkout";
import PlanWorkout, { type WorkoutPlan } from "@/components/dashboard/PlanWorkout";

// Sample pre-made plans
const DEFAULT_PLANS: WorkoutPlan[] = [
  {
    id: "plan-1",
    name: "Push Day",
    exercises: [
      { name: "Bench Press", muscleGroup: "Chest", sets: [{ targetWeight: 185, targetReps: 8 }, { targetWeight: 195, targetReps: 6 }, { targetWeight: 205, targetReps: 4 }], notes: "Warm up with bar first" },
      { name: "Overhead Press", muscleGroup: "Shoulders", sets: [{ targetWeight: 115, targetReps: 8 }, { targetWeight: 125, targetReps: 6 }], notes: "" },
      { name: "Cable Fly", muscleGroup: "Chest", sets: [{ targetWeight: 40, targetReps: 12 }, { targetWeight: 45, targetReps: 10 }], notes: "Squeeze at peak" },
      { name: "Lateral Raise", muscleGroup: "Shoulders", sets: [{ targetWeight: 25, targetReps: 15 }, { targetWeight: 25, targetReps: 12 }], notes: "" },
      { name: "Skull Crusher", muscleGroup: "Arms", sets: [{ targetWeight: 75, targetReps: 10 }, { targetWeight: 85, targetReps: 8 }], notes: "" },
    ],
  },
  {
    id: "plan-2",
    name: "Leg Day",
    exercises: [
      { name: "Squat", muscleGroup: "Legs", sets: [{ targetWeight: 225, targetReps: 8 }, { targetWeight: 245, targetReps: 6 }, { targetWeight: 265, targetReps: 4 }], notes: "Deep squats, control descent" },
      { name: "Romanian Deadlift", muscleGroup: "Legs", sets: [{ targetWeight: 205, targetReps: 10 }, { targetWeight: 225, targetReps: 8 }], notes: "" },
      { name: "Leg Press", muscleGroup: "Legs", sets: [{ targetWeight: 400, targetReps: 12 }, { targetWeight: 450, targetReps: 10 }], notes: "" },
      { name: "Calf Raise", muscleGroup: "Legs", sets: [{ targetWeight: 170, targetReps: 15 }, { targetWeight: 190, targetReps: 12 }], notes: "Slow eccentric" },
    ],
  },
];

type ViewMode = "dashboard" | "planning" | "active";

const Index = () => {
  const [view, setView] = useState<ViewMode>("dashboard");
  const [plans, setPlans] = useState<WorkoutPlan[]>(DEFAULT_PLANS);
  const [activePlan, setActivePlan] = useState<WorkoutPlan | undefined>();

  const handleSavePlan = (plan: WorkoutPlan) => {
    setPlans((prev) => {
      const exists = prev.findIndex((p) => p.id === plan.id);
      if (exists >= 0) {
        const copy = [...prev];
        copy[exists] = plan;
        return copy;
      }
      return [...prev, plan];
    });
    setView("dashboard");
  };

  const handleDeletePlan = (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
  };

  const handleStartPlan = (plan: WorkoutPlan) => {
    setActivePlan(plan);
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
        onFinish={() => { setView("dashboard"); setActivePlan(undefined); }}
        plan={activePlan}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-md">
        <DashboardHeader />
        <div className="flex flex-col gap-6 pb-6">
          <StartWorkoutCard onStart={handleStartEmpty} />

          {/* Planned Workouts */}
          <section className="mx-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-foreground">My Plans</h3>
              <button
                onClick={() => setView("planning")}
                className="inline-flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-border"
              >
                <Plus className="h-3.5 w-3.5" />
                New Plan
              </button>
            </div>

            {plans.length === 0 ? (
              <button
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
                            {plan.exercises.length} exercises · {plan.exercises.reduce((a, e) => a + e.sets.length, 0)} sets
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleDeletePlan(plan.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleStartPlan(plan)}
                          className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:brightness-105"
                        >
                          <Play className="h-3 w-3" />
                          Start
                        </button>
                      </div>
                    </div>
                    {/* Exercise preview */}
                    <div className="border-t border-border bg-secondary/30 px-4 py-2.5">
                      <div className="flex flex-wrap gap-1.5">
                        {plan.exercises.map((ex, i) => (
                          <span
                            key={i}
                            className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                          >
                            {ex.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <RecentWorkouts />
          <ProgressChart />
        </div>
      </div>
    </div>
  );
};

export default Index;
