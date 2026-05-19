import { useState, useMemo } from 'react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid } from 'recharts';
import { TrendingUp, Calendar, Target, Trophy, Plus, Minus, Scale, X, Ruler, Dumbbell, Heart, Footprints, Navigation, Clock } from 'lucide-react';
import { useWeightHistory, useWorkoutSessions, useMeasurements } from '../hooks';
import { cn } from '@/src/lib/utils';

export function Progress() {
  const { history, logWeight } = useWeightHistory();
  const { sessions } = useWorkoutSessions();
  const { measurements, logMeasurement } = useMeasurements();
  
  const [newWeight, setNewWeight] = useState('');
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showMeasureModal, setShowMeasureModal] = useState(false);
  const [newMeasure, setNewMeasure] = useState({ bodyFat: '', chest: '', arms: '', waist: '', legs: '' });
  const [selectedExerciseFor1RM, setSelectedExerciseFor1RM] = useState('');
  
  const [selectedMonth, setSelectedMonth] = useState('Setembro');
  const [selectedWeek, setSelectedWeek] = useState('Semana 1');

  // Simulated data for mockup bento stats
  const stepsCount = "8.432";
  const heartRate = "74 bpm";
  const distance = "4.2 km";
  const activeTime = "1h 15m";

  // Recharts data for screen 3 bar chart (Weekly activity volume)
  const caloriesChartData = [
    { name: 'S', value: 120 },
    { name: 'T', value: 240 },
    { name: 'Q', value: 180 },
    { name: 'Q', value: 310 },
    { name: 'S', value: 220 },
    { name: 'S', value: 290 },
    { name: 'D', value: 150 },
  ];

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
    
    const dataByDate: Record<string, number> = {};
    sessions.forEach(session => {
      const sets = session.completedSets.filter(s => s.exerciseName === selectedExerciseFor1RM);
      if (sets.length > 0) {
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
    <div className="flex flex-col gap-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-mono font-bold text-primary-fixed uppercase tracking-wider pl-0.5">Métricas</span>
        <h2 className="font-display font-black text-4xl text-white uppercase italic tracking-tighter leading-none">Estatísticas</h2>
      </div>

      {/* Selectors matching Mockup Screen 3 */}
      <div className="flex gap-3">
        <select 
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="flex-1 bg-[#121212] border border-white/5 h-12 rounded-xl px-4 font-mono font-bold text-[10px] text-white/70 uppercase tracking-widest outline-none appearance-none cursor-pointer"
        >
          <option value="Janeiro">Janeiro</option>
          <option value="Fevereiro">Fevereiro</option>
          <option value="Março">Março</option>
          <option value="Abril">Abril</option>
          <option value="Maio">Maio</option>
          <option value="Setembro">Setembro</option>
        </select>
        <select 
          value={selectedWeek}
          onChange={(e) => setSelectedWeek(e.target.value)}
          className="flex-1 bg-[#121212] border border-white/5 h-12 rounded-xl px-4 font-mono font-bold text-[10px] text-white/70 uppercase tracking-widest outline-none appearance-none cursor-pointer"
        >
          <option value="Semana 1">Semana 1</option>
          <option value="Semana 2">Semana 2</option>
          <option value="Semana 3">Semana 3</option>
          <option value="Semana 4">Semana 4</option>
        </select>
      </div>

      {/* Screen 3 Calories Card with neon vertical chart */}
      <section className="bg-[#121212] border border-white/5 p-6 rounded-[24px] shadow-lg flex flex-col gap-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">Calorias</span>
          <span className="font-display font-black text-3xl text-white tracking-tight italic">239 Kcal</span>
        </div>

        <div className="h-28 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={caloriesChartData}>
              <Bar 
                dataKey="value" 
                fill="#e1ff00" 
                radius={[5, 5, 5, 5]}
                className="drop-shadow-[0_0_6px_rgba(225,255,0,0.2)]"
              />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#ffffff', opacity: 0.3, fontSize: 10, fontWeight: 700 }}
                dy={6}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Screen 3 Metrics Bento Grid */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-[#121212] border border-white/5 p-5 rounded-[24px] flex flex-col gap-3">
          <div className="flex items-center justify-between text-white/40">
            <span className="text-[10px] font-mono uppercase tracking-wider">Ritmo Cardíaco</span>
            <Heart size={16} className="text-red-500" />
          </div>
          <span className="font-display font-black text-xl text-white uppercase italic tracking-tight">{heartRate}</span>
        </div>

        <div className="bg-[#121212] border border-white/5 p-5 rounded-[24px] flex flex-col gap-3">
          <div className="flex items-center justify-between text-white/40">
            <span className="text-[10px] font-mono uppercase tracking-wider">Passos</span>
            <Footprints size={16} className="text-primary-fixed" />
          </div>
          <span className="font-display font-black text-xl text-white uppercase italic tracking-tight">{stepsCount}</span>
        </div>

        <div className="bg-[#121212] border border-white/5 p-5 rounded-[24px] flex flex-col gap-3">
          <div className="flex items-center justify-between text-white/40">
            <span className="text-[10px] font-mono uppercase tracking-wider">Distância</span>
            <Navigation size={16} className="text-blue-400" />
          </div>
          <span className="font-display font-black text-xl text-white uppercase italic tracking-tight">{distance}</span>
        </div>

        <div className="bg-[#121212] border border-white/5 p-5 rounded-[24px] flex flex-col gap-3">
          <div className="flex items-center justify-between text-white/40">
            <span className="text-[10px] font-mono uppercase tracking-wider">Tempo</span>
            <Clock size={16} className="text-yellow-500" />
          </div>
          <span className="font-display font-black text-xl text-white uppercase italic tracking-tight">{activeTime}</span>
        </div>
      </section>

      {/* Summary Cards */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-[#121212] border border-white/5 p-5 rounded-[20px]">
          <div className="flex items-center gap-2 text-white/40 mb-2">
            <Calendar size={14} />
            <span className="text-[9px] font-mono uppercase tracking-wider">Sessões</span>
          </div>
          <p className="text-xl font-mono font-black text-white leading-none">{thisMonth}</p>
          {monthDelta !== null ? (
            <span className={`text-[8px] font-mono font-bold mt-1.5 block ${monthDelta >= 0 ? 'text-primary-fixed' : 'text-red-400'}`}>
              {monthDelta >= 0 ? '+' : ''}{monthDelta}% vs mês passado
            </span>
          ) : (
            <span className="text-[8px] font-mono font-bold text-white/30 mt-1.5 block">Este mês</span>
          )}
        </div>
        <div className="bg-[#121212] border border-white/5 p-5 rounded-[20px]">
          <div className="flex items-center gap-2 text-white/40 mb-2">
            <Trophy size={14} />
            <span className="text-[9px] font-mono uppercase tracking-wider">Recordes</span>
          </div>
          <p className="text-xl font-mono font-black text-white leading-none">{prs.length}</p>
          <span className="text-[8px] font-mono font-bold text-primary-fixed mt-1.5 block">
            {prs.length > 0 ? `PRs registrados` : 'Treine para criar PRs'}
          </span>
        </div>
      </section>

      {/* Weight Chart */}
      <section className="bg-[#121212] border border-white/5 p-6 rounded-[24px] space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-display font-bold text-xl uppercase italic">Histórico de Peso</h3>
            <p className="text-[10px] font-mono font-bold text-white/40">
              {currentWeight ? `${currentWeight} kg agora` : 'Registre seu peso'}
            </p>
          </div>
          <button
            onClick={() => setShowWeightModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary-fixed/10 hover:bg-primary-fixed text-primary-fixed hover:text-on-primary-fixed rounded-xl font-mono font-bold text-[9px] uppercase tracking-wider transition-all active:scale-95 border border-primary-fixed/10"
          >
            <Scale size={12} />
            Registrar
          </button>
        </div>

        {chartData.length > 1 ? (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#666', fontSize: 9, fontWeight: 600 }}
                  dy={10}
                  interval="preserveStartEnd"
                />
                <YAxis hide domain={['dataMin - 0.5', 'dataMax + 0.5']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#161616', border: '1px solid #e1ff00', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#e1ff00', fontWeight: 'bold' }}
                  formatter={(v: number) => [`${v} kg`, 'Peso']}
                />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#e1ff00" 
                  strokeWidth={3} 
                  dot={{ fill: '#e1ff00', r: 4, strokeWidth: 2, stroke: '#000000' }} 
                  activeDot={{ r: 6, fill: '#fff', stroke: '#e1ff00' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center">
            <p className="font-mono text-white/30 text-[10px] uppercase tracking-wider">Registre pelo menos 2 entradas para ver o gráfico</p>
          </div>
        )}
      </section>

      {/* 1RM Progress Chart */}
      {exerciseNames.length > 0 && (
        <section className="bg-[#121212] border border-white/5 p-6 rounded-[24px] space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Dumbbell size={18} className="text-primary-fixed" />
                <h3 className="font-display font-bold text-xl uppercase italic">Evolução de Cargas (1RM)</h3>
              </div>
              <p className="text-[10px] font-mono font-bold text-white/40">
                Estimativa de Força Máxima
              </p>
            </div>
          </div>
          
          <select 
            value={selectedExerciseFor1RM}
            onChange={(e) => setSelectedExerciseFor1RM(e.target.value)}
            className="w-full bg-[#161616] h-12 rounded-xl px-4 font-mono font-bold text-xs text-white focus:ring-2 ring-primary-fixed outline-none border border-white/5"
          >
            {exerciseNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>

          {chartData1RM.length > 1 ? (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData1RM}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#666', fontSize: 9, fontWeight: 600 }}
                    dy={10}
                    interval="preserveStartEnd"
                  />
                  <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#161616', border: '1px solid #e1ff00', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#e1ff00', fontWeight: 'bold' }}
                    formatter={(v: number) => [`${v} kg`, '1RM Estimada']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="max1RM" 
                    stroke="#e1ff00" 
                    strokeWidth={3} 
                    dot={{ fill: '#e1ff00', r: 4, strokeWidth: 2, stroke: '#000000' }} 
                    activeDot={{ r: 6, fill: '#fff', stroke: '#e1ff00' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center">
              <p className="font-mono text-white/30 text-[10px] uppercase tracking-wider">Treine mais vezes esse exercício para ver o gráfico</p>
            </div>
          )}
        </section>
      )}

      {/* Body Measurements */}
      <section className="bg-[#121212] border border-white/5 p-6 rounded-[24px] space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-display font-bold text-xl uppercase italic">Medidas Corporais</h3>
            <p className="text-[10px] font-mono font-bold text-white/40">
              Acompanhe sua evolução física
            </p>
          </div>
          <button
            onClick={() => setShowMeasureModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary-fixed/10 hover:bg-primary-fixed text-primary-fixed hover:text-on-primary-fixed rounded-xl font-mono font-bold text-[9px] uppercase tracking-wider transition-all active:scale-95 border border-primary-fixed/10"
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
              <div key={m.label} className="bg-[#161616] p-3 rounded-xl border border-white/5">
                <span className="text-[9px] font-mono font-bold text-white/40 uppercase">{m.label}</span>
                <p className="font-mono font-black text-lg text-white mt-1">{m.value}<span className="text-xs opacity-60 ml-1">{m.unit}</span></p>
              </div>
            ) : null)}
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="font-mono text-white/30 text-[10px] uppercase tracking-wider">Nenhuma medida registrada</p>
          </div>
        )}
      </section>

      {/* Personal Records */}
      {prs.length > 0 && (
        <section className="bg-[#121212] border border-white/5 p-6 rounded-[24px] space-y-4">
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
                    <p className="font-mono font-bold text-xs text-white">{pr.name}</p>
                    <p className="font-mono text-[9px] text-white/40">{pr.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-md text-primary-fixed">{pr.weight}kg</span>
                  <span className="font-mono text-white/40 text-xs"> × {pr.reps}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Goals */}
      <section className="p-6 bg-[#121212] border border-primary-fixed/20 rounded-[24px] relative overflow-hidden group">
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Target size={20} className="text-primary-fixed" />
            <span className="font-mono font-bold text-[9px] text-primary-fixed uppercase tracking-widest">Objetivo Ativo</span>
          </div>
          <div className="space-y-1">
            <h4 className="font-display font-black text-2xl text-white tracking-widest leading-none">BULKING LIMPO</h4>
            <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden mt-3">
              <div 
                className="bg-primary-fixed h-full transition-all duration-700 drop-shadow-[0_0_8px_rgba(225,255,0,0.5)]"
                style={{ width: `${goalProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-mono font-bold text-white/40 mt-1 uppercase">
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
          <div className="bg-[#121212] border border-white/10 w-full max-w-sm rounded-[24px] p-6 flex flex-col gap-6 relative shadow-2xl">
            <button onClick={() => setShowWeightModal(false)} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
              <X size={20} />
            </button>
            <div className="flex flex-col gap-2 pt-2">
              <h3 className="font-display font-black text-2xl text-white uppercase italic tracking-tighter">Registrar Peso</h3>
              <p className="font-mono text-[9px] text-white/40 uppercase tracking-widest">Acompanhe sua evolução</p>
            </div>
            
            <div className="relative">
              <input 
                type="number"
                inputMode="decimal"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value.replace(',', '.'))}
                placeholder="Ex: 85.5"
                className="w-full bg-[#161616] h-16 rounded-2xl px-6 font-mono font-black text-3xl text-white text-center focus:ring-2 ring-primary-fixed outline-none transition-all placeholder:text-white/10"
                autoFocus
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 font-mono font-bold text-white/40">KG</span>
            </div>

            <button 
              onClick={handleLogWeight}
              className="w-full bg-primary-fixed text-on-primary-fixed h-14 rounded-xl font-display font-black text-xl tracking-widest uppercase active:scale-95 transition-all shadow-[0_4px_20px_rgba(225,255,0,0.2)] hover:opacity-90 mt-2"
            >
              Salvar Peso
            </button>
          </div>
        </div>
      )}

      {/* Measure Modal */}
      {showMeasureModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/10 w-full max-w-sm rounded-[24px] p-6 flex flex-col gap-6 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowMeasureModal(false)} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
              <X size={20} />
            </button>
            <div className="flex flex-col gap-2 pt-2">
              <h3 className="font-display font-black text-2xl text-white uppercase italic tracking-tighter">Medidas</h3>
              <p className="font-mono text-[9px] text-white/40 uppercase tracking-widest">Atualize suas métricas</p>
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
                  <span className="w-20 text-[9px] font-mono font-bold text-white/40 uppercase">{field.label}</span>
                  <div className="relative flex-1">
                    <input 
                      type="number"
                      inputMode="decimal"
                      value={newMeasure[field.key as keyof typeof newMeasure]}
                      onChange={(e) => setNewMeasure(m => ({ ...m, [field.key]: e.target.value.replace(',', '.') }))}
                      placeholder={field.placeholder}
                      className="w-full bg-[#161616] h-12 rounded-xl px-4 font-mono font-bold text-lg text-white focus:ring-2 ring-primary-fixed outline-none transition-all placeholder:text-white/10"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono font-bold text-white/40 text-xs">{field.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={handleLogMeasure}
              className="w-full bg-primary-fixed text-on-primary-fixed h-14 rounded-xl font-display font-black text-xl tracking-widest uppercase active:scale-95 transition-all shadow-[0_4px_20px_rgba(225,255,0,0.2)] hover:opacity-90 mt-2"
            >
              Salvar Medidas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
