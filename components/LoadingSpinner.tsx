import React, { useState, useEffect } from 'react';

export const LoadingSpinner: React.FC = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate progress for the AI analysis
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          return prev; // Stall at 95% until actual completion
        }
        // Logarithmic-like slowdown
        const remaining = 95 - prev;
        // Move faster at the beginning, slower at the end
        const increment = Math.max(0.5, Math.random() * (remaining * 0.1)); 
        return Math.min(95, prev + increment);
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-8 w-full max-w-md mx-auto">
      <div className="relative">
        {/* Outer ring */}
        <div className="w-24 h-24 border-4 border-slate-800 rounded-full"></div>
        {/* Inner spinning ring */}
        <div className="absolute top-0 left-0 w-24 h-24 border-4 border-transparent border-t-emerald-500 border-r-emerald-500 rounded-full animate-spin"></div>
        {/* Icon/Center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-emerald-500 font-bold font-mono">{Math.round(progress)}%</span>
        </div>
      </div>

      <div className="w-full space-y-3">
        <div className="flex justify-between text-xs text-slate-400 uppercase tracking-wider font-medium">
          <span>Analyzing</span>
          <span className="animate-pulse">Processing Visuals...</span>
        </div>
        
        {/* Progress Bar Track */}
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
          {/* Progress Bar Fill */}
          <div 
            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-300 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
          </div>
        </div>
      </div>

      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-white animate-pulse">Analyzing Physique...</h3>
        <p className="text-slate-400 text-sm">Identifying muscle groups and estimating composition</p>
      </div>
    </div>
  );
};