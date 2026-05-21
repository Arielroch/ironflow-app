import { Workout, Exercise, UserStats, WeightEntry, WorkoutSession, CompletedSet, MeasurementEntry } from '../types';
import { MOCK_WORKOUTS, MOCK_USER_STATS } from '../data';
import { SMARTWORKOUT_EXERCISES } from '../exerciseLibrary';
import { supabase } from '../lib/supabase';

const DEFAULT_USER_ID = 'default-user-id';

export async function pushToSupabase() {
  if (!supabase) return;
  const payload = {
    user_id: DEFAULT_USER_ID,
    workouts: getWorkouts(),
    exercises_library: getExerciseLibrary(),
    weight_history: getWeightHistory(),
    workout_sessions: getWorkoutSessions(),
    user_stats: load<UserStats>(KEYS.USER_STATS, MOCK_USER_STATS),
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('sync_state')
    .upsert(payload, { onConflict: 'user_id' });
    
  if (error) console.error('Supabase push error:', error);
}

export async function pullFromSupabase() {
  if (!supabase) return;
  const { data, error } = await supabase
    .from('sync_state')
    .select('*')
    .eq('user_id', DEFAULT_USER_ID)
    .single();

  if (error || !data) return;

  if (data.workouts) save(KEYS.WORKOUTS, data.workouts, false);
  if (data.exercises_library) save(KEYS.EXERCISES_LIBRARY, data.exercises_library, false);
  if (data.weight_history) save(KEYS.WEIGHT_HISTORY, data.weight_history, false);
  if (data.workout_sessions) save(KEYS.WORKOUT_SESSIONS, data.workout_sessions, false);
  if (data.user_stats) save(KEYS.USER_STATS, data.user_stats, false);

  window.dispatchEvent(new Event('ironflow-sync'));
}
// ─────────────────────────────────────────────
// Storage keys
// ─────────────────────────────────────────────
const KEYS = {
  WORKOUTS: 'ironflow_workouts',
  EXERCISES_LIBRARY: 'ironflow_exercises_library',
  WEIGHT_HISTORY: 'ironflow_weight_history',
  WORKOUT_SESSIONS: 'ironflow_sessions',
  USER_STATS: 'ironflow_user_stats',
  LIBRARY_VERSION: 'ironflow_library_version',
} as const;

// ── Reset library if version changed (e.g. after SmartWorkout import) ──
const CURRENT_LIBRARY_VERSION = 'smartworkout-v2'; // Bumped to v2 to force clear mocks
if (localStorage.getItem(KEYS.LIBRARY_VERSION) !== CURRENT_LIBRARY_VERSION) {
  localStorage.removeItem(KEYS.EXERCISES_LIBRARY);
  localStorage.removeItem(KEYS.WORKOUTS); // Clear old mock workouts
  localStorage.setItem(KEYS.LIBRARY_VERSION, CURRENT_LIBRARY_VERSION);
}

// ─────────────────────────────────────────────
// Generic helpers
// ─────────────────────────────────────────────
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T, sync = true): void {
  localStorage.setItem(key, JSON.stringify(value));
  if (sync) {
    pushToSupabase().catch(console.error);
  }
}

// ─────────────────────────────────────────────
// Workouts CRUD
// ─────────────────────────────────────────────
export function getWorkouts(): Workout[] {
  return load<Workout[]>(KEYS.WORKOUTS, []);
}

function notifyWatch(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('ironflow-watch-update'));
  }
}

export function saveWorkouts(workouts: Workout[]): void {
  save(KEYS.WORKOUTS, workouts);
  notifyWatch();
}

export function addWorkout(workout: Workout): void {
  const list = getWorkouts();
  save(KEYS.WORKOUTS, [...list, workout]);
  notifyWatch();
}

export function updateWorkout(workout: Workout): void {
  const list = getWorkouts().map(w => w.id === workout.id ? workout : w);
  save(KEYS.WORKOUTS, list);
  notifyWatch();
}

export function deleteWorkout(id: string): void {
  save(KEYS.WORKOUTS, getWorkouts().filter(w => w.id !== id));
  notifyWatch();
}

// ─────────────────────────────────────────────
// Exercise Library CRUD
// ─────────────────────────────────────────────
export function getExerciseLibrary(): Exercise[] {
  return load<Exercise[]>(KEYS.EXERCISES_LIBRARY, SMARTWORKOUT_EXERCISES);
}

export function saveExerciseLibrary(exercises: Exercise[]): void {
  save(KEYS.EXERCISES_LIBRARY, exercises);
}

export function addExerciseToLibrary(exercise: Exercise): void {
  const list = getExerciseLibrary();
  save(KEYS.EXERCISES_LIBRARY, [...list, exercise]);
}

// ─────────────────────────────────────────────
// Weight History
// ─────────────────────────────────────────────
function buildDefaultWeightHistory(): WeightEntry[] {
  const today = new Date();
  const entries: WeightEntry[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    entries.push({
      date: d.toISOString().split('T')[0],
      weight: parseFloat((85.1 - i * 0.15).toFixed(1)),
    });
  }
  return entries;
}

export function getWeightHistory(): WeightEntry[] {
  return load<WeightEntry[]>(KEYS.WEIGHT_HISTORY, buildDefaultWeightHistory());
}

export function addWeightEntry(entry: WeightEntry): void {
  const list = getWeightHistory();
  // Replace if same date
  const filtered = list.filter(e => e.date !== entry.date);
  filtered.push(entry);
  filtered.sort((a, b) => a.date.localeCompare(b.date));
  save(KEYS.WEIGHT_HISTORY, filtered.slice(-90)); // keep last 90 days
}

// ─────────────────────────────────────────────
// Workout Sessions (history)
// ─────────────────────────────────────────────
export function getWorkoutSessions(): WorkoutSession[] {
  return load<WorkoutSession[]>(KEYS.WORKOUT_SESSIONS, []);
}

export function saveWorkoutSession(session: WorkoutSession): void {
  const sessions = getWorkoutSessions();
  save(KEYS.WORKOUT_SESSIONS, [...sessions, session]);

  // Also update workout's lastSessionDate
  const workouts = getWorkouts();
  const updated = workouts.map(w => {
    if (w.id === session.workoutId) {
      // Calculate avg duration from sessions
      const related = [...sessions, session].filter(s => s.workoutId === w.id);
      const avgDuration = Math.round(
        related.reduce((sum, s) => sum + s.durationSeconds, 0) / related.length / 60
      );
      const date = new Date(session.date);
      const formattedDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase();
      return { ...w, lastSessionDate: formattedDate, avgDuration };
    }
    return w;
  });
  saveWorkouts(updated);
}

// ─────────────────────────────────────────────
// User Stats (streak, etc.)
// ─────────────────────────────────────────────
export function getUserStats(): UserStats {
  const baseStats = load<UserStats>(KEYS.USER_STATS, MOCK_USER_STATS);
  
  // Compute dynamic fields
  const sessions = getWorkoutSessions();
  const weightHistory = getWeightHistory();
  
  // Current weight = last entry
  const currentWeight = weightHistory.length > 0 
    ? weightHistory[weightHistory.length - 1].weight 
    : baseStats.weight;

  // Weight change vs 7 days ago
  const weekAgoEntry = weightHistory.length > 1 ? weightHistory[Math.max(0, weightHistory.length - 8)] : null;
  const weightChange = weekAgoEntry 
    ? `${(currentWeight - weekAgoEntry.weight) >= 0 ? '+' : ''}${(currentWeight - weekAgoEntry.weight).toFixed(1)} KG ESTA SEMANA`
    : baseStats.weightChange;

  // Streak calculation
  const streak = computeStreak(sessions);

  // Weekly volume (last 7 days)
  const today = new Date();
  const weeklyVolume = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const daySessions = sessions.filter(s => s.date.startsWith(dateStr));
    const volume = daySessions.reduce((sum, s) => sum + s.totalVolume, 0);
    const dayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    return {
      day: dayLabels[d.getDay()],
      value: Math.round(volume / 100) || 0, // normalised
      isToday: i === 6,
    };
  });

  return {
    ...baseStats,
    weight: currentWeight,
    weightChange,
    streak,
    weeklyVolume,
  };
}

export function saveUserStatsBase(stats: Partial<UserStats>): void {
  const current = load<UserStats>(KEYS.USER_STATS, MOCK_USER_STATS);
  save(KEYS.USER_STATS, { ...current, ...stats });
}

export function getMeasurements(): MeasurementEntry[] {
  const current = load<UserStats>(KEYS.USER_STATS, MOCK_USER_STATS);
  return current.measurements || [];
}

export function addMeasurementEntry(entry: MeasurementEntry): void {
  const list = getMeasurements();
  const filtered = list.filter(e => e.date !== entry.date);
  filtered.push(entry);
  filtered.sort((a, b) => a.date.localeCompare(b.date));
  saveUserStatsBase({ measurements: filtered });
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function computeStreak(sessions: WorkoutSession[]): number {
  if (!sessions.length) return 0;
  const days = new Set(sessions.map(s => s.date.split('T')[0]));
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (days.has(key)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
