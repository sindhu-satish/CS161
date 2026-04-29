import { useNavigate } from "react-router-dom";
import { Play, Target, Dumbbell, BarChart3, Trophy, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { ExerciseInfo } from "@/data/types";

interface ExerciseDetailDialogProps {
  exercise: ExerciseInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ExerciseDetailDialog = ({ exercise, open, onOpenChange }: ExerciseDetailDialogProps) => {
  const navigate = useNavigate();
  if (!exercise) return null;

  const details = {
    muscles: [
      ...(exercise.target ? [exercise.target] : []),
      ...((exercise.secondaryMuscles ?? []).filter(Boolean) as string[]),
    ],
    instructions: (exercise.instructions ?? []).filter(Boolean),
  };
  const showImage = Boolean(exercise.imageUrl);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md max-h-[85vh] overflow-y-auto rounded-2xl p-0 gap-0">
        {/* Hero / Video placeholder */}
        <div className="relative flex items-center justify-center bg-foreground/5 py-10">
          {showImage ? (
            <img
              src={exercise.imageUrl}
              alt={exercise.name}
              className="max-h-52 w-auto rounded-lg object-contain"
              loading="lazy"
            />
          ) : (
            <span className="text-6xl">🏋️</span>
          )}
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg bg-foreground/80 px-2.5 py-1">
            <Play className="h-3 w-3 text-background" />
            <span className="text-[10px] font-medium text-background">RapidAPI</span>
          </div>
        </div>

        <div className="px-5 pb-5">
          {/* Title */}
          <DialogHeader className="pt-4 pb-1">
            <DialogTitle className="font-display text-lg font-bold text-foreground text-left">
              {exercise.name}
            </DialogTitle>
            <DialogDescription className="text-left">
              <span className="flex items-center gap-2 mt-1">
                <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-accent">{exercise.muscleGroup}</span>
                <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">{exercise.equipment}</span>
              </span>
            </DialogDescription>
          </DialogHeader>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{exercise.description}</p>

          {/* Muscles Targeted */}
          <div className="mt-5">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-3.5 w-3.5 text-accent" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">Muscles Targeted</h4>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(details.muscles.length > 0 ? details.muscles : ["Primary muscle group"]).map((m) => (
                <span key={m} className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground">
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* How to Perform */}
          <div className="mt-5">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="h-3.5 w-3.5 text-accent" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">How to Perform</h4>
            </div>
            <ol className="space-y-2">
              {(details.instructions.length > 0
                ? details.instructions
                : ["Perform the exercise with proper form.", "Control the movement throughout.", "Breathe steadily."]).map((step, i) => (
                <li key={i} className="flex gap-2.5 text-xs leading-relaxed text-muted-foreground">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-accent">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* PR badge */}
          {exercise.pr > 0 && (
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-primary/10 p-3">
              <Trophy className="h-4 w-4 text-accent" />
              <div>
                <p className="text-xs font-semibold text-foreground">Personal Record: {exercise.pr} lbs</p>
                <p className="text-[10px] text-muted-foreground">Your all-time best for this exercise</p>
              </div>
            </div>
          )}

          {/* View Stats button */}
          <button
            onClick={() => {
              onOpenChange(false);
              navigate("/stats");
            }}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
          >
            <BarChart3 className="h-4 w-4" />
            View My Stats
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExerciseDetailDialog;
