import { Menu, Bell, ChevronLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const isActiveWorkout = location.pathname.startsWith('/active-workout');
  const isSecondaryPage = location.pathname !== '/' && location.pathname !== '/workouts' && location.pathname !== '/library' && location.pathname !== '/progress';

  return (
    <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[600px] z-50 bg-background/90 backdrop-blur-md h-20 flex items-center justify-between px-6 transition-all">
      <div className="flex items-center justify-center">
        {isSecondaryPage || isActiveWorkout ? (
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center bg-[#161616] border border-white/5 rounded-full transition-all active:scale-95 text-white"
          >
            <ChevronLeft size={20} />
          </button>
        ) : (
          <button className="w-10 h-10 flex items-center justify-center bg-[#161616] border border-white/5 rounded-full transition-all active:scale-95 text-white">
            <Menu size={20} />
          </button>
        )}
      </div>

      <h1 className="font-display font-black text-xl tracking-tight text-white uppercase italic">
        IRONFLOW
      </h1>

      <div className="flex items-center justify-center">
        <button className="w-10 h-10 flex items-center justify-center bg-[#161616] border border-white/5 rounded-full transition-all active:scale-90 text-white">
          <Bell size={20} />
        </button>
      </div>
    </header>
  );
}

