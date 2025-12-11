import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BodyFatAnalysis } from '../types';
import { Activity, Info, AlertTriangle, CheckCircle2, Share2, Download, X, Edit3, Camera, Lightbulb } from 'lucide-react';

interface AnalysisResultProps {
  data: BodyFatAnalysis;
  originalImage: string | null;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ data, originalImage }) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Custom branding state
  const [brandingText, setBrandingText] = useState('BodyFatAI Analysis');
  const [debouncedBrandingText, setDebouncedBrandingText] = useState(brandingText);

  // Cache the loaded image to avoid reloading it constantly
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Debounce the text input to prevent canvas trashing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedBrandingText(brandingText);
    }, 500);
    return () => clearTimeout(timer);
  }, [brandingText]);

  const drawCanvas = useCallback(async (text: string) => {
    if (!imageRef.current) return;
    
    setIsGenerating(true);
    try {
      const img = imageRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas dimensions to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // --- Draw Overlay ---
      const gradientHeight = canvas.height * 0.5; 
      const gradient = ctx.createLinearGradient(0, canvas.height - gradientHeight, 0, canvas.height);
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(0.4, 'rgba(2, 6, 23, 0.7)');
      gradient.addColorStop(1, 'rgba(2, 6, 23, 0.95)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, canvas.height - gradientHeight, canvas.width, gradientHeight);

      // Helper for responsive font sizing
      const baseUnit = Math.min(canvas.width, canvas.height);
      const padding = baseUnit * 0.05;

      // 1. Custom Branding (Bottom Right)
      const brandSize = baseUnit * 0.04;
      ctx.font = `bold ${brandSize}px "Inter", sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.textAlign = 'right';
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 4;
      ctx.fillText(text, canvas.width - padding, canvas.height - padding);
      
      // Reset shadow
      ctx.shadowBlur = 0;

      // 2. Estimated Range (Main Metric - Bottom Left)
      const valueSize = baseUnit * 0.12;
      ctx.font = `bold ${valueSize}px "Inter", sans-serif`;
      ctx.fillStyle = '#34d399'; // Emerald-400
      ctx.textAlign = 'left';
      ctx.fillText(data.estimatedRange, padding, canvas.height - padding - (baseUnit * 0.06));

      // 3. Label (Above Metric)
      const labelSize = baseUnit * 0.035;
      ctx.font = `${labelSize}px "Inter", sans-serif`;
      ctx.fillStyle = '#cbd5e1'; // Slate-300
      ctx.fillText('Estimated Body Fat', padding, canvas.height - padding - (baseUnit * 0.06) - valueSize - (baseUnit * 0.01));

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      setShareImageUrl(dataUrl);
    } catch (e) {
      console.error("Failed to draw canvas", e);
    } finally {
      setIsGenerating(false);
    }
  }, [data.estimatedRange]);

  const initShare = async () => {
    if (!originalImage) return;
    setShowShareModal(true);
    
    if (!imageRef.current) {
      setIsGenerating(true);
      const img = new Image();
      img.src = `data:image/jpeg;base64,${originalImage}`;
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      imageRef.current = img;
    }
    
    // Initial draw
    drawCanvas(brandingText);
  };

  // Redraw when debounced text changes and modal is open
  useEffect(() => {
    if (showShareModal && imageRef.current) {
      drawCanvas(debouncedBrandingText);
    }
  }, [debouncedBrandingText, showShareModal, drawCanvas]);


  const handleDownload = () => {
    if (shareImageUrl) {
      const link = document.createElement('a');
      link.href = shareImageUrl;
      link.download = 'bodyfat-analysis.png';
      link.click();
    }
  };

  const handleNativeShare = async () => {
    if (!shareImageUrl) return;

    try {
      const blob = await (await fetch(shareImageUrl)).blob();
      const file = new File([blob], "bodyfat-analysis.png", { type: "image/png" });
      
      const shareData = {
        title: brandingText,
        text: `Estimated Body Fat: ${data.estimatedRange}\nConfidence Level: ${data.confidenceLevel}\n\nAnalyzed by BodyFatAI`,
        files: [file],
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback if share is not supported on device/browser
        alert("Sharing is not supported on this device. Downloading image instead.");
        handleDownload();
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return;
      }
      console.error("Error sharing", err);
      // Fallback on error
      handleDownload();
    }
  };

  if (data.estimatedRange === "N/A") {
     return (
        <div className="w-full max-w-2xl mx-auto mt-8 bg-red-500/10 border border-red-500/20 rounded-2xl p-6 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
            <div className="flex items-start gap-4 mb-6">
                <AlertTriangle className="text-red-400 shrink-0 mt-1" size={24} />
                <div>
                    <h3 className="text-xl font-bold text-red-200 mb-2">Analysis Failed</h3>
                    <p className="text-red-200/80 leading-relaxed">{data.muscleDefinitionAnalysis}</p>
                </div>
            </div>

            {data.suggestions && data.suggestions.length > 0 && (
               <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-700/50">
                  <h4 className="text-emerald-400 font-medium mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                     <Lightbulb size={16} />
                     How to get a better result
                  </h4>
                  <ul className="grid gap-3">
                     {data.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-slate-300 text-sm">
                           <div className="mt-0.5 min-w-[16px]">
                             <CheckCircle2 size={16} className="text-slate-500" />
                           </div>
                           <span>{suggestion}</span>
                        </li>
                     ))}
                  </ul>
               </div>
            )}
        </div>
     );
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* Primary Metric Card & Share Action */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 border border-slate-700/50 shadow-2xl relative overflow-hidden flex flex-col justify-between group">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Activity size={120} />
          </div>
          
          <div>
            <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">Estimated Body Fat</h3>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                {data.estimatedRange}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm bg-slate-950/30 w-fit px-3 py-1.5 rounded-full border border-slate-700/30">
              <Info size={14} />
              <span>Confidence: <span className="text-emerald-400 font-medium">{data.confidenceLevel}</span></span>
            </div>
            
            <button 
              onClick={initShare}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-900 px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-105 transform"
            >
              <Share2 size={18} />
              Share Result
            </button>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl p-8 border border-slate-700/50 flex flex-col justify-center">
          <h3 className="text-slate-200 font-semibold mb-4 flex items-center gap-2">
             <CheckCircle2 size={18} className="text-emerald-400" />
             Visual Cues
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.visualCues.map((cue, idx) => (
              <span 
                key={idx} 
                className="bg-slate-700/50 text-slate-300 px-3 py-1.5 rounded-lg text-sm border border-slate-600/30"
              >
                {cue}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Analysis */}
      <div className="bg-slate-800/30 backdrop-blur-md rounded-3xl p-8 border border-slate-700/30">
         <h3 className="text-xl font-semibold text-white mb-4">Physique Analysis</h3>
         <p className="text-slate-300 leading-relaxed text-lg font-light">
           {data.muscleDefinitionAnalysis}
         </p>
      </div>

      {/* Tips */}
      <div className="grid md:grid-cols-3 gap-4">
        {data.healthTips.map((tip, idx) => (
            <div key={idx} className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700/30">
                <div className="bg-emerald-500/10 w-8 h-8 rounded-full flex items-center justify-center text-emerald-400 font-bold mb-3 text-sm">
                    {idx + 1}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{tip}</p>
            </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="text-center p-4 opacity-60 hover:opacity-100 transition-opacity">
        <p className="text-xs text-slate-500 max-w-2xl mx-auto">
          {data.disclaimer}
        </p>
      </div>

      {/* Share Modal */}
      {showShareModal && shareImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh]">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Share2 size={18} className="text-emerald-400" />
                Customize & Share
              </h3>
              <button 
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-black/20 flex flex-col items-center gap-4">
              
              {/* Custom Branding Input */}
              <div className="w-full">
                <label className="block text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">
                  Custom Branding Text
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={30}
                    value={brandingText}
                    onChange={(e) => setBrandingText(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all pl-10"
                    placeholder="Enter custom text..."
                  />
                  <Edit3 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                </div>
              </div>

              {/* Preview */}
              <div className="relative rounded-lg overflow-hidden shadow-lg border border-slate-700 bg-slate-950">
                <img 
                  src={shareImageUrl} 
                  alt="Shareable Result" 
                  className={`max-h-[45vh] w-auto transition-opacity duration-300 ${isGenerating ? 'opacity-50' : 'opacity-100'}`} 
                />
                {isGenerating && (
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                   </div>
                )}
              </div>
              <p className="text-xs text-slate-500">Preview updates automatically</p>
            </div>

            <div className="p-4 bg-slate-800/50 flex gap-3 mt-auto border-t border-slate-800">
              <button 
                onClick={handleNativeShare}
                disabled={isGenerating}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl transition-all font-medium shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Share2 size={18} />
                Share Image
              </button>
              <button 
                onClick={handleDownload}
                disabled={isGenerating}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl transition-all font-medium border border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={18} />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};