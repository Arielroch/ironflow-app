import { BarChart, Bar, ResponsiveContainer, XAxis, Cell } from 'recharts';
import { Weight, Flame, TrendingUp, Play, Timer, Dumbbell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserStats, useWorkouts, useWorkoutSessions } from '../hooks';

export function Dashboard() {
  const navigate = useNavigate();
  const { stats } = useUserStats();
  const { workouts } = useWorkouts();
  const { sessions } = useWorkoutSessions();

  // Find the "next" workout — one not done today, prioritizing longest ago
  const today = new Date().toISOString().split('T')[0];
  const todaySessionIds = new Set(
    sessions.filter(s => s.date.startsWith(today)).map(s => s.workoutId)
  );
  const nextWorkout = workouts.find(w => !todaySessionIds.has(w.id)) || workouts[0];

  // Last session info
  const lastSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Quick Stats Bento */}
      <section className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5 rounded-xl flex flex-col justify-between h-36 relative overflow-hidden group">
          <div className="flex items-center justify-between opacity-60">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Peso</span>
            <Weight size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-4xl font-mono font-bold text-white tracking-tighter">
              {stats.weight.toFixed(1)}
            </span>
            <span className="text-[10px] font-mono font-bold text-primary-fixed mt-1">
              {stats.weightChange}
            </span>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
            <Weight size={80} />
          </div>
        </div>

        <div className="glass-card p-5 rounded-xl flex flex-col justify-between h-36 relative overflow-hidden group">
          <div className="flex items-center justify-between opacity-60">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Sequência</span>
            <Flame size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-4xl font-mono font-bold text-white tracking-tighter">
              {stats.streak}
            </span>
            <span className="text-[10px] font-mono font-bold text-primary-fixed mt-1 uppercase">
              Dias Seguidos
            </span>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
            <Flame size={80} />
          </div>
        </div>
      </section>

      {/* Weekly Progress Chart */}
      <section className="glass-card p-6 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-xl uppercase italic">Volume Semanal</h3>
          <TrendingUp size={20} className="text-on-surface-variant" />
        </div>
        
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.weeklyVolume}>
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#c4c9ac', fontSize: 10, fontWeight: 600 }}
                dy={10}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {stats.weeklyVolume.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.isToday ? '#c3f400' : '#273647'} 
                    className={entry.isToday ? 'drop-shadow-[0_0_8px_rgba(195,244,0,0.4)]' : ''}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {lastSession ? (
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Último treino: <span className="text-primary-fixed font-bold">{lastSession.workoutName}</span> — {sessions.length} sessão{sessions.length !== 1 ? 'ões' : ''} no total.
          </p>
        ) : (
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Nenhum treino registrado ainda. <span className="text-primary-fixed font-bold">Comece agora!</span>
          </p>
        )}
      </section>

      {/* Next Workout Card */}
      {nextWorkout && (
        <section 
          onClick={() => navigate(`/active-workout/${nextWorkout.id}`)}
          className="relative overflow-hidden rounded-xl border border-surface-variant bg-surface-container h-52 group cursor-pointer active:scale-[0.98] transition-all"
        >
          <img 
            src="https://images.unsplash.com/photo-1541534741688-6078c65b5a33?q=80&w=800&auto=format&fit=crop" 
            alt={nextWorkout.name} 
            className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
          
          <div className="absolute inset-0 p-6 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="bg-primary-fixed text-on-primary-fixed font-mono font-bold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest">
                Próximo
              </span>
              <h2 className="font-display font-extrabold text-2xl text-white tracking-tight leading-none uppercase">
                {nextWorkout.name}
              </h2>
            </div>
            
            <div className="flex items-center gap-6">
              {nextWorkout.avgDuration && (
                <div className="flex items-center gap-2">
                  <Timer size={16} className="text-primary-fixed" />
                  <span className="font-mono font-bold text-xs">{nextWorkout.avgDuration} MIN</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Dumbbell size={16} className="text-primary-fixed" />
                <span className="font-mono font-bold text-xs">{nextWorkout.exercises.length} EXERCÍCIOS</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Primary CTA */}
      <button 
        onClick={() => navigate(nextWorkout ? `/active-workout/${nextWorkout.id}` : '/workouts')}
        className="w-full bg-primary-fixed text-on-primary-fixed font-display font-extrabold text-xl h-16 rounded-xl uppercase flex items-center justify-center gap-3 active:scale-95 transition-all shadow-[0_0_20px_rgba(195,244,0,0.15)] group"
      >
        Iniciar Treino
        <Play size={20} fill="currentColor" className="group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}
