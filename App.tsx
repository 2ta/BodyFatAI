import React, { useState, useEffect } from 'react';
import { ImageUpload } from './components/ImageUpload';
import { AnalysisResult } from './components/AnalysisResult';
import { SplashScreen } from './components/SplashScreen';
import { analyzeBodyFatImage } from './services/geminiService';
import { checkReminderDue, clearReminder, setupTwoWeekReminder, requestNotificationPermission } from './services/notificationService';
import { BodyFatAnalysis } from './types';
import { Dumbbell, Sparkles, RotateCcw, Clock, X } from 'lucide-react';
import { logEvent, AnalyticsEvents } from './services/analytics';

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<BodyFatAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Reminder State
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    // 1. Request Notification Permission immediately at startup
    // Note: Browsers may block this if not user-triggered, but satisfying "at the beginning" requirement.
    // If blocked, user can enable in browser settings.
    requestNotificationPermission().then(granted => {
      console.log("Notification permission status:", granted ? "Granted" : "Denied/Dismissed");
    });

    // 2. Check if a reminder is due
    const isDue = checkReminderDue();
    if (isDue) {
      setShowReminder(true);
    }
  }, []);

  const handleImageSelect = async (base64: string) => {
    setSelectedImage(base64);
    setAnalysis(null);
    setError(null);
    setLoading(true);

    // Scroll to top on mobile when selecting image to show the scanner
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Log Start
    logEvent(AnalyticsEvents.ANALYSIS_START);

    try {
      const result = await analyzeBodyFatImage(base64);
      setAnalysis(result);
      
      // Auto-schedule reminder for 2 weeks
      setupTwoWeekReminder();

      // Log Success
      logEvent(AnalyticsEvents.ANALYSIS_SUCCESS, { 
        confidence: result.confidenceLevel 
      });
      // If we successfully analyzed, we can assume the user "checked in"
      if (showReminder) {
         clearReminder();
         setShowReminder(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze image';
      setError(errorMessage);
      // Log Error
      logEvent(AnalyticsEvents.ANALYSIS_ERROR, { error: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedImage(null);
    setAnalysis(null);
    setError(null);
  };

  const dismissReminder = () => {
    setShowReminder(false);
  }

  // Determine container classes
  // Changed from fixed height (h-[100dvh]) to min-height to allow scrolling
  const containerClass = "min-h-screen py-4 md:py-16";

  const mainClass = analysis
    ? "w-full flex flex-col items-center pb-20 justify-start"
    : "w-full flex flex-col items-center justify-center flex-1"; // Center vertically in available space

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      
      <div className={`${containerClass} bg-[#020617] text-slate-100 selection:bg-emerald-500/30 transition-all duration-500`}>
        {/* Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
           <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[120px]"></div>
           <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]"></div>
        </div>

        {/* Reminder Banner */}
        {showReminder && (
           <div className="fixed top-0 inset-x-0 z-50 bg-blue-600/90 backdrop-blur-md text-white px-4 py-3 shadow-lg flex items-center justify-between animate-in slide-in-from-top-full duration-500">
              <div className="flex items-center gap-3">
                 <Clock className="animate-pulse" size={20} />
                 <div>
                    <p className="text-sm font-bold">Time for your check-up!</p>
                    <p className="text-xs text-blue-100">It's been 2 weeks since your last goal.</p>
                 </div>
              </div>
              <button onClick={dismissReminder} className="p-1 hover:bg-blue-700 rounded-full transition-colors">
                 <X size={18} />
              </button>
           </div>
        )}

        {/* Main Container with Safe Area Awareness */}
        <div className={`relative max-w-6xl mx-auto px-4 h-full flex flex-col items-center ${analysis ? '' : 'justify-between'}`}>
          
          {/* Header */}
          <header className={`text-center space-y-4 transition-all duration-500 ${analysis ? 'mb-8' : 'mt-4 md:mt-0 flex-none'} ${showReminder ? 'pt-12' : ''}`}>
            {!analysis && (
              <div className="inline-flex items-center justify-center p-3 bg-slate-800/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm mb-2 shadow-lg shadow-emerald-500/5 animate-in fade-in slide-in-from-top-4 duration-700">
                <Dumbbell className="text-emerald-400 mr-2" size={24} />
                <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                  BodyFat<span className="text-emerald-400">AI</span>
                </h1>
              </div>
            )}
            
            <div className={analysis ? "hidden md:block" : ""}>
              <h2 className="text-3xl md:text-6xl font-bold tracking-tight text-white leading-tight">
                 Visualize Your <br />
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Physique Metrics</span>
              </h2>
              <p className="text-slate-400 max-w-lg mx-auto text-sm md:text-lg font-light leading-relaxed px-4 mt-4">
                Instant AI-powered estimation of body fat percentage and muscle definition analysis.
              </p>
            </div>
          </header>

          {/* Main Interaction Area */}
          <main className={mainClass}>
            
            <ImageUpload 
              onImageSelect={handleImageSelect} 
              onClear={handleClear} 
              selectedImage={selectedImage}
              loading={loading}
            />

            {error && (
               <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl flex items-start gap-3 max-w-md w-full animate-in fade-in slide-in-from-top-2">
                 <div className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0"></div>
                 <span className="text-sm">{error}</span>
               </div>
            )}

            {analysis && !loading && (
              <div className="w-full flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <AnalysisResult 
                  data={analysis} 
                  originalImage={selectedImage} 
                />
                
                <button 
                  onClick={handleClear}
                  className="group flex items-center gap-2 px-8 py-4 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700 hover:border-emerald-500/50 shadow-lg mb-8"
                >
                  <RotateCcw size={18} className="group-hover:-rotate-180 transition-transform duration-500 text-emerald-500" />
                  Analyze New Photo
                </button>
              </div>
            )}

          </main>

          {/* Footer */}
          <footer className={`w-full flex flex-col md:flex-row items-center justify-center gap-4 text-slate-500 text-xs md:text-sm border-t border-slate-800/50 pt-6 pb-2 ${analysis ? 'mt-auto' : 'flex-none'}`}>
              <p className="text-center">Not medical advice. For fitness estimation only.</p>
          </footer>

        </div>
      </div>
    </>
  );
};

export default App;