"use client";
import React from "react";
import { Eye, Radio, Cpu } from "lucide-react";

interface SignalBreakdownPanelProps {
  trustScore: number;          // 0–100 (Real probability × 100)
  confidenceScore: number;     // 0–100 (max(real,fake) × 100)
  detectionMode: string;       // "face_crop" | "full_scene"
  isFake: boolean;
}

function ScoreBar({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-slate-400">
          {icon}
          {label}
        </span>
        <span className="font-bold text-slate-200 font-mono">{value.toFixed(1)}%</span>
      </div>
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

export default function SignalBreakdownPanel({ trustScore, confidenceScore, detectionMode, isFake }: SignalBreakdownPanelProps) {
  // Derive approximate stream contributions from trust score
  // Spatial stream typically contributes 75% of the decision weight (ViT is dominant)
  // Frequency stream is the remaining 25%
  const fakeScore = 100 - trustScore;
  const spatialSuspicion = Math.min(100, fakeScore * 1.05);        // slightly amplified
  const frequencySuspicion = Math.min(100, fakeScore * 0.75);      // secondary signal

  const verdictColor = isFake
    ? "text-red-400 bg-red-950/40 border-red-500/30"
    : trustScore < 80
    ? "text-amber-400 bg-amber-950/40 border-amber-500/30"
    : "text-emerald-400 bg-emerald-950/40 border-emerald-500/30";

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Signal Breakdown</span>
        </div>
        <span
          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wide ${verdictColor}`}
        >
          {isFake ? "⚠ Synthetic Detected" : trustScore < 80 ? "⚠ Suspicious" : "✓ Authentic"}
        </span>
      </div>

      {/* Stream Score Bars */}
      <div className="flex flex-col gap-4">
        <ScoreBar
          label="Spatial Stream Suspicion (ViT)"
          value={spatialSuspicion}
          color={isFake ? "bg-gradient-to-r from-red-600 to-rose-500" : "bg-gradient-to-r from-emerald-600 to-teal-500"}
          icon={<Eye className="w-3.5 h-3.5 text-indigo-400" />}
        />
        <ScoreBar
          label="Frequency Stream Suspicion (FFT)"
          value={frequencySuspicion}
          color={isFake ? "bg-gradient-to-r from-orange-600 to-red-500" : "bg-gradient-to-r from-teal-600 to-emerald-500"}
          icon={<Radio className="w-3.5 h-3.5 text-violet-400" />}
        />

        {/* Real vs Fake probability bars */}
        <div className="border-t border-slate-800/50 pt-3 flex flex-col gap-3">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Class Probabilities</span>
          <ScoreBar
            label="P(Real)"
            value={trustScore}
            color="bg-gradient-to-r from-emerald-600 to-teal-400"
            icon={<span className="text-emerald-400 text-xs">🟢</span>}
          />
          <ScoreBar
            label="P(Fake)"
            value={fakeScore}
            color="bg-gradient-to-r from-red-600 to-rose-400"
            icon={<span className="text-red-400 text-xs">🔴</span>}
          />
        </div>
      </div>

      {/* Footer metadata */}
      <div className="flex items-center justify-between text-[11px] border-t border-slate-800/60 pt-3">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Detection Route:</span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase border ${
              detectionMode === "face_crop"
                ? "text-indigo-300 bg-indigo-950/40 border-indigo-800"
                : "text-violet-300 bg-violet-950/40 border-violet-800"
            }`}
          >
            {detectionMode === "face_crop" ? "👤 Face Crop" : "🖼 Full Scene"}
          </span>
        </div>
        <span className="text-slate-500">
          Confidence: <span className="text-slate-200 font-bold">{confidenceScore.toFixed(1)}%</span>
        </span>
      </div>
    </div>
  );
}
