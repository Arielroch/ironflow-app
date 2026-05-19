import { useState } from 'react';
import { Play, Flame, Clock, Award, Dumbbell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserStats, useWorkouts, useWorkoutSessions } from '../hooks';
import { cn } from '@/src/lib/utils';

export function Dashboard() {
  const navigate = useNavigate();
  const { stats } = useUserStats();
  const { workouts } = useWorkouts();
  const { sessions } = useWorkoutSessions();

  // Find next workout
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessionIds = new Set(
    sessions.filter(s => s.date.startsWith(todayStr)).map(s => s.workoutId)
  );
  const nextWorkout = workouts.find(w => !todaySessionIds.has(w.id)) || workouts[0];

  // Generate dynamic week days (Seg a Sex)
  const daysOfWeek = [];
  const startOfWeek = new Date();
  const currentDay = startOfWeek.getDay();
  // Get Monday date
  const diff = startOfWeek.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
  startOfWeek.setDate(diff);

  for (let i = 0; i < 5; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dayLabel = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').substring(0, 3);
    const dayNum = String(d.getDate()).padStart(2, '0');
    const isToday = d.toDateString() === new Date().toDateString();
    
    daysOfWeek.push({
      label: dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1),
      num: dayNum,
      isToday,
    });
  }

  // Calculate stats this week
  const thisWeekSessions = sessions.filter(s => {
    const sDate = new Date(s.date);
    const now = new Date();
    const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));
    return sDate >= oneWeekAgo;
  });

  const weeklyCalories = thisWeekSessions.length * 350; // estimate 350 kcal per session
  const weeklyDurationSeconds = thisWeekSessions.reduce((sum, s) => sum + (s.durationSeconds || 1800), 0);
  const hours = Math.floor(weeklyDurationSeconds / 3600);
  const minutes = Math.floor((weeklyDurationSeconds % 3600) / 60);

  const workoutsRemaining = workouts.length - sessions.filter(s => s.date.startsWith(todayStr)).length;

  return (
    <div className="flex flex-col gap-8">
      {/* Title greeting */}
      <section className="space-y-1">
        <h2 className="font-display font-black text-4xl text-white tracking-tight uppercase italic leading-none">
          {workoutsRemaining > 0 ? `${workoutsRemaining} restantes!` : 'Tudo feito!'}
        </h2>
        <p className="text-on-surface-variant/60 font-mono text-[10px] uppercase tracking-widest pl-0.5">
          Seu progresso diário
        </p>
      </section>

      {/* Week Calendar Selector */}
      <section className="flex gap-2.5 overflow-x-auto no-scrollbar py-1">
        {daysOfWeek.map((day, idx) => (
          <div
            key={idx}
            className={cn(
              "flex flex-col items-center justify-center min-w-[62px] h-[78px] rounded-2xl transition-all duration-300",
              day.isToday
                ? "bg-primary-fixed text-on-primary-fixed shadow-[0_0_15px_rgba(225,255,0,0.25)] scale-105"
                : "bg-[#121212] border border-white/5 text-white/50"
            )}
          >
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider mb-1">
              {day.label}
            </span>
            <span className={cn(
              "font-display font-black text-xl tracking-tighter",
              day.isToday ? "text-black" : "text-white"
            )}>
              {day.num}
            </span>
          </div>
        ))}
      </section>

      {/* Next Workout */}
      {nextWorkout && (
        <section className="space-y-3">
          <h3 className="font-mono font-bold text-[10px] text-on-surface-variant uppercase tracking-widest pl-1">
            Próximo Treino
          </h3>
          <div className="relative bg-[#121212] border border-white/5 rounded-[24px] p-6 flex flex-col justify-between h-[210px] overflow-hidden group shadow-lg">
            <div className="flex flex-col gap-1.5 relative z-10">
              <span className="text-[10px] font-mono text-primary-fixed font-bold uppercase tracking-wider">
                Rotina recomendada
              </span>
              <h2 className="font-display font-black text-2xl text-white uppercase tracking-tight italic">
                {nextWorkout.name}
              </h2>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {nextWorkout.exercises.slice(0, 3).map((ex) => (
                  <span
                    key={ex.id}
                    className="px-2.5 py-0.5 bg-[#1c1c1e] rounded-full text-[9px] font-mono font-bold text-on-surface-variant/80 uppercase"
                  >
                    {ex.muscleGroup}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-end justify-between relative z-10 mt-4">
              <span className="text-white/60 font-mono font-bold text-xs uppercase">
                {nextWorkout.avgDuration || 45} MINUTOS
              </span>
              <button
                onClick={() => navigate(`/active-workout/${nextWorkout.id}`)}
                className="bg-primary-fixed text-on-primary-fixed font-display font-black text-sm px-5 py-2.5 rounded-full uppercase flex items-center gap-1.5 shadow-[0_0_12px_rgba(225,255,0,0.2)] active:scale-95 transition-all hover:scale-105"
              >
                <Play size={14} fill="currentColor" />
                Iniciar
              </button>
            </div>

            {/* Subtle background decoration */}
            <div className="absolute right-[-10px] top-[-10px] opacity-[0.02] group-hover:opacity-[0.04] transition-all duration-700 pointer-events-none">
              <Dumbbell size={180} />
            </div>
          </div>
        </section>
      )}

      {/* This Week Panel */}
      <section className="space-y-3">
        <h3 className="font-mono font-bold text-[10px] text-on-surface-variant uppercase tracking-widest pl-1">
          Esta Semana
        </h3>
        <div className="bg-[#121212] border border-white/5 rounded-[24px] p-5 flex items-center justify-around gap-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#1c1c1e] flex items-center justify-center text-primary-fixed border border-white/5">
              <Flame size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-on-surface-variant/60 uppercase tracking-wider">Calorias</span>
              <span className="font-display font-black text-lg text-white tracking-tight uppercase italic">
                {weeklyCalories} Kcal
              </span>
            </div>
          </div>

          <div className="h-8 w-[1px] bg-white/5" />

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#1c1c1e] flex items-center justify-center text-primary-fixed border border-white/5">
              <Clock size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-on-surface-variant/60 uppercase tracking-wider">Tempo</span>
              <span className="font-display font-black text-lg text-white tracking-tight uppercase italic">
                {hours > 0 ? `${hours}h ` : ''}{minutes}m
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Streak Bento mini card */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-[#121212] border border-white/5 p-5 rounded-[20px] flex items-center gap-4 group">
          <div className="w-10 h-10 rounded-xl bg-primary-fixed/10 text-primary-fixed flex items-center justify-center">
            <Flame size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-mono text-on-surface-variant/50 uppercase tracking-wider">Sequência</span>
            <span className="font-display font-black text-xl text-white tracking-tighter italic">
              {stats.streak} DIAS
            </span>
          </div>
        </div>

        <div className="bg-[#121212] border border-white/5 p-5 rounded-[20px] flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary-fixed/10 text-primary-fixed flex items-center justify-center">
            <Award size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-mono text-on-surface-variant/50 uppercase tracking-wider">Treinos</span>
            <span className="font-display font-black text-xl text-white tracking-tighter italic">
              {sessions.length} TOTAL
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
