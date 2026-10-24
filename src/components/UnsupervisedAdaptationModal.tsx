import React, { useState, useEffect } from "react";
import {
  X,
  Cpu,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  Layers,
  ArrowRight,
  ShieldCheck,
  Camera,
  Activity,
} from "lucide-react";
import { DomainAdaptationState, CameraId } from "../types/reid";
import { runDomainAdaptationStep } from "../lib/reidEngine";

interface UnsupervisedAdaptationModalProps {
  isOpen: boolean;
  onClose: () => void;
  adaptationState: DomainAdaptationState;
  onUpdateAdaptationState: (state: DomainAdaptationState) => void;
}

export const UnsupervisedAdaptationModal: React.FC<UnsupervisedAdaptationModalProps> = ({
  isOpen,
  onClose,
  adaptationState,
  onUpdateAdaptationState,
}) => {
  const [isAutoRunning, setIsAutoRunning] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAutoRunning && adaptationState.epoch < adaptationState.maxEpochs) {
      timer = setTimeout(() => {
        const next = runDomainAdaptationStep(adaptationState);
        onUpdateAdaptationState(next);
        if (next.epoch >= next.maxEpochs) {
          setIsAutoRunning(false);
        }
      }, 700);
    }
    return () => clearTimeout(timer);
  }, [isAutoRunning, adaptationState, onUpdateAdaptationState]);

  if (!isOpen) return null;

  const handleStepOnce = () => {
    const next = runDomainAdaptationStep(adaptationState);
    onUpdateAdaptationState(next);
  };

  const handleReset = () => {
    setIsAutoRunning(false);
    onUpdateAdaptationState({
      newCameraId: "CAM_D",
      cameraName: "Camera 04: HSR Outer Ring Road Link",
      status: "uncalibrated",
      epoch: 0,
      maxEpochs: 12,
      clusterPurity: 0.485,
      pseudoLabelsGenerated: 0,
      reIdAccuracyBefore: 52.1,
      reIdAccuracyCurrent: 52.1,
      isAdapting: false,
    });
  };

  const stages = [
    {
      name: "1. Self-Supervised Pretraining",
      method: "MoCo-v3 Contrastive Learning",
      description: "Extracts camera-specific viewpoint representations from 50k unlabeled frames.",
      active: adaptationState.epoch >= 1 && adaptationState.epoch <= 3,
      completed: adaptationState.epoch > 3,
    },
    {
      name: "2. Domain Adversarial Feature Alignment",
      method: "DANN + Adaptive Batch Normalization",
      description: "Aligns CAM_D feature distributions to CAM_A/B/C shared embedding manifold.",
      active: adaptationState.epoch >= 4 && adaptationState.epoch <= 8,
      completed: adaptationState.epoch > 8,
    },
    {
      name: "3. Spatio-Temporal Pseudo-Labeling",
      method: "Kinematic Corridors + Directional Prior",
      description: "Selects 95%+ confidence transit matches as pseudo-labels to fine-tune the Re-ID head.",
      active: adaptationState.epoch >= 9 && adaptationState.epoch < adaptationState.maxEpochs,
      completed: adaptationState.epoch >= adaptationState.maxEpochs,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 select-none backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Unsupervised Domain Adaptation for New Cameras
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-950 text-violet-300 border border-violet-800">
                  Zero Manual Annotation
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Self-supervised contrastive learning, domain adversarial alignment & kinematic pseudo-labeling for new node {adaptationState.newCameraId}
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Node Summary Card */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-900 border border-violet-800/80 text-violet-400">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  {adaptationState.cameraName}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Commissioning Node • Link Distance: 1.2 km downstream
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAutoRunning(!isAutoRunning)}
                disabled={adaptationState.epoch >= adaptationState.maxEpochs}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer ${
                  isAutoRunning
                    ? "bg-amber-600 hover:bg-amber-500 text-white"
                    : "bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50"
                }`}
              >
                {isAutoRunning ? (
                  <>
                    <Activity className="w-3.5 h-3.5 animate-spin" />
                    <span>Pause Adaptation</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Run Full Pipeline (12 Epochs)</span>
                  </>
                )}
              </button>

              <button
                onClick={handleStepOnce}
                disabled={adaptationState.epoch >= adaptationState.maxEpochs || isAutoRunning}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                Step +1
              </button>

              <button
                onClick={handleReset}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Reset Adaptation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* KPI Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Adaptation Phase
              </span>
              <div className="text-sm font-bold font-mono text-violet-400 capitalize truncate mt-0.5">
                {adaptationState.status.replace("_", " ")}
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
                Epoch {adaptationState.epoch} / {adaptationState.maxEpochs}
              </span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Re-ID Accuracy on CAM_D
              </span>
              <div className="text-2xl font-mono font-black text-emerald-400">
                {adaptationState.reIdAccuracyCurrent}%
              </div>
              <span className="text-[10px] text-emerald-500 block mt-0.5">
                +{(adaptationState.reIdAccuracyCurrent - adaptationState.reIdAccuracyBefore).toFixed(1)}% gain
              </span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Cluster Purity (t-SNE)
              </span>
              <div className="text-2xl font-mono font-black text-cyan-400">
                {(adaptationState.clusterPurity * 100).toFixed(1)}%
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Inter-camera separation
              </span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Pseudo-Labels Mined
              </span>
              <div className="text-2xl font-mono font-black text-amber-400">
                {adaptationState.pseudoLabelsGenerated}
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Plausibility threshold &gt; 95%
              </span>
            </div>
          </div>

          {/* 3-Stage Pipeline Cards */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Automated 3-Stage Adaptation Pipeline:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {stages.map((st, idx) => (
                <div
                  key={st.name}
                  className={`p-4 rounded-xl border transition-all ${
                    st.completed
                      ? "bg-emerald-950/20 border-emerald-500/70 shadow-sm"
                      : st.active
                      ? "bg-violet-950/40 border-violet-400 ring-1 ring-violet-400 shadow-lg shadow-violet-950/50"
                      : "bg-slate-950/60 border-slate-800 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white">{st.name}</span>
                    {st.completed ? (
                      <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" /> DONE
                      </span>
                    ) : st.active ? (
                      <span className="text-violet-300 text-[10px] font-bold flex items-center gap-1 font-mono animate-pulse">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[10px] font-mono">PENDING</span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-cyan-400 mb-1">{st.method}</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{st.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Embedding Space Alignment Visualizer */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-white uppercase tracking-wider">
                Feature Space Alignment (2D PCA / t-SNE Projection)
              </span>
              <span className="font-mono text-cyan-400">
                Purity: {(adaptationState.clusterPurity * 100).toFixed(1)}%
              </span>
            </div>
            <div className="relative aspect-[21/8] bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center">
              {/* Reference cluster (CAM_A/B/C) */}
              <div className="absolute left-[30%] top-[45%] w-24 h-24 rounded-full border-2 border-cyan-500/40 bg-cyan-500/10 flex items-center justify-center">
                <span className="text-[9px] font-mono text-cyan-300 font-bold">CAM_A/B/C CLUSTER</span>
              </div>

              {/* Adapting cluster (CAM_D) shifting toward center */}
              <div
                style={{
                  left: `${65 - (adaptationState.epoch / 12) * 35}%`,
                  top: `${45 + (1 - adaptationState.epoch / 12) * 15}%`,
                  transition: "all 0.5s ease-out",
                }}
                className={`absolute w-24 h-24 rounded-full border-2 flex items-center justify-center ${
                  adaptationState.epoch >= 10
                    ? "border-emerald-400 bg-emerald-500/20 shadow-lg shadow-emerald-500/30"
                    : "border-violet-400 bg-violet-500/20"
                }`}
              >
                <span className="text-[9px] font-mono text-white font-bold text-center">
                  CAM_D EMBEDDINGS
                  <span className="block text-[8px] text-emerald-300">
                    {adaptationState.epoch >= 10 ? "ALIGNED" : "ADAPTING"}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Eliminates expensive manual bounding-box annotations when expanding camera grids.</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors cursor-pointer"
          >
            Close Pipeline
          </button>
        </div>
      </div>
    </div>
  );
};
