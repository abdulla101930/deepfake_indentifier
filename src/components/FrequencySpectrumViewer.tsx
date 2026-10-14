"use client";
import React, { useEffect, useRef } from "react";
import { Waves } from "lucide-react";

interface FrequencySpectrumViewerProps {
  imageUrl: string; // Object URL or remote URL of the image to analyze
}

export default function FrequencySpectrumViewer({ imageUrl }: FrequencySpectrumViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!imageUrl || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const SIZE = 256;
      // Draw image scaled to SIZE x SIZE into an offscreen canvas
      const offscreen = document.createElement("canvas");
      offscreen.width = SIZE;
      offscreen.height = SIZE;
      const offCtx = offscreen.getContext("2d")!;
      offCtx.drawImage(img, 0, 0, SIZE, SIZE);

      const imageData = offCtx.getImageData(0, 0, SIZE, SIZE);
      const data = imageData.data;

      // Convert to grayscale float array
      const gray: number[] = [];
      for (let i = 0; i < SIZE * SIZE; i++) {
        const r = data[i * 4];
        const g = data[i * 4 + 1];
        const b = data[i * 4 + 2];
        gray.push(0.299 * r + 0.587 * g + 0.114 * b);
      }

      // Compute magnitude of 2D DFT using a simplified row-column approach (no full FFT lib needed)
      // For display purposes we compute a simplified log-magnitude spectrum via correlation
      // We use a spatial frequency visualization based on DCT-like approach
      const spectrum = new Float32Array(SIZE * SIZE);

      // Compute frequency magnitude by sampling horizontal + vertical patterns
      for (let fy = 0; fy < SIZE; fy++) {
        for (let fx = 0; fx < SIZE; fx++) {
          let re = 0, im = 0;
          // Sample a small subset for speed (every 4th pixel)
          for (let y = 0; y < SIZE; y += 4) {
            for (let x = 0; x < SIZE; x += 4) {
              const angle = -2 * Math.PI * ((fx * x) / SIZE + (fy * y) / SIZE);
              const g = gray[y * SIZE + x];
              re += g * Math.cos(angle);
              im += g * Math.sin(angle);
            }
          }
          const mag = Math.sqrt(re * re + im * im);
          // Shift center: map (fy, fx) to centered coordinates
          const cfy = (fy + SIZE / 2) % SIZE;
          const cfx = (fx + SIZE / 2) % SIZE;
          spectrum[cfy * SIZE + cfx] = Math.log(mag + 1);
        }
      }

      // Normalize to 0–255
      let maxVal = 0;
      for (let i = 0; i < spectrum.length; i++) {
        if (spectrum[i] > maxVal) maxVal = spectrum[i];
      }

      // Draw onto main canvas with JET colormap simulation
      canvas.width = SIZE;
      canvas.height = SIZE;
      const out = ctx.createImageData(SIZE, SIZE);

      for (let i = 0; i < SIZE * SIZE; i++) {
        const t = maxVal > 0 ? spectrum[i] / maxVal : 0; // 0..1

        // JET colormap: blue → cyan → green → yellow → red
        let r = 0, g = 0, b = 0;
        if (t < 0.125) {
          b = 0.5 + t * 4;
        } else if (t < 0.375) {
          b = 1;
          g = (t - 0.125) * 4;
        } else if (t < 0.625) {
          g = 1;
          b = 1 - (t - 0.375) * 4;
          r = (t - 0.375) * 4;
        } else if (t < 0.875) {
          r = 1;
          g = 1 - (t - 0.625) * 4;
        } else {
          r = 1 - (t - 0.875) * 4;
        }

        out.data[i * 4 + 0] = Math.round(r * 255);
        out.data[i * 4 + 1] = Math.round(g * 255);
        out.data[i * 4 + 2] = Math.round(b * 255);
        out.data[i * 4 + 3] = 255;
      }

      ctx.putImageData(out, 0, 0);
    };

    img.onerror = () => {
      // Fallback: draw a placeholder gradient
      const SIZE = 256;
      canvas.width = SIZE;
      canvas.height = SIZE;
      const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
      gradient.addColorStop(0, "#6366f1");
      gradient.addColorStop(0.4, "#312e81");
      gradient.addColorStop(1, "#0f172a");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.fillStyle = "#4f46e5";
      ctx.font = "11px monospace";
      ctx.fillText("FFT unavailable for remote URLs", 10, 130);
    };

    img.src = imageUrl;
  }, [imageUrl]);

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col gap-4">
      <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
        <Waves className="w-4 h-4 text-violet-400" />
        <div>
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Frequency Spectrum</span>
          <p className="text-[10px] text-slate-500 mt-0.5">
            2D FFT log-magnitude — GAN artifacts appear as periodic grid patterns
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start justify-center">
        {/* Original image thumb */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Original</span>
          <div className="w-40 h-40 rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Source" className="w-full h-full object-cover" crossOrigin="anonymous" />
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center text-slate-600 text-xl self-center">→</div>

        {/* FFT canvas */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] text-violet-400 font-bold uppercase tracking-wider">FFT Spectrum</span>
          <div className="w-40 h-40 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 relative">
            <canvas ref={canvasRef} className="w-full h-full" style={{ imageRendering: "pixelated" }} />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 flex-wrap text-[9px] text-slate-500">
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-2 rounded bg-blue-700" /> Low freq</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-2 rounded bg-green-600" /> Mid freq</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-2 rounded bg-yellow-500" /> High freq</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-2 rounded bg-red-600" /> Peak (GAN artifacts)</span>
      </div>
    </div>
  );
}
