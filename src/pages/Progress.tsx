import { useState, useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp, Calendar, Target, Trophy, Plus, Minus, Scale, X, Ruler, Dumbbell } from 'lucide-react';
import { useWeightHistory, useWorkoutSessions, useMeasurements } from '../hooks';

export function Progress() {
  const { history, logWeight } = useWeightHistory();
  const { sessions } = useWorkoutSessions();
  const { measurements, logMeasurement } = useMeasurements();
  const [newWeight, setNewWeight] = useState('');
  const [showWeightModal, setShowWeightModal] = useState(false);
  
  const [showMeasureModal, setShowMeasureModal] = useState(false);
  const [newMeasure, setNewMeasure] = useState({ bodyFat: '', chest: '', arms: '', waist: '', legs: '' });

  const [selectedExerciseFor1RM, setSelectedExerciseFor1RM] = useState('');

  // Personal records: best volume per exercise across sessions
  const prs = useMemo(() => {
    const bests: Record<string, { weight: number; reps: number | string; date: string }> = {};
    sessions.forEach(session => {
      session.completedSets.forEach(set => {
        const key = set.exerciseName;
        const vol = (Number(set.weight) || 0) * (Number(set.reps) || 0);
        if (!bests[key] || vol > (Number(bests[key].weight) * Number(bests[key].reps))) {
          bests[key] = { weight: set.weight, reps: set.reps, date: session.date.split('T')[0] };
        }
      });
    });
    return Object.entries(bests).map(([name, best]) => ({ name, ...best })).slice(0, 5);
  }, [sessions]);

  // Streak
  const streak = useMemo(() => {
    const days = new Set(sessions.map(s => s.date.split('T')[0]));
    const today = new Date();
    let count = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      if (days.has(key)) count++;
      else if (i > 0) break;
    }
    return count;
  }, [sessions]);

  // Sessions this month
  const thisMonth = useMemo(() => {
    const now = new Date();
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return sessions.filter(s => s.date.startsWith(prefix)).length;
  }, [sessions]);

  // Last month sessions count for % comparison
  const lastMonth = useMemo(() => {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return sessions.filter(s => s.date.startsWith(prefix)).length;
  }, [sessions]);

  const monthDelta = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null;

  // Chart data — last 30 days of weight
  const chartData = history.slice(-30).map(e => ({
    date: e.date.slice(5), // MM-DD
    weight: e.weight,
  }));

  const currentWeight = history.length > 0 ? history[history.length - 1].weight : null;
  const goalWeight = 86.0;
  const startWeight = history.length > 0 ? history[0].weight : 82;
  const goalProgress = currentWeight 
    ? Math.min(100, Math.max(0, ((currentWeight - startWeight) / (goalWeight - startWeight)) * 100))
    : 0;

  const handleLogWeight = () => {
    const val = parseFloat(newWeight);
    if (isNaN(val) || val < 30 || val > 250) {
      alert('Peso inválido');
      return;
    }
    logWeight(val);
    setNewWeight('');
    setShowWeightModal(false);
  };

  const handleLogMeasure = () => {
    logMeasurement({
      bodyFat: parseFloat(newMeasure.bodyFat) || undefined,
      chest: parseFloat(newMeasure.chest) || undefined,
      arms: parseFloat(newMeasure.arms) || undefined,
      waist: parseFloat(newMeasure.waist) || undefined,
      legs: parseFloat(newMeasure.legs) || undefined,
    });
    setNewMeasure({ bodyFat: '', chest: '', arms: '', waist: '', legs: '' });
    setShowMeasureModal(false);
  };

  // 1RM Data
  const exerciseNames = useMemo(() => {
    const names = new Set<string>();
    sessions.forEach(s => s.completedSets.forEach(set => names.add(set.exerciseName)));
    return Array.from(names).sort();
  }, [sessions]);

  // Set default selected exercise for 1RM if available and not set
  useMemo(() => {
    if (exerciseNames.length > 0 && !selectedExerciseFor1RM) {
      setSelectedExerciseFor1RM(exerciseNames[0]);
    }
  }, [exerciseNames, selectedExerciseFor1RM]);

  const chartData1RM = useMemo(() => {
    if (!selectedExerciseFor1RM) return [];
    
    // Group by session date, finding the max 1RM for that exercise on that day
    const dataByDate: Record<string, number> = {};
    
    sessions.forEach(session => {
      const sets = session.completedSets.filter(s => s.exerciseName === selectedExerciseFor1RM);
      if (sets.length > 0) {
        // Epley formula: 1RM = weight * (1 + reps / 30)
        const max1RM = Math.max(...sets.map(s => {
          const w = Number(s.weight) || 0;
          const r = Number(s.reps) || 0;
          return r === 1 ? w : w * (1 + r / 30);
        }));
        
        const dateKey = session.date.split('T')[0].slice(5); // MM-DD
        if (!dataByDate[dateKey] || max1RM > dataByDate[dateKey]) {
          dataByDate[dateKey] = Math.round(max1RM);
        }
      }
    });
    
    return Object.entries(dataByDate)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, max1RM]) => ({ date, max1RM }))
      .slice(-30);
  }, [sessions, selectedExerciseFor1RM]);

  const currentMeasurements = measurements.length > 0 ? measurements[measurements.length - 1] : null;

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-mono font-bold text-primary-fixed uppercase tracking-wider">Análises</span>
        <h2 className="font-display font-extrabold text-4xl text-white uppercase italic tracking-tighter">Desempenho</h2>
      </div>

      {/* Summary Cards */}
      <section className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5 rounded-xl">
          <div className="flex items-center gap-2 text-on-surface-variant mb-2">
            <Calendar size={14} />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Sessões</span>
          </div>
          <p className="text-2xl font-mono font-black text-white leading-none">{thisMonth}</p>
          {monthDelta !== null ? (
            <span className={`text-[9px] font-mono font-bold mt-1 block ${monthDelta >= 0 ? 'text-primary-fixed' : 'text-red-400'}`}>
              {monthDelta >= 0 ? '+' : ''}{monthDelta}% vs mês passado
            </span>
          ) : (
            <span className="text-[9px] font-mono font-bold text-on-surface-variant/50 mt-1 block">Este mês</span>
          )}
        </div>
        <div className="glass-card p-5 rounded-xl">
          <div className="flex items-center gap-2 text-on-surface-variant mb-2">
            <Trophy size={14} />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Recordes</span>
          </div>
          <p className="text-2xl font-mono font-black text-white leading-none">{prs.length}</p>
          <span className="text-[9px] font-mono font-bold text-primary-fixed mt-1 block">
            {prs.length > 0 ? `PRs registrados` : 'Treine para criar PRs'}
          </span>
        </div>
      </section>

      {/* Weight Chart */}
      <section className="glass-card p-6 rounded-2xl border-white/5 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-display font-bold text-xl uppercase italic">Histórico de Peso</h3>
            <p className="text-[10px] font-mono font-bold text-on-surface-variant opacity-60">
              {currentWeight ? `${currentWeight} kg agora` : 'Registre seu peso'}
            </p>
          </div>
          <button
            onClick={() => setShowWeightModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary-fixed/10 hover:bg-primary-fixed text-primary-fixed hover:text-on-primary-fixed rounded-xl font-mono font-bold text-[10px] uppercase tracking-wider transition-all active:scale-95"
          >
            <Scale size={12} />
            Registrar
          </button>
        </div>

        {chartData.length > 1 ? (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#273647" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#c4c9ac', fontSize: 9, fontWeight: 600 }}
                  dy={10}
                  interval="preserveStartEnd"
                />
                <YAxis hide domain={['dataMin - 0.5', 'dataMax + 0.5']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#122131', border: '1px solid #c3f400', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#c3f400', fontWeight: 'bold' }}
                  formatter={(v: number) => [`${v} kg`, 'Peso']}
                />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#c3f400" 
                  strokeWidth={3} 
                  dot={{ fill: '#c3f400', r: 4, strokeWidth: 2, stroke: '#051424' }} 
                  activeDot={{ r: 6, fill: '#fff', stroke: '#c3f400' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center">
            <p className="font-mono text-on-surface-variant/40 text-xs uppercase tracking-wider">Registre pelo menos 2 entradas para ver o gráfico</p>
          </div>
        )}
      </section>

      {/* Weight Log Modal */}
      {showWeightModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowWeightModal(false)}>
          <div className="w-full max-w-[600px] bg-surface-container rounded-t-3xl p-6 pb-28 space-y-6" onClick={e => e.stopPropagation()}>
            <div className="space-y-1">
              <h3 className="font-display font-bold text-2xl text-white uppercase italic">Registrar Peso</h3>
              <p className="font-mono text-xs text-on-surface-variant">Hoje: {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setNewWeight(w => String(Math.max(0, (parseFloat(w) || 0) - 0.1).toFixed(1)))}
                className="w-14 h-14 rounded-full bg-surface-variant flex items-center justify-center active:scale-90 transition-all"
              >
                <Minus size={20} className="text-white" />
              </button>
              <input
                type="number"
                step="0.1"
                placeholder={currentWeight?.toString() || "80.0"}
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="flex-1 h-16 bg-transparent text-center font-mono font-black text-4xl text-white focus:outline-none border-b-2 border-primary-fixed"
                autoFocus
              />
              <span className="font-mono font-bold text-on-surface-variant">kg</span>
              <button
                onClick={() => setNewWeight(w => String((parseFloat(w) || 0) + 0.1).slice(0, 5))}
                className="w-14 h-14 rounded-full bg-surface-variant flex items-center justify-center active:scale-90 transition-all"
              >
                <Plus size={20} className="text-white" />
              </button>
            </div>
            <button
              onClick={handleLogWeight}
              className="w-full h-14 bg-primary-fixed text-on-primary-fixed font-display font-black text-xl uppercase rounded-xl active:scale-95 transition-all"
            >
              Salvar
            </button>
          </div>
        </div>
      )}

      {/* Personal Records */}
      {prs.length > 0 && (
        <section className="glass-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-primary-fixed" />
            <h3 className="font-display font-bold text-xl uppercase italic">Recordes Pessoais</h3>
          </div>
          <div className="flex flex-col gap-3">
            {prs.map((pr, i) => (
              <div key={pr.name} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-2xl text-primary-fixed/30">#{i + 1}</span>
                  <div>
                    <p className="font-mono font-bold text-sm text-white">{pr.name}</p>
                    <p className="font-mono text-[10px] text-on-surface-variant">{pr.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-lg text-primary-fixed">{pr.weight}kg</span>
                  <span className="font-mono text-on-surface-variant text-sm"> × {pr.reps}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 1RM Progress Chart */}
      {exerciseNames.length > 0 && (
        <section className="glass-card p-6 rounded-2xl border-white/5 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Dumbbell size={18} className="text-primary-fixed" />
                <h3 className="font-display font-bold text-xl uppercase italic">Evolução de Cargas (1RM)</h3>
              </div>
              <p className="text-[10px] font-mono font-bold text-on-surface-variant opacity-60">
                Estimativa de Força Máxima
              </p>
            </div>
          </div>
          
          <select 
            value={selectedExerciseFor1RM}
            onChange={(e) => setSelectedExerciseFor1RM(e.target.value)}
            className="w-full bg-surface-container h-12 rounded-xl px-4 font-mono font-bold text-sm text-white focus:ring-2 ring-primary-fixed outline-none border border-white/5"
          >
            {exerciseNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>

          {chartData1RM.length > 1 ? (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData1RM}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#273647" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#c4c9ac', fontSize: 9, fontWeight: 600 }}
                    dy={10}
                    interval="preserveStartEnd"
                  />
                  <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#122131', border: '1px solid #c3f400', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#c3f400', fontWeight: 'bold' }}
                    formatter={(v: number) => [`${v} kg`, '1RM Estimada']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="max1RM" 
                    stroke="#c3f400" 
                    strokeWidth={3} 
                    dot={{ fill: '#c3f400', r: 4, strokeWidth: 2, stroke: '#051424' }} 
                    activeDot={{ r: 6, fill: '#fff', stroke: '#c3f400' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center">
              <p className="font-mono text-on-surface-variant/40 text-xs uppercase tracking-wider">Treine mais vezes esse exercício para ver o gráfico</p>
            </div>
          )}
        </section>
      )}

      {/* Body Measurements */}
      <section className="glass-card p-6 rounded-2xl border-white/5 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-display font-bold text-xl uppercase italic">Medidas Corporais</h3>
            <p className="text-[10px] font-mono font-bold text-on-surface-variant opacity-60">
              Acompanhe sua evolução física
            </p>
          </div>
          <button
            onClick={() => setShowMeasureModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary-fixed/10 hover:bg-primary-fixed text-primary-fixed hover:text-on-primary-fixed rounded-xl font-mono font-bold text-[10px] uppercase tracking-wider transition-all active:scale-95"
          >
            <Ruler size={12} />
            Atualizar
          </button>
        </div>

        {currentMeasurements ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Gordura (BF)', value: currentMeasurements.bodyFat, unit: '%' },
              { label: 'Braços', value: currentMeasurements.arms, unit: 'cm' },
              { label: 'Peitoral', value: currentMeasurements.chest, unit: 'cm' },
              { label: 'Cintura', value: currentMeasurements.waist, unit: 'cm' },
              { label: 'Pernas', value: currentMeasurements.legs, unit: 'cm' },
            ].map(m => m.value ? (
              <div key={m.label} className="bg-surface-container p-3 rounded-xl border border-white/5">
                <span className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">{m.label}</span>
                <p className="font-mono font-black text-xl text-white mt-1">{m.value}<span className="text-sm opacity-60 ml-1">{m.unit}</span></p>
              </div>
            ) : null)}
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="font-mono text-on-surface-variant/40 text-xs uppercase tracking-wider">Nenhuma medida registrada</p>
          </div>
        )}
      </section>

      {/* Goals */}
      <section className="p-6 bg-surface-container border border-primary-fixed/20 rounded-2xl relative overflow-hidden group">
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Target size={20} className="text-primary-fixed" />
            <span className="font-mono font-bold text-[10px] text-primary-fixed uppercase tracking-widest">Objetivo Ativo</span>
          </div>
          <div className="space-y-1">
            <h4 className="font-display font-black text-2xl text-white tracking-widest leading-none">BULKING LIMPO</h4>
            <div className="w-full bg-background/50 h-2 rounded-full overflow-hidden mt-3">
              <div 
                className="bg-primary-fixed h-full transition-all duration-700 drop-shadow-[0_0_8px_rgba(195,244,0,0.5)]"
                style={{ width: `${goalProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-mono font-bold text-on-surface-variant mt-1 uppercase">
              <span>{startWeight.toFixed(1)} kg</span>
              <span className="text-primary-fixed">{currentWeight ? `${currentWeight} kg atual` : '—'}</span>
              <span>Meta: {goalWeight} kg</span>
            </div>
          </div>
        </div>
        
        <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <TrendingUp size={120} />
        </div>
      </section>

      {/* Weight Modal */}
      {showWeightModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-high border border-outline-variant/30 w-full max-w-sm rounded-3xl p-6 flex flex-col gap-6 relative shadow-2xl">
            <button onClick={() => setShowWeightModal(false)} className="absolute top-4 right-4 text-on-surface-variant hover:text-white transition-colors">
              <X size={20} />
            </button>
            <div className="flex flex-col gap-2 pt-2">
              <h3 className="font-display font-black text-2xl text-white uppercase italic tracking-tighter">Registrar Peso</h3>
              <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">Acompanhe sua evolução</p>
            </div>
            
            <div className="relative">
              <input 
                type="number"
                inputMode="decimal"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value.replace(',', '.'))}
                placeholder="Ex: 85.5"
                className="w-full bg-surface-container h-16 rounded-2xl px-6 font-mono font-black text-3xl text-white text-center focus:ring-2 ring-primary-fixed outline-none transition-all placeholder:text-on-surface-variant/20"
                autoFocus
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 font-mono font-bold text-on-surface-variant">KG</span>
            </div>

            <button 
              onClick={handleLogWeight}
              className="w-full bg-primary-fixed text-on-primary-fixed h-14 rounded-xl font-display font-black text-xl tracking-widest uppercase active:scale-95 transition-all shadow-[0_4px_20px_rgba(195,244,0,0.2)] hover:opacity-90 mt-2"
            >
              Salvar Peso
            </button>
          </div>
        </div>
      )}

      {/* Measure Modal */}
      {showMeasureModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-high border border-outline-variant/30 w-full max-w-sm rounded-3xl p-6 flex flex-col gap-6 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowMeasureModal(false)} className="absolute top-4 right-4 text-on-surface-variant hover:text-white transition-colors">
              <X size={20} />
            </button>
            <div className="flex flex-col gap-2 pt-2">
              <h3 className="font-display font-black text-2xl text-white uppercase italic tracking-tighter">Medidas</h3>
              <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">Atualize suas métricas</p>
            </div>
            
            <div className="flex flex-col gap-4">
              {[
                { key: 'bodyFat', label: 'BF (Gordura)', placeholder: 'Ex: 15.5', unit: '%' },
                { key: 'arms', label: 'Braços', placeholder: 'Ex: 38.0', unit: 'cm' },
                { key: 'chest', label: 'Peitoral', placeholder: 'Ex: 105', unit: 'cm' },
                { key: 'waist', label: 'Cintura', placeholder: 'Ex: 82', unit: 'cm' },
                { key: 'legs', label: 'Pernas', placeholder: 'Ex: 60', unit: 'cm' },
              ].map(field => (
                <div key={field.key} className="flex items-center gap-4">
                  <span className="w-20 text-[10px] font-mono font-bold text-on-surface-variant uppercase">{field.label}</span>
                  <div className="relative flex-1">
                    <input 
                      type="number"
                      inputMode="decimal"
                      value={newMeasure[field.key as keyof typeof newMeasure]}
                      onChange={(e) => setNewMeasure(m => ({ ...m, [field.key]: e.target.value.replace(',', '.') }))}
                      placeholder={field.placeholder}
                      className="w-full bg-surface-container h-12 rounded-xl px-4 font-mono font-bold text-lg text-white focus:ring-2 ring-primary-fixed outline-none transition-all placeholder:text-on-surface-variant/20"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono font-bold text-on-surface-variant text-xs">{field.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={handleLogMeasure}
              className="w-full bg-primary-fixed text-on-primary-fixed h-14 rounded-xl font-display font-black text-xl tracking-widest uppercase active:scale-95 transition-all shadow-[0_4px_20px_rgba(195,244,0,0.2)] hover:opacity-90 mt-2"
            >
              Salvar Medidas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
