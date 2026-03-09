import { Play, Flame } from "lucide-react";

interface StartWorkoutCardProps {
  onStart: () => void;
}

const StartWorkoutCard = ({ onStart }: StartWorkoutCardProps) => (
  <div className="mx-5 rounded-2xl bg-foreground p-5">
    <div className="mb-3 flex items-center gap-2">
      <Flame className="h-4 w-4 text-primary" />
      <span className="text-sm font-medium text-primary">Ready to train?</span>
    </div>
    <h2 className="mb-1 font-display text-lg font-bold text-background">
      Start Your Workout
    </h2>
    <p className="mb-4 text-sm text-muted-foreground">
      Log exercises, track sets & reps in real time.
    </p>
    <button
      onClick={onStart}
      className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-display text-sm font-semibold text-primary-foreground shadow-md transition-all hover:brightness-105 active:scale-[0.98] animate-pulse-gold"
    >
      <Play className="h-4 w-4" />
      Start Workout
    </button>
  </div>
);

export default StartWorkoutCard;
