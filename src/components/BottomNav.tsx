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
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[600px] z-50 flex justify-around items-center px-4 py-2 bg-surface-container border-t border-outline-variant shadow-lg rounded-t-xl transition-all duration-300">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 active:scale-90",
              isActive 
                ? "bg-primary-fixed/20 text-primary-fixed" 
                : "text-on-surface-variant/60 hover:text-on-surface-variant"
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-mono font-semibold mt-1 uppercase tracking-wider">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
