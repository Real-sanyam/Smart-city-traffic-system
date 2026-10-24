import React, { useState } from "react";
import {
  X,
  Cpu,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Sliders,
  Activity,
  Maximize2,
  Eye,
  Crosshair,
  FileText,
  Gauge,
  Workflow,
  Radio,
} from "lucide-react";
import {
  VisionModelPipelineConfig,
  DetectorModelId,
  EmbedderModelId,
  SimulatedVehicle,
} from "../types/reid";

interface VisionPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: VisionModelPipelineConfig;
  onChangeConfig: (updated: Partial<VisionModelPipelineConfig>) => void;
  selectedVehicle?: SimulatedVehicle | null;
  vehicles?: SimulatedVehicle[];
}

export const VisionPipelineModal: React.FC<VisionPipelineModalProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  selectedVehicle,
  vehicles = [],
}) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "detector" | "embedder" | "tracker" | "dentDetector"
  >("overview");

  if (!isOpen) return null;

  // Find vehicles that have YOLOv8m-t42 dent defect detections
  const vehiclesWithDents = vehicles.filter(
    (v) => v.dentDefects && v.dentDefects.length > 0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 select-none backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  Vision AI Model Matrix &amp; Pipeline Architecture
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  REAL-TIME ITS PIPELINE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ultralytics YOLO26s/27/26n Detector • OSNet x1.0 (512-d) • ByteTrack • DINOv2-small (384-d) Fallback • YOLOv8m-t42 Dent Detector
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 gap-2 pt-2">
          {[
            { id: "overview", label: "Pipeline Stack Overview", icon: Workflow },
            { id: "detector", label: "Primary Detector (YOLO26s/27/26n)", icon: Crosshair },
            { id: "embedder", label: "Re-ID Embedders (OSNet + DINOv2)", icon: Layers },
            { id: "tracker", label: "Tracker (ByteTrack)", icon: Activity },
            { id: "dentDetector", label: "YOLOv8m-t42 Dent Detector (NUST)", icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 text-xs font-semibold rounded-t-lg flex items-center gap-1.5 transition-all cursor-pointer border-b-2 ${
                  isActive
                    ? "border-cyan-400 text-cyan-300 bg-slate-900/90"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              {/* Architecture Flow Chart Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {/* Stage 1: Detector */}
                <div className="bg-slate-950/90 p-3.5 rounded-xl border border-cyan-800/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
                      1. DETECTOR
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {config.isCpuLowPowerMode ? "CPU Low-Power" : "GPU TensorRT"}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white">
                    {config.activeDetector === "yolo26s"
                      ? "Ultralytics YOLO26s"
                      : config.activeDetector === "yolo27"
                      ? "Ultralytics YOLO27"
                      : "YOLO26n (CPU Mode)"}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    File: <span className="text-cyan-300">{config.detectorWeights}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    Multi-class vehicle bounding box &amp; confidence estimation in dense Indian mixed traffic.
                  </div>
                </div>

                {/* Stage 2: Tracker */}
                <div className="bg-slate-950/90 p-3.5 rounded-xl border border-indigo-800/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase">
                      2. TRACKER
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                      Built-in
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white">ByteTrack (Ultralytics)</div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Thresholds: <span className="text-indigo-300">0.60 / 0.10</span>
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    Two-stage matching keeps occluded vehicles tracked without identity swaps across frames.
                  </div>
                </div>

                {/* Stage 3: Primary Embedder */}
                <div className="bg-slate-950/90 p-3.5 rounded-xl border border-purple-800/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-purple-400 uppercase">
                      3. RE-ID EMBEDDER
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                      Primary
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white">OSNet x1.0 (TorchReID)</div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Vector: <span className="text-purple-300">512-dimensional</span>
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    Omni-scale feature streams capture fine wheel patterns and vehicle contour biometrics.
                  </div>
                </div>

                {/* Stage 4: Fallback Embedder */}
                <div className="bg-slate-950/90 p-3.5 rounded-xl border border-amber-800/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">
                      4. FALLBACK EMBEDDER
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                      {config.forceFallbackEmbedder ? "ACTIVE" : "STANDBY"}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white">DINOv2-small (Meta)</div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Model: <span className="text-amber-300">dinov2_vits14 (384-d)</span>
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    Self-supervised Vision Transformer patch tokens resolve extreme occlusions and lighting shifts.
                  </div>
                </div>

                {/* Stage 5: Dent Detector */}
                <div className="bg-slate-950/90 p-3.5 rounded-xl border border-emerald-800/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase">
                      5. DEFECT BIOMETRIC
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      NUST Benchmark
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white">YOLOv8m-t42</div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Precision: <span className="text-emerald-300">0.86</span> • Recall: <span className="text-emerald-300">0.84</span>
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    Real-time dent detection &amp; insurance vehicle fingerprinting breaks identical coating ties.
                  </div>
                </div>
              </div>

              {/* Live Status and Interactive Toggles */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    Live Vision Pipeline Runtime Controls:
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Target FPS: {config.targetFps} • Active Weights: {config.detectorWeights}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  {/* Toggle CPU Mode */}
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">CPU Low-Power Mode</div>
                      <div className="text-[10px] text-slate-400">Switches detector to yolo26n.pt</div>
                    </div>
                    <button
                      onClick={() => {
                        const next = !config.isCpuLowPowerMode;
                        onChangeConfig({
                          isCpuLowPowerMode: next,
                          activeDetector: next ? "yolo26n" : config.primaryDetector,
                          detectorWeights: next ? "yolo26n.pt" : `${config.primaryDetector}.pt`,
                          targetFps: next ? 28 : 60,
                        });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        config.isCpuLowPowerMode
                          ? "bg-amber-500 text-slate-950 shadow-md"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {config.isCpuLowPowerMode ? "CPU ACTIVE (28 FPS)" : "GPU NORMAL (60 FPS)"}
                    </button>
                  </div>

                  {/* Toggle DINOv2 Fallback */}
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">DINOv2 Fallback Embedder</div>
                      <div className="text-[10px] text-slate-400">Force 384-dim Meta ViT</div>
                    </div>
                    <button
                      onClick={() =>
                        onChangeConfig({
                          forceFallbackEmbedder: !config.forceFallbackEmbedder,
                        })
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        config.forceFallbackEmbedder
                          ? "bg-purple-600 text-white shadow-md"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {config.forceFallbackEmbedder ? "FORCED (384-D)" : "AUTO ON DIVERGENCE"}
                    </button>
                  </div>

                  {/* YOLOv8m-t42 Dent Weight */}
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-center">
                    <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                      <span>YOLOv8m-t42 Dent Biometric Weight:</span>
                      <span className="font-mono text-emerald-400">
                        {(config.dentDisambiguationWeight * 100).toFixed(0)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.40"
                      step="0.05"
                      value={config.dentDisambiguationWeight}
                      onChange={(e) =>
                        onChangeConfig({
                          dentDisambiguationWeight: parseFloat(e.target.value),
                        })
                      }
                      className="accent-emerald-400 w-full h-1.5 bg-slate-800 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Real-World Mixed Traffic Benchmark Stats */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-cyan-400" />
                  Corridor Benchmark Telemetry:
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
                  <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">YOLO26s Latency</div>
                    <div className="text-cyan-300 font-bold text-sm">3.8 ms</div>
                    <div className="text-[9px] text-slate-500">TensorRT FP16 / 640x640</div>
                  </div>
                  <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">OSNet x1.0 Dims</div>
                    <div className="text-purple-300 font-bold text-sm">512-D L2 Norm</div>
                    <div className="text-[9px] text-slate-500">Omni-Scale Multi-Branch</div>
                  </div>
                  <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">ByteTrack ID Switches</div>
                    <div className="text-emerald-400 font-bold text-sm">0.12 / 1000 frames</div>
                    <div className="text-[9px] text-slate-500">2-Stage Kalman Prediction</div>
                  </div>
                  <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">YOLOv8m-t42 Precision</div>
                    <div className="text-emerald-300 font-bold text-sm">0.86 P • 0.84 R</div>
                    <div className="text-[9px] text-slate-500">Real-time Dent Localization</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DETECTOR DETAILS */}
          {activeTab === "detector" && (
            <div className="space-y-4">
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-cyan-400" />
                  Ultralytics YOLO26s / YOLO27 Object Detection Engine
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The primary detector executes inference on raw 1080p CCTV frames at 30–60 FPS. It is trained on mixed-traffic datasets incorporating two-wheelers, auto-rickshaws, commercial trucks, and hatchbacks.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  {/* Option A: YOLO26s */}
                  <div
                    onClick={() =>
                      onChangeConfig({
                        primaryDetector: "yolo26s",
                        activeDetector: "yolo26s",
                        isCpuLowPowerMode: false,
                        detectorWeights: "yolo26s.pt",
                        targetFps: 60,
                      })
                    }
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      config.activeDetector === "yolo26s" && !config.isCpuLowPowerMode
                        ? "bg-cyan-950/70 border-cyan-400 shadow-md ring-1 ring-cyan-400"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">YOLO26s</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-900/60 text-cyan-300">
                        Default GPU
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-cyan-400 mb-1">yolo26s.pt (9.4M params)</div>
                    <div className="text-[11px] text-slate-400 leading-normal">
                      Optimal speed/accuracy equilibrium. 3.8ms latency per frame. Handles rapid occlusions.
                    </div>
                  </div>

                  {/* Option B: YOLO27 */}
                  <div
                    onClick={() =>
                      onChangeConfig({
                        primaryDetector: "yolo27",
                        activeDetector: "yolo27",
                        isCpuLowPowerMode: false,
                        detectorWeights: "yolo27.pt",
                        targetFps: 48,
                      })
                    }
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      config.activeDetector === "yolo27" && !config.isCpuLowPowerMode
                        ? "bg-cyan-950/70 border-cyan-400 shadow-md ring-1 ring-cyan-400"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">YOLO27</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-300">
                        Ultra Accuracy
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-purple-400 mb-1">yolo27.pt (18.2M params)</div>
                    <div className="text-[11px] text-slate-400 leading-normal">
                      Next-Gen Transformer-CNN hybrid backbone. Enhanced precision on distant or partially occluded two-wheelers.
                    </div>
                  </div>

                  {/* Option C: YOLO26n CPU Mode */}
                  <div
                    onClick={() =>
                      onChangeConfig({
                        activeDetector: "yolo26n",
                        isCpuLowPowerMode: true,
                        detectorWeights: "yolo26n.pt",
                        targetFps: 28,
                      })
                    }
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      config.activeDetector === "yolo26n" || config.isCpuLowPowerMode
                        ? "bg-amber-950/70 border-amber-400 shadow-md ring-1 ring-amber-400"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">YOLO26n (CPU Mode)</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-900/60 text-amber-300">
                        Low-Power
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-amber-400 mb-1">yolo26n.pt (3.1M params)</div>
                    <div className="text-[11px] text-slate-400 leading-normal">
                      Ultra-lightweight edge profile. Runs directly on CPU / ONNX without discrete GPU acceleration.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RE-ID EMBEDDERS */}
          {activeTab === "embedder" && (
            <div className="space-y-4">
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-purple-400" />
                      Primary Embedder: OSNet x1.0 (TorchReID)
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Model weights: <span className="text-purple-300 font-mono">osnet_v1</span> • Feature dimension: <span className="text-purple-300 font-mono">512</span>
                    </p>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                    Primary Metric Extractor
                  </span>
                </div>

                <div className="text-xs text-slate-300 leading-relaxed bg-slate-900/70 p-3 rounded-lg border border-slate-800">
                  OSNet (Omni-Scale Network) employs parallel depthwise convolutional streams with receptive field sizes ranging from 3×3 to 9×9. This allows simultaneous representation of micro-cues (e.g., wheel hub caps, sticker shapes) and macro silhouettes (cabin contours, rooflines).
                </div>

                {/* Fallback Embedder: DINOv2-small */}
                <div className="border-t border-slate-800 pt-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        Fallback Embedder: DINOv2-small (Meta)
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Architecture: <span className="text-amber-300 font-mono">dinov2_vits14</span> • Dimension: <span className="text-amber-300 font-mono">384-d patch tokens</span>
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        onChangeConfig({
                          forceFallbackEmbedder: !config.forceFallbackEmbedder,
                        })
                      }
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        config.forceFallbackEmbedder
                          ? "bg-amber-500 text-slate-950"
                          : "bg-slate-800 text-slate-300 hover:text-white"
                      }`}
                    >
                      {config.forceFallbackEmbedder ? "Fallback Forced ON" : "Fallback Standby"}
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/70 p-3 rounded-lg border border-slate-800">
                    When candidate vehicles yield ambiguous cosine distance (&gt; 0.85 similarity between identical Maruti Swifts), or when lighting diverges across cameras, DINOv2-small ViT patch self-attention activates to extract semantic invariant patch tokens.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TRACKER (BYTETRACK) */}
          {activeTab === "tracker" && (
            <div className="space-y-4">
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-indigo-400" />
                      Ultralytics Built-in ByteTrack Engine
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Two-stage spatial association with Kalman filter trajectory estimation
                    </p>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                    Active on all cameras
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-900/70 p-3.5 rounded-xl border border-indigo-900/40 space-y-1.5">
                    <div className="font-bold text-indigo-300 flex items-center justify-between">
                      <span>Stage 1: High-Confidence Detections</span>
                      <span className="font-mono text-cyan-300">τ_high ≥ 0.60</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Matches unoccluded vehicle bounding boxes to existing tracklets via Hungarian IoU matching.
                    </p>
                  </div>

                  <div className="bg-slate-900/70 p-3.5 rounded-xl border border-indigo-900/40 space-y-1.5">
                    <div className="font-bold text-amber-300 flex items-center justify-between">
                      <span>Stage 2: Low-Confidence Salvage</span>
                      <span className="font-mono text-amber-400">τ_low ≥ 0.10</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Recovers heavily occluded vehicles (e.g. scooter shadowed by a transit bus) without re-assigning tracklet IDs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DENT & DEFECT DETECTOR (YOLOv8m-t42 NUST) */}
          {activeTab === "dentDetector" && (
            <div className="space-y-4">
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        YOLOv8m-t42 (NUST) Real-Time Dent &amp; Damage Detector
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        Precision 0.86 • Recall 0.84
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Real-time dent detection, panel deformations, scratches for physical vehicle fingerprinting &amp; insurance audit
                    </p>
                  </div>
                </div>

                <div className="text-xs text-slate-300 leading-relaxed bg-slate-900/70 p-3 rounded-lg border border-slate-800">
                  <strong>Why Dent Detection is Critical:</strong> When two vehicles share the exact same make, model, year, and paint (such as two Arctic White Maruti Swifts), standard visual Re-ID models produce identical embeddings. YOLOv8m-t42 (NUST) detects localized panel deformities (e.g., front fender dent, rear bumper crease) and converts their normalized coordinates into an unforgeable physical biometric fingerprint.
                </div>

                {/* Live Dents Detected in Fleet */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Live Vehicles in Fleet with YOLOv8m-t42 Defect Detections:</span>
                    <span className="font-mono text-emerald-400">{vehiclesWithDents.length} Vehicles</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {vehiclesWithDents.slice(0, 4).map((veh) => {
                      const dent = veh.dentDefects[0];
                      return (
                        <div
                          key={veh.id}
                          className="bg-slate-900/80 p-2.5 rounded-xl border border-emerald-900/40 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-cyan-300 font-bold">
                              [{veh.globalId}]
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                              YOLOv8m-t42: {Math.round(dent.confidence * 100)}%
                            </span>
                          </div>
                          <div className="font-bold text-white capitalize">
                            {veh.colorName} {veh.type.replace("_", " ")}
                          </div>
                          <div className="text-[11px] text-slate-300 flex items-center justify-between">
                            <span>Defect: <strong className="text-emerald-300">{dent.label}</strong></span>
                            <span className="text-slate-500 font-mono">Sev: {dent.severity}</span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                            <span>Hash: {dent.fingerprintHash}</span>
                            <span>Audit: {dent.insuranceAuditCode}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Primary: YOLO26s (yolo26s.pt)</span>
            <span>•</span>
            <span>Embedder: OSNet x1.0 (512-d)</span>
            <span>•</span>
            <span>Tracker: ByteTrack</span>
            <span>•</span>
            <span className="text-emerald-400">Dent: YOLOv8m-t42 (0.86 P / 0.84 R)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Apply &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
