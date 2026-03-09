import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Target, Dumbbell, BarChart3, Trophy, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { EXERCISE_CATALOG, WORKOUT_HISTORY, type ExerciseInfo } from "@/data/mockData";

// Extended exercise data with instructions and muscles
const EXERCISE_DETAILS: Record<string, { muscles: string[]; instructions: string[]; videoPlaceholder: string }> = {
  "Bench Press": {
    muscles: ["Pectoralis Major", "Anterior Deltoid", "Triceps"],
    instructions: ["Lie flat on the bench with feet on the floor.", "Grip the bar slightly wider than shoulder width.", "Unrack and lower the bar to mid-chest with control.", "Press the bar up explosively until arms are fully extended.", "Keep shoulder blades retracted throughout the movement."],
    videoPlaceholder: "🏋️",
  },
  "Incline Bench Press": {
    muscles: ["Upper Pectoralis", "Anterior Deltoid", "Triceps"],
    instructions: ["Set bench to 30–45° incline.", "Grip bar slightly wider than shoulders.", "Lower bar to upper chest.", "Press up until arms are extended.", "Keep core braced and back against pad."],
    videoPlaceholder: "🏋️",
  },
  "Cable Fly": {
    muscles: ["Pectoralis Major", "Anterior Deltoid"],
    instructions: ["Set cables at chest height.", "Step forward with a slight lean.", "Bring handles together in a hugging motion.", "Squeeze chest at the peak contraction.", "Return slowly with arms slightly bent."],
    videoPlaceholder: "🔄",
  },
  "Push Up": {
    muscles: ["Pectoralis Major", "Triceps", "Anterior Deltoid", "Core"],
    instructions: ["Start in plank position, hands shoulder-width apart.", "Lower chest to the floor with elbows at 45°.", "Push back up to full arm extension.", "Keep body in a straight line throughout.", "Breathe in on the way down, out on the way up."],
    videoPlaceholder: "💪",
  },
  "Squat": {
    muscles: ["Quadriceps", "Glutes", "Hamstrings", "Core", "Erectors"],
    instructions: ["Position bar on upper traps, feet shoulder-width apart.", "Brace core and initiate by pushing hips back.", "Descend until thighs are at least parallel to the floor.", "Drive through mid-foot to stand back up.", "Keep knees tracking over toes throughout."],
    videoPlaceholder: "🦵",
  },
  "Deadlift": {
    muscles: ["Hamstrings", "Glutes", "Erectors", "Traps", "Forearms"],
    instructions: ["Stand with mid-foot under the bar.", "Grip bar just outside knees, hinge at hips.", "Flatten back, brace core, chest up.", "Drive through the floor, extending hips and knees together.", "Lock out at the top, then reverse the motion."],
    videoPlaceholder: "🏗️",
  },
  "Romanian Deadlift": {
    muscles: ["Hamstrings", "Glutes", "Erectors"],
    instructions: ["Hold bar at hip level, feet hip-width apart.", "Push hips back with a slight knee bend.", "Lower bar along your legs until you feel a deep hamstring stretch.", "Squeeze glutes to return to standing.", "Keep the bar close to your body throughout."],
    videoPlaceholder: "🦵",
  },
  "Leg Press": {
    muscles: ["Quadriceps", "Glutes", "Hamstrings"],
    instructions: ["Sit in the machine with back flat against pad.", "Place feet shoulder-width on the platform.", "Release the safety and lower the sled with control.", "Press through heels until legs are almost fully extended.", "Do not lock out knees at the top."],
    videoPlaceholder: "🦿",
  },
  "Lunges": {
    muscles: ["Quadriceps", "Glutes", "Hamstrings"],
    instructions: ["Stand tall with dumbbells at your sides.", "Step forward and lower until both knees are at 90°.", "Push through front heel to return to start.", "Alternate legs or complete all reps on one side.", "Keep torso upright throughout."],
    videoPlaceholder: "🚶",
  },
  "Calf Raise": {
    muscles: ["Gastrocnemius", "Soleus"],
    instructions: ["Stand on the edge of a platform with heels hanging off.", "Rise up onto your toes as high as possible.", "Hold the peak contraction for 1–2 seconds.", "Lower slowly below the platform for a full stretch.", "Keep knees straight for gastrocnemius focus."],
    videoPlaceholder: "🦶",
  },
  "Overhead Press": {
    muscles: ["Anterior Deltoid", "Lateral Deltoid", "Triceps", "Upper Chest"],
    instructions: ["Grip bar at shoulder width, bar resting on front delts.", "Brace core and press bar straight overhead.", "Lock out arms fully at the top.", "Lower bar back to shoulders with control.", "Avoid excessive back arch."],
    videoPlaceholder: "🙌",
  },
  "Lateral Raise": {
    muscles: ["Lateral Deltoid", "Traps"],
    instructions: ["Stand with dumbbells at your sides.", "Raise arms out to the sides until parallel to the floor.", "Lead with elbows, slight bend in arms.", "Lower slowly with control.", "Avoid using momentum or swinging."],
    videoPlaceholder: "🦅",
  },
  "Front Raise": {
    muscles: ["Anterior Deltoid"],
    instructions: ["Hold dumbbells in front of thighs.", "Raise one or both arms forward to shoulder height.", "Keep a slight bend in elbows.", "Lower with control.", "Avoid swinging or arching the back."],
    videoPlaceholder: "🦅",
  },
  "Face Pull": {
    muscles: ["Rear Deltoid", "Rhomboids", "External Rotators"],
    instructions: ["Set cable at upper chest height with rope attachment.", "Pull rope toward your face, separating the ends.", "Externally rotate shoulders at the end position.", "Squeeze shoulder blades together.", "Return slowly to start position."],
    videoPlaceholder: "🔄",
  },
  "Barbell Row": {
    muscles: ["Latissimus Dorsi", "Rhomboids", "Traps", "Biceps"],
    instructions: ["Hinge forward at hips, back flat, knees slightly bent.", "Grip bar just outside knees.", "Pull bar to lower chest / upper abdomen.", "Squeeze shoulder blades at the top.", "Lower with control, full arm extension."],
    videoPlaceholder: "🚣",
  },
  "Pull Up": {
    muscles: ["Latissimus Dorsi", "Biceps", "Teres Major", "Core"],
    instructions: ["Hang from bar with overhand grip, slightly wider than shoulders.", "Pull yourself up until chin clears the bar.", "Focus on driving elbows down and back.", "Lower with control to full arm extension.", "Avoid swinging or kipping."],
    videoPlaceholder: "🧗",
  },
  "Lat Pulldown": {
    muscles: ["Latissimus Dorsi", "Biceps", "Teres Major"],
    instructions: ["Sit at the machine, thighs secured under pads.", "Grip bar wider than shoulders.", "Pull bar to upper chest, leaning back slightly.", "Squeeze lats at the bottom.", "Return bar slowly to start."],
    videoPlaceholder: "⬇️",
  },
  "Dumbbell Curl": {
    muscles: ["Biceps Brachii", "Brachialis"],
    instructions: ["Stand with dumbbells at sides, palms facing forward.", "Curl weights up by flexing at the elbow.", "Squeeze biceps at the top.", "Lower slowly to full extension.", "Keep elbows stationary at your sides."],
    videoPlaceholder: "💪",
  },
  "Hammer Curl": {
    muscles: ["Brachioradialis", "Brachialis", "Biceps"],
    instructions: ["Hold dumbbells with neutral (palms facing in) grip.", "Curl weights up keeping neutral wrist position.", "Squeeze at the top.", "Lower with control.", "Keep elbows pinned to your sides."],
    videoPlaceholder: "🔨",
  },
  "Tricep Dip": {
    muscles: ["Triceps", "Anterior Deltoid", "Pectoralis Minor"],
    instructions: ["Grip parallel bars, arms fully extended.", "Lower body by bending elbows to 90°.", "Keep torso upright for tricep emphasis.", "Press back up to full extension.", "Avoid flaring elbows excessively."],
    videoPlaceholder: "⬇️",
  },
  "Skull Crusher": {
    muscles: ["Triceps (all three heads)"],
    instructions: ["Lie on bench holding bar with narrow grip overhead.", "Lower bar toward forehead by bending elbows.", "Keep upper arms perpendicular to the floor.", "Extend arms to press bar back up.", "Control the weight throughout the movement."],
    videoPlaceholder: "💀",
  },
  "Plank": {
    muscles: ["Rectus Abdominis", "Transverse Abdominis", "Obliques", "Erectors"],
    instructions: ["Start in forearm plank position.", "Keep body in a straight line from head to heels.", "Engage core and squeeze glutes.", "Breathe steadily throughout.", "Hold for the prescribed time."],
    videoPlaceholder: "🧘",
  },
  "Cable Crunch": {
    muscles: ["Rectus Abdominis"],
    instructions: ["Kneel facing the cable machine with rope behind head.", "Crunch down by flexing the spine.", "Bring elbows toward knees.", "Squeeze abs at the bottom.", "Return slowly to start position."],
    videoPlaceholder: "🔄",
  },
  "Hanging Leg Raise": {
    muscles: ["Lower Rectus Abdominis", "Hip Flexors", "Obliques"],
    instructions: ["Hang from a pull-up bar with arms extended.", "Raise legs until thighs are parallel or higher.", "Control the movement—avoid swinging.", "Lower legs slowly back to start.", "For added difficulty, keep legs straight."],
    videoPlaceholder: "🦵",
  },
};

const getDefault = () => ({
  muscles: ["Primary muscle group"],
  instructions: ["Perform the exercise with proper form.", "Control the weight throughout.", "Breathe steadily."],
  videoPlaceholder: "🏋️",
});

interface ExerciseDetailDialogProps {
  exercise: ExerciseInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ExerciseDetailDialog = ({ exercise, open, onOpenChange }: ExerciseDetailDialogProps) => {
  const navigate = useNavigate();
  if (!exercise) return null;

  const details = EXERCISE_DETAILS[exercise.name] || getDefault();

  // Gather history stats for this exercise
  const allSets = WORKOUT_HISTORY.flatMap((w) =>
    w.exercises.filter((e) => e.name === exercise.name).flatMap((e) => e.sets)
  );
  const totalSets = allSets.length;
  const maxWeight = allSets.length > 0 ? Math.max(...allSets.map((s) => s.weight)) : 0;
  const totalVolume = allSets.reduce((sum, s) => sum + s.weight * s.reps, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md max-h-[85vh] overflow-y-auto rounded-2xl p-0 gap-0">
        {/* Hero / Video placeholder */}
        <div className="relative flex items-center justify-center bg-foreground/5 py-10">
          <span className="text-6xl">{details.videoPlaceholder}</span>
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg bg-foreground/80 px-2.5 py-1">
            <Play className="h-3 w-3 text-background" />
            <span className="text-[10px] font-medium text-background">Watch Demo</span>
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

          {/* Quick stats */}
          {totalSets > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-secondary p-2.5 text-center">
                <p className="font-display text-base font-bold text-foreground">{maxWeight}</p>
                <p className="text-[9px] text-muted-foreground">Max (lbs)</p>
              </div>
              <div className="rounded-lg bg-secondary p-2.5 text-center">
                <p className="font-display text-base font-bold text-foreground">{totalSets}</p>
                <p className="text-[9px] text-muted-foreground">Total Sets</p>
              </div>
              <div className="rounded-lg bg-secondary p-2.5 text-center">
                <p className="font-display text-base font-bold text-foreground">{(totalVolume / 1000).toFixed(1)}k</p>
                <p className="text-[9px] text-muted-foreground">Volume (lbs)</p>
              </div>
            </div>
          )}

          {/* Muscles Targeted */}
          <div className="mt-5">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-3.5 w-3.5 text-accent" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">Muscles Targeted</h4>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {details.muscles.map((m) => (
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
              {details.instructions.map((step, i) => (
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
