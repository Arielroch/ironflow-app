import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Timer as TimerIcon, Check, Plus, ArrowRight, Save, X, Film, Dumbbell } from 'lucide-react';
import { formatTime, cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useWorkouts, useWorkoutSessions } from '../hooks';
import { useExerciseMedia } from '../hooks/useExerciseMedia';
import { ExerciseVideo } from '../components/ExerciseVideo';
import { notifyRestComplete, requestNotificationPermission } from '../lib/alarm';
import { CompletedSet, WorkoutSession, Exercise, WorkoutSet } from '../types';
import { generateId, getExerciseLibrary } from '../store';

// ─────────────────────────────────────────────
// Exercise Guide: shows video/GIF from SmartWorkout
// ─────────────────────────────────────────────
function ExerciseGuide({ exercise }: { exercise: Exercise }) {
  const [show, setShow] = useState(true);
  const { media, loading, load } = useExerciseMedia(exercise.muscleGroup, exercise.name, true, exercise.id);

  useEffect(() => { load(); }, [exercise.name]);

  if (!show) return (
    <button
      onClick={() => setShow(true)}
      className="flex items-center gap-2 text-on-surface-variant/50 hover:text-primary-fixed font-mono font-bold text-[10px] uppercase tracking-widest transition-colors"
    >
      <Film size={12} /> Ver guia de execução
    </button>
  );

  return (
    <div className="relative">
      {loading && (
        <div className="w-full h-44 glass-card rounded-xl flex items-center justify-center border border-primary-fixed/10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-primary-fixed border-t-transparent rounded-full animate-spin" />
            <span className="text-[9px] font-mono text-on-surface-variant/50 uppercase">Carregando guia...</span>
          </div>
        </div>
      )}
      {!loading && media?.videoUrl && (
        <div className="relative">
          <ExerciseVideo
            videoUrl={media.videoUrl}
            imageUrl={media.imageUrl}
            name={exercise.name}
            className="w-full h-44 rounded-xl"
            autoPlay
          />
          <button
            onClick={() => setShow(false)}
            className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white/60 hover:text-white rounded-full p-1.5 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      )}
      {!loading && (!media || !media.videoUrl) && (
        <div className="relative w-full h-44 rounded-xl bg-surface-container-highest flex items-center justify-center border border-white/5">
          <div className="flex flex-col items-center gap-2 opacity-40">
            <Dumbbell size={28} />
            <span className="text-[10px] font-mono uppercase tracking-wider">Sem mídia</span>
          </div>
          <button
            onClick={() => setShow(false)}
            className="absolute top-2 left-2 bg-black/40 text-white/60 hover:text-white rounded-full p-1.5 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────
interface LiveSet {
  weight: string;
  reps: string;
  isCompleted: boolean;
}

interface LiveExercise {
  exercise: Exercise;
  sets: LiveSet[];
}

function buildLiveSets(exercise: Exercise): LiveSet[] {
  const count = exercise.sets.length || 3;
  const template = exercise.sets[0] || { weight: 0, reps: 10 };
  return Array.from({ length: count }, (_, i) => ({
    weight: String(exercise.sets[i]?.weight ?? template.weight),
    reps: String(exercise.sets[i]?.reps ?? template.reps),
    isCompleted: false,
  }));
}

export function ActiveWorkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { workouts, update: updateWorkout } = useWorkouts();
  const { saveSession } = useWorkoutSessions();

  const workout = useMemo(() => workouts.find(w => w.id === id) || workouts[0], [workouts, id]);

  const SESSION_KEY = 'ironflow_active_session';

  // ── Load or Initialize State ──
  const [sessionState, setSessionState] = useState<{
    startTime: number;
    liveExercises: LiveExercise[];
    activeExerciseIndex: number;
  }>(() => {
    const cached = localStorage.getItem(SESSION_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.workoutId === id) return parsed;
      } catch (e) {
        // ignore error
      }
    }
    return {
      workoutId: id,
      startTime: Date.now(),
      liveExercises: (workout?.exercises || []).map(ex => ({ exercise: ex, sets: buildLiveSets(ex) })),
      activeExerciseIndex: 0
    };
  });

  const { startTime, liveExercises, activeExerciseIndex } = sessionState;

  // ── Session timer ──
  const [seconds, setSeconds] = useState(() => Math.floor((Date.now() - startTime) / 1000));
  
  useEffect(() => {
    requestNotificationPermission();
    const interval = setInterval(() => {
      setSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  // ── Persist state changes ──
  const updateSessionState = useCallback((updater: (prev: typeof sessionState) => typeof sessionState) => {
    setSessionState(prev => {
      const next = updater(prev);
      localStorage.setItem(SESSION_KEY, JSON.stringify({ ...next, workoutId: id }));
      return next;
    });
  }, [id]);

  const setActiveExerciseIndex = (idx: number | ((prev: number) => number)) => {
    updateSessionState(prev => ({
      ...prev,
      activeExerciseIndex: typeof idx === 'function' ? idx(prev.activeExerciseIndex) : idx
    }));
  };

  // ── Rest timer ──
  const [restSecondsLeft, setRestSecondsLeft] = useState<number | null>(null);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRest = (restTime: number) => {
    if (restRef.current) clearInterval(restRef.current);
    
    const targetEndTime = Date.now() + restTime * 1000;
    
    const update = () => {
      const remaining = Math.ceil((targetEndTime - Date.now()) / 1000);
      
      if (remaining <= 0) {
        clearInterval(restRef.current!);
        setRestSecondsLeft(null);
        notifyRestComplete();
      } else {
        setRestSecondsLeft(remaining);
      }
    };

    update();
    restRef.current = setInterval(update, 500);
  };

  // Cleanup
  useEffect(() => () => { if (restRef.current) clearInterval(restRef.current); }, []);

  const currentLive = liveExercises[activeExerciseIndex];
  const currentExercise = currentLive?.exercise;

  // ── Mark set complete ──
  const completeSet = (setIndex: number) => {
    updateSessionState(prev => ({
      ...prev,
      liveExercises: prev.liveExercises.map((le, i) => {
        if (i !== prev.activeExerciseIndex) return le;
        const newSets = le.sets.map((s, si) =>
          si === setIndex ? { ...s, isCompleted: true } : s
        );
        return { ...le, sets: newSets };
      })
    }));
    // Start rest timer
    const restTime = currentExercise?.restTime || 90;
    startRest(restTime);
  };

  const updateSetField = (setIndex: number, field: 'weight' | 'reps', value: string) => {
    updateSessionState(prev => ({
      ...prev,
      liveExercises: prev.liveExercises.map((le, i) => {
        if (i !== prev.activeExerciseIndex) return le;
        const newSets = le.sets.map((s, si) =>
          si === setIndex ? { ...s, [field]: value } : s
        );
        return { ...le, sets: newSets };
      })
    }));
  };

  const addSet = () => {
    updateSessionState(prev => ({
      ...prev,
      liveExercises: prev.liveExercises.map((le, i) => {
        if (i !== prev.activeExerciseIndex) return le;
        const last = le.sets[le.sets.length - 1] || { weight: '0', reps: '10', isCompleted: false };
        return { ...le, sets: [...le.sets, { weight: last.weight, reps: last.reps, isCompleted: false }] };
      })
    }));
  };

  // ── Total progress ──
  const totalCompleted = liveExercises.reduce((sum, le) => sum + le.sets.filter(s => s.isCompleted).length, 0);
  const totalSets = liveExercises.reduce((sum, le) => sum + le.sets.length, 0);
  const totalProgress = totalSets > 0 ? (totalCompleted / totalSets) * 100 : 0;

  // ── Finish workout ──
  const finishWorkout = () => {
    const completedSets: CompletedSet[] = [];
    let totalVolume = 0;

    liveExercises.forEach(le => {
      le.sets.forEach((s, si) => {
        if (s.isCompleted) {
          const w = parseFloat(s.weight) || 0;
          const r = parseFloat(String(s.reps)) || 0;
          totalVolume += w * r;
          completedSets.push({
            exerciseId: le.exercise.id,
            exerciseName: le.exercise.name,
            setIndex: si,
            weight: w,
            reps: r,
          });
        }
      });
    });

    const session: WorkoutSession = {
      id: generateId(),
      workoutId: workout.id,
      workoutName: workout.name,
      date: new Date().toISOString(),
      durationSeconds: seconds,
      completedSets,
      totalVolume,
    };

    saveSession(session);
    localStorage.removeItem(SESSION_KEY);
    navigate('/workouts');
  };

  if (!workout) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="font-mono text-on-surface-variant">Treino não encontrado</p>
        <button onClick={() => {
          localStorage.removeItem(SESSION_KEY);
          navigate('/workouts');
        }} className="font-mono text-primary-fixed">Voltar</button>
      </div>
    );
  }

  const handleAbandon = () => {
    localStorage.removeItem(SESSION_KEY);
    navigate('/workouts');
  };

  return (
    <div className="flex flex-col gap-8 pb-32">
      {/* Session Header */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1 bg-surface-container-high rounded-full border border-primary-fixed/20">
          <TimerIcon size={16} className="text-primary-fixed" />
          <span className="font-mono font-bold text-lg text-primary-fixed tracking-tighter">
            {formatTime(seconds)}
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold text-on-surface-variant uppercase tracking-[0.2em]">
          {workout.name}
        </span>
      </div>

      {/* Exercise Tabs */}
      {liveExercises.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {liveExercises.map((le, idx) => {
            const done = le.sets.filter(s => s.isCompleted).length;
            const isActive = idx === activeExerciseIndex;
            return (
              <button
                key={le.exercise.id}
                onClick={() => setActiveExerciseIndex(idx)}
                className={cn(
                  "flex-shrink-0 px-3 py-1.5 rounded-full font-mono font-bold text-[10px] uppercase tracking-widest transition-all",
                  isActive
                    ? "bg-primary-fixed text-on-primary-fixed"
                    : done === le.sets.length && le.sets.length > 0
                      ? "bg-surface-variant text-primary-fixed/60"
                      : "bg-surface-container text-on-surface-variant hover:text-white"
                )}
              >
                {idx + 1}. {le.exercise.name.split(' ')[0]}
                {done > 0 && <span className="ml-1 opacity-70">({done}/{le.sets.length})</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Exercise Focus Area */}
      {currentExercise ? (
        <section className="flex flex-col gap-4">
          <div className="flex justify-between items-end px-1">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono font-bold text-primary-fixed uppercase tracking-wider mb-1">Exercício Atual</span>
              <h2 className="font-display font-extrabold text-3xl text-white tracking-tight leading-none">
                {currentExercise.name}
              </h2>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-mono font-bold text-on-surface-variant uppercase tracking-wider mb-1">Séries</span>
              <span className="font-mono font-black text-xl text-white tracking-tighter">
                {currentLive.sets.filter(s => s.isCompleted).length} <span className="text-on-surface-variant/40">/ {currentLive.sets.length}</span>
              </span>
              <div className="flex items-center gap-1 mt-1 text-primary-fixed/80 bg-primary-fixed/10 px-2 py-0.5 rounded-full border border-primary-fixed/20">
                <TimerIcon size={10} />
                <span className="font-mono font-bold text-[9px] uppercase tracking-widest">{currentExercise.restTime}s pausa</span>
              </div>
            </div>
          </div>

          {/* Exercise Video Guide */}
          <ExerciseGuide exercise={currentExercise} />

          {/* Set Tracking Table */}
          <div className="flex flex-col gap-3 mt-4">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 px-4">
              <div className="col-span-2 text-[9px] font-mono font-bold text-on-surface-variant uppercase tracking-widest">SÉRIE</div>
              <div className="col-span-4 text-[9px] font-mono font-bold text-on-surface-variant uppercase tracking-widest">PESO (KG)</div>
              <div className="col-span-3 text-[9px] font-mono font-bold text-on-surface-variant uppercase tracking-widest">REPS</div>
              <div className="col-span-3"></div>
            </div>

            {/* Rows */}
            {currentLive.sets.map((set, setIndex) => {
              const isCompleted = set.isCompleted;
              const isActive = !isCompleted && currentLive.sets.slice(0, setIndex).every(s => s.isCompleted);

              return (
                <motion.div
                  key={setIndex}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: setIndex * 0.05 }}
                  className={cn(
                    "grid grid-cols-12 items-center gap-4 p-4 glass-card rounded-xl transition-all duration-300",
                    isActive && "glow-active scale-[1.02] border-primary-fixed/40",
                    isCompleted && "opacity-40 grayscale"
                  )}
                >
                  <div className={cn(
                    "col-span-2 font-mono font-black text-xl tracking-tighter",
                    isActive ? "text-primary-fixed" : "text-white"
                  )}>
                    {setIndex + 1}
                  </div>
                  
                  <div className="col-span-4">
                    {isActive || !isCompleted ? (
                      <input 
                        type="number" 
                        value={set.weight}
                        onChange={(e) => updateSetField(setIndex, 'weight', e.target.value)}
                        disabled={isCompleted}
                        className="w-full bg-surface-container-highest border-b-2 border-primary-fixed text-white font-mono font-black text-xl text-center py-1 focus:outline-none focus:bg-surface-variant transition-colors disabled:opacity-40"
                      />
                    ) : (
                      <div className="font-mono font-bold text-xl text-center text-white/80">{set.weight}</div>
                    )}
                  </div>

                  <div className="col-span-3">
                    {isActive || !isCompleted ? (
                      <input 
                        type="text" 
                        inputMode="text"
                        value={set.reps}
                        onChange={(e) => updateSetField(setIndex, 'reps', e.target.value)}
                        disabled={isCompleted}
                        className="w-full bg-surface-container-highest border-b-2 border-primary-fixed text-white font-mono font-black text-xl text-center py-1 focus:outline-none focus:bg-surface-variant transition-colors disabled:opacity-40"
                      />
                    ) : (
                      <div className="font-mono font-bold text-xl text-center text-white/80">{set.reps}</div>
                    )}
                  </div>

                  <div className="col-span-3 flex justify-end">
                    <button 
                      onClick={() => !isCompleted && completeSet(setIndex)}
                      disabled={isCompleted}
                      className={cn(
                        "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 active:scale-90",
                        isActive ? "border-primary-fixed text-primary-fixed shadow-[0_0_10px_rgba(195,244,0,0.2)]" : "border-on-surface-variant/20 text-on-surface-variant/20",
                        isCompleted && "bg-primary-fixed border-primary-fixed text-on-primary-fixed opacity-100"
                      )}
                    >
                      <Check size={20} className="stroke-[3]" />
                    </button>
                  </div>
                </motion.div>
              );
            })}

            {/* Add Set */}
            <button
              onClick={addSet}
              className="flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-outline-variant/40 text-on-surface-variant/60 hover:text-primary-fixed hover:border-primary-fixed/40 transition-all font-mono font-bold text-[10px] uppercase tracking-widest"
            >
              <Plus size={14} strokeWidth={3} />
              Adicionar Série
            </button>
          </div>
        </section>
      ) : (
        <div className="text-center py-12 text-on-surface-variant font-mono text-sm">
          Nenhum exercício neste treino. Edite o treino para adicionar exercícios.
        </div>
      )}

      {/* Rest Timer */}
      <AnimatePresence>
        {restSecondsLeft !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-4 glass-card rounded-2xl flex items-center justify-between border-primary-fixed/20 glow-active"
          >
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4" className="text-surface-variant" />
                  <circle 
                    cx="28" cy="28" r="24" 
                    fill="none" stroke="currentColor" 
                    strokeWidth="4" 
                    strokeDasharray="150" 
                    strokeDashoffset={150 - (restSecondsLeft / (currentExercise?.restTime || 90)) * 150}
                    strokeLinecap="round"
                    className="text-primary-fixed transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-mono font-black text-xs text-white">
                  {restSecondsLeft}s
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-mono font-bold text-on-surface-variant uppercase tracking-widest">Tempo de Descanso</span>
                <span className="font-sans font-semibold text-white/90">Recuperando...</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setRestSecondsLeft(r => r !== null ? Math.min(r + 30, 300) : 30)}
                className="bg-surface-variant/80 px-3 py-1.5 rounded-lg font-mono font-bold text-[10px] text-white active:scale-95 transition-all flex items-center gap-1"
              >
                <Plus size={10} strokeWidth={3} /> 30S
              </button>
              <button
                onClick={() => { clearInterval(restRef.current!); setRestSecondsLeft(null); }}
                className="bg-surface-variant/80 px-3 py-1.5 rounded-lg font-mono font-bold text-[10px] text-red-400 active:scale-95 transition-all flex items-center gap-1"
              >
                <X size={10} strokeWidth={3} /> PULAR
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 pt-4">
        {activeExerciseIndex < liveExercises.length - 1 ? (
          <button 
            onClick={() => setActiveExerciseIndex(i => i + 1)}
            className="w-full bg-primary-fixed text-on-primary-fixed h-16 rounded-xl font-display font-black text-2xl tracking-tighter uppercase flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl hover:opacity-90"
          >
            Próximo Exercício
            <ArrowRight size={20} className="stroke-[3]" />
          </button>
        ) : (
          <button 
            onClick={finishWorkout}
            className="w-full bg-primary-fixed text-on-primary-fixed h-16 rounded-xl font-display font-black text-2xl tracking-tighter uppercase flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl"
          >
            Finalizar Treino
            <Save size={20} />
          </button>
        )}
        
        <button 
          onClick={() => {
            if (window.confirm('Abandonar treino? O progresso não será salvo.')) {
              handleAbandon();
            }
          }}
          onDoubleClick={handleAbandon}
          className="w-full border-2 border-red-500/30 text-red-500/60 h-12 rounded-xl font-mono font-bold text-sm uppercase flex items-center justify-center gap-3 active:scale-95 transition-all hover:border-red-500/60 hover:text-red-500"
        >
          Abandonar
        </button>
      </div>

      {/* Progress bar at bottom */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[600px] z-[60]">
        <div className="w-full bg-surface-container h-1.5 relative">
          <motion.div 
            className="absolute left-0 top-0 h-full bg-primary-fixed shadow-[0_0_12px_rgba(195,244,0,0.8)]"
            initial={{ width: 0 }}
            animate={{ width: `${totalProgress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </div>
  );
}
