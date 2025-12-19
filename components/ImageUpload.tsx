import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Camera, AlertCircle, ScanLine, ShieldCheck } from 'lucide-react';
import { logEvent, AnalyticsEvents } from '../services/analytics';

interface ImageUploadProps {
  onImageSelect: (base64: string) => void;
  onClear: () => void;
  selectedImage: string | null;
  loading: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelect, onClear, selectedImage, loading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // Dynamic Loading Text
  const [loadingText, setLoadingText] = useState("INITIALIZING SCAN");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cycle through loading messages
  useEffect(() => {
    if (!loading) return;
    
    const messages = [
      "CALIBRATING SENSORS...",
      "MAPPING ANATOMY...",
      "ANALYZING DENSITY...",
      "COMPUTING METRICS...",
      "FINALIZING REPORT..."
    ];
    let i = 0;
    const interval = setInterval(() => {
      setLoadingText(messages[i]);
      i = (i + 1) % messages.length;
    }, 1200);
    
    return () => clearInterval(interval);
  }, [loading]);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    // Log Gallery Upload
    logEvent(AnalyticsEvents.UPLOAD_IMAGE, { 
      method: 'gallery',
      file_size: file.size 
    });

    const reader = new FileReader();
    reader.onloadend = (e) => {
      const result = e.target?.result as string;
      
      const img = new Image();
      img.onload = () => {
        // Reduced to 1024 to prevent XHR/Payload errors on mobile networks
        const maxDimension = 1024; 
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
           ctx.drawImage(img, 0, 0, width, height);
           // Compress to jpeg with 0.7 quality to keep payload light
           const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
           const base64 = dataUrl.split(',')[1];
           onImageSelect(base64);
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // Log Drag and Drop
      logEvent(AnalyticsEvents.UPLOAD_IMAGE, { method: 'drag_drop' });
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    // Log Camera Open
    logEvent(AnalyticsEvents.OPEN_CAMERA);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
        } 
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 50);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setCameraError("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        const base64 = dataUrl.split(',')[1];
        
        // Log Camera Capture
        logEvent(AnalyticsEvents.UPLOAD_IMAGE, { method: 'camera_capture' });
        
        stopCamera();
        onImageSelect(base64);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 1. Display Selected Image with Professional Scanner Overlay
  if (selectedImage) {
    return (
      <div className="relative w-full max-w-md mx-auto mb-8 group animate-in fade-in zoom-in duration-300">
        <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 bg-slate-900">
          <img 
            src={`data:image/jpeg;base64,${selectedImage}`} 
            alt="Uploaded analysis" 
            className="w-full h-auto max-h-[500px] object-cover"
          />
          
          {/* Default Close Button (Only show if NOT loading) */}
          {!loading && (
            <button
              onClick={onClear}
              className="absolute top-3 right-3 bg-black/60 hover:bg-red-500/90 text-white p-2 rounded-full backdrop-blur-md border border-white/10 shadow-lg transition-all transform hover:scale-105 active:scale-95 z-20"
              title="Remove image"
            >
              <X size={20} />
            </button>
          )}

          {/* === BIOMETRIC SCANNER OVERLAY === */}
          {loading && (
            <div className="absolute inset-0 z-10 bg-emerald-950/40 backdrop-blur-[1px] overflow-hidden">
               {/* 1. Grid Background */}
               <div className="absolute inset-0 bg-grid-pattern opacity-40"></div>
               
               {/* 2. Target Corners (Reticle) */}
               <div className="absolute top-4 left-4 w-12 h-12 border-t-[3px] border-l-[3px] border-emerald-400 rounded-tl-xl shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
               <div className="absolute top-4 right-4 w-12 h-12 border-t-[3px] border-r-[3px] border-emerald-400 rounded-tr-xl shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
               <div className="absolute bottom-4 left-4 w-12 h-12 border-b-[3px] border-l-[3px] border-emerald-400 rounded-bl-xl shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
               <div className="absolute bottom-4 right-4 w-12 h-12 border-b-[3px] border-r-[3px] border-emerald-400 rounded-br-xl shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>

               {/* 3. Moving Scan Line */}
               <div className="absolute inset-x-0 h-[2px] bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,1)] animate-scan z-20"></div>

               {/* 4. Center Spinner & Text */}
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="relative mb-6">
                     <div className="w-24 h-24 border-2 border-emerald-500/20 rounded-full animate-[spin_8s_linear_infinite]"></div>
                     <div className="absolute inset-0 w-24 h-24 border-t-2 border-emerald-400 rounded-full animate-[spin_2s_linear_infinite]"></div>
                     <div className="absolute inset-2 w-20 h-20 border-r-2 border-emerald-300/50 rounded-full animate-[spin_3s_linear_reverse_infinite]"></div>
                     <div className="absolute inset-0 flex items-center justify-center">
                        <ScanLine className="text-emerald-400 animate-pulse" size={32} />
                     </div>
                  </div>
                  
                  {/* Status Box */}
                  <div className="px-6 py-2 bg-black/70 backdrop-blur-md rounded-sm border-x-2 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                     <p className="text-emerald-400 text-sm font-mono font-bold tracking-[0.2em] animate-pulse">
                        {loadingText}
                     </p>
                  </div>
               </div>

               {/* 5. Decorative Data Lines */}
               <div className="absolute bottom-16 left-8 flex flex-col gap-1 opacity-60">
                  <div className="w-16 h-[2px] bg-emerald-500/50"></div>
                  <div className="w-10 h-[2px] bg-emerald-500/30"></div>
                  <div className="w-24 h-[2px] bg-emerald-500/20"></div>
               </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. Display Camera Interface
  if (isCameraOpen) {
    return (
      <div className="relative w-full max-w-md mx-auto mb-8 animate-in zoom-in-95 duration-300">
        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-700 bg-black h-[500px] flex flex-col">
           <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover flex-1" />
           <canvas ref={canvasRef} className="hidden" />
           <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent">
              <div className="bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
                <span className="text-xs font-medium text-white/80 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                  Live
                </span>
              </div>
              <button onClick={stopCamera} className="bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-sm border border-white/10">
                <X size={20} />
              </button>
           </div>
           <div className="absolute bottom-0 inset-x-0 pb-10 pt-16 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex justify-center items-center">
              <button onClick={capturePhoto} className="group relative">
                <div className="w-20 h-20 rounded-full border-4 border-white/30 group-hover:border-white/50 transition-colors"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-lg group-active:scale-90 transition-transform"></div>
              </button>
           </div>
        </div>
      </div>
    );
  }

  // 3. Main Upload Interface
  return (
    <div className="w-full max-w-md mx-auto mb-8">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} disabled={loading} />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative w-full h-80 md:h-96
          border-2 border-dashed rounded-[2rem]
          flex flex-col items-center justify-center text-center 
          transition-all duration-300 ease-out touch-manipulation
          ${isDragging 
            ? 'border-emerald-400 bg-emerald-400/10 scale-[1.02]' 
            : 'border-slate-700 bg-slate-800/30'
          }
          ${loading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {cameraError && (
          <div className="absolute top-4 inset-x-4 bg-red-500/20 border border-red-500/30 text-red-200 p-3 rounded-xl text-xs font-medium flex items-center gap-2 animate-in slide-in-from-top-2 z-20">
            <AlertCircle size={16} className="shrink-0" />
            {cameraError}
          </div>
        )}

        <div className="bg-slate-900 p-5 rounded-2xl mb-5 shadow-xl shadow-black/30 ring-1 ring-white/5 group-hover:scale-110 transition-transform duration-500">
           <ImageIcon className="text-emerald-400" size={36} />
        </div>
        
        <h3 className="text-2xl font-bold text-slate-100 mb-2 tracking-tight">
          Upload Photo
        </h3>
        <p className="text-sm text-slate-400 px-8 mb-8 max-w-[280px] leading-relaxed">
          For best results, use good lighting and show key anatomical markers.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full px-6 md:px-10">
           <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white py-4 rounded-xl transition-all font-semibold border border-slate-600 hover:border-slate-500 shadow-lg active:scale-95"
              disabled={loading}
           >
              <Upload size={20} />
              Gallery
           </button>
           <button
              onClick={startCamera}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white py-4 rounded-xl transition-all font-semibold shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40 active:scale-95"
              disabled={loading}
           >
              <Camera size={20} />
              Camera
           </button>
        </div>
      </div>
      
      <div className="mt-6 flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
         <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-900/50 shadow-sm shadow-emerald-900/20">
            <ShieldCheck size={14} />
            <span>100% Private Analysis</span>
         </div>
         <p className="text-[10px] text-slate-500 text-center max-w-xs leading-relaxed">
            Your photos are processed instantly in memory and are <span className="text-slate-400 font-medium">never stored</span> or saved to any database.
         </p>
      </div>
    </div>
  );
};