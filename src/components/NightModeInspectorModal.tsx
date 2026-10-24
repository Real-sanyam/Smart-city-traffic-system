import React, { useState } from "react";
import {
  X,
  Moon,
  Sun,
  Eye,
  Sliders,
  Sparkles,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Camera,
} from "lucide-react";
import { NightModeSettings } from "../types/reid";

interface NightModeInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  nightSettings: NightModeSettings;
  onUpdateNightSettings: (settings: Partial<NightModeSettings>) => void;
  onRunAiAudit?: (data: any) => void;
  isAiLoading?: boolean;
}

export const NightModeInspectorModal: React.FC<NightModeInspectorModalProps> = ({
  isOpen,
  onClose,
  nightSettings,
  onUpdateNightSettings,
  onRunAiAudit,
  isAiLoading = false,
}) => {
  const [selectedEnhancer, setSelectedEnhancer] = useState<"none" | "retinex_net" | "thermal_ir">(
    nightSettings.enhancer
  );
  const [activeTab, setActiveTab] = useState<"enhancer" | "partAttention" | "benchmarks">("enhancer");

  if (!isOpen) return null;

  const idf1Metrics = {
    daytime: { idf1: 88.6, flowErrorMape: 3.8, snrDb: 34.2 },
    nightRaw: { idf1: 74.2, flowErrorMape: 11.4, snrDb: 11.5 },
    nightRetinex: { idf1: 83.8, flowErrorMape: 5.2, snrDb: 26.5 },
    nightThermalIr: { idf1: 86.1, flowErrorMape: 4.4, snrDb: 38.0 },
  };

  const currentMetrics =
    !nightSettings.isNight
      ? idf1Metrics.daytime
      : selectedEnhancer === "retinex_net"
      ? idf1Metrics.nightRetinex
      : selectedEnhancer === "thermal_ir"
      ? idf1Metrics.nightThermalIr
      : idf1Metrics.nightRaw;

  const partAttentionAreas = [
    {
      name: "Windshield FASTag Region",
      weight: "30%",
      stability: "High (Non-Reflective)",
      description: "Localized inside the cabin; invariant to oncoming headlight glare.",
      score: selectedEnhancer !== "none" ? "92%" : "68%",
    },
    {
      name: "Wheel Rims & Tyre Footprint",
      weight: "25%",
      stability: "Very High (Shadow Protected)",
      description: "Ground plane acoustic and geometric rim circularity under streetlights.",
      score: selectedEnhancer !== "none" ? "88%" : "61%",
    },
    {
      name: "Headlamp/Taillight Color Temperature",
      weight: "25%",
      stability: "Medium (Bloom Prone)",
      description: "Distinguishes 3200K Halogen vs 6000K LED projector signatures.",
      score: selectedEnhancer !== "none" ? "85%" : "54%",
    },
    {
      name: "Roof Silhouette & Luggage Profile",
      weight: "20%",
      stability: "High Against Ambient Sky",
      description: "Contrast boundary against ambient urban sky glow.",
      score: selectedEnhancer !== "none" ? "89%" : "72%",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 select-none backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Night-Time Robustness & Low-Light Enhancement
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                  RetinexNet Edge Pipeline
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Overcoming headlight glare, low SNR, and chromaticity collapse using domain-adversarial invariance and part-level attention
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
        <div className="px-6 py-2.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("enhancer")}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "enhancer"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span>Low-Light Enhancer</span>
            </button>
            <button
              onClick={() => setActiveTab("partAttention")}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "partAttention"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Part-Level Night Attention</span>
            </button>
            <button
              onClick={() => setActiveTab("benchmarks")}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "benchmarks"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>IDF1 Day vs Night Benchmark</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const nextNight = !nightSettings.isNight;
                onUpdateNightSettings({ isNight: nextNight });
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                nightSettings.isNight
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/50"
                  : "bg-amber-500 text-slate-950 shadow-md shadow-amber-900/50"
              }`}
            >
              {nightSettings.isNight ? (
                <>
                  <Moon className="w-3.5 h-3.5" />
                  <span>Night Mode Active</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5" />
                  <span>Day Mode Active</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === "enhancer" && (
            <div className="space-y-6">
              {/* Live Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    IDF1 Tracking Score
                  </span>
                  <div className="text-2xl font-mono font-black text-indigo-400">
                    {currentMetrics.idf1}%
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {nightSettings.isNight ? "+9.6% via RetinexNet" : "Daytime baseline"}
                  </span>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Flow Error (MAPE)
                  </span>
                  <div className="text-2xl font-mono font-black text-emerald-400">
                    {currentMetrics.flowErrorMape}%
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Held-out test footage
                  </span>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Sensor Signal-to-Noise
                  </span>
                  <div className="text-2xl font-mono font-black text-cyan-400">
                    {currentMetrics.snrDb} dB
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Restored optical dynamic range
                  </span>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Domain Adversarial Loss
                  </span>
                  <div className="text-base font-bold text-amber-400 mt-1">
                    DANN Invariant
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    Gradient Reversal Layer
                  </span>
                </div>
              </div>

              {/* Edge Enhancement Mode Selector */}
              <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-xl space-y-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Select Edge Vision Enhancement Pipeline:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => {
                      setSelectedEnhancer("none");
                      onUpdateNightSettings({ enhancer: "none" });
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedEnhancer === "none"
                        ? "bg-slate-800 border-rose-500 text-white ring-1 ring-rose-500"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">1. Raw Low-Light (No Enhancer)</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-950 text-rose-300">
                        IDF1: 74.2%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Standard CCTV feed with noise, motion blur, and glare. Embeddings suffer severe lighting drift.
                    </p>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedEnhancer("retinex_net");
                      onUpdateNightSettings({ enhancer: "retinex_net" });
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedEnhancer === "retinex_net"
                        ? "bg-indigo-950/60 border-indigo-400 text-white ring-1 ring-indigo-400 shadow-lg shadow-indigo-950/50"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-indigo-300">2. RetinexNet / U-Net (Edge)</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-700">
                        IDF1: 83.8%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Decomposes reflectance and illumination on-edge. Restores chromaticity and suppress headlight bloom.
                    </p>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedEnhancer("thermal_ir");
                      onUpdateNightSettings({ enhancer: "thermal_ir" });
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedEnhancer === "thermal_ir"
                        ? "bg-emerald-950/60 border-emerald-400 text-white ring-1 ring-emerald-400 shadow-lg shadow-emerald-950/50"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-emerald-300">3. Thermal / IR Fusion</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                        IDF1: 86.1%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Fuses long-wave infrared thermal radiance (engine/exhaust heat signatures) immune to zero visible light.
                    </p>
                  </button>
                </div>
              </div>

              {/* Side-by-side Visual Viewfinder Simulation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>CAMERA 02 FEED: RAW INPUT</span>
                    <span className="text-rose-400">8 LUX (DARK)</span>
                  </div>
                  <div className="aspect-video bg-black rounded-lg border border-slate-800 flex items-center justify-center relative overflow-hidden">
                    {/* Simulated low light grain & headlight glare */}
                    <div className="absolute inset-0 bg-radial from-slate-800/40 via-black to-black opacity-90" />
                    <div className="relative z-10 text-center space-y-1">
                      <div className="w-16 h-8 border border-slate-700 bg-slate-900/60 rounded flex items-center justify-center text-[10px] text-slate-500 font-mono">
                        SWIFT CROP
                      </div>
                      <span className="text-[10px] text-rose-400 block font-mono">
                        SNR: 11.5 dB (Colors Washed Out)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 border border-indigo-900/60 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-indigo-300 font-bold">
                      {selectedEnhancer === "retinex_net"
                        ? "RETINEXNET RESTORED REFLECTANCE"
                        : selectedEnhancer === "thermal_ir"
                        ? "THERMAL / IR FALSE-COLOR VIEW"
                        : "UNENHANCED"}
                    </span>
                    <span className="text-emerald-400 font-bold">
                      {selectedEnhancer !== "none" ? "OPTIMAL FOR RE-ID" : "DEGRADED"}
                    </span>
                  </div>
                  <div
                    className={`aspect-video rounded-lg border flex items-center justify-center relative overflow-hidden ${
                      selectedEnhancer === "thermal_ir"
                        ? "bg-gradient-to-br from-emerald-950 via-slate-900 to-amber-950 border-emerald-500/50"
                        : selectedEnhancer === "retinex_net"
                        ? "bg-slate-900 border-indigo-500/60"
                        : "bg-black border-slate-800"
                    }`}
                  >
                    <div className="relative z-10 text-center space-y-1">
                      <div className="w-16 h-8 border border-indigo-400 bg-indigo-950/80 rounded flex items-center justify-center text-[10px] text-indigo-300 font-mono font-bold shadow-lg">
                        SWIFT CROP
                      </div>
                      <span className="text-[10px] text-emerald-300 block font-mono font-bold">
                        FASTag & Wheels Isolated (SNR: {currentMetrics.snrDb} dB)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "partAttention" && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                  Part-Level Attention Mechanism for Night Stability
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Global body color is deceptive in the dark due to sodium streetlighting. NetraFlow segments the vehicle bounding box into local attention zones that maintain high discriminability under night conditions.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {partAttentionAreas.map((area) => (
                    <div
                      key={area.name}
                      className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">{area.name}</span>
                        <span className="font-mono text-cyan-400 text-xs font-bold">{area.score} Attention</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>Weight: {area.weight}</span>
                        <span className="text-emerald-400">{area.stability}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                        {area.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "benchmarks" && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Held-Out Benchmark Evaluation (Day vs. Night Scenarios)
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left font-mono">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                        <th className="py-2.5 px-3">Scenario</th>
                        <th className="py-2.5 px-3">Detector & Tracker</th>
                        <th className="py-2.5 px-3">IDF1 Metric</th>
                        <th className="py-2.5 px-3">Flow Error (MAPE)</th>
                        <th className="py-2.5 px-3">Optical SNR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-[11px]">
                      <tr className="hover:bg-slate-900/50">
                        <td className="py-2.5 px-3 font-sans font-bold text-white">Full Daylight (12k Lux)</td>
                        <td className="py-2.5 px-3 text-slate-400">ByteTrack + ResNet50</td>
                        <td className="py-2.5 px-3 text-emerald-400 font-bold">88.6%</td>
                        <td className="py-2.5 px-3 text-slate-300">3.8%</td>
                        <td className="py-2.5 px-3 text-cyan-300">34.2 dB</td>
                      </tr>
                      <tr className="hover:bg-slate-900/50">
                        <td className="py-2.5 px-3 font-sans font-bold text-rose-300">Night Raw (No Enhancer)</td>
                        <td className="py-2.5 px-3 text-slate-400">Standard ByteTrack</td>
                        <td className="py-2.5 px-3 text-rose-400 font-bold">74.2%</td>
                        <td className="py-2.5 px-3 text-rose-400">11.4%</td>
                        <td className="py-2.5 px-3 text-rose-400">11.5 dB</td>
                      </tr>
                      <tr className="hover:bg-slate-900/50 bg-indigo-950/20">
                        <td className="py-2.5 px-3 font-sans font-bold text-indigo-300">Night + RetinexNet Edge</td>
                        <td className="py-2.5 px-3 text-slate-400">OC-SORT + DANN Head</td>
                        <td className="py-2.5 px-3 text-emerald-400 font-bold">83.8% (+9.6%)</td>
                        <td className="py-2.5 px-3 text-emerald-400 font-bold">5.2% (-6.2%)</td>
                        <td className="py-2.5 px-3 text-cyan-300">26.5 dB</td>
                      </tr>
                      <tr className="hover:bg-slate-900/50">
                        <td className="py-2.5 px-3 font-sans font-bold text-emerald-300">Night + Thermal/IR Fusion</td>
                        <td className="py-2.5 px-3 text-slate-400">Dual-Spectral Cross-Attn</td>
                        <td className="py-2.5 px-3 text-emerald-400 font-bold">86.1% (+11.9%)</td>
                        <td className="py-2.5 px-3 text-emerald-400 font-bold">4.4%</td>
                        <td className="py-2.5 px-3 text-cyan-300">38.0 dB</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>RetinexNet operates locally on-edge at 45 FPS without transmitting raw imagery.</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
