import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BodyFatAnalysis } from '../types';
import { Activity, Info, AlertTriangle, CheckCircle2, Share2, Download, X, Edit3, ShieldCheck, UserCog, Lightbulb, Save } from 'lucide-react';
import { logEvent, AnalyticsEvents } from '../services/analytics';

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

  // Result Editing State
  const [currentValue, setCurrentValue] = useState(data.estimatedRange);
  const [isEditing, setIsEditing] = useState(false);
  const [editInput, setEditInput] = useState('');
  
  // Check if the current value differs from the original AI prediction
  const isManuallyAdjusted = currentValue !== data.estimatedRange;

  // Cache the loaded image to avoid reloading it constantly
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Reset state when new data comes in
  useEffect(() => {
    setCurrentValue(data.estimatedRange);
    setIsEditing(false);
    setEditInput('');
  }, [data]);

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
      const gradientHeight = canvas.height * 0.55; 
      const gradient = ctx.createLinearGradient(0, canvas.height - gradientHeight, 0, canvas.height);
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(0.3, 'rgba(2, 6, 23, 0.8)');
      gradient.addColorStop(1, 'rgba(2, 6, 23, 0.98)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, canvas.height - gradientHeight, canvas.width, gradientHeight);

      // Helper for responsive font sizing
      const baseUnit = Math.min(canvas.width, canvas.height);
      const padding = baseUnit * 0.06;

      // 1. Custom Branding (Bottom Right)
      const brandSize = baseUnit * 0.04;
      ctx.font = `bold ${brandSize}px "Inter", sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.textAlign = 'right';
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 8;
      ctx.fillText(text, canvas.width - padding, canvas.height - padding);
      
      // Reset shadow
      ctx.shadowBlur = 0;

      // 2. Main Metric (Bottom Left)
      const valueSize = baseUnit * 0.14;
      ctx.font = `bold ${valueSize}px "Inter", sans-serif`;
      
      // Change color based on source
      if (isManuallyAdjusted) {
          ctx.fillStyle = '#fbbf24'; // Amber-400 for manual
      } else {
          ctx.fillStyle = '#34d399'; // Emerald-400 for AI
      }
      
      ctx.textAlign = 'left';
      const valueY = canvas.height - padding - (baseUnit * 0.08);
      ctx.fillText(currentValue, padding, valueY);

      // 3. Label (Above Metric)
      const labelSize = baseUnit * 0.035;
      ctx.font = `600 ${labelSize}px "Inter", sans-serif`;
      ctx.fillStyle = '#e2e8f0'; // Slate-200
      
      const labelText = isManuallyAdjusted ? "Self-Reported Body Fat" : "Estimated Body Fat";
      const labelY = valueY - valueSize - (baseUnit * 0.02);
      ctx.fillText(labelText, padding, labelY);

      // 4. Source Footnote (If adjusted)
      if (isManuallyAdjusted) {
         const noteSize = baseUnit * 0.025;
         ctx.font = `italic ${noteSize}px "Inter", sans-serif`;
         ctx.fillStyle = 'rgba(251, 191, 36, 0.8)'; // Dim Amber
         ctx.fillText("Source: User Adjustment", padding, canvas.height - padding + noteSize + 5);
      } else {
         // Draw Confidence pill for AI result
         const confSize = baseUnit * 0.025;
         ctx.font = `${confSize}px "Inter", sans-serif`;
         ctx.fillStyle = '#94a3b8';
         ctx.fillText(`AI Confidence: ${data.confidenceLevel}`, padding, canvas.height - padding + confSize + 5);
      }

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      setShareImageUrl(dataUrl);
    } catch (e) {
      console.error("Failed to draw canvas", e);
    } finally {
      setIsGenerating(false);
    }
  }, [currentValue, isManuallyAdjusted, data.confidenceLevel]);

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
    logEvent(AnalyticsEvents.DOWNLOAD_RESULT);
    if (shareImageUrl) {
      const link = document.createElement('a');
      link.href = shareImageUrl;
      link.download = 'bodyfat-analysis.png';
      link.click();
    }
  };

  const handleNativeShare = async () => {
    if (!shareImageUrl) return;
    
    logEvent(AnalyticsEvents.SHARE_RESULT);

    try {
      const blob = await (await fetch(shareImageUrl)).blob();
      const file = new File([blob], "bodyfat-analysis.png", { type: "image/png" });
      
      const shareData = {
        title: brandingText,
        text: `Body Fat: ${currentValue} ${isManuallyAdjusted ? '(Self-Reported)' : '(AI Estimated)'}\n\nAnalyzed by BodyFatAI`,
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

  // --- Handle Editing Logic ---
  const startEditing = () => {
    setEditInput(currentValue);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditInput('');
  };

  const saveEditing = () => {
    if (editInput.trim()) {
      setCurrentValue(editInput.trim());
    }
    setIsEditing(false);
  };

  const resetToAI = () => {
    setCurrentValue(data.estimatedRange);
  }


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
        
        {/* Main Result Card */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 border border-slate-700/50 shadow-2xl relative overflow-hidden flex flex-col justify-between group">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Activity size={120} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
               <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider flex items-center gap-2">
                 {isManuallyAdjusted ? <UserCog size={14} className="text-amber-400" /> : <Activity size={14} className="text-emerald-400" />}
                 {isManuallyAdjusted ? 'Self-Reported' : 'Estimated Body Fat'}
               </h3>
               {isManuallyAdjusted && (
                 <button onClick={resetToAI} className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-400 px-2 py-1 rounded-md border border-slate-700 transition-colors">
                   Reset to AI
                 </button>
               )}
            </div>

            {/* Editing Interface vs Display Interface */}
            {isEditing ? (
              <div className="flex items-center gap-2 mb-4 animate-in fade-in slide-in-from-left-2 duration-200">
                <input 
                  type="text" 
                  value={editInput}
                  onChange={(e) => setEditInput(e.target.value)}
                  placeholder="e.g. 12-14%"
                  className="bg-slate-950/50 border border-slate-600 rounded-xl px-4 py-3 text-2xl font-bold text-white w-full focus:ring-2 focus:ring-emerald-500 outline-none"
                  autoFocus
                />
                <button onClick={saveEditing} className="bg-emerald-500 hover:bg-emerald-400 text-black p-3.5 rounded-xl transition-colors">
                   <Save size={20} />
                </button>
                <button onClick={cancelEditing} className="bg-slate-700 hover:bg-slate-600 text-white p-3.5 rounded-xl transition-colors">
                   <X size={20} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-1 mb-4 group/val">
                <div className="flex items-baseline gap-3">
                  <span className={`text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${isManuallyAdjusted ? 'from-amber-400 to-orange-300' : 'from-emerald-400 to-teal-300'}`}>
                    {currentValue}
                  </span>
                </div>
                
                <button 
                  onClick={startEditing}
                  className="text-xs font-medium text-slate-500 hover:text-emerald-400 flex items-center gap-1.5 transition-colors px-2 py-1 -ml-2 rounded-lg hover:bg-slate-800/50"
                >
                  <Edit3 size={12} />
                  Wrong result? Adjust manually
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-4 relative z-10">
            {isManuallyAdjusted ? (
               <div className="flex items-center gap-2 text-slate-400 text-sm bg-amber-950/30 w-fit px-3 py-1.5 rounded-full border border-amber-900/30">
                  <Info size={14} className="text-amber-400" />
                  <span className="text-amber-200/80">User Modified</span>
               </div>
            ) : (
               <div className="flex items-center gap-2 text-slate-400 text-sm bg-slate-950/30 w-fit px-3 py-1.5 rounded-full border border-slate-700/30">
                 <ShieldCheck size={14} className="text-emerald-500" />
                 <span>Confidence: <span className="text-emerald-400 font-medium">{data.confidenceLevel}</span></span>
               </div>
            )}
            
            <button 
              onClick={initShare}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40 hover:scale-105 transform active:scale-95"
            >
              <Share2 size={18} />
              Share Result
            </button>
          </div>
        </div>

        {/* Visual Cues Card */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-3xl p-8 border border-slate-700/50 flex flex-col justify-center shadow-lg">
          <h3 className="text-slate-200 font-semibold mb-6 flex items-center gap-2 text-lg">
             <CheckCircle2 size={20} className="text-emerald-400" />
             AI Visual Analysis
          </h3>
          <div className="flex flex-wrap gap-3">
            {data.visualCues.map((cue, idx) => (
              <span 
                key={idx} 
                className="bg-slate-700/40 hover:bg-slate-700/60 transition-colors text-slate-200 px-4 py-2 rounded-xl text-sm border border-slate-600/30"
              >
                {cue}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="grid md:grid-cols-3 gap-4">
        {data.healthTips.map((tip, idx) => (
            <div key={idx} className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700/30 hover:border-slate-600/50 transition-colors">
                <div className="bg-emerald-500/10 w-8 h-8 rounded-full flex items-center justify-center text-emerald-400 font-bold mb-3 text-sm">
                    {idx + 1}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{tip}</p>
            </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="text-center p-4 opacity-60 hover:opacity-100 transition-opacity">
        <p className="text-xs text-slate-500 max-w-2xl mx-auto mb-2">
          {data.disclaimer}
        </p>
        <p className="text-[10px] text-slate-600 uppercase tracking-wide">
           For 100% exact medical accuracy, please verify with a DEXA Scan or Hydrostatic Weighing.
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
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                 <Info size={12} />
                 {isManuallyAdjusted ? "Includes 'Self-Reported' label due to manual edit." : "Includes AI Confidence score."}
              </p>
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