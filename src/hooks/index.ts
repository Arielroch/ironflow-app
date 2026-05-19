import { useState, useEffect, useCallback } from 'react';
import {
  getWorkouts, saveWorkouts, addWorkout, updateWorkout, deleteWorkout,
  getExerciseLibrary, addExerciseToLibrary,
  getWeightHistory, addWeightEntry,
  getWorkoutSessions, saveWorkoutSession,
  getUserStats, saveUserStatsBase,
  generateId,
} from '../store';
import { Workout, Exercise, WeightEntry, WorkoutSession } from '../types';

// ─────────────────────────────────────────────
// Workouts
// ─────────────────────────────────────────────
export function useWorkouts() {
  const [workouts, setWorkouts] = useState<Workout[]>(() => getWorkouts());

  const refresh = useCallback(() => setWorkouts(getWorkouts()), []);

  const create = useCallback((workout: Omit<Workout, 'id'>) => {
    const newWorkout: Workout = { ...workout, id: generateId() };
    addWorkout(newWorkout);
    refresh();
    return newWorkout;
  }, [refresh]);

  const update = useCallback((workout: Workout) => {
    updateWorkout(workout);
    refresh();
  }, [refresh]);

  const remove = useCallback((id: string) => {
    deleteWorkout(id);
    refresh();
  }, [refresh]);

  return { workouts, refresh, create, update, remove };
}

// ─────────────────────────────────────────────
// Exercise Library
// ─────────────────────────────────────────────
export function useExerciseLibrary() {
  const [exercises, setExercises] = useState<Exercise[]>(() => getExerciseLibrary());

  const refresh = useCallback(() => setExercises(getExerciseLibrary()), []);

  const add = useCallback((exercise: Omit<Exercise, 'id'>) => {
    const newEx: Exercise = { ...exercise, id: generateId() };
    addExerciseToLibrary(newEx);
    refresh();
    return newEx;
  }, [refresh]);

  return { exercises, refresh, add };
}

// ─────────────────────────────────────────────
// Weight History
// ─────────────────────────────────────────────
export function useWeightHistory() {
  const [history, setHistory] = useState<WeightEntry[]>(() => getWeightHistory());

  const refresh = useCallback(() => setHistory(getWeightHistory()), []);

  const logWeight = useCallback((weight: number) => {
    const entry: WeightEntry = {
      date: new Date().toISOString().split('T')[0],
      weight,
    };
    addWeightEntry(entry);
    refresh();
  }, [refresh]);

  return { history, logWeight, refresh };
}

// ─────────────────────────────────────────────
// Workout Sessions
// ─────────────────────────────────────────────
export function useWorkoutSessions() {
  const [sessions, setSessions] = useState<WorkoutSession[]>(() => getWorkoutSessions());

  const refresh = useCallback(() => setSessions(getWorkoutSessions()), []);

  const saveSession = useCallback((session: WorkoutSession) => {
    saveWorkoutSession(session);
    refresh();
  }, [refresh]);

  return { sessions, saveSession, refresh };
}

// ─────────────────────────────────────────────
// User Stats
// ─────────────────────────────────────────────
export function useUserStats() {
  const [stats, setStats] = useState(() => getUserStats());

  const refresh = useCallback(() => setStats(getUserStats()), []);

  return { stats, refresh };
}
