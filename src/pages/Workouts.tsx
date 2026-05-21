import React, { useState } from 'react';
import { Plus, Timer, Dumbbell, Trash2, Play, MoreVertical, Sparkles, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/src/lib/utils';
import { useWorkouts } from '../hooks';

const BACKGROUND_IMAGES = [
  "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1541534741688-6078c65b5a33?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=600&auto=format&fit=crop"
];

export function Workouts() {
  const navigate = useNavigate();
  const { workouts, remove } = useWorkouts();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const categories = ['Todos', 'Força', 'Cardio', 'Hipertrofia'];
  const [selectedWorkoutPreview, setSelectedWorkoutPreview] = useState<any | null>(null);

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

  React.useEffect(() => {
    if (!menuOpen) setConfirmDeleteId(null);
  }, [menuOpen]);

  // Filter workouts (mock filtering based on category name check for demo/simplicity)
  const filteredWorkouts = workouts.filter(w => {
    if (activeCategory === 'Todos') return true;
    if (activeCategory === 'Força') return w.name.toLowerCase().includes('força') || w.name.toLowerCase().includes('dorsal') || w.name.toLowerCase().includes('peito');
    if (activeCategory === 'Cardio') return w.name.toLowerCase().includes('cardio') || w.name.toLowerCase().includes('aerobico');
    if (activeCategory === 'Hipertrofia') return !w.name.toLowerCase().includes('cardio');
    return true;
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-mono font-bold text-primary-fixed uppercase tracking-wider pl-0.5">Rotinas</span>
          <h2 className="font-display font-black text-4xl text-white uppercase italic tracking-tighter leading-none">Meus Treinos</h2>
        </div>
        <button 
          onClick={() => navigate('/ai-generator')}
          className="p-3 bg-[#121212] border border-white/5 text-primary-fixed rounded-2xl hover:bg-primary-fixed hover:text-on-primary-fixed transition-all active:scale-95 shadow-md group"
        >
          <Sparkles size={22} className="group-hover:animate-pulse" />
        </button>
      </div>

      {/* Category Filter Pills (Screen 2 Mockup style) */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-5 py-2.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-300 border flex-shrink-0 active:scale-95",
              cat === activeCategory
                ? "bg-primary-fixed text-on-primary-fixed border-primary-fixed shadow-[0_0_12px_rgba(225,255,0,0.2)]"
                : "bg-transparent text-white/50 border-white/10 hover:border-white/20"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filteredWorkouts.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <Dumbbell size={40} className="text-white/20 mx-auto" />
          <p className="font-mono text-white/40 text-sm uppercase tracking-wider">Nenhum treino nesta categoria</p>
          <button
            onClick={() => navigate('/editor')}
            className="bg-primary-fixed text-on-primary-fixed font-mono font-bold text-xs px-6 py-3 rounded-full"
          >
            Criar Treino
          </button>
        </div>
      )}

      {/* Routine list with premium image backgrounds */}
      <div className="flex flex-col gap-5">
        {filteredWorkouts.map((workout, index) => {
          const bgImage = BACKGROUND_IMAGES[index % BACKGROUND_IMAGES.length];
          return (
            <div 
              key={workout.id}
              onClick={() => setSelectedWorkoutPreview(workout)}
              className="relative overflow-hidden rounded-[24px] border border-white/5 bg-[#121212] h-[220px] group cursor-pointer active:scale-[0.98] transition-all duration-300 shadow-lg"
            >
              {/* Cover Image */}
              <img 
                src={bgImage} 
                alt={workout.name} 
                className="absolute inset-0 w-full h-full object-cover opacity-25 grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" 
              />
              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
              
              <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight italic">
                      {workout.name}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {workout.exercises.slice(0, 2).map((ex) => (
                        <span 
                          key={ex.id}
                          className="px-2 py-0.5 bg-black/60 backdrop-blur-sm border border-white/5 rounded-full text-[8px] font-mono font-bold text-white/70 uppercase"
                        >
                          {ex.muscleGroup}
                        </span>
                      ))}
                      {workout.exercises.length > 2 && (
                        <span className="px-2 py-0.5 bg-black/60 backdrop-blur-sm border border-white/5 rounded-full text-[8px] font-mono font-bold text-white/70 uppercase">
                          +{workout.exercises.length - 2} EXERCÍCIOS
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Context menu for edit/delete */}
                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMenuOpen(menuOpen === workout.id ? null : workout.id);
                      }}
                      className="w-8 h-8 flex items-center justify-center bg-black/60 backdrop-blur-sm border border-white/5 rounded-full text-white/80 hover:text-white"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {menuOpen === workout.id && (
                      <div 
                        className="absolute right-0 top-10 bg-[#1c1c1e] border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden min-w-[140px]"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      >
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setMenuOpen(null);
                            navigate(`/editor/${workout.id}`);
                          }}
                          className="w-full text-left px-4 py-2.5 font-mono text-[10px] text-white hover:bg-white/5 transition-colors uppercase tracking-wider"
                        >
                          Editar
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, workout.id)}
                          className={cn(
                            "w-full text-left px-4 py-2.5 font-mono text-[10px] transition-colors uppercase tracking-wider flex items-center gap-2",
                            confirmDeleteId === workout.id 
                              ? "bg-red-500 text-white font-black"
                              : "text-red-400 hover:bg-red-500/10"
                          )}
                        >
                          {confirmDeleteId === workout.id ? 'Confirmar?' : 'Excluir'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-4">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-mono text-white/40 uppercase tracking-wider mb-0.5">Último Treino</span>
                    <span className="font-mono font-bold text-xs text-primary-fixed">
                      {workout.lastSessionDate || 'NUNCA'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 font-mono text-xs text-white/70">
                      <Timer size={14} className="text-primary-fixed" />
                      <span>{workout.avgDuration ? `${workout.avgDuration}M` : '45M'}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedWorkoutPreview(workout); }}
                      className="w-10 h-10 bg-primary-fixed text-on-primary-fixed rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-[0_0_12px_rgba(225,255,0,0.2)]"
                    >
                      <Play size={16} fill="currentColor" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FAB - Premium Float */}
      <button 
        onClick={() => navigate('/editor')}
        className="fixed bottom-24 right-6 w-14 h-14 bg-primary-fixed text-on-primary-fixed rounded-full shadow-[0_8px_30px_rgb(225,255,0,0.3)] flex items-center justify-center z-50 active:scale-90 transition-all hover:scale-105 group"
      >
        <Plus size={28} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
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

      {/* Workout Preview Modal */}
      {selectedWorkoutPreview && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 cursor-default"
          onClick={() => setSelectedWorkoutPreview(null)}
        >
          <div 
            className="bg-[#122131] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[80vh] animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-white/5 flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono font-bold text-primary-fixed uppercase tracking-wider">Visualizar Rotina</span>
                <h3 className="font-display font-extrabold text-2xl text-white uppercase italic tracking-tight">{selectedWorkoutPreview.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedWorkoutPreview(null)}
                className="p-2 hover:bg-white/5 rounded-full text-on-surface-variant transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            {/* Exercises List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[50vh] scrollbar-thin scrollbar-thumb-white/10">
              {selectedWorkoutPreview.exercises.length === 0 ? (
                <div className="text-center py-8">
                  <p className="font-mono text-xs text-on-surface-variant/60 italic">Nenhum exercício cadastrado nesta rotina.</p>
                </div>
              ) : (
                selectedWorkoutPreview.exercises.map((ex, idx) => (
                  <div key={ex.id} className="bg-[#051424]/40 border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-primary-fixed/10 text-primary-fixed font-mono text-xs flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <h4 className="font-sans font-bold text-white text-base">{ex.name}</h4>
                      </div>
                      <span className="px-2.5 py-0.5 bg-[#273647] rounded-full text-[9px] font-mono font-bold text-primary-fixed uppercase">
                        {ex.muscleGroup}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs font-mono text-[#c4c9ac] border-t border-white/5 pt-2">
                      <span>{ex.sets.length} séries • {ex.sets[0]?.reps ?? 10} reps</span>
                      <span className="flex items-center gap-1">
                        <Timer size={12} className="text-primary-fixed" />
                        Descanso: {ex.restTime || 90}s
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Action Footer */}
            <div className="p-6 border-t border-white/5 bg-[#122131] flex gap-3">
              <button 
                onClick={() => {
                  setSelectedWorkoutPreview(null);
                  navigate(`/editor/${selectedWorkoutPreview.id}`);
                }}
                className="flex-1 py-3 border border-white/10 hover:border-white/20 text-white font-mono text-xs font-bold uppercase rounded-xl transition-all active:scale-95"
              >
                Editar
              </button>
              <button 
                onClick={() => {
                  setSelectedWorkoutPreview(null);
                  navigate(`/active-workout/${selectedWorkoutPreview.id}`);
                }}
                className="flex-[2] py-3 bg-primary-fixed text-on-primary-fixed font-mono text-xs font-black uppercase rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(195,244,0,0.15)] hover:shadow-[0_0_25px_rgba(195,244,0,0.25)]"
              >
                <Play size={14} fill="currentColor" />
                Iniciar Treino
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
