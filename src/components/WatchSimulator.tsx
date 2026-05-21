import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Timer, Check, ChevronLeft, ChevronRight, X, Play, Zap, Battery, Wifi, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getWorkouts, getWorkoutSessions, saveWorkoutSession, generateId } from '../store';
import { Workout, WorkoutSession, CompletedSet } from '../types';
import { cn } from '../lib/utils';

interface LiveSet {
  weight: string;
  reps: string;
  isCompleted: boolean;
}

interface LiveExercise {
  exercise: {
    id: string;
    name: string;
    restTime: number;
    muscleGroup: string;
  };
  sets: LiveSet[];
}

interface ActiveSessionData {
  workoutId: string;
  startTime: number;
  liveExercises: LiveExercise[];
  activeExerciseIndex: number;
}

const SESSION_KEY = 'ironflow_active_session';
const WATCH_UPDATE_EVENT = 'ironflow-watch-update';

export function WatchSimulator({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveSessionData | null>(null);
  const [previewWorkout, setPreviewWorkout] = useState<Workout | null>(null);
  const [currentTime, setCurrentTime] = useState('');
  
  // Timers
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [restSecondsLeft, setRestSecondsLeft] = useState<number | null>(null);
  const [activeRestTotal, setActiveRestTotal] = useState(90);
  const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load workouts and active session
  const loadData = () => {
    setWorkouts(getWorkouts());
    const cached = localStorage.getItem(SESSION_KEY);
    if (cached) {
      try {
        setActiveSession(JSON.parse(cached));
      } catch (e) {
        setActiveSession(null);
      }
    } else {
      setActiveSession(null);
    }
  };

  useEffect(() => {
    loadData();
    
    // Listen for storage changes & custom updates
    const handleUpdate = () => {
      loadData();
    };
    
    window.addEventListener('storage', handleUpdate);
    window.addEventListener(WATCH_UPDATE_EVENT, handleUpdate);
    
    // Clock helper
    const updateClock = () => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener(WATCH_UPDATE_EVENT, handleUpdate);
      clearInterval(clockInterval);
      if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    };
  }, []);

  // Reload data when the simulator is opened
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Update session duration
  useEffect(() => {
    if (!activeSession) return;
    setSessionSeconds(Math.floor((Date.now() - activeSession.startTime) / 1000));
    
    const interval = setInterval(() => {
      setSessionSeconds(Math.floor((Date.now() - activeSession.startTime) / 1000));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [activeSession?.startTime]);

  // Sync back to local storage
  const syncSession = (nextSession: ActiveSessionData | null) => {
    if (nextSession) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
    setActiveSession(nextSession);
    // Notify the rest of the application
    window.dispatchEvent(new Event(WATCH_UPDATE_EVENT));
  };

  // Start workout from watch
  const handleStartWorkout = (workout: Workout) => {
    const liveExercises = (workout.exercises || []).map(ex => ({
      exercise: {
        id: ex.id,
        name: ex.name,
        restTime: ex.restTime || 90,
        muscleGroup: ex.muscleGroup,
      },
      sets: Array.from({ length: ex.sets.length || 3 }, (_, i) => ({
        weight: String(ex.sets[i]?.weight ?? 0),
        reps: String(ex.sets[i]?.reps ?? 10),
        isCompleted: false,
      })),
    }));

    const next: ActiveSessionData = {
      workoutId: workout.id,
      startTime: Date.now(),
      liveExercises,
      activeExerciseIndex: 0,
    };

    syncSession(next);

    // Handoff: automatically navigate the parent web app to the active workout screen
    if (!location.pathname.startsWith('/active-workout')) {
      navigate(`/active-workout/${workout.id}`);
    }
  };

  // Complete set
  const handleCompleteSet = (setIndex: number) => {
    if (!activeSession) return;

    const { activeExerciseIndex, liveExercises } = activeSession;
    const currentLiveEx = liveExercises[activeExerciseIndex];
    if (!currentLiveEx) return;

    const nextLiveExercises = liveExercises.map((le, exIdx) => {
      if (exIdx !== activeExerciseIndex) return le;
      const nextSets = le.sets.map((s, sIdx) => 
        sIdx === setIndex ? { ...s, isCompleted: true } : s
      );
      return { ...le, sets: nextSets };
    });

    const nextSession = {
      ...activeSession,
      liveExercises: nextLiveExercises,
    };

    syncSession(nextSession);

    // Trigger watch haptic/vibration simulator using a sound or visual flash
    triggerWatchHaptic();

    // Start rest timer
    const restTime = currentLiveEx.exercise.restTime || 90;
    startRestTimer(restTime);
  };

  const startRestTimer = (seconds: number) => {
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    setActiveRestTotal(seconds);
    setRestSecondsLeft(seconds);

    restIntervalRef.current = setInterval(() => {
      setRestSecondsLeft(prev => {
        if (prev === null || prev <= 1) {
          if (restIntervalRef.current) clearInterval(restIntervalRef.current);
          triggerWatchHaptic();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const triggerWatchHaptic = () => {
    // Quick audio beep / custom haptic visual flash
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch beep
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      // AudioContext blocked or not supported
    }
  };

  const handleNextExercise = () => {
    if (!activeSession) return;
    const nextIdx = Math.min(activeSession.activeExerciseIndex + 1, activeSession.liveExercises.length - 1);
    syncSession({
      ...activeSession,
      activeExerciseIndex: nextIdx,
    });
  };

  const handlePrevExercise = () => {
    if (!activeSession) return;
    const prevIdx = Math.max(activeSession.activeExerciseIndex - 1, 0);
    syncSession({
      ...activeSession,
      activeExerciseIndex: prevIdx,
    });
  };

  // Finish Workout
  const handleFinishWorkout = () => {
    if (!activeSession) return;

    const completedSets: CompletedSet[] = [];
    let totalVolume = 0;

    activeSession.liveExercises.forEach(le => {
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
      workoutId: activeSession.workoutId,
      workoutName: workouts.find(w => w.id === activeSession.workoutId)?.name || 'Treino customizado',
      date: new Date().toISOString(),
      durationSeconds: sessionSeconds,
      completedSets,
      totalVolume,
    };

    saveWorkoutSession(session);
    syncSession(null);
    navigate('/workouts');
  };

  const handleCancelWorkout = () => {
    if (window.confirm('Abandonar treino no Apple Watch?')) {
      syncSession(null);
      navigate('/workouts');
    }
  };

  // Duration Formatter
  const formatDuration = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm md:inset-auto md:bottom-20 md:right-8 md:w-[320px] md:h-[520px] md:bg-transparent md:backdrop-blur-none">
      {/* Background close overlay for mobile */}
      <div className="absolute inset-0 md:hidden" onClick={onClose} />
      
      {/* Visual watch container */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Close Button on Desktop */}
        <button 
          onClick={onClose} 
          className="absolute -top-12 right-2 bg-surface-container hover:bg-surface-variant text-white p-2 rounded-full border border-white/10 active:scale-90 transition-all cursor-pointer"
          title="Fechar Simulador"
        >
          <X size={18} />
        </button>

        {/* Top strap hook */}
        <div className="w-[140px] h-[35px] bg-[#1a1a1c] rounded-t-2xl shadow-inner border-b border-black/30" />

        {/* Watch Chassis */}
        <div className="relative w-[210px] h-[256px] bg-gradient-to-br from-[#2a2b2f] via-[#121315] to-[#25262a] rounded-[48px] p-[6px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.2),inset_0_-2px_4px_rgba(0,0,0,0.5)] border border-[#3e4046]">
          
          {/* Digital Crown (Top Right) */}
          <div className="absolute -right-[6px] top-[46px] w-[8px] h-[40px] bg-gradient-to-r from-[#222] via-[#555] to-[#111] rounded-r-[3px] border border-black/40 shadow-md flex flex-col justify-between py-1">
            <div className="h-[2px] bg-black/40" />
            <div className="h-[2px] bg-black/40" />
            <div className="h-[2px] bg-black/40" />
            <div className="h-[2px] bg-black/40" />
            <div className="h-[2px] bg-black/40" />
          </div>

          {/* Side Button (Lower Right) */}
          <div className="absolute -right-[3px] top-[96px] w-[5px] h-[34px] bg-gradient-to-r from-[#2a2b2f] to-[#121315] rounded-r-[2px] border border-black/50 shadow-sm" />

          {/* Screen Glass Frame */}
          <div className="w-full h-full bg-[#000000] rounded-[42px] overflow-hidden p-[8px] relative shadow-[inset_0_0_10px_rgba(0,0,0,0.8)] border border-black select-none">
            
            {/* Screen sheen reflection effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none z-30" />

            {/* Apple Watch Software Core */}
            <div className="w-full h-full bg-[#000000] text-white font-sans flex flex-col justify-between text-left relative overflow-hidden select-none">
              
              {/* Status Bar */}
              <div className="flex items-center justify-between text-[10px] text-[#a1a1aa] font-semibold px-2 py-0.5 z-20 bg-[#000000]/80">
                <span className="font-mono text-[#e1ff00]">{currentTime}</span>
                <div className="flex items-center gap-1.5">
                  <Wifi size={10} className="text-emerald-400" />
                  <Battery size={12} className="text-[#a1a1aa]" />
                </div>
              </div>

              {/* Main Screen Content Scroll Area */}
              <div className="flex-1 overflow-y-auto no-scrollbar px-2 pb-3 pt-1 text-left">
                <AnimatePresence mode="wait">
                  {/* Rest Timer View overlay (highest priority inside software) */}
                  {restSecondsLeft !== null ? (
                    <motion.div 
                      key="rest"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute inset-x-0 bottom-0 top-[18px] bg-[#000000] flex flex-col items-center justify-center z-40 px-1"
                    >
                      <span className="text-[7px] font-mono font-black text-[#a1a1aa]/80 uppercase tracking-widest mb-1.5">DESCANSO</span>
                      
                      <div className="relative w-[70px] h-[70px] flex items-center justify-center mb-2">
                        <svg className="w-full h-full -rotate-90">
                          <circle cx="35" cy="35" r="31" fill="none" stroke="#121212" strokeWidth="3" />
                          <circle 
                            cx="35" cy="35" r="31" 
                            fill="none" stroke="#e1ff00" 
                            strokeWidth="3.5" 
                            strokeDasharray="194.7" 
                            strokeDashoffset={194.7 - (restSecondsLeft / activeRestTotal) * 194.7}
                            strokeLinecap="round"
                            className="transition-all duration-1000"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center font-mono leading-none">
                          <span className="text-lg font-black text-white">{restSecondsLeft}</span>
                          <span className="text-[7px] font-bold text-gray-500 uppercase">seg</span>
                        </div>
                      </div>

                      <div className="flex gap-2 w-full px-1">
                        <button 
                          onClick={() => {
                            setRestSecondsLeft(r => r !== null ? r + 30 : 30);
                            setActiveRestTotal(t => t + 30);
                          }}
                          className="flex-1 bg-[#1c1c1e] hover:bg-[#1c1c1e]/85 py-1.5 rounded-lg text-[9px] font-mono font-bold text-center active:scale-95 transition-transform"
                        >
                          +30S
                        </button>
                        <button 
                          onClick={() => setRestSecondsLeft(null)}
                          className="flex-1 bg-[#1c1c1e] hover:bg-[#1c1c1e]/85 py-1.5 rounded-lg text-[9px] font-mono font-bold text-red-400 text-center active:scale-95 transition-transform"
                        >
                          PULAR
                        </button>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                {/* Workout content conditional render */}
                {activeSession ? (
                  /* Active Workout Mode */
                  <div className="flex flex-col gap-2 pt-1">
                    {/* Timer Panel */}
                    <div className="flex items-center justify-between bg-[#121212]/60 border border-[#1c1c1e] rounded-lg p-1.5">
                      <div className="flex items-center gap-1">
                        <Timer size={10} className="text-[#e1ff00]" />
                        <span className="font-mono text-[11px] font-black tracking-tight text-white">
                          {formatDuration(sessionSeconds)}
                        </span>
                      </div>
                      <span className="text-[7px] font-mono font-bold bg-[#e1ff00]/10 text-[#e1ff00] border border-[#e1ff00]/20 px-1 rounded">
                        WATCH
                      </span>
                    </div>

                    {/* Active Exercise */}
                    {activeSession.liveExercises.length > 0 && activeSession.liveExercises[activeSession.activeExerciseIndex] ? (
                      <div className="flex flex-col gap-2">
                        {/* Title bar */}
                        <div className="flex flex-col">
                          <span className="text-[8px] font-mono font-bold text-[#e1ff00]/80 uppercase">
                            EXER. {activeSession.activeExerciseIndex + 1}/{activeSession.liveExercises.length}
                          </span>
                          <h4 className="text-[11px] font-bold text-white leading-tight font-sans line-limit-2 mt-0.5">
                            {activeSession.liveExercises[activeSession.activeExerciseIndex].exercise.name}
                          </h4>
                          <span className="text-[7px] font-mono text-[#a1a1aa] uppercase mt-0.5">
                            {activeSession.liveExercises[activeSession.activeExerciseIndex].exercise.muscleGroup}
                          </span>
                        </div>

                        {/* Sets Check List */}
                        <div className="flex flex-col gap-1.5">
                          {activeSession.liveExercises[activeSession.activeExerciseIndex].sets.map((set, setIndex) => {
                            const isCompleted = set.isCompleted;
                            const isNextToComplete = !isCompleted && activeSession.liveExercises[activeSession.activeExerciseIndex].sets.slice(0, setIndex).every(s => s.isCompleted);
                            
                            return (
                              <button
                                key={setIndex}
                                onClick={() => !isCompleted && handleCompleteSet(setIndex)}
                                disabled={isCompleted}
                                className={cn(
                                  "w-full text-left flex items-center justify-between p-1.5 rounded-lg border text-[10px] font-mono font-semibold transition-all duration-200 active:scale-[0.98]",
                                  isCompleted 
                                    ? "bg-black/40 border-[#121212]/60 opacity-40" 
                                    : isNextToComplete 
                                      ? "bg-[#e1ff00]/5 border-[#e1ff00]/30 text-white shadow-[0_0_8px_rgba(225,255,0,0.05)]"
                                      : "bg-[#121212] border-[#1c1c1e] text-[#d4e4fa]"
                                )}
                              >
                                <span className={cn(isNextToComplete && "text-[#e1ff00] font-bold")}>
                                  S{setIndex + 1}: {set.weight}kg x{set.reps}
                                </span>
                                <div className={cn(
                                  "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                                  isCompleted 
                                    ? "bg-emerald-500 border-emerald-500 text-black" 
                                    : isNextToComplete 
                                      ? "border-[#e1ff00]/50 text-[#e1ff00]/50" 
                                      : "border-[#1c1c1e] text-transparent"
                                )}>
                                  <Check size={8} strokeWidth={4} />
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Navigation Chevrons */}
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <button
                            onClick={handlePrevExercise}
                            disabled={activeSession.activeExerciseIndex === 0}
                            className="flex-1 flex justify-center items-center bg-[#121212] hover:bg-[#1c1c1e] disabled:opacity-30 disabled:pointer-events-none py-1 rounded-lg text-white"
                          >
                            <ChevronLeft size={14} />
                          </button>
                          <button
                            onClick={handleNextExercise}
                            disabled={activeSession.activeExerciseIndex === activeSession.liveExercises.length - 1}
                            className="flex-1 flex justify-center items-center bg-[#121212] hover:bg-[#1c1c1e] disabled:opacity-30 disabled:pointer-events-none py-1 rounded-lg text-white"
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>

                        {/* Finish Workout */}
                        <button
                          onClick={handleFinishWorkout}
                          className="w-full bg-[#e1ff00] text-black hover:bg-[#e1ff00]/90 py-2 rounded-lg font-bold text-[10px] text-center active:scale-95 transition-transform mt-2 tracking-tight flex items-center justify-center gap-1"
                        >
                          <Check size={11} strokeWidth={3} className="text-black" />
                          FINALIZAR TREINO
                        </button>

                        {/* Abandon workout */}
                        <button
                          onClick={handleCancelWorkout}
                          className="w-full text-center text-[8px] font-bold text-red-400/80 hover:text-red-400 py-1"
                        >
                          Abandonar Treino
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-[#a1a1aa] block text-center py-4">Sem exercícios</span>
                    )}
                  </div>
                ) : previewWorkout ? (
                  /* Workout Preview Mode */
                  <div className="flex flex-col gap-2 pt-1 text-left">
                    <div className="flex flex-col mb-1">
                      <span className="text-[8px] font-mono font-bold text-[#a1a1aa] uppercase">DETALHES DO TREINO</span>
                      <h4 className="text-[11.5px] font-bold text-white leading-tight font-sans line-clamp-2 mt-0.5 uppercase">
                        {previewWorkout.name}
                      </h4>
                    </div>

                    {/* Exercise List Preview */}
                    <div className="flex flex-col gap-1.5 max-h-[110px] overflow-y-auto no-scrollbar pr-0.5">
                      {previewWorkout.exercises.length === 0 ? (
                        <span className="text-[9px] font-mono text-zinc-400 italic">Rotina sem exercícios</span>
                      ) : (
                        previewWorkout.exercises.map((ex, idx) => (
                          <div key={ex.id} className="p-1.5 rounded-lg bg-[#121212]/60 border border-[#1c1c1e] text-[8.5px] text-white/90">
                            <div className="flex justify-between items-center font-bold">
                              <span>{idx + 1}. {ex.name}</span>
                            </div>
                            <div className="flex justify-between text-[7px] text-[#a1a1aa] font-mono mt-0.5">
                              <span>{ex.sets.length} séries • {ex.restTime || 90}s rec</span>
                              <span className="text-[#e1ff00] uppercase font-bold">{ex.muscleGroup}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1.5 mt-1.5">
                      <button 
                        onClick={() => setPreviewWorkout(null)}
                        className="flex-1 bg-[#1c1c1e] hover:bg-[#1c1c1e]/85 py-1.5 rounded-lg text-[9px] font-mono font-bold text-center active:scale-95 transition-transform"
                      >
                        VOLTAR
                      </button>
                      <button 
                        onClick={() => {
                          handleStartWorkout(previewWorkout);
                          setPreviewWorkout(null);
                        }}
                        className="flex-[1.5] bg-[#e1ff00] text-black hover:bg-[#e1ff00]/95 py-1.5 rounded-lg text-[9px] font-mono font-black text-center active:scale-95 transition-transform tracking-tight flex items-center justify-center gap-1 shadow-[0_0_8px_rgba(225,255,0,0.2)]"
                      >
                        <Play size={8} fill="currentColor" />
                        INICIAR
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Workouts Selection Mode */
                  <div className="flex flex-col gap-2 pt-1">
                    <span className="text-[9px] font-mono font-bold text-[#a1a1aa] uppercase tracking-wider block">
                      SELECIONAR TREINO
                    </span>
                    {workouts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 text-center opacity-60">
                        <ShieldAlert size={16} className="text-zinc-500 mb-1" />
                        <span className="text-[8px] font-mono text-zinc-400">Nenhum treino salvo.</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {workouts.map(w => (
                          <button
                            key={w.id}
                            onClick={() => setPreviewWorkout(w)}
                            className="w-full text-left p-2 rounded-lg bg-[#121212] hover:bg-[#1c1c1e] border border-[#1c1c1e] flex items-center justify-between group active:scale-95 transition-all"
                          >
                            <div className="flex flex-col overflow-hidden max-w-[82%]">
                              <span className="text-[9.5px] font-bold text-white truncate">{w.name}</span>
                              <span className="text-[7.5px] font-mono text-[#e1ff00]/80 mt-0.5 font-bold">
                                {w.exercises?.length || 0} EXERCÍCIOS
                              </span>
                            </div>
                            <Play size={8} className="text-[#e1ff00] fill-[#e1ff00] opacity-60 group-hover:opacity-100" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Bottom strap hook */}
        <div className="w-[140px] h-[35px] bg-[#1a1a1c] rounded-b-2xl shadow-md border-t border-black/30" />
      </div>
    </div>
  );
}
