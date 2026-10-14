"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  Cpu,
  Binary,
  RefreshCw,
  Image as ImageIcon,
  Film,
  Zap,
  ScanLine,
  FlaskConical,
} from "lucide-react";

import Dropzone from "@/components/Dropzone";
import TrustScoreGauge from "@/components/TrustScoreGauge";
import HeatmapViewer from "@/components/HeatmapViewer";
import VideoTimeline from "@/components/VideoTimeline";
import SystemStatusPanel from "@/components/SystemStatusPanel";
import SignalBreakdownPanel from "@/components/SignalBreakdownPanel";
import ScanHistoryLog, { ScanRecord } from "@/components/ScanHistoryLog";
import FrequencySpectrumViewer from "@/components/FrequencySpectrumViewer";
import PipelineProgress from "@/components/PipelineProgress";

// ─── Type Definitions ────────────────────────────────────────────────────────

interface SampleItem {
  id: string;
  name: string;
  description: string;
  category: string;
  filename: string;
  url: string;
}

interface ImageResult {
  trust_score: number;
  is_fake: boolean;
  detection_mode: string;
  confidence_score: number;
  heatmap: string;
}

interface VideoFrame {
  frame_index: number;
  timestamp: number;
  trust_score: number;
  detection_mode: string;
}

interface VideoResult {
  overall_trust_score: number;
  is_fake: boolean;
  total_sampled_frames: number;
  frames: VideoFrame[];
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const backendHost = "http://localhost:8000";

  // Global states
  const [samples, setSamples] = useState<SampleItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Result states
  const [imageResults, setImageResults] = useState<ImageResult | null>(null);
  const [videoResults, setVideoResults] = useState<VideoResult | null>(null);
  const [evaluationType, setEvaluationType] = useState<"image" | "video" | null>(null);

  // Scan history
  const [scanHistory, setScanHistory] = useState<ScanRecord[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);

  // Fetch samples on mount
  useEffect(() => {
    async function fetchSamples() {
      try {
        const res = await fetch(`${backendHost}/api/v1/samples`);
        if (res.ok) setSamples(await res.json());
      } catch (err) {
        console.warn("Could not fetch samples:", err);
      }
    }
    fetchSamples();
  }, []);

  // ─── Upload progress simulator ──────────────────────────────────────────────
  const simulateProgress = useCallback((callback: () => Promise<void>) => {
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) { clearInterval(interval); return 90; }
        return prev + 10;
      });
    }, 150);
    return callback().finally(() => {
      clearInterval(interval);
      setUploadProgress(100);
    });
  }, []);

  // ─── Add a scan record to history ──────────────────────────────────────────
  const addToHistory = useCallback((filename: string, result: ImageResult, previewUrl: string) => {
    const record: ScanRecord = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      filename,
      isFake: result.is_fake,
      trustScore: result.trust_score,
      confidenceScore: result.confidence_score,
      detectionMode: result.detection_mode,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      previewUrl,
      heatmap: result.heatmap,
    };
    setScanHistory((prev) => [record, ...prev]);
    setActiveHistoryId(record.id);
  }, []);

  // ─── Handle uploaded file ───────────────────────────────────────────────────
  const handleFileSelected = async (file: File) => {
    setSelectedFile(file);
    setErrorText(null);
    setImageResults(null);
    setVideoResults(null);

    const objectUrl = URL.createObjectURL(file);
    setMediaPreviewUrl(objectUrl);

    const isVideo =
      file.type.startsWith("video/") ||
      ["mp4", "mov"].includes(file.name.split(".").pop()?.toLowerCase() || "");
    setEvaluationType(isVideo ? "video" : "image");
    setIsUploading(true);

    const uploadAction = async () => {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const endpoint = isVideo
          ? `${backendHost}/api/v1/detect/video`
          : `${backendHost}/api/v1/detect/image`;
        const res = await fetch(endpoint, { method: "POST", body: formData });
        if (!res.ok) throw new Error(`Inference returned status ${res.status}`);
        const data = await res.json();
        if (isVideo) {
          setVideoResults(data);
        } else {
          setImageResults(data);
          addToHistory(file.name, data, objectUrl);
        }
      } catch (err: any) {
        setErrorText(err.message || "Failed to connect to backend on port 8000.");
      } finally {
        setIsUploading(false);
      }
    };

    await simulateProgress(uploadAction);
  };

  // ─── Handle preset sample ───────────────────────────────────────────────────
  const handleSampleSelected = async (sample: SampleItem) => {
    setErrorText(null);
    setImageResults(null);
    setVideoResults(null);
    setSelectedFile(null);
    setEvaluationType("image");
    const sampleUrl = `${backendHost}${sample.url}`;
    setMediaPreviewUrl(sampleUrl);
    setIsUploading(true);

    const fetchSampleAction = async () => {
      try {
        const res = await fetch(`${backendHost}/api/v1/detect/image?sample_id=${sample.id}`, {
          method: "POST",
        });
        if (!res.ok) throw new Error(`Sample processing failed: ${res.status}`);
        const data = await res.json();
        setImageResults(data);
        addToHistory(sample.name, data, sampleUrl);
      } catch (err: any) {
        setErrorText("Server failed to process sample. Make sure backend is live.");
      } finally {
        setIsUploading(false);
      }
    };

    await simulateProgress(fetchSampleAction);
  };

  // ─── Handle selecting past scan from history ────────────────────────────────
  const handleSelectHistoryRecord = (record: ScanRecord) => {
    setActiveHistoryId(record.id);
    setSelectedFile(null);
    setEvaluationType("image");
    setMediaPreviewUrl(record.previewUrl);
    setImageResults({
      trust_score: record.trustScore,
      is_fake: record.isFake,
      detection_mode: record.detectionMode,
      confidence_score: record.confidenceScore,
      heatmap: record.heatmap,
    });
  };

  // ─── Reset ──────────────────────────────────────────────────────────────────
  const resetState = () => {
    setSelectedFile(null);
    setMediaPreviewUrl(null);
    setImageResults(null);
    setVideoResults(null);
    setEvaluationType(null);
    setUploadProgress(0);
    setErrorText(null);
    setActiveHistoryId(null);
  };

  const hasResults = !!(imageResults || videoResults);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#020617] text-slate-100 font-sans relative overflow-x-hidden pb-20 selection:bg-indigo-600 selection:text-white">

      {/* Background glow blobs */}
      <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-indigo-950/25 via-slate-950/0 to-transparent -z-10 pointer-events-none" />
      <div className="absolute top-20 left-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
      <div className="absolute top-80 right-10 w-[450px] h-[450px] bg-purple-500/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-violet-500/4 rounded-full blur-[100px] -z-10 pointer-events-none" />

      {/* ── Navigation ── */}
      <nav className="border-b border-slate-900 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-lg shadow-indigo-500/20">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-wide flex items-center gap-1.5 antialiased">
                Aegis{" "}
                <span className="text-[10px] px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-indigo-400 font-mono rounded font-medium">
                  V1.0
                </span>
              </span>
              <p className="text-[9px] text-slate-500 font-medium tracking-tight">
                UNIVERSAL SYNTHETIC CONTENT DETECTOR
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-xl">
              <ScanLine className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[10px] text-slate-400 font-medium font-mono">
                {scanHistory.length} scan{scanHistory.length !== 1 ? "s" : ""} this session
              </span>
            </div>
            <span className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer hidden sm:inline">
              Docs
            </span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs px-3.5 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-200 transition-all cursor-pointer font-medium"
            >
              GitHub
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero strip ── */}
      <div className="max-w-[1400px] mx-auto px-6 pt-10 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-3.5 h-3.5 fill-indigo-400 text-indigo-400" />
          <span className="text-xs text-indigo-400 font-bold tracking-widest uppercase">
            Dual-Stream Machine Learning Engine
          </span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white leading-none">
          Deepfake & AI Content{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
            Forensics Dashboard
          </span>
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed mt-2 max-w-2xl">
          Powered by a Vision Transformer (ViT) spatial stream and an FFT frequency-domain convolutional
          network. Upload any image to receive a trust verdict, explainability heatmap, and signal breakdown.
        </p>
      </div>

      {/* ── 3-column grid ── */}
      <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ── LEFT SIDEBAR (col 3) ── */}
        <div className="lg:col-span-3 flex flex-col gap-5">
          <SystemStatusPanel backendHost={backendHost} />

          {/* Upload card */}
          <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 p-4 shadow-2xl">
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Upload Target</span>
            </div>
            <Dropzone
              onFileSelected={handleFileSelected}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
            />

            {mediaPreviewUrl && (
              <div className="mt-3 flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                <div className="flex items-center gap-2 truncate mr-2">
                  {evaluationType === "video" ? (
                    <Film className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                  )}
                  <span className="text-[10px] font-medium text-slate-400 truncate">
                    {selectedFile ? selectedFile.name : "Demo Asset"}
                  </span>
                </div>
                <button
                  onClick={resetState}
                  disabled={isUploading}
                  className="shrink-0 px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[10px] text-slate-400 hover:text-white transition-colors"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Pipeline progress */}
          <PipelineProgress isRunning={isUploading} isDone={hasResults} />

          {/* Scan history */}
          <ScanHistoryLog
            records={scanHistory}
            activeId={activeHistoryId}
            onSelectRecord={handleSelectHistoryRecord}
          />
        </div>

        {/* ── CENTER / MAIN PANEL (col 6) ── */}
        <div className="lg:col-span-6 flex flex-col gap-5">

          {/* Preset samples */}
          {samples.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Quick Test Samples
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {samples.map((sample) => (
                  <div
                    key={sample.id}
                    onClick={() => !isUploading && handleSampleSelected(sample)}
                    className={`flex flex-col p-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-indigo-700 rounded-xl transition-all cursor-pointer group shadow-md hover:scale-[1.02] ${
                      isUploading ? "opacity-40 pointer-events-none" : ""
                    }`}
                  >
                    <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider mb-1 block">
                      {sample.category}
                    </span>
                    <span className="text-white text-xs font-semibold group-hover:text-indigo-300 transition-colors block leading-snug">
                      {sample.name}
                    </span>
                    <p className="text-[9px] text-slate-500 mt-1 leading-snug line-clamp-2">
                      {sample.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error state */}
          {errorText && (
            <div className="bg-rose-950/30 border border-rose-500/20 text-rose-400 p-5 rounded-2xl">
              <span className="text-sm font-bold block mb-1">Evaluation Interrupted</span>
              <p className="text-xs leading-relaxed">{errorText}</p>
            </div>
          )}

          {/* Empty state */}
          {!mediaPreviewUrl && !errorText && (
            <div className="flex flex-col items-center justify-center h-[400px] rounded-2xl border border-slate-800/60 bg-slate-950/20 text-center p-6 border-dashed">
              <Binary className="w-14 h-14 text-slate-800 animate-pulse mb-4" />
              <h3 className="text-slate-400 font-semibold text-sm">Awaiting Content Upload</h3>
              <p className="text-xs text-slate-600 mt-2 max-w-[260px] leading-relaxed">
                Drop an image or video in the left panel, or click a preset sample, to run the dual-stream inference pipeline.
              </p>
            </div>
          )}

          {/* ── Image Results ── */}
          {imageResults && mediaPreviewUrl && evaluationType === "image" && (
            <div className="flex flex-col gap-5">
              {/* Gauge + Heatmap row */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
                <div className="md:col-span-5 flex flex-col items-center">
                  <TrustScoreGauge score={imageResults.trust_score} />
                </div>
                <div className="md:col-span-7">
                  <HeatmapViewer
                    originalUrl={mediaPreviewUrl}
                    heatmapUrl={imageResults.heatmap}
                  />
                </div>
              </div>

              {/* Frequency Spectrum */}
              <FrequencySpectrumViewer imageUrl={mediaPreviewUrl} />
            </div>
          )}

          {/* ── Video Results ── */}
          {videoResults && mediaPreviewUrl && evaluationType === "video" && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
                <div className="md:col-span-5 flex flex-col items-center justify-center">
                  <TrustScoreGauge score={videoResults.overall_trust_score} />
                </div>
                <div className="md:col-span-7 flex flex-col justify-between bg-slate-900/60 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-xl">
                  <h4 className="text-indigo-400 text-xs font-bold tracking-wider uppercase mb-3 flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5" />
                    Temporal Video Evaluation Report
                  </h4>
                  <div className="flex flex-col gap-2.5">
                    {[
                      ["Sample Step Rate", "1 frame / 15 steps"],
                      ["Total Sampled Frames", `${videoResults.total_sampled_frames} frames`],
                      ["Decision Mode", "Dynamic Face Crop & Scene Router"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs pb-1.5 border-b border-slate-800/60">
                        <span className="text-slate-400">{k}:</span>
                        <span className="text-slate-200 font-semibold">{v}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-[10px] text-slate-400 leading-relaxed">
                    <strong>Evaluation Notes:</strong> Sampled sequences analyzed for spatial inconsistencies.
                    Overall trust represents chronological average.
                  </p>
                </div>
              </div>
              <VideoTimeline frames={videoResults.frames} />
            </div>
          )}
        </div>

        {/* ── RIGHT SIDEBAR (col 3) ── */}
        <div className="lg:col-span-3 flex flex-col gap-5">
          {imageResults && (
            <SignalBreakdownPanel
              trustScore={imageResults.trust_score}
              confidenceScore={imageResults.confidence_score}
              detectionMode={imageResults.detection_mode}
              isFake={imageResults.is_fake}
            />
          )}

          {/* How it works explainer */}
          <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800 p-4 shadow-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 block">
              How It Works
            </span>
            <div className="flex flex-col gap-3 text-[11px] text-slate-500 leading-relaxed">
              <div>
                <span className="text-slate-300 font-semibold block mb-0.5">🧠 Spatial Stream (ViT)</span>
                Vision Transformer splits image into 16×16 patches and uses self-attention to identify
                unnatural texture, alignment, or face-region anomalies.
              </div>
              <div>
                <span className="text-slate-300 font-semibold block mb-0.5">📡 Frequency Stream (FFT)</span>
                2D Fast Fourier Transform extracts the log-magnitude spectrum. GAN & diffusion models
                leave characteristic periodic grid artifacts invisible to the naked eye.
              </div>
              <div>
                <span className="text-slate-300 font-semibold block mb-0.5">🔥 XAI Heatmap</span>
                Grad-CAM on the final ViT block, fused with a Laplacian edge map, highlights the
                exact pixels driving the fake prediction.
              </div>
              <div>
                <span className="text-slate-300 font-semibold block mb-0.5">📊 Trust Score</span>
                P(Real) × 100. Below 50% → classified as Synthetic/Fake.
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
