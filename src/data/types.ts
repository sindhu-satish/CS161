// Shared data types for the fitness app

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
  id: string;
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
