"use client";
import React, { useEffect, useState } from "react";
import { Cpu, ShieldCheck, ShieldOff, Zap, Layers } from "lucide-react";

interface SystemStatusPanelProps {
  backendHost: string;
}

export default function SystemStatusPanel({ backendHost }: SystemStatusPanelProps) {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      setChecking(true);
      try {
        const res = await fetch(`${backendHost}/`, { signal: AbortSignal.timeout(3000) });
        setIsOnline(res.ok);
      } catch {
        setIsOnline(false);
      } finally {
        setChecking(false);
      }
    };
    check();
    const interval = setInterval(check, 10000); // re-check every 10s
    return () => clearInterval(interval);
  }, [backendHost]);

  const rows = [
    { label: "Model", value: "DualStream ViT + FFT" },
    { label: "Spatial Dim", value: "768-d  (ViT-Base/16)" },
    { label: "Frequency Dim", value: "256-d  (FFT ConvNet)" },
    { label: "Fused Dim", value: "1024-d  → MLP Head" },
    { label: "Fake Threshold", value: "Trust Score < 50%" },
    { label: "Device", value: "Auto (CPU / CUDA)" },
  ];

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">System Status</span>
        </div>

        {/* Live status badge */}
        {checking ? (
          <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-slate-600 animate-pulse" />
            Checking...
          </span>
        ) : isOnline ? (
          <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            BACKEND LIVE
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-[10px] text-red-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            OFFLINE
          </span>
        )}
      </div>

      {/* Model architecture rows */}
      <div className="flex flex-col gap-1.5 border-t border-slate-800/60 pt-3">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between items-center text-[11px]">
            <span className="text-slate-500">{row.label}</span>
            <span className="text-slate-300 font-mono font-medium">{row.value}</span>
          </div>
        ))}
      </div>

      {/* Icon footer */}
      <div className="flex items-center gap-2 border-t border-slate-800/60 pt-3">
        {isOnline ? (
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
        ) : (
          <ShieldOff className="w-4 h-4 text-red-500" />
        )}
        <span className="text-[10px] text-slate-500 leading-snug">
          {isOnline
            ? "Aegis inference engine is online and ready."
            : "Cannot reach backend. Start FastAPI on port 8000."}
        </span>
      </div>
    </div>
  );
}
