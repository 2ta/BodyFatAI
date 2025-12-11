import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Camera, AlertCircle } from 'lucide-react';

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
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onloadend = (e) => {
      const result = e.target?.result as string;
      
      // Resize and compress image before sending
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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
            facingMode: 'user', // Default to front camera (mirror style)
            width: { ideal: 1280 }, // Reduced ideal resolution
            height: { ideal: 720 }
        } 
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
      
      // Allow time for the modal/element to render before attaching stream
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
      
      // Capture resolution
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64 with reduced quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        const base64 = dataUrl.split(',')[1];
        
        stopCamera();
        onImageSelect(base64);
      }
    }
  };

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 1. Display Selected Image
  if (selectedImage) {
    return (
      <div className="relative w-full max-w-md mx-auto mb-8 group animate-in fade-in zoom-in duration-300">
        <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 bg-slate-900">
          <img 
            src={`data:image/jpeg;base64,${selectedImage}`} 
            alt="Uploaded analysis" 
            className={`w-full h-auto max-h-[500px] object-cover transition-opacity duration-300 ${loading ? 'opacity-50 grayscale-[50%]' : 'opacity-100'}`}
          />
          {!loading && (
            <button
              onClick={onClear}
              className="absolute top-3 right-3 bg-black/60 hover:bg-red-500/90 text-white p-2 rounded-full backdrop-blur-md border border-white/10 shadow-lg transition-all transform hover:scale-105 active:scale-95 z-20"
              title="Remove image"
            >
              <X size={20} />
            </button>
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
           <video 
             ref={videoRef} 
             autoPlay 
             playsInline 
             muted
             className="w-full h-full object-cover flex-1"
           />
           <canvas ref={canvasRef} className="hidden" />
           
           {/* Camera Overlay UI */}
           <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent">
              <div className="bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
                <span className="text-xs font-medium text-white/80 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                  Live Camera
                </span>
              </div>
              <button 
                onClick={stopCamera}
                className="bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-sm transition-colors border border-white/10"
              >
                <X size={20} />
              </button>
           </div>

           <div className="absolute bottom-0 inset-x-0 pb-8 pt-12 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex justify-center items-center">
              <button 
                onClick={capturePhoto}
                className="group relative"
              >
                <div className="w-20 h-20 rounded-full border-4 border-white/30 group-hover:border-white/50 transition-colors"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-lg shadow-emerald-500/20 group-active:scale-90 transition-transform"></div>
              </button>
           </div>
        </div>
      </div>
    );
  }

  // 3. Display Upload/Start Camera Interface
  return (
    <div className="w-full max-w-md mx-auto mb-8">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
        disabled={loading}
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative w-full h-80 
          border-2 border-dashed rounded-3xl 
          flex flex-col items-center justify-center text-center 
          transition-all duration-300 ease-out
          ${isDragging 
            ? 'border-emerald-400 bg-emerald-400/10 scale-[1.02]' 
            : 'border-slate-700 bg-slate-800/50'
          }
          ${loading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {cameraError && (
          <div className="absolute top-4 inset-x-4 bg-red-500/20 border border-red-500/30 text-red-200 p-3 rounded-xl text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
            <AlertCircle size={16} className="shrink-0" />
            {cameraError}
          </div>
        )}

        <div className="bg-slate-900 p-4 rounded-full mb-4 shadow-xl shadow-black/20 ring-1 ring-white/5">
           <ImageIcon className="text-emerald-400" size={32} />
        </div>
        
        <h3 className="text-xl font-bold text-slate-200 mb-2">
          Upload Physique Photo
        </h3>
        <p className="text-sm text-slate-400 px-8 mb-8 max-w-xs">
          Drag and drop your image here, or choose an option below
        </p>
        
        <div className="flex gap-3 w-full px-8">
           <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl transition-all font-medium border border-slate-600 hover:border-slate-500"
              disabled={loading}
           >
              <Upload size={18} />
              Upload
           </button>
           <button
              onClick={startCamera}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl transition-all font-medium shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40"
              disabled={loading}
           >
              <Camera size={18} />
              Camera
           </button>
        </div>
      </div>
      
      <div className="mt-4 flex justify-center gap-6 text-xs text-slate-500 font-medium">
         <span className="flex items-center gap-1.5"><ImageIcon size={12} /> JPG, PNG Supported</span>
         <span className="flex items-center gap-1.5"><Camera size={12} /> HD Capture Ready</span>
      </div>
    </div>
  );
};