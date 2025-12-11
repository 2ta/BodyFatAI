import React, { useState } from 'react';
import { ImageUpload } from './components/ImageUpload';
import { AnalysisResult } from './components/AnalysisResult';
import { LoadingSpinner } from './components/LoadingSpinner';
import { analyzeBodyFatImage } from './services/geminiService';
import { BodyFatAnalysis } from './types';
import { Dumbbell, Sparkles, RotateCcw } from 'lucide-react';

const App: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<BodyFatAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = async (base64: string) => {
    setSelectedImage(base64);
    setAnalysis(null);
    setError(null);
    setLoading(true);

    try {
      const result = await analyzeBodyFatImage(base64);
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze image');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedImage(null);
    setAnalysis(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-emerald-500/30">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-12 md:py-20 flex flex-col items-center">
        
        {/* Header */}
        <header className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-slate-800/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm mb-4 shadow-lg shadow-emerald-500/5">
            <Dumbbell className="text-emerald-400 mr-2" size={28} />
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              BodyFat<span className="text-emerald-400">AI</span>
            </h1>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
             Visualize Your <br />
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Physique Metrics</span>
          </h2>
          <p className="text-slate-400 max-w-lg mx-auto text-lg font-light leading-relaxed">
            Upload a photo to get an instant AI-powered estimate of body fat percentage, muscle definition analysis, and personalized tips.
          </p>
        </header>

        {/* Main Interaction Area */}
        <main className="w-full flex flex-col items-center">
          
          <ImageUpload 
            onImageSelect={handleImageSelect} 
            onClear={handleClear} 
            selectedImage={selectedImage}
            loading={loading}
          />

          {error && (
             <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl flex items-center gap-3 max-w-md w-full animate-in fade-in slide-in-from-top-2">
               <div className="w-2 h-2 rounded-full bg-red-500"></div>
               {error}
             </div>
          )}

          {loading && <LoadingSpinner />}

          {analysis && !loading && (
            <div className="w-full flex flex-col items-center gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <AnalysisResult 
                data={analysis} 
                originalImage={selectedImage} 
              />
              
              <button 
                onClick={handleClear}
                className="group flex items-center gap-2 px-8 py-4 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700 hover:border-emerald-500/50 shadow-lg"
              >
                <RotateCcw size={18} className="group-hover:-rotate-180 transition-transform duration-500 text-emerald-500" />
                Analyze New Photo
              </button>
            </div>
          )}

        </main>

        {/* Footer */}
        <footer className="mt-24 border-t border-slate-800/50 pt-8 w-full flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500 text-sm">
            <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-emerald-500" />
                <span>Powered by Gemini 2.5 Flash</span>
            </div>
            <p>Not medical advice. For fitness estimation only.</p>
        </footer>

      </div>
    </div>
  );
};

export default App;