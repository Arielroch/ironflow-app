import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Trash2, GripVertical, PlusCircle, Save, X, ChevronDown } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Reorder } from 'motion/react';
import { useWorkouts, useExerciseLibrary } from '../hooks';
import { Exercise, Workout } from '../types';
import { generateId } from '../store';

export function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { workouts, create, update } = useWorkouts();
  const { exercises: library } = useExerciseLibrary();

  const existingWorkout = useMemo(() => workouts.find(w => w.id === id), [workouts, id]);

  const [name, setName] = useState(existingWorkout?.name || '');
  const [exercises, setExercises] = useState<Exercise[]>(existingWorkout?.exercises || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLibrary, setShowLibrary] = useState(false);

  const filteredLibrary = useMemo(() =>
    library.filter(ex =>
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.muscleGroup.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [library, searchQuery]
  );

  const addExercise = (ex: Exercise) => {
    if (exercises.find(e => e.id === ex.id)) return; // already added
    setExercises(prev => [...prev, { ...ex, sets: ex.sets.length > 0 ? ex.sets : [{ weight: 0, reps: 10, isCompleted: false }, { weight: 0, reps: 10, isCompleted: false }, { weight: 0, reps: 10, isCompleted: false }] }]);
    setSearchQuery('');
    setShowLibrary(false);
  };

  const updateSetsCount = (exId: string, count: number) => {
    setExercises(prev => prev.map(e => {
      if (e.id !== exId) return e;
      const curr = e.sets.length;
      let newSets = [...e.sets];
      if (count > curr) {
        const template = newSets[curr - 1] || { weight: 0, reps: 10, isCompleted: false };
        for (let i = curr; i < count; i++) newSets.push({ ...template, isCompleted: false });
      } else {
        newSets = newSets.slice(0, count);
      }
      return { ...e, sets: newSets };
    }));
  };

  const updateSetField = (exId: string, field: 'weight' | 'reps' | 'restTime', value: string | number) => {
    setExercises(prev => prev.map(e => {
      if (e.id !== exId) return e;
      if (field === 'restTime') return { ...e, restTime: Number(value) };
      const newSets = e.sets.map(s => ({ ...s, [field]: value }));
      return { ...e, sets: newSets };
    }));
  };

  const removeExercise = (exId: string) => {
    setExercises(prev => prev.filter(e => e.id !== exId));
  };

  const toggleSuperSet = (idx: number) => {
    if (idx === 0) return;
    setExercises(prev => {
      const copy = [...prev];
      const prevEx = copy[idx - 1];
      const currEx = copy[idx];
      
      const currentGroupId = currEx.superSetId;
      const prevGroupId = prevEx.superSetId;
      
      if (currentGroupId && prevGroupId && currentGroupId === prevGroupId) {
        currEx.superSetId = undefined;
        const prevStillLinked = copy.some((e, i) => i !== idx - 1 && e.superSetId === prevGroupId);
        if (!prevStillLinked) {
          prevEx.superSetId = undefined;
        }
      } else {
        const newGroupId = prevGroupId || generateId();
        prevEx.superSetId = newGroupId;
        currEx.superSetId = newGroupId;
      }
      return copy;
    });
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Digite um nome para o treino');
      return;
    }
    if (existingWorkout) {
      update({ ...existingWorkout, name: name.trim(), exercises });
    } else {
      create({ name: name.trim(), exercises });
    }
    navigate('/workouts');
  };

  return (
    <div className="flex flex-col gap-8 pb-32">
      {/* Workout Identity */}
      <section className="space-y-2">
        <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase tracking-widest pl-1">Nome do Treino</label>
        <input 
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="NOME DO TREINO..."
          className="w-full bg-transparent font-display font-black text-4xl text-white border-b-2 border-surface-variant focus:border-primary-fixed outline-none py-2 transition-all placeholder:text-surface-variant/40 uppercase tracking-tighter"
        />
      </section>

      {/* Exercise Search */}
      <div className="relative z-50">
        <div className="relative group">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary-fixed transition-colors" />
          <input 
            type="text" 
            placeholder="BUSCAR E ADICIONAR EXERCÍCIO..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowLibrary(true); }}
            onFocus={() => setShowLibrary(true)}
            className="w-full h-14 glass-card rounded-2xl pl-12 pr-4 font-mono font-bold text-sm focus:ring-1 focus:ring-primary-fixed/50 outline-none transition-all placeholder:text-on-surface-variant/30"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setShowLibrary(false); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-white">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Dropdown library */}
        {showLibrary && (
          <div className="absolute top-16 left-0 right-0 z-50 bg-surface-container-high/95 backdrop-blur-md border border-outline-variant/40 rounded-2xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
            {filteredLibrary.length === 0 ? (
              <div className="p-4 text-center text-on-surface-variant font-mono text-xs">Nenhum exercício encontrado</div>
            ) : (
              filteredLibrary.map(ex => (
                <button
                  key={ex.id}
                  onClick={() => addExercise(ex)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 hover:bg-surface-variant transition-colors text-left",
                    exercises.find(e => e.id === ex.id) && "opacity-40 pointer-events-none"
                  )}
                >
                  {ex.imageUrl && (
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-surface-variant">
                      <img src={ex.imageUrl} alt={ex.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-mono font-bold text-xs text-white truncate">{ex.name}</span>
                    <span className="font-mono text-[10px] text-on-surface-variant">{ex.muscleGroup} · {ex.type}</span>
                  </div>
                  {exercises.find(e => e.id === ex.id) && (
                    <span className="text-[9px] font-mono text-primary-fixed/50">Adicionado</span>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Exercise List */}
      <Reorder.Group 
        axis="y" 
        values={exercises} 
        onReorder={setExercises} 
        className="flex flex-col gap-4"
      >
        {exercises.map((ex, idx) => {
          const isGroupedWithPrev = idx > 0 && ex.superSetId && ex.superSetId === exercises[idx - 1].superSetId;
          const isGroupedWithNext = idx < exercises.length - 1 && ex.superSetId && ex.superSetId === exercises[idx + 1].superSetId;

          return (
            <Reorder.Item 
              key={ex.id} 
              value={ex}
              className={cn(
                "glass-card rounded-2xl p-5 flex flex-col gap-5 cursor-grab active:cursor-grabbing active:shadow-2xl transition-all duration-300",
                (isGroupedWithPrev || isGroupedWithNext) && "border-l-4 border-l-primary-fixed pl-4"
              )}
            >
              {isGroupedWithNext && !isGroupedWithPrev && (
                <div className="flex items-center gap-1.5 text-primary-fixed font-mono text-[9px] uppercase tracking-wider mb-[-8px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed animate-pulse" />
                  🔥 Super Série / Bi-set
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-on-surface-variant/40 hover:text-white transition-colors">
                    <GripVertical size={20} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xl text-white tracking-tight leading-none">{ex.name}</h3>
                    <span className="text-[10px] font-mono text-on-surface-variant/60 uppercase">{ex.muscleGroup}</span>
                  </div>
                </div>
                <button 
                  onClick={() => removeExercise(ex.id)}
                  className="text-on-surface-variant opacity-40 hover:opacity-100 hover:text-red-500 transition-all p-1"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <p className="text-[9px] font-mono font-bold text-on-surface-variant uppercase tracking-widest pl-1">Séries</p>
                  <input 
                    type="number"
                    min={1}
                    max={10}
                    value={ex.sets.length}
                    onChange={(e) => updateSetsCount(ex.id, Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                    className="w-full h-12 bg-surface-container rounded-xl text-center font-mono font-black text-xl text-primary-fixed border border-white/5 focus:border-primary-fixed/50 focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[9px] font-mono font-bold text-on-surface-variant uppercase tracking-widest pl-1">Reps</p>
                  <input 
                    type="text"
                    value={ex.sets[0]?.reps ?? '10'}
                    onChange={(e) => updateSetField(ex.id, 'reps', e.target.value)}
                    className="w-full h-12 bg-surface-container rounded-xl text-center font-mono font-black text-xl text-primary-fixed border border-white/5 focus:border-primary-fixed/50 focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[9px] font-mono font-bold text-on-surface-variant uppercase tracking-widest pl-1">Desc. (s)</p>
                  <input 
                    type="number"
                    value={ex.restTime}
                    onChange={(e) => updateSetField(ex.id, 'restTime', e.target.value)}
                    className="w-full h-12 bg-surface-container rounded-xl text-center font-mono font-black text-xl text-primary-fixed border border-white/5 focus:border-primary-fixed/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Super Set Link Action */}
              <div className="flex items-center justify-between mt-1 pt-3 border-t border-white/5">
                {idx > 0 ? (
                  <button
                    type="button"
                    onClick={() => toggleSuperSet(idx)}
                    className={cn(
                      "text-[9px] font-mono font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all",
                      isGroupedWithPrev
                        ? "bg-primary-fixed/10 text-primary-fixed border border-primary-fixed/20 shadow-[0_0_8px_rgba(195,244,0,0.15)]"
                        : "bg-surface-container text-on-surface-variant hover:text-white"
                    )}
                  >
                    {isGroupedWithPrev ? "🔗 Desvincular Super Série" : "🔗 Vincular em Super Série"}
                  </button>
                ) : (
                  <div className="text-[8px] font-mono text-on-surface-variant/30 uppercase tracking-widest pl-1">Primeiro Exercício (Base)</div>
                )}
              </div>
            </Reorder.Item>
          );
        })}
      </Reorder.Group>

      {exercises.length === 0 && (
        <div className="text-center py-12 space-y-2">
          <p className="text-on-surface-variant/40 font-mono text-xs uppercase">Busque exercícios acima para adicionar</p>
        </div>
      )}

      {/* Contextual Save Button */}
      <div className="pt-6 w-full">
        <button 
          onClick={handleSave}
          className="w-full h-16 bg-primary-fixed text-on-primary-fixed font-display font-black text-2xl tracking-widest uppercase flex items-center justify-center gap-3 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] active:scale-95 transition-all hover:opacity-90"
        >
          <Save size={24} />
          {existingWorkout ? 'Salvar Alterações' : 'Criar Treino'}
        </button>
      </div>
    </div>
  );
}
