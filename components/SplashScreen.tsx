import React, { useEffect, useState } from 'react';
import { Dumbbell } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Show splash for 2.2 seconds total
    const fadeTimer = setTimeout(() => {
      setIsVisible(false);
    }, 2200);

    // Unmount after animation finishes
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2700);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-50 bg-[#020617] flex items-center justify-center transition-opacity duration-500 ease-in-out ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="relative flex flex-col items-center">
        {/* Animated Glow Background */}
        <div className="absolute inset-0 bg-emerald-500/20 blur-[60px] rounded-full animate-pulse-slow"></div>
        
        {/* Logo Container */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-2xl mb-6 animate-[bounce_2s_infinite]">
            <Dumbbell className="text-emerald-400 w-16 h-16" strokeWidth={1.5} />
          </div>
          
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
            BodyFat<span className="text-emerald-400">AI</span>
          </h1>
          
          <div className="flex items-center gap-2 mt-4">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>
    </div>
  );
};