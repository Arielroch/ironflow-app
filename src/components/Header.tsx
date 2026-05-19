import { Settings, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MOCK_USER_STATS } from '../data';

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const isActiveWorkout = location.pathname.startsWith('/active-workout');

  return (
    <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[600px] z-50 bg-background/80 backdrop-blur-md border-b border-surface-variant h-16 flex items-center justify-between px-6 transition-all">
      <div className="flex items-center gap-3">
        {isActiveWorkout ? (
          <button 
            onClick={() => navigate('/workouts')}
            className="p-1 hover:bg-surface-variant rounded-full transition-colors active:scale-95"
          >
            <X size={20} className="text-on-surface-variant" />
          </button>
        ) : (
          <div className="w-10 h-10 rounded-full border border-outline-variant overflow-hidden cursor-pointer active:scale-95 transition-transform" onClick={() => navigate('/progress')}>
            <img 
              src={MOCK_USER_STATS.userImageUrl} 
              alt="User" 
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      <h1 className="font-display font-extrabold text-2xl tracking-tighter text-white uppercase italic">
        IRONFLOW
      </h1>

      <button className="p-2 hover:bg-surface-variant rounded-full transition-all active:scale-90">
        <Settings size={24} className="text-white" />
      </button>
    </header>
  );
}

