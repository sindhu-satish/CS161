// Shared mock data for the fitness app

export interface SetEntry {
  weight: number;
  reps: number;
  done: boolean;
}

export interface WorkoutExercise {
  name: string;
  sets: SetEntry[];
  muscleGroup: string;
}

export interface Workout {
  id: string;
  date: string;
  name: string;
  duration: string;
  exercises: WorkoutExercise[];
}

export interface ExerciseInfo {
  name: string;
  muscleGroup: string;
  equipment: string;
  description: string;
  pr: number;
  imageUrl?: string;
  instructions?: string[];
  secondaryMuscles?: string[];
  target?: string;
}

export const MUSCLE_GROUPS = [
  "All",
  "Chest",
  "Back",
  "Shoulders",
  "Arms",
  "Legs",
  "Core",
] as const;

export const EXERCISE_CATALOG: ExerciseInfo[] = [
  { name: "Bench Press", muscleGroup: "Chest", equipment: "Barbell", description: "Flat barbell press targeting the pectorals, anterior deltoids, and triceps.", pr: 225 },
  { name: "Incline Bench Press", muscleGroup: "Chest", equipment: "Barbell", description: "Angled press emphasizing upper chest development.", pr: 185 },
  { name: "Cable Fly", muscleGroup: "Chest", equipment: "Cable", description: "Isolation movement for chest stretch and contraction.", pr: 50 },
  { name: "Push Up", muscleGroup: "Chest", equipment: "Bodyweight", description: "Classic bodyweight push movement for chest and triceps.", pr: 0 },
  { name: "Squat", muscleGroup: "Legs", equipment: "Barbell", description: "Compound lower body movement targeting quads, glutes, and hamstrings.", pr: 315 },
  { name: "Deadlift", muscleGroup: "Back", equipment: "Barbell", description: "Full-body pull from floor, emphasizing posterior chain.", pr: 365 },
  { name: "Romanian Deadlift", muscleGroup: "Legs", equipment: "Barbell", description: "Hip hinge movement targeting hamstrings and glutes.", pr: 275 },
  { name: "Leg Press", muscleGroup: "Legs", equipment: "Machine", description: "Machine-based quad-dominant pressing movement.", pr: 540 },
  { name: "Lunges", muscleGroup: "Legs", equipment: "Dumbbell", description: "Unilateral leg exercise for balance and strength.", pr: 80 },
  { name: "Calf Raise", muscleGroup: "Legs", equipment: "Machine", description: "Isolation exercise for the gastrocnemius and soleus.", pr: 200 },
  { name: "Overhead Press", muscleGroup: "Shoulders", equipment: "Barbell", description: "Strict press for deltoid and upper body strength.", pr: 155 },
  { name: "Lateral Raise", muscleGroup: "Shoulders", equipment: "Dumbbell", description: "Isolation movement for lateral deltoid development.", pr: 30 },
  { name: "Front Raise", muscleGroup: "Shoulders", equipment: "Dumbbell", description: "Isolation for anterior deltoid.", pr: 25 },
  { name: "Face Pull", muscleGroup: "Shoulders", equipment: "Cable", description: "Rear delt and rotator cuff exercise for shoulder health.", pr: 40 },
  { name: "Barbell Row", muscleGroup: "Back", equipment: "Barbell", description: "Bent-over row for lats, rhomboids, and traps.", pr: 205 },
  { name: "Pull Up", muscleGroup: "Back", equipment: "Bodyweight", description: "Vertical pull targeting lats and biceps.", pr: 0 },
  { name: "Lat Pulldown", muscleGroup: "Back", equipment: "Cable", description: "Cable-based vertical pull for lat development.", pr: 160 },
  { name: "Dumbbell Curl", muscleGroup: "Arms", equipment: "Dumbbell", description: "Bicep isolation with supinated grip.", pr: 50 },
  { name: "Hammer Curl", muscleGroup: "Arms", equipment: "Dumbbell", description: "Neutral grip curl targeting brachialis and brachioradialis.", pr: 45 },
  { name: "Tricep Dip", muscleGroup: "Arms", equipment: "Bodyweight", description: "Compound tricep movement using body weight.", pr: 0 },
  { name: "Skull Crusher", muscleGroup: "Arms", equipment: "Barbell", description: "Lying tricep extension for long head development.", pr: 95 },
  { name: "Plank", muscleGroup: "Core", equipment: "Bodyweight", description: "Isometric hold for core stability and endurance.", pr: 0 },
  { name: "Cable Crunch", muscleGroup: "Core", equipment: "Cable", description: "Weighted crunch for rectus abdominis.", pr: 80 },
  { name: "Hanging Leg Raise", muscleGroup: "Core", equipment: "Bodyweight", description: "Advanced core exercise targeting lower abs.", pr: 0 },
];

export const WORKOUT_HISTORY: Workout[] = [
  {
    id: "w1", date: "2026-03-08", name: "Upper Body", duration: "48 min",
    exercises: [
      { name: "Bench Press", muscleGroup: "Chest", sets: [{ weight: 185, reps: 8, done: true }, { weight: 185, reps: 8, done: true }, { weight: 195, reps: 6, done: true }, { weight: 195, reps: 5, done: true }] },
      { name: "Overhead Press", muscleGroup: "Shoulders", sets: [{ weight: 115, reps: 8, done: true }, { weight: 125, reps: 6, done: true }, { weight: 125, reps: 6, done: true }] },
      { name: "Barbell Row", muscleGroup: "Back", sets: [{ weight: 155, reps: 10, done: true }, { weight: 165, reps: 8, done: true }, { weight: 175, reps: 6, done: true }] },
      { name: "Dumbbell Curl", muscleGroup: "Arms", sets: [{ weight: 35, reps: 12, done: true }, { weight: 40, reps: 10, done: true }, { weight: 40, reps: 8, done: true }] },
      { name: "Face Pull", muscleGroup: "Shoulders", sets: [{ weight: 30, reps: 15, done: true }, { weight: 35, reps: 12, done: true }] },
    ],
  },
  {
    id: "w2", date: "2026-03-06", name: "Leg Day", duration: "52 min",
    exercises: [
      { name: "Squat", muscleGroup: "Legs", sets: [{ weight: 225, reps: 8, done: true }, { weight: 245, reps: 6, done: true }, { weight: 265, reps: 4, done: true }] },
      { name: "Romanian Deadlift", muscleGroup: "Legs", sets: [{ weight: 185, reps: 10, done: true }, { weight: 205, reps: 8, done: true }, { weight: 225, reps: 6, done: true }] },
      { name: "Leg Press", muscleGroup: "Legs", sets: [{ weight: 360, reps: 12, done: true }, { weight: 410, reps: 10, done: true }, { weight: 450, reps: 8, done: true }] },
      { name: "Calf Raise", muscleGroup: "Legs", sets: [{ weight: 150, reps: 15, done: true }, { weight: 170, reps: 12, done: true }] },
    ],
  },
  {
    id: "w3", date: "2026-03-04", name: "Push Day", duration: "55 min",
    exercises: [
      { name: "Bench Press", muscleGroup: "Chest", sets: [{ weight: 175, reps: 10, done: true }, { weight: 185, reps: 8, done: true }, { weight: 195, reps: 6, done: true }, { weight: 205, reps: 4, done: true }] },
      { name: "Incline Bench Press", muscleGroup: "Chest", sets: [{ weight: 135, reps: 10, done: true }, { weight: 155, reps: 8, done: true }, { weight: 165, reps: 6, done: true }] },
      { name: "Overhead Press", muscleGroup: "Shoulders", sets: [{ weight: 105, reps: 10, done: true }, { weight: 115, reps: 8, done: true }, { weight: 125, reps: 6, done: true }] },
      { name: "Lateral Raise", muscleGroup: "Shoulders", sets: [{ weight: 20, reps: 15, done: true }, { weight: 25, reps: 12, done: true }] },
      { name: "Skull Crusher", muscleGroup: "Arms", sets: [{ weight: 65, reps: 12, done: true }, { weight: 75, reps: 10, done: true }, { weight: 85, reps: 8, done: true }] },
      { name: "Cable Fly", muscleGroup: "Chest", sets: [{ weight: 35, reps: 12, done: true }, { weight: 40, reps: 10, done: true }] },
    ],
  },
  {
    id: "w4", date: "2026-03-02", name: "Pull Day", duration: "50 min",
    exercises: [
      { name: "Deadlift", muscleGroup: "Back", sets: [{ weight: 275, reps: 5, done: true }, { weight: 315, reps: 3, done: true }, { weight: 335, reps: 2, done: true }] },
      { name: "Barbell Row", muscleGroup: "Back", sets: [{ weight: 145, reps: 10, done: true }, { weight: 165, reps: 8, done: true }, { weight: 175, reps: 6, done: true }] },
      { name: "Lat Pulldown", muscleGroup: "Back", sets: [{ weight: 120, reps: 12, done: true }, { weight: 140, reps: 10, done: true }, { weight: 150, reps: 8, done: true }] },
      { name: "Hammer Curl", muscleGroup: "Arms", sets: [{ weight: 35, reps: 12, done: true }, { weight: 40, reps: 10, done: true }] },
      { name: "Face Pull", muscleGroup: "Shoulders", sets: [{ weight: 30, reps: 15, done: true }, { weight: 35, reps: 12, done: true }] },
    ],
  },
  {
    id: "w5", date: "2026-02-28", name: "Full Body", duration: "60 min",
    exercises: [
      { name: "Squat", muscleGroup: "Legs", sets: [{ weight: 205, reps: 10, done: true }, { weight: 225, reps: 8, done: true }, { weight: 245, reps: 6, done: true }] },
      { name: "Bench Press", muscleGroup: "Chest", sets: [{ weight: 175, reps: 8, done: true }, { weight: 185, reps: 6, done: true }, { weight: 185, reps: 6, done: true }] },
      { name: "Barbell Row", muscleGroup: "Back", sets: [{ weight: 155, reps: 8, done: true }, { weight: 165, reps: 8, done: true }] },
      { name: "Overhead Press", muscleGroup: "Shoulders", sets: [{ weight: 105, reps: 10, done: true }, { weight: 115, reps: 8, done: true }] },
    ],
  },
];

// Weekly volume data for stats
export const WEEKLY_VOLUME = [
  { week: "Feb 3", volume: 28500 },
  { week: "Feb 10", volume: 31200 },
  { week: "Feb 17", volume: 29800 },
  { week: "Feb 24", volume: 33400 },
  { week: "Mar 3", volume: 35100 },
  { week: "Mar 8", volume: 37200 },
];

export const PR_HISTORY = [
  { exercise: "Bench Press", data: [{ week: "W1", value: 195 }, { week: "W2", value: 200 }, { week: "W3", value: 205 }, { week: "W4", value: 205 }, { week: "W5", value: 215 }, { week: "W6", value: 225 }] },
  { exercise: "Squat", data: [{ week: "W1", value: 275 }, { week: "W2", value: 285 }, { week: "W3", value: 295 }, { week: "W4", value: 295 }, { week: "W5", value: 305 }, { week: "W6", value: 315 }] },
  { exercise: "Deadlift", data: [{ week: "W1", value: 325 }, { week: "W2", value: 335 }, { week: "W3", value: 345 }, { week: "W4", value: 345 }, { week: "W5", value: 355 }, { week: "W6", value: 365 }] },
];

export const BODY_WEIGHT = [
  { date: "Feb 3", weight: 182 },
  { date: "Feb 10", weight: 181 },
  { date: "Feb 17", weight: 180.5 },
  { date: "Feb 24", weight: 179.5 },
  { date: "Mar 3", weight: 179 },
  { date: "Mar 8", weight: 178 },
];
