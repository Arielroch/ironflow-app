import { ReactNode } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './pages/Dashboard';
import { Workouts } from './pages/Workouts';
import { Library } from './pages/Library';
import { Progress } from './pages/Progress';
import { ActiveWorkout } from './pages/ActiveWorkout';
import { Editor } from './pages/Editor';
import { AiGenerator } from './pages/AiGenerator';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background selection:bg-primary-fixed selection:text-on-primary-fixed">
        <Header />
        
        <main className="max-w-[600px] mx-auto pt-20 pb-28 px-4">
          <Routes>
            <Route path="/" element={<PageTransition><Dashboard /></PageTransition>} />
            <Route path="/workouts" element={<PageTransition><Workouts /></PageTransition>} />
            <Route path="/library" element={<PageTransition><Library /></PageTransition>} />
            <Route path="/progress" element={<PageTransition><Progress /></PageTransition>} />
            <Route path="/active-workout/:id" element={<PageTransition><ActiveWorkout /></PageTransition>} />
            <Route path="/editor/:id?" element={<PageTransition><Editor /></PageTransition>} />
            <Route path="/ai-generator" element={<PageTransition><AiGenerator /></PageTransition>} />
          </Routes>
        </main>

        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
