import React, { useEffect, useState } from "react";

interface TrustScoreGaugeProps {
  score: number; // 0 to 100
}

export default function TrustScoreGauge({ score }: TrustScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    // Animate score count-up
    const duration = 1000; // 1s
    const steps = 60;
    const stepTime = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      // Ease out quad
      const easedProgress = progress * (2 - progress);
      const val = easedProgress * score;
      
      setAnimatedScore(Math.min(score, Math.round(val)));

      if (currentStep >= steps) {
        clearInterval(timer);
        setAnimatedScore(score);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [score]);

  // Determine colors and verdict labels
  let colorClass = "stroke-emerald-500 text-emerald-400";
  let bgStrokeClass = "stroke-emerald-950";
  let label = "Authentic";
  let desc = "The media is clean and matches organic profiles.";

  if (score < 40) {
    colorClass = "stroke-red-500 text-red-400";
    bgStrokeClass = "stroke-red-950";
    label = "Synthetic / Fake";
    desc = "AI generation or deep manipulation detected.";
  } else if (score < 80) {
    colorClass = "stroke-orange-500 text-orange-400";
    bgStrokeClass = "stroke-orange-950";
    label = "Suspicious";
    desc = "Anomalies detected; potential local manipulations.";
  }

  // Circle dimensions
  const radius = 80;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl w-full max-w-sm">
      <h3 className="text-slate-400 text-sm font-semibold tracking-wide uppercase mb-4">
        Trust Score Verdict
      </h3>
      
      <div className="relative flex items-center justify-center w-52 h-52">
        {/* SVG Circle Track */}
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle track */}
          <circle
            cx="104"
            cy="104"
            r={radius}
            strokeWidth={strokeWidth}
            className={`fill-none ${bgStrokeClass} transition-colors duration-500`}
          />
          {/* Progress circle */}
          <circle
            cx="104"
            cy="104"
            r={radius}
            strokeWidth={strokeWidth}
            className={`fill-none ${colorClass} transition-all duration-300`}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Inner Label values */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-5xl font-extrabold tracking-tight text-white mb-1">
            {animatedScore}%
          </span>
          <span className="text-xs font-medium text-slate-400 antialiased">
            CONFIDENCE
          </span>
        </div>
      </div>

      <div className="mt-5 text-center">
        <span className={`text-lg font-bold ${colorClass} block transition-colors duration-500`}>
          {label}
        </span>
        <p className="text-xs text-slate-400 mt-1 max-w-[240px] leading-relaxed mx-auto">
          {desc}
        </p>
      </div>
    </div>
  );
}
