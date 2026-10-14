import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Film, AlertTriangle } from "lucide-react";

// Register ChartJS plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface VideoFrame {
  frame_index: number;
  timestamp: number;
  trust_score: number;
  detection_mode: string;
}

interface VideoTimelineProps {
  frames: VideoFrame[];
}

export default function VideoTimeline({ frames }: VideoTimelineProps) {
  // Sort frames by index to ensure chronological order
  const sortedFrames = [...frames].sort((a, b) => a.frame_index - b.frame_index);

  const labels = sortedFrames.map((f) => `${f.timestamp}s`);
  const scores = sortedFrames.map((f) => f.trust_score);

  // Mark data colors dynamically: red if suspicious, else violet
  const pointColors = sortedFrames.map((f) =>
    f.trust_score < 40 ? "#ef4444" : f.trust_score < 80 ? "#f97316" : "#8b5cf6"
  );
  
  const pointRadius = sortedFrames.map((f) => (f.trust_score < 50 ? 6 : 4));

  const data: ChartData<"line"> = {
    labels,
    datasets: [
      {
        label: "Authentic Confidence Score (%)",
        data: scores,
        borderColor: "rgb(139, 92, 246)",
        backgroundColor: "rgba(139, 92, 246, 0.1)",
        borderWidth: 2,
        tension: 0.35,
        fill: true,
        pointBackgroundColor: pointColors,
        pointBorderColor: "#1e1b4b",
        pointBorderWidth: 1.5,
        pointRadius: pointRadius,
        pointHoverRadius: 8,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        titleColor: "#f8fafc",
        bodyColor: "#cbd5e1",
        borderColor: "rgba(139, 92, 246, 0.4)",
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          afterBody: (context) => {
            const index = context[0].dataIndex;
            const item = sortedFrames[index];
            return `Mode: ${item.detection_mode === "face_crop" ? "Face Routing" : "Full Scene"}\nFrame: #${item.frame_index}`;
          },
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: {
          color: "rgba(51, 65, 85, 0.3)",
        },
        ticks: {
          color: "rgb(148, 163, 184)",
          font: {
            size: 10,
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "rgb(148, 163, 184)",
          font: {
            size: 9,
          },
        },
      },
    },
  };

  const manipulatedCount = sortedFrames.filter((f) => f.trust_score < 50).length;

  return (
    <div className="flex flex-col p-6 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl w-full">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-indigo-400" />
          <h3 className="text-white text-base font-semibold">Temporal Face & Pattern Timeline</h3>
        </div>
        
        {manipulatedCount > 0 ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-950/60 border border-red-500/30 rounded-lg text-red-400 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{manipulatedCount} manipulated sequences detected</span>
          </div>
        ) : (
          <span className="text-xs px-2.5 py-1 bg-emerald-950/60 border border-emerald-500/30 rounded-lg text-emerald-400 font-semibold">
            All sequences healthy
          </span>
        )}
      </div>

      <div className="relative h-64 w-full">
        <Line data={data} options={options} />
      </div>
      
      <div className="flex items-center justify-between mt-3 text-[10px] text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 block"></span>
            Synthetic / Fake Frame (&lt;50%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 block"></span>
            Suspicious (40% - 80%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-600 block"></span>
            Authentic (&gt;80%)
          </span>
        </div>
        <span>Temporal Resolution: 1 frame / 15 steps</span>
      </div>
    </div>
  );
}
