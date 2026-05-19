import React, { useState } from 'react';
import { Search, ChevronRight, Dumbbell } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useExerciseLibrary } from '../hooks';
import { useExerciseMedia } from '../hooks/useExerciseMedia';
import { ExerciseVideo } from '../components/ExerciseVideo';
import { Exercise } from '../types';

const MUSCLE_LABELS: Record<string, string> = {
  'ALL': 'TODOS',
  'Peitoral': 'PEITORAL',
  'Costas': 'COSTAS',
  'Pernas': 'PERNAS',
  'Ombros': 'OMBROS',
  'Bíceps': 'BÍCEPS',
  'Tríceps': 'TRÍCEPS',
  'Abdominais': 'ABS',
  'Glúteos': 'GLÚTEOS',
  'Antebraços': 'ANTEBRAÇOS',
};

// ─── Individual exercise card with lazy media load ───────────────────────────
const ExerciseCard = ({ ex, isExpanded, onToggle }: {
  ex: Exercise;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const { media, loading, load } = useExerciseMedia(ex.muscleGroup, ex.name, isExpanded, ex.id);

  const handleToggle = () => {
    onToggle();
    if (!isExpanded) load(); // trigger fetch when expanding
  };

  return (
    <div className="overflow-hidden">
      <div
        onClick={handleToggle}
        className={cn(
          "group relative rounded-xl bg-surface-container border border-outline-variant/30 hover:border-primary-fixed/40 transition-all cursor-pointer active:scale-[0.99]",
          isExpanded && "bg-surface-container-high ring-1 ring-primary-fixed/30"
        )}
      >
        <div className="flex items-center p-3 gap-4">
          {/* Thumbnail / Letter avatar */}
          <div className="w-16 h-16 rounded-lg bg-surface-container-highest overflow-hidden flex-shrink-0 border border-white/5 relative">
            {ex.imageUrl ? (
              <img
                src={ex.imageUrl}
                alt={ex.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="font-display font-black text-2xl text-on-surface-variant/20">
                  {ex.name[0]}
                </span>
              </div>
            )}
          </div>

          <div className="flex-grow min-w-0">
            <h3 className="font-display font-bold text-lg text-white leading-tight">{ex.name}</h3>
            <div className="flex gap-2 mt-1.5 overflow-x-auto no-scrollbar">
              <span className="bg-surface-variant/50 text-[9px] font-mono font-bold text-on-surface-variant px-2 py-0.5 rounded uppercase flex-shrink-0">
                {ex.muscleGroup}
              </span>
              <span className="bg-surface-variant/50 text-[9px] font-mono font-bold text-on-surface-variant px-2 py-0.5 rounded uppercase flex-shrink-0">
                {ex.type}
              </span>
              <span className="bg-surface-variant/50 text-[9px] font-mono font-bold text-on-surface-variant px-2 py-0.5 rounded uppercase flex-shrink-0">
                {ex.category}
              </span>
            </div>
          </div>

          <ChevronRight
            size={20}
            className={cn(
              "text-on-surface-variant group-hover:text-primary-fixed transition-all flex-shrink-0",
              isExpanded && "rotate-90 text-primary-fixed"
            )}
          />
        </div>

        {/* Expanded panel */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-5 pt-2 border-t border-white/5 space-y-4">
                {/* Video / GIF */}
                {loading && (
                  <div className="w-full h-44 rounded-xl bg-surface-container-highest flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-2 border-primary-fixed border-t-transparent rounded-full animate-spin" />
                      <span className="text-[10px] font-mono text-on-surface-variant/60 uppercase">Carregando...</span>
                    </div>
                  </div>
                )}

                {!loading && media?.videoUrl && (
                  <ExerciseVideo
                    videoUrl={media.videoUrl}
                    imageUrl={media.imageUrl}
                    name={ex.name}
                    className="w-full h-52"
                    autoPlay
                  />
                )}

                {!loading && !media?.videoUrl && (
                  <div className="w-full h-32 rounded-xl bg-surface-container-highest flex items-center justify-center border border-white/5">
                    <div className="flex flex-col items-center gap-2 opacity-40">
                      <Dumbbell size={28} />
                      <span className="text-[10px] font-mono uppercase tracking-wider">Sem mídia</span>
                    </div>
                  </div>
                )}

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-background/40 rounded-lg p-3 border border-white/5 text-center">
                    <span className="font-mono font-bold text-[9px] text-on-surface-variant uppercase block mb-1">Tipo</span>
                    <span className="font-mono font-extrabold text-primary-fixed text-xs uppercase">{ex.type}</span>
                  </div>
                  <div className="bg-background/40 rounded-lg p-3 border border-white/5 text-center">
                    <span className="font-mono font-bold text-[9px] text-on-surface-variant uppercase block mb-1">Descanso</span>
                    <span className="font-mono font-extrabold text-primary-fixed text-xs uppercase">{ex.restTime}s</span>
                  </div>
                  <div className="bg-background/40 rounded-lg p-3 border border-white/5 text-center">
                    <span className="font-mono font-bold text-[9px] text-on-surface-variant uppercase block mb-1">Foco</span>
                    <span className="font-mono font-extrabold text-primary-fixed text-xs uppercase truncate block">{ex.muscleGroup}</span>
                  </div>
                </div>

                {ex.description && (
                  <p className="text-on-surface-variant font-sans text-xs leading-relaxed opacity-80">{ex.description}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Main Library page ───────────────────────────────────────────────────────
export function Library() {
  const { exercises } = useExerciseLibrary();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const muscleGroups = ['ALL', ...Array.from(new Set(exercises.map(e => e.muscleGroup)))];

  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscle = selectedMuscle === 'ALL' || ex.muscleGroup === selectedMuscle;
    return matchesSearch && matchesMuscle;
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Search & Filter */}
      <section className="space-y-4">
        <div className="relative group">
          <input
            type="text"
            placeholder="BUSCAR EXERCÍCIOS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container border-b-2 border-outline-variant focus:border-primary-fixed text-white px-12 py-4 font-mono font-bold text-sm focus:outline-none transition-all placeholder:text-on-surface-variant/40"
          />
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary-fixed transition-colors" />
        </div>

        <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
          {muscleGroups.map((muscle) => (
            <button
              key={muscle as string}
              onClick={() => { setSelectedMuscle(muscle as string); setExpandedId(null); }}
              className={cn(
                "px-4 py-2 rounded-full font-mono font-bold text-[10px] whitespace-nowrap transition-all active:scale-95 flex-shrink-0",
                selectedMuscle === muscle
                  ? "bg-primary-fixed text-on-primary-fixed drop-shadow-[0_0_8px_rgba(195,244,0,0.3)]"
                  : "bg-surface-container-high text-on-surface-variant/70 hover:text-white"
              )}
            >
              {MUSCLE_LABELS[muscle as string] || (muscle as string).toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      {/* Count header */}
      <section className="space-y-4">
        <div className="flex items-end justify-between px-1">
          <h2 className="font-display font-bold text-2xl text-white uppercase italic tracking-tight underline decoration-primary-fixed/30 underline-offset-8">
            {MUSCLE_LABELS[selectedMuscle] || selectedMuscle.toUpperCase()}
          </h2>
          <span className="font-mono font-bold text-on-surface-variant text-[10px]">
            {filteredExercises.length} EXERCÍCIOS
          </span>
        </div>

        {/* Exercise list */}
        <div className="flex flex-col gap-2">
          {filteredExercises.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-mono text-on-surface-variant/40 text-xs uppercase">Nenhum exercício encontrado</p>
            </div>
          ) : (
            filteredExercises.map((ex) => (
              <div key={ex.id}>
                <ExerciseCard
                  ex={ex}
                  isExpanded={expandedId === ex.id}
                  onToggle={() => setExpandedId(expandedId === ex.id ? null : ex.id)}
                />
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
