"use client";
import React from "react";
import { History, CheckCircle2, AlertTriangle } from "lucide-react";

interface ScanRecord {
  id: string;
  filename: string;
  isFake: boolean;
  trustScore: number;
  confidenceScore: number;
  detectionMode: string;
  timestamp: string;
  previewUrl: string;
  heatmap: string;
}

interface ScanHistoryLogProps {
  records: ScanRecord[];
  activeId?: string | null;
  onSelectRecord?: (record: ScanRecord) => void;
}

export default function ScanHistoryLog({ records, activeId, onSelectRecord }: ScanHistoryLogProps) {
  if (records.length === 0) {
    return (
      <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <History className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Scan History</span>
        </div>
        <p className="text-xs text-slate-500 text-center py-3">
          No detections yet. Scanned media will be logged here for instant review.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Scan History</span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono bg-slate-800/80 px-2 py-0.5 rounded-md">
          {records.length} item{records.length !== 1 ? "s" : ""} (Click to inspect)
        </span>
      </div>

      <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
        {records.map((rec) => {
          const isActive = activeId === rec.id;
          return (
            <div
              key={rec.id}
              onClick={() => onSelectRecord?.(rec)}
              className={`flex items-center gap-3 p-2 rounded-xl border transition-all cursor-pointer group ${
                isActive
                  ? "bg-indigo-950/40 border-indigo-500/80 shadow-md shadow-indigo-500/10"
                  : "bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/70"
              }`}
            >
              {/* Image thumbnail */}
              <div className="w-11 h-11 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 shrink-0 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={rec.previewUrl}
                  alt={rec.filename}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>

              {/* Title & metadata */}
              <div className="flex-1 min-w-0">
                <span className="text-xs text-slate-200 font-medium block truncate group-hover:text-white transition-colors">
                  {rec.filename}
                </span>
                <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                  <span>{rec.timestamp}</span>
                  <span>•</span>
                  <span>{rec.detectionMode === "face_crop" ? "Face" : "Scene"}</span>
                </span>
              </div>

              {/* Verdict badge */}
              <div className="flex flex-col items-end shrink-0">
                <div className="flex items-center gap-1">
                  {rec.isFake ? (
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  )}
                  <span
                    className={`text-xs font-bold font-mono ${
                      rec.isFake ? "text-rose-400" : "text-emerald-400"
                    }`}
                  >
                    {rec.trustScore.toFixed(0)}%
                  </span>
                </div>
                <span
                  className={`text-[9px] uppercase font-bold tracking-wider mt-0.5 px-1.5 py-0.2 rounded ${
                    rec.isFake
                      ? "text-rose-400 bg-rose-950/40 border border-rose-800/40"
                      : "text-emerald-400 bg-emerald-950/40 border border-emerald-800/40"
                  }`}
                >
                  {rec.isFake ? "FAKE" : "REAL"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export type { ScanRecord };
