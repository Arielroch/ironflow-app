export interface WorkoutSet {
  weight: number;
  reps: number | string;
  isCompleted: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  sets: WorkoutSet[];
  muscleGroup: string;
  restTime: number; // in seconds
  type: 'Compound' | 'Isolation';
  category: 'Strength' | 'Hypertrophy' | 'Power' | 'Width';
  imageUrl?: string;
  description?: string;
  focusMuscle?: string;
}

export interface Workout {
  id: string;
  name: string;
  exercises: Exercise[];
  lastSessionDate?: string;
  avgDuration?: number;
}

export interface UserStats {
  weight: number;
  weightChange: string;
  streak: number;
  weeklyVolume: { day: string; value: number; isToday?: boolean }[];
  userImageUrl: string;
  measurements?: MeasurementEntry[];
}

export interface WeightEntry {
  date: string; // ISO date string 'YYYY-MM-DD'
  weight: number;
}

export interface MeasurementEntry {
  date: string; // ISO date string 'YYYY-MM-DD'
  bodyFat?: number;
  chest?: number;
  arms?: number;
  waist?: number;
  legs?: number;
}

export interface CompletedSet {
  exerciseId: string;
  exerciseName: string;
  setIndex: number;
  weight: number;
  reps: number | string;
}

export interface WorkoutSession {
  id: string;
  workoutId: string;
  workoutName: string;
  date: string; // ISO string
  durationSeconds: number;
  completedSets: CompletedSet[];
  totalVolume: number; // kg * reps summed
}
