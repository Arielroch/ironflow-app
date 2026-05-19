import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Key, Target, Activity, Dumbbell, Calendar, ArrowRight, Check, X, Loader } from 'lucide-react';
import { generateWorkoutsWithAI, AiWorkoutPreferences } from '../lib/ai';
import { useWorkouts } from '../hooks';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function AiGenerator() {
  const navigate = useNavigate();
  const { create } = useWorkouts();
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [prefs, setPrefs] = useState<AiWorkoutPreferences>({
    goal: 'Hipertrofia',
    frequency: 4,
    experience: 'Intermediário',
    equipment: 'Academia Completa'
  });

  useEffect(() => {
    const stored = localStorage.getItem('ironflow_gemini_key');
    if (stored) {
      setApiKey(stored);
      setHasKey(true);
    }
  }, []);

  const handleSaveKey = () => {
    if (apiKey.trim().length > 10) {
      localStorage.setItem('ironflow_gemini_key', apiKey.trim());
      setHasKey(true);
      setError(null);
    } else {
      setError('Chave de API inválida.');
    }
  };

  const handleGenerate = async () => {
    if (!hasKey) return;
    setLoading(true);
    setError(null);
    try {
      const generatedWorkouts = await generateWorkoutsWithAI(apiKey, prefs);
      
      // Save each generated workout
      generatedWorkouts.forEach(w => {
        create({ name: w.name, exercises: w.exercises });
      });

      navigate('/workouts');
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar treino.');
      setLoading(false);
    }
  };

  if (!hasKey) {
    return (
      <div className="flex flex-col gap-6 py-10 px-4">
        <div className="flex flex-col gap-2 items-center text-center">
          <div className="w-16 h-16 rounded-full bg-primary-fixed/20 flex items-center justify-center mb-2">
            <Key size={32} className="text-primary-fixed" />
          </div>
          <h2 className="font-display font-black text-3xl text-white tracking-tighter uppercase">Chave da IA</h2>
          <p className="text-on-surface-variant font-mono text-xs">Insira sua chave de API do Google Gemini para habilitar o treinador inteligente.</p>
        </div>

        <div className="glass-card p-6 rounded-2xl flex flex-col gap-4 mt-4">
          <input 
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="Cole sua API Key aqui..."
            className="w-full bg-surface-container h-14 rounded-xl px-4 font-mono text-sm text-white focus:ring-2 ring-primary-fixed outline-none transition-all placeholder:text-on-surface-variant/40"
          />
          {error && <p className="text-red-400 font-mono text-[10px] uppercase">{error}</p>}
          <button 
            onClick={handleSaveKey}
            className="w-full bg-primary-fixed text-on-primary-fixed h-14 rounded-xl font-display font-black text-xl tracking-widest uppercase active:scale-95 transition-all shadow-[0_0_20px_rgba(195,244,0,0.2)]"
          >
            Salvar e Continuar
          </button>
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-center font-mono text-[10px] text-primary-fixed hover:underline uppercase mt-2">
            Não tem uma chave? Pegue aqui
          </a>
        </div>
        <button onClick={() => navigate('/workouts')} className="mx-auto text-on-surface-variant font-mono text-[10px] uppercase tracking-widest mt-4">
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/workouts')} className="p-2 glass-card rounded-full text-on-surface-variant hover:text-white transition-colors">
          <X size={20} />
        </button>
        <div className="flex flex-col">
          <span className="text-[10px] font-mono font-bold text-primary-fixed uppercase tracking-widest flex items-center gap-1">
            <Sparkles size={10} fill="currentColor" /> Treinador IA
          </span>
          <h2 className="font-display font-extrabold text-2xl text-white uppercase italic tracking-tighter">Gerar Treinos</h2>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-8">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              className="absolute inset-0 rounded-full border-2 border-dashed border-primary-fixed/30"
            />
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }} 
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-16 h-16 rounded-full bg-primary-fixed/20 flex items-center justify-center backdrop-blur-md border border-primary-fixed shadow-[0_0_40px_rgba(195,244,0,0.4)]"
            >
              <Sparkles size={32} className="text-primary-fixed" fill="currentColor" />
            </motion.div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <h3 className="font-display font-black text-2xl text-white uppercase tracking-tighter text-center">
              Analisando<br/>Biomecânica...
            </h3>
            <p className="font-mono text-xs text-primary-fixed animate-pulse">Buscando na biblioteca de 598 exercícios...</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Objective */}
          <div className="space-y-3">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
              <Target size={12} className="text-primary-fixed" /> Objetivo Principal
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['Hipertrofia', 'Força', 'Emagrecimento', 'Resistência'].map(g => (
                <button
                  key={g}
                  onClick={() => setPrefs(p => ({ ...p, goal: g }))}
                  className={cn(
                    "h-12 rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider border-2 transition-all active:scale-95",
                    prefs.goal === g 
                      ? "border-primary-fixed bg-primary-fixed/10 text-primary-fixed" 
                      : "border-outline-variant/30 text-on-surface-variant hover:border-outline-variant/60 hover:text-white"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Level */}
          <div className="space-y-3">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
              <Activity size={12} className="text-primary-fixed" /> Nível de Experiência
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Iniciante', 'Intermediário', 'Avançado'].map(l => (
                <button
                  key={l}
                  onClick={() => setPrefs(p => ({ ...p, experience: l }))}
                  className={cn(
                    "h-12 rounded-xl font-mono text-[9px] font-bold uppercase tracking-wider border-2 transition-all active:scale-95",
                    prefs.experience === l 
                      ? "border-primary-fixed bg-primary-fixed/10 text-primary-fixed" 
                      : "border-outline-variant/30 text-on-surface-variant hover:border-outline-variant/60 hover:text-white"
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div className="space-y-3">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
              <Calendar size={12} className="text-primary-fixed" /> Dias por Semana
            </label>
            <div className="flex bg-surface-container rounded-xl p-1">
              {[2, 3, 4, 5, 6].map(d => (
                <button
                  key={d}
                  onClick={() => setPrefs(p => ({ ...p, frequency: d }))}
                  className={cn(
                    "flex-1 h-12 rounded-lg font-mono text-sm font-bold transition-all",
                    prefs.frequency === d 
                      ? "bg-primary-fixed text-on-primary-fixed shadow-lg" 
                      : "text-on-surface-variant hover:text-white"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Equipment */}
          <div className="space-y-3">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
              <Dumbbell size={12} className="text-primary-fixed" /> Equipamento Disponível
            </label>
            <div className="grid grid-cols-1 gap-2">
              {['Academia Completa', 'Apenas Halteres e Bancos', 'Apenas Cabos/Elásticos', 'Calistenia / Peso Corporal'].map(e => (
                <button
                  key={e}
                  onClick={() => setPrefs(p => ({ ...p, equipment: e }))}
                  className={cn(
                    "h-14 rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider border-2 transition-all active:scale-[0.98] px-4 text-left",
                    prefs.equipment === e 
                      ? "border-primary-fixed bg-primary-fixed/10 text-primary-fixed" 
                      : "border-outline-variant/30 text-on-surface-variant hover:border-outline-variant/60 hover:text-white"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-[10px] uppercase leading-relaxed text-center">
              {error}
            </div>
          )}

          <div className="pt-4">
            <button 
              onClick={handleGenerate}
              className="w-full bg-primary-fixed text-on-primary-fixed h-16 rounded-2xl font-display font-black text-2xl tracking-widest uppercase flex items-center justify-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.12)] active:scale-95 transition-all hover:opacity-90"
            >
              <Sparkles size={24} fill="currentColor" />
              Montar Plano Mágico
            </button>
            <button onClick={() => { localStorage.removeItem('ironflow_gemini_key'); setHasKey(false); }} className="w-full text-center text-[10px] font-mono text-on-surface-variant/50 hover:text-white uppercase tracking-widest mt-6 pb-4">
              Remover Chave de API
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
