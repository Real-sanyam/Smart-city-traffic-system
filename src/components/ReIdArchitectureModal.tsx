import React, { useState } from "react";
import { X, BookOpen, Layers, Network, Clock, ShieldCheck, Sparkles, Send, CheckCircle2 } from "lucide-react";

interface ReIdArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReIdArchitectureModal: React.FC<ReIdArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedStep, setSelectedStep] = useState<number>(3);
  const [question, setQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);

  if (!isOpen) return null;

  const steps = [
    {
      num: 1,
      title: "Single-Camera Detection & Tracking",
      subtitle: "Ultralytics YOLO26s / YOLO27 + ByteTrack (CPU: YOLO26n)",
      summary:
        "High-throughput object detection and multi-object tracking keeping persistent tracklets across dense Indian mixed-traffic occlusions.",
      details: [
        "Primary Detector: Ultralytics YOLO26s (yolo26s.pt, 60 FPS, 3.8ms latency on TensorRT) and Next-Gen YOLO27 (yolo27.pt) for ultra-dense mixed traffic.",
        "Edge / Low-Power CPU Mode: Ultralytics YOLO26n (yolo26n.pt, 28 FPS on CPU) for solar-powered or CPU edge nodes.",
        "Tracker: ByteTrack (Ultralytics built-in) with two-stage Kalman association (τ_high ≥ 0.60, τ_low ≥ 0.10) to recover partially occluded two-wheelers and autos without identity switches.",
      ],
    },
    {
      num: 2,
      title: "Re-ID Appearance Embeddings & Fallback",
      subtitle: "OSNet x1.0 (512-dim) + DINOv2-small Fallback (384-dim)",
      summary:
        "Extracts dense metric embedding vectors invariant to camera angles, viewpoint differences, and illumination shifts.",
      details: [
        "Primary Feature Embedder: OSNet x1.0 (osnet_v1, 512-dim, TorchReID) utilizing parallel multi-scale convolutional streams to capture fine structural cues (wheels, roof racks, grill geometry).",
        "Fallback Embedder: DINOv2-small (dinov2_vits14, 384-dim, Meta) self-supervised Vision Transformer dynamically triggered when OSNet visual ambiguity exceeds 0.85 or severe illumination divergence occurs.",
        "Trained with Circle Loss & Triplet Loss with hard negative mining to separate identical vehicle models.",
      ],
    },
    {
      num: 3,
      title: "Physical Biometrics & Defect Disambiguation",
      subtitle: "YOLOv8m-t42 (NUST) Dents + Windshield Grid + Road Tyre Pressure",
      summary:
        "When appearance embeddings alone produce false-match ambiguities (e.g. two identical Arctic White Maruti Swifts), physical vehicle biometrics break the tie without reading number plates.",
      details: [
        "YOLOv8m-t42 (NUST) Real-Time Dent & Damage Detection: High-precision model (Precision: 0.86, Recall: 0.84) detecting body panel dents, scratches, and creases. Generates localized damage coordinates for forensic insurance audits and unforgeable vehicle fingerprinting.",
        "Windshield Fine-Grid Coordinate Analysis: Divides windshield into a 10×10 coordinate grid. Compares exact FASTag placement coordinates (u, v) and physical millimeter offsets (dx, dy mm from rearview mirror) to exploit human sticker application variance.",
        "Dynamic Tyre Pressure Profiling: Captures 4-wheel tyre pressure readings [FL, FR, RL, RR] in PSI at road sensor strips. Computes wheel-to-wheel differential balance and RMSE against thermal friction tolerances (±0.4 PSI).",
        "Spatio-Temporal Plausibility & Route Filtering: Evaluates transit duration Δt against Gaussian density P(Δt | distance, congestion), automatically eliminating candidates requiring physically impossible velocities (> 85 km/h).",
      ],
    },
    {
      num: 4,
      title: "Cross-Camera Global Graph Matching",
      subtitle: "Hungarian Algorithm & Min-Cost Max-Flow",
      summary:
        "Solves the multi-camera association problem as a bipartite matching graph to prevent double-counting.",
      details: [
        "Constructs cost matrix C_ij = -log(P(Match_ij)) between vehicles detected at Camera A and Camera B.",
        "Applies Kuhn-Munkres Hungarian Algorithm to compute the globally optimal 1-to-1 matching across camera pairs.",
        "Handles unobserved exits and entry ramps via dummy slack nodes in minimum cost network flow.",
      ],
    },
    {
      num: 5,
      title: "Traffic Flow & Origin-Destination Matrix",
      subtitle: "Municipal Planning & Corridor Intelligence",
      summary:
        "Aggregates validated cross-camera trips into Origin-Destination (OD) matrices to plan transit routes and roads.",
      details: [
        "Replaces expensive, biased manual roadside survey clipboards with automated 24/7 continuous flow data.",
        "Calculates dynamic OD matrices (Vehicles/hour from Junction A to Junction C).",
        "Identifies bottleneck bottlenecks, average corridor travel times, and modal split breakdowns.",
      ],
    },
  ];

  const handleAskQuickQuestion = async () => {
    if (!question.trim()) return;
    setIsAsking(true);
    setAiAnswer(null);
    try {
      const res = await fetch("/api/reid/fast-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepName: steps[selectedStep - 1].title,
          technicalQuestion: question,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiAnswer(data.text);
      } else {
        setAiAnswer("Could not fetch answer: " + (data.error || "Unknown error"));
      }
    } catch (e: any) {
      setAiAnswer("Network error: " + e.message);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 select-none">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Multi-Camera Vehicle Re-Identification Architecture
              </h2>
              <p className="text-xs text-slate-400">
                End-to-End System Blueprint: Detecting, Tracking, and Matching Vehicles Without Reading Number Plates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Step Navigator Bar */}
          <div className="grid grid-cols-5 gap-2">
            {steps.map((s) => (
              <button
                key={s.num}
                onClick={() => {
                  setSelectedStep(s.num);
                  setAiAnswer(null);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedStep === s.num
                    ? "bg-cyan-950/80 border-cyan-500 text-white shadow-md ring-1 ring-cyan-500"
                    : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-0.5">
                  Step {s.num}
                </div>
                <div className="text-xs font-semibold truncate">{s.title}</div>
              </button>
            ))}
          </div>

          {/* Active Step Detailed Card */}
          {(() => {
            const step = steps[selectedStep - 1];
            return (
              <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      Pipeline Phase {step.num} of 5
                    </span>
                    <h3 className="text-base font-bold text-white mt-1.5">{step.title}</h3>
                    <div className="text-xs text-cyan-400 font-mono">{step.subtitle}</div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                  {step.summary}
                </p>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Engineering Deep-Dive & Methodological Details:
                  </h4>
                  <ul className="space-y-2">
                    {step.details.map((d, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })()}

          {/* Fast Gemini Explainer Interaction */}
          <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-300">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span>Ask Gemini 3.1 Flash-Lite about this pipeline step:</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAskQuickQuestion()}
                placeholder={`e.g. Why is ByteTrack preferred over DeepSORT in dense Indian mixed traffic?`}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                onClick={handleAskQuickQuestion}
                disabled={isAsking || !question.trim()}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isAsking ? "Thinking..." : "Explain"}</span>
              </button>
            </div>

            {aiAnswer && (
              <div className="mt-3 p-3 bg-slate-900/90 border border-cyan-800/60 rounded-xl text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                {aiAnswer}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Complies with municipal privacy regulations and zero-license-plate camera standards.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
