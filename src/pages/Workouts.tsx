import React, { useState } from 'react';
import { Plus, Timer, Dumbbell, Trash2, Play, MoreVertical, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/src/lib/utils';
import { useWorkouts } from '../hooks';
import { Workout } from '../types';

export function Workouts() {
  const navigate = useNavigate();
  const { workouts, remove } = useWorkouts();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = (e: React.MouseEvent | React.TouchEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirmDeleteId === id) {
      remove(id);
      setMenuOpen(null);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
    }
  };

  // Close menu when clicking outside (handled implicitly by navigating or clicking elsewhere usually)
  // Let's reset confirm state when menu closes
  React.useEffect(() => {
    if (!menuOpen) setConfirmDeleteId(null);
  }, [menuOpen]);

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-mono font-bold text-primary-fixed uppercase tracking-wider">Rotinas</span>
          <h2 className="font-display font-extrabold text-4xl text-white uppercase italic tracking-tighter">Meus Treinos</h2>
        </div>
        <button 
          onClick={() => navigate('/ai-generator')}
          className="p-3 bg-surface-container-high border border-primary-fixed/20 text-primary-fixed rounded-2xl hover:bg-primary-fixed hover:text-on-primary-fixed transition-all active:scale-95 shadow-[0_0_20px_rgba(195,244,0,0.1)] group"
        >
          <Sparkles size={24} className="group-hover:animate-pulse" />
        </button>
      </div>

      {/* Empty state */}
      {workouts.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <Dumbbell size={40} className="text-on-surface-variant/30 mx-auto" />
          <p className="font-mono text-on-surface-variant/50 text-sm uppercase tracking-wider">Nenhum treino criado</p>
          <button
            onClick={() => navigate('/editor')}
            className="bg-primary-fixed text-on-primary-fixed font-mono font-bold text-xs px-6 py-3 rounded-full"
          >
            Criar primeiro treino
          </button>
        </div>
      )}

      {/* Routine Grid */}
      <div className="grid grid-cols-1 gap-4">
        {workouts.map((workout, index) => (
          <div 
            key={workout.id}
            className="glass-card rounded-xl p-5 flex flex-col gap-5 relative overflow-hidden"
          >
            {/* Visual Decoration */}
            {index === 2 && (
              <div className="absolute top-[-20px] right-[-20px] opacity-10 group-hover:opacity-20 transition-opacity">
                <Dumbbell size={120} />
              </div>
            )}

            <div className="flex justify-between items-start relative z-30">
              <div className="flex flex-col gap-2">
                <h3 className="font-display font-bold text-2xl text-white tracking-tight">{workout.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {workout.exercises.slice(0, 2).map((ex) => (
                    <span 
                      key={ex.id}
                      className="px-2 py-0.5 bg-surface-variant rounded-full text-[9px] font-mono font-bold text-on-surface-variant/80 uppercase"
                    >
                      {ex.muscleGroup}
                    </span>
                  ))}
                  {workout.exercises.length > 2 && (
                    <span className="px-2 py-0.5 bg-surface-variant rounded-full text-[9px] font-mono font-bold text-on-surface-variant/80 uppercase">
                      +{workout.exercises.length - 2} MORE
                    </span>
                  )}
                  {workout.exercises.length === 0 && (
                    <span className="px-2 py-0.5 bg-surface-variant/30 rounded-full text-[9px] font-mono font-bold text-on-surface-variant/50 uppercase italic">
                      Rotina Vazia
                    </span>
                  )}
                </div>
              </div>

              {/* Context Menu */}
              <div className="relative">
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMenuOpen(menuOpen === workout.id ? null : workout.id);
                  }}
                  className="p-1 hover:bg-surface-variant rounded-lg transition-colors"
                >
                  <MoreVertical size={20} className="text-on-surface-variant" />
                </button>

                {menuOpen === workout.id && (
                  <div 
                    className="absolute right-0 top-8 bg-surface-container-high border border-outline-variant/30 rounded-xl shadow-2xl z-20 overflow-hidden min-w-[160px]"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onTouchStart={(e) => { e.stopPropagation(); }}
                  >
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMenuOpen(null);
                        navigate(`/editor/${workout.id}`);
                      }}
                      className="w-full text-left px-4 py-3 font-mono text-xs text-white hover:bg-surface-variant transition-colors uppercase tracking-wider"
                    >
                      Editar
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, workout.id)}
                      className={cn(
                        "w-full text-left px-4 py-3 font-mono text-xs transition-colors uppercase tracking-wider flex items-center gap-2",
                        confirmDeleteId === workout.id 
                          ? "bg-red-500 text-white font-black"
                          : "text-red-400 hover:bg-red-500/10"
                      )}
                    >
                      <Trash2 size={12} />
                      {confirmDeleteId === workout.id ? 'Tem certeza?' : 'Excluir'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/5 pt-4 relative z-10">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono font-bold text-on-surface-variant mb-1 uppercase tracking-tighter">Último Treino</span>
                <span className={cn(
                  "font-mono font-bold text-sm tracking-tighter",
                  !workout.lastSessionDate || workout.lastSessionDate === 'NUNCA' ? "text-on-surface-variant/40" : "text-primary-fixed"
                )}>
                  {workout.lastSessionDate || 'NUNCA'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-mono font-bold text-on-surface-variant mb-1 uppercase tracking-tighter">Duração Média</span>
                  <div className="flex items-center gap-1.5">
                    <Timer size={14} className={workout.avgDuration ? "text-primary-fixed" : "text-on-surface-variant/20"} />
                    <span className={cn(
                      "font-mono font-bold text-sm tracking-tighter",
                      workout.avgDuration ? "text-primary-fixed" : "text-on-surface-variant/40"
                    )}>
                      {workout.avgDuration ? `${workout.avgDuration}M` : '--'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/active-workout/${workout.id}`); }}
                  className="w-10 h-10 bg-primary-fixed/10 hover:bg-primary-fixed text-primary-fixed hover:text-on-primary-fixed rounded-full flex items-center justify-center transition-all active:scale-90"
                >
                  <Play size={16} fill="currentColor" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FAB */}
      <button 
        onClick={() => navigate('/editor')}
        className="fixed bottom-28 right-6 w-14 h-14 bg-primary-fixed text-on-primary-fixed rounded-full shadow-2xl flex items-center justify-center z-50 active:scale-90 transition-all hover:scale-110 group"
      >
        <Plus size={32} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Bottom atmospheric divider */}
      <div className="relative w-full h-36 rounded-xl overflow-hidden mt-4 group">
        <img 
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop" 
          alt="Push Limits" 
          className="w-full h-full object-cover opacity-30 grayscale group-hover:scale-105 transition-transform duration-1000" 
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
          <p className="font-display font-extrabold text-2xl text-white italic tracking-widest px-8 text-center leading-tight">
            SUPERE SEUS LIMITES
          </p>
        </div>
      </div>
    </div>
  );
}
