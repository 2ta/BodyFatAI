import React, { useState } from 'react';
import { BodyFatAnalysis } from '../types';
import { Activity, Info, AlertTriangle, CheckCircle2, Share2, Download, X } from 'lucide-react';

interface AnalysisResultProps {
  data: BodyFatAnalysis;
  originalImage: string | null;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ data, originalImage }) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateShareImage = async () => {
    if (!originalImage) return;
    setIsGenerating(true);

    try {
      const img = new Image();
      img.src = `data:image/jpeg;base64,${originalImage}`;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas dimensions to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // --- Draw Overlay ---
      // Gradient from bottom for text readability
      const gradientHeight = canvas.height * 0.5; // Bottom 50%
      const gradient = ctx.createLinearGradient(0, canvas.height - gradientHeight, 0, canvas.height);
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(0.4, 'rgba(2, 6, 23, 0.7)'); // slate-950 with opacity
      gradient.addColorStop(1, 'rgba(2, 6, 23, 0.95)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, canvas.height - gradientHeight, canvas.width, gradientHeight);

      // Helper for responsive font sizing
      const baseUnit = Math.min(canvas.width, canvas.height);
      const padding = baseUnit * 0.05;

      // 1. "BodyFatAI" Branding (Bottom Right)
      const brandSize = baseUnit * 0.04;
      ctx.font = `bold ${brandSize}px "Inter", sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.textAlign = 'right';
      ctx.fillText('BodyFatAI Analysis', canvas.width - padding, canvas.height - padding);

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

      // 4. Confidence (Optional small badge style text next to label)
      // ctx.fillStyle = '#94a3b8';
      // ctx.fillText(`Confidence: ${data.confidenceLevel}`, padding, canvas.height - padding);

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      setShareImageUrl(dataUrl);
      setShowShareModal(true);
    } catch (e) {
      console.error("Failed to generate share image", e);
    } finally {
      setIsGenerating(false);
    }
  };

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
        title: 'My BodyFatAI Analysis',
        text: `Estimated Body Fat: ${data.estimatedRange}. Analyzed by AI.`,
        files: [file],
      };

      // Check if the browser supports sharing files
      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback to download if share API not supported or cannot share files
        handleDownload();
      }
    } catch (err: any) {
      // Ignore AbortError which happens when user cancels the share sheet
      if (err.name === 'AbortError') {
        console.log('Share canceled by user');
        return;
      }
      console.error("Error sharing", err);
    }
  };

  if (data.estimatedRange === "N/A") {
     return (
        <div className="w-full max-w-2xl mx-auto mt-8 bg-red-500/10 border border-red-500/20 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-start gap-4">
                <AlertTriangle className="text-red-400 shrink-0 mt-1" size={24} />
                <div>
                    <h3 className="text-xl font-bold text-red-200 mb-2">Analysis Failed</h3>
                    <p className="text-red-200/80 leading-relaxed">{data.muscleDefinitionAnalysis}</p>
                </div>
            </div>
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
              onClick={generateShareImage}
              disabled={isGenerating}
              className="flex items-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 px-4 py-2 rounded-full text-sm font-medium transition-colors border border-emerald-500/20 hover:border-emerald-500/40"
            >
              <Share2 size={16} />
              {isGenerating ? 'Generating...' : 'Share'}
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
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Share2 size={18} className="text-emerald-400" />
                Share Analysis
              </h3>
              <button 
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 bg-black/20 flex items-center justify-center">
              <img 
                src={shareImageUrl} 
                alt="Shareable Result" 
                className="max-h-[60vh] w-auto rounded-lg shadow-lg border border-slate-700" 
              />
            </div>

            <div className="p-4 bg-slate-800/50 flex gap-3">
              <button 
                onClick={handleNativeShare}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl transition-all font-medium shadow-lg shadow-emerald-900/20"
              >
                <Share2 size={18} />
                Share Image
              </button>
              <button 
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl transition-all font-medium border border-slate-600"
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