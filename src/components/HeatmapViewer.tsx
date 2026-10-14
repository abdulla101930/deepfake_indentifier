import React, { useState } from "react";
import { MoveRight, RefreshCw, Layers } from "lucide-react";

interface HeatmapViewerProps {
  originalUrl: string;
  heatmapUrl: string;
}

export default function HeatmapViewer({ originalUrl, heatmapUrl }: HeatmapViewerProps) {
  const [viewMode, setViewMode] = useState<"side-by-side" | "slider" | "overlay">("side-by-side");
  const [sliderPos, setSliderPos] = useState(50); // percentage

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPos(Number(e.target.value));
  };

  return (
    <div className="flex flex-col p-6 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl w-full">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-slate-800/60 pb-3">
        <div>
          <h3 className="text-white text-base font-semibold">Explainable AI (XAI) Heatmap</h3>
          <p className="text-xs text-slate-400">Grad-CAM overlaid with local high-frequency frequency grids</p>
        </div>
        
        {/* Toggle Mode Toolbar */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode("side-by-side")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === "side-by-side"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Side by Side
          </button>
          <button
            onClick={() => setViewMode("slider")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === "slider"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Split Slider
          </button>
          <button
            onClick={() => setViewMode("overlay")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === "overlay"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Overlay Toggle
          </button>
        </div>
      </div>

      {/* 1. Side by Side View Mode */}
      {viewMode === "side-by-side" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center justify-center">
          <div className="flex flex-col items-center">
            <span className="text-xs text-indigo-400 font-semibold mb-2 uppercase tracking-wider">Original Upload</span>
            <div className="relative w-full max-w-[280px] aspect-square rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
              <img
                src={originalUrl}
                alt="Source File"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          <div className="flex flex-col items-center relative">
            <div className="absolute left-0 top-1/2 -ml-3 hidden md:flex items-center justify-center bg-slate-950 border border-slate-800 w-6 h-6 rounded-full text-indigo-400 z-10">
              <MoveRight className="w-3.5 h-3.5" />
            </div>
            
            <span className="text-xs text-rose-400 font-semibold mb-2 uppercase tracking-wider">XAI Localization</span>
            <div className="relative w-full max-w-[280px] aspect-square rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
              <img
                src={heatmapUrl}
                alt="Model Heatmap"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. Interactive Split Slider Mode */}
      {viewMode === "slider" && (
        <div className="flex flex-col items-center">
          <div className="relative w-full max-w-[380px] aspect-square rounded-xl overflow-hidden border border-slate-800 bg-slate-950 select-none">
            {/* Heatmap Image Backing */}
            <img
              src={heatmapUrl}
              alt="Model Heatmap"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Original Image sliding foreground */}
            <div
              style={{ width: `${sliderPos}%` }}
              className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-indigo-500 shadow-lg"
            >
              <img
                src={originalUrl}
                alt="Source File"
                style={{ width: "380px", maxWidth: "none" }}
                className="absolute inset-0 h-full object-cover"
              />
            </div>
            {/* Label badges */}
            <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-indigo-300 font-medium">Original</div>
            <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-rose-300 font-medium">Heatmap</div>
          </div>
          
          <div className="w-full max-w-[380px] mt-4 flex items-center gap-2">
            <span className="text-xs text-slate-400">Slider Control:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPos}
              onChange={handleSliderChange}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        </div>
      )}

      {/* 3. Overlay / Toggle Mode */}
      {viewMode === "overlay" && (
        <div className="flex flex-col items-center">
          <div className="relative w-full max-w-[320px] aspect-square rounded-xl overflow-hidden border border-slate-800 bg-slate-950 group">
            {/* Original content base */}
            <img
              src={originalUrl}
              alt="Source File"
              className="w-full h-full object-cover"
            />
            {/* Heatmap container visible on group-hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <img
                src={heatmapUrl}
                alt="Model Heatmap"
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Indicator Overlay Instructions */}
            <div className="absolute bottom-2 inset-x-2 bg-slate-950/80 backdrop-blur-md px-3 py-2 rounded-lg text-center flex items-center justify-center gap-1.5 pointer-events-none">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[10px] text-slate-300 font-medium font-sans">Hover mouse over image to reveal XAI Heatmap</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
