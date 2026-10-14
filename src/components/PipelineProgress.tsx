"use client";
import React, { useEffect, useState } from "react";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

const STEPS = [
  { id: "upload", label: "Image received" },
  { id: "mtcnn", label: "MTCNN face detection" },
  { id: "spatial", label: "Spatial ViT stream" },
  { id: "frequency", label: "Frequency FFT stream" },
  { id: "fusion", label: "Fusion & classification" },
  { id: "xai", label: "Generating XAI heatmap" },
];

interface PipelineProgressProps {
  isRunning: boolean;
  isDone: boolean;
}

export default function PipelineProgress({ isRunning, isDone }: PipelineProgressProps) {
  const [activeStep, setActiveStep] = useState(-1);

  useEffect(() => {
    if (!isRunning) {
      if (isDone) {
        setActiveStep(STEPS.length); // all done
      } else {
        setActiveStep(-1); // reset
      }
      return;
    }

    setActiveStep(0);
    let step = 0;
    const delays = [150, 400, 900, 900, 400, 500]; // ms per step
    let timeout: ReturnType<typeof setTimeout>;

    const advance = () => {
      step++;
      setActiveStep(step);
      if (step < STEPS.length - 1) {
        timeout = setTimeout(advance, delays[step] ?? 500);
      }
    };

    timeout = setTimeout(advance, delays[0]);
    return () => clearTimeout(timeout);
  }, [isRunning, isDone]);

  if (activeStep === -1 && !isRunning && !isDone) return null;

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-4 shadow-xl">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 block">
        Inference Pipeline
      </span>
      <div className="flex flex-col gap-2">
        {STEPS.map((step, idx) => {
          const done = isDone || activeStep > idx;
          const active = isRunning && activeStep === idx;
          return (
            <div key={step.id} className="flex items-center gap-2.5">
              {done ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : active ? (
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-slate-700 shrink-0" />
              )}
              <span
                className={`text-xs transition-colors duration-300 ${
                  done
                    ? "text-emerald-400 font-medium"
                    : active
                    ? "text-indigo-300 font-semibold"
                    : "text-slate-600"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
