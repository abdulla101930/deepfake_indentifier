import React, { useCallback, useState } from "react";
import { UploadCloud, File, AlertCircle, RefreshCw } from "lucide-react";

interface DropzoneProps {
  onFileSelected: (file: File) => void;
  isUploading: boolean;
  uploadProgress: number;
}

export default function Dropzone({ onFileSelected, isUploading, uploadProgress }: DropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const processFile = (file: File) => {
    setErrorMessage(null);
    const validExtensions = ["jpg", "jpeg", "png", "mp4", "mov"];
    const ext = file.name.split(".").pop()?.toLowerCase();
    
    if (!ext || !validExtensions.includes(ext)) {
      setErrorMessage("Unsupported file type. Please upload a conversion matching JPG, PNG, MP4, or MOV.");
      return;
    }
    
    // Max size: 25MB for videos, 5MB for images
    const isVideo = ["mp4", "mov"].includes(ext);
    const maxSize = isVideo ? 25 * 1024 * 1024 : 5 * 1024 * 1024;
    
    if (file.size > maxSize) {
      setErrorMessage(`File exceeds standard limits. Max image size: 5MB, Max video size: 25MB.`);
      return;
    }
    
    onFileSelected(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative w-full h-64 flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl transition-all duration-300 backdrop-blur-sm cursor-pointer select-none ${
          isDragActive
            ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10 scale-[0.99]"
            : "border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/60"
        } ${isUploading ? "pointer-events-none opacity-80" : ""}`}
      >
        {/* Hidden input anchor */}
        <input
          type="file"
          id="file-upload"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleChange}
          disabled={isUploading}
          accept=".jpg,.jpeg,.png,.mp4,.mov"
        />

        {isUploading ? (
          <div className="flex flex-col items-center text-center">
            {/* Spinning load wheel */}
            <div className="relative flex items-center justify-center w-12 h-12 mb-3">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin absolute" />
            </div>
            
            <p className="text-white text-sm font-semibold">Running Neural Inference Pipeline...</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
              Extracting frequency FFT checks and routing face models...
            </p>
            
            {/* Smooth Progress slider bar */}
            <div className="w-48 h-1.5 bg-slate-900 rounded-full mt-4 overflow-hidden border border-slate-800/80">
              <div
                style={{ width: `${uploadProgress}%` }}
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300 rounded-full"
              ></div>
            </div>
            <span className="text-[10px] text-indigo-300 mt-2 font-mono">{uploadProgress}% Complete</span>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <UploadCloud className="w-10 h-10 text-slate-500 mb-3 animate-pulse" />
            <h4 className="text-white font-medium text-sm">Drag and drop file here</h4>
            <p className="text-xs text-slate-500 mt-1 mb-3">or click to browse local files</p>
            <div className="px-3 py-1 bg-slate-900/80 border border-slate-800 rounded-lg text-[10px] text-slate-400 font-medium">
              JPG, PNG (max 5MB) | MP4, MOV (max 25MB)
            </div>
          </div>
        )}
      </div>

      {/* Render validation error messages */}
      {errorMessage && (
        <div className="mt-3 flex items-center gap-1.5 px-3 py-2 bg-red-950/60 border border-red-500/20 text-red-400 rounded-xl text-xs w-full">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
