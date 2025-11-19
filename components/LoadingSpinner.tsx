import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      <div className="relative">
        {/* Outer ring */}
        <div className="w-20 h-20 border-4 border-slate-700 rounded-full"></div>
        {/* Inner spinning ring */}
        <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-emerald-500 border-r-emerald-500 rounded-full animate-spin"></div>
        {/* Pulse effect */}
        <div className="absolute top-0 left-0 w-20 h-20 bg-emerald-500/20 rounded-full animate-ping"></div>
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-white">Analyzing Physique...</h3>
        <p className="text-slate-400 text-sm">Identifying muscle groups and estimating composition</p>
      </div>
    </div>
  );
};