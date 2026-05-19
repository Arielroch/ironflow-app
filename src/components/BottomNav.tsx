import { NavLink } from 'react-router-dom';
import { Home, Dumbbell, Library, BarChart2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export function BottomNav() {
  const navItems = [
    { to: '/', icon: Home, label: 'Início' },
    { to: '/workouts', icon: Dumbbell, label: 'Treinos' },
    { to: '/library', icon: Library, label: 'Exercícios' },
    { to: '/progress', icon: BarChart2, label: 'Progresso' },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[420px] z-50 flex justify-around items-center px-3 py-2 bg-[#161616]/95 backdrop-blur-md border border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.4)] rounded-full transition-all duration-300">
      {navItems.map(({ to, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 active:scale-90",
              isActive 
                ? "bg-primary-fixed text-on-primary-fixed shadow-[0_0_12px_rgba(225,255,0,0.3)]" 
                : "text-white/40 hover:text-white"
            )
          }
        >
          {({ isActive }) => (
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
          )}
        </NavLink>
      ))}
    </nav>
  );
}
