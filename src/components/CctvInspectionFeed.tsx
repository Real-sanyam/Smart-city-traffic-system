import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Activity,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  ArrowRight,
  ShieldCheck,
  Flame,
  Gauge,
  Zap,
  Layers,
  Compass,
  LineChart,
  TrendingDown,
  TrendingUp,
  Info,
} from "lucide-react";
import {
  ReIdMatchResult,
  SimulatedVehicle,
  VisionModelPipelineConfig,
} from "../types/reid";
import { Cpu, Crosshair, Wrench } from "lucide-react";

interface CctvInspectionFeedProps {
  activeCameraId: "CAM_A" | "CAM_B" | "CAM_C" | "CAM_D" | "overview" | "chase";
  selectedVehicle: SimulatedVehicle | null;
  recentMatches: ReIdMatchResult[];
  onSelectVehicle: (id: string) => void;
  avgCorridorSpeedKmh?: number;
  congestionAlertThreshold?: number;
  congestionSpeedFactor?: number;
  onMitigateCongestion?: () => void;
  onChangeSpeedFactor?: (val: number) => void;
  isNightMode?: boolean;
  enhancerMode?: "none" | "retinex_net" | "thermal_ir";
  offlineCameraId?: string | null;
  visionConfig?: VisionModelPipelineConfig;
  onOpenVisionModels?: () => void;
  onToggleCpuMode?: () => void;
}

export interface TrackletConfidencePoint {
  id: string;
  timeSeconds: number;
  score: number; // 0.0 to 1.0
  cameraLabel?: string;
  cueReason?: string;
}

// Procedural soft tech chime using Web Audio API (Zero external mp3 dependencies)
function playProceduralReIdChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {}
}

// Procedural urgent low-frequency warning tone for high-congestion alert threshold breach
function playProceduralCongestionTone() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.28);

    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {}
}

export const CctvInspectionFeed: React.FC<CctvInspectionFeedProps> = ({
  activeCameraId,
  selectedVehicle,
  recentMatches,
  onSelectVehicle,
  avgCorridorSpeedKmh = 28.4,
  congestionAlertThreshold = 10.0,
  congestionSpeedFactor = 1.0,
  onMitigateCongestion,
  onChangeSpeedFactor,
  isNightMode = false,
  enhancerMode = "retinex_net",
  offlineCameraId = null,
  visionConfig,
  onOpenVisionModels,
  onToggleCpuMode,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Active real-time notification state for high-confidence matches
  const [activeNotification, setActiveNotification] = useState<ReIdMatchResult | null>(null);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const lastProcessedMatchId = useRef<string | null>(null);
  const notificationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // High Congestion Alert State (< 10 km/h)
  const isCongested = avgCorridorSpeedKmh < congestionAlertThreshold;
  const [dismissedCongestionAlert, setDismissedCongestionAlert] = useState(false);
  const prevCongestedRef = useRef(false);

  // Tracklet Continuous Confidence History for the Sparkline Graph
  const trackletHistoryMap = useRef<Map<string, TrackletConfidencePoint[]>>(new Map());
  const [currentSparklineData, setCurrentSparklineData] = useState<TrackletConfidencePoint[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<TrackletConfidencePoint | null>(null);

  // Sound and banner trigger when speed drops below 10 km/h threshold
  useEffect(() => {
    if (isCongested && !prevCongestedRef.current) {
      setDismissedCongestionAlert(false);
      if (soundEnabled) {
        playProceduralCongestionTone();
      }
    } else if (!isCongested && prevCongestedRef.current) {
      setDismissedCongestionAlert(false);
    }
    prevCongestedRef.current = isCongested;
  }, [isCongested, soundEnabled]);

  const cameraTitles: Record<string, string> = {
    CAM_A: "CAM 01: Silk Board North Entry",
    CAM_B: "CAM 02: Koramangala 100ft Flyover",
    CAM_C: "CAM 03: HSR Layout Sector 1 Gate",
    CAM_D: "CAM 04: HSR Outer Ring Road Link",
    overview: "3D Spatial Corridor Overview",
    chase: "Vehicle Dynamic Chase Cam",
  };

  // Monitor incoming matches for high-confidence confirmations (combinedScore >= 0.78)
  useEffect(() => {
    if (recentMatches.length === 0) return;
    const latest = recentMatches[0];
    if (!latest) return;

    // High-Confidence Confirmation Alert (combinedScore >= 0.78)
    if (
      latest.id !== lastProcessedMatchId.current &&
      latest.decision === "TRUE_MATCH" &&
      latest.combinedScore >= 0.78
    ) {
      lastProcessedMatchId.current = latest.id;
      setActiveNotification(latest);
      setNotificationVisible(true);

      if (soundEnabled) {
        playProceduralReIdChime();
      }

      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
      notificationTimerRef.current = setTimeout(() => {
        setNotificationVisible(false);
      }, 5200);
    }
  }, [recentMatches, soundEnabled]);

  // Synchronize Sparkline confidence history for the currently selected vehicle
  useEffect(() => {
    if (!selectedVehicle) return;

    const vehicleKey = selectedVehicle.id;
    let existing = trackletHistoryMap.current.get(vehicleKey);

    if (!existing || existing.length === 0) {
      // Build an initial 10-point continuous tracklet trajectory leading to current position
      const basePoints: TrackletConfidencePoint[] = [];
      const now = Math.round(Date.now() / 1000);

      for (let i = 9; i >= 0; i--) {
        const t = now - i * 3;
        const score = 0.88 + Math.sin(i * 0.9) * 0.05 + (i % 2 === 0 ? 0.015 : -0.015);
        let camLabel: string | undefined = undefined;

        if (i === 9) camLabel = "CAM 01";
        if (i === 5) camLabel = "CAM 02";

        basePoints.push({
          id: `pt_${vehicleKey}_${t}_${i}`,
          timeSeconds: t,
          score: parseFloat(Math.max(0.65, Math.min(0.98, score)).toFixed(3)),
          cameraLabel: camLabel,
          cueReason: "Continuous spatial correlation",
        });
      }

      existing = basePoints;
      trackletHistoryMap.current.set(vehicleKey, existing);
    }

    setCurrentSparklineData([...existing]);

    // Interval to append real-time tracking points as vehicle traverses corridor
    const interval = setInterval(() => {
      setCurrentSparklineData((prev) => {
        const last = prev[prev.length - 1];
        const t = Math.round(Date.now() / 1000);
        const prevScore = last ? last.score : 0.88;
        const target = 0.89;
        let nextScore = prevScore + (target - prevScore) * 0.25 + (Math.random() - 0.5) * 0.035;
        nextScore = Math.max(0.65, Math.min(0.98, nextScore));

        const newPoint: TrackletConfidencePoint = {
          id: `pt_${vehicleKey}_${t}`,
          timeSeconds: t,
          score: parseFloat(nextScore.toFixed(3)),
          cueReason: "Continuous correlation",
        };

        const updated = [...prev.slice(-19), newPoint];
        trackletHistoryMap.current.set(vehicleKey, updated);
        return updated;
      });
    }, 2400);

    return () => clearInterval(interval);
  }, [selectedVehicle?.id]);

  // If a real match event arrives for the selected vehicle, log exact match score into sparkline
  useEffect(() => {
    if (!selectedVehicle || recentMatches.length === 0) return;
    const latest = recentMatches[0];
    if (
      latest &&
      (latest.candidateVehicleId === selectedVehicle.id ||
        latest.queryVehicleId === selectedVehicle.id ||
        latest.candidateVehicleId === selectedVehicle.globalId)
    ) {
      setCurrentSparklineData((prev) => {
        const point: TrackletConfidencePoint = {
          id: `match_${latest.id}`,
          timeSeconds: Math.round(Date.now() / 1000),
          score: latest.combinedScore,
          cameraLabel: latest.targetCamera,
          cueReason: latest.decision === "TRUE_MATCH" ? "Confirmed Match" : "Active Tracklet",
        };
        const updated = [...prev.slice(-19), point];
        trackletHistoryMap.current.set(selectedVehicle.id, updated);
        return updated;
      });
    }
  }, [recentMatches, selectedVehicle]);

  const dismissNotification = () => {
    setNotificationVisible(false);
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
    }
  };


  // Compute Sparkline Metrics for the selected vehicle
  const latestSparklinePoint =
    currentSparklineData.length > 0
      ? currentSparklineData[currentSparklineData.length - 1]
      : null;

  const minConfidence =
    currentSparklineData.length > 0
      ? Math.min(...currentSparklineData.map((p) => p.score))
      : 0.88;

  const maxConfidence =
    currentSparklineData.length > 0
      ? Math.max(...currentSparklineData.map((p) => p.score))
      : 0.88;

  const avgConfidence =
    currentSparklineData.length > 0
      ? currentSparklineData.reduce((s, p) => s + p.score, 0) / currentSparklineData.length
      : 0.88;

  const initialScore =
    currentSparklineData.length > 0 ? currentSparklineData[0].score : 0.88;

  const deltaScore = latestSparklinePoint ? latestSparklinePoint.score - initialScore : 0;

  return (
    <div
      style={{
        position: "fixed",
        top: "70px",
        right: "16px",
        width: "348px",
        maxWidth: "calc(100vw - 32px)",
        zIndex: 35,
      }}
      className="flex flex-col gap-2.5 select-none"
    >


      {/* 2. High-Congestion Visual Alert Banner (Triggered when avg corridor speed < 10 km/h) */}
      {isCongested && !dismissedCongestionAlert && (
        <div
          style={{
            boxShadow:
              "0 0 28px rgba(239, 68, 68, 0.65), 0 0 10px rgba(245, 158, 11, 0.4)",
          }}
          className="bg-slate-950/95 border-2 border-rose-500 rounded-2xl p-3.5 text-slate-100 shadow-2xl relative overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-top-2"
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-25 animate-pulse"
            style={{
              background:
                "radial-gradient(circle at 50% 25%, #ef4444 0%, #f59e0b 50%, transparent 75%)",
            }}
          />

          <div className="flex items-center justify-between mb-2 relative z-10">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/50 animate-bounce">
                <Flame className="w-4 h-4" />
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-black uppercase tracking-wider text-rose-300 bg-rose-950/90 px-1.5 py-0.5 rounded border border-rose-800">
                    BOTTLENECK WARNING
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono font-bold animate-pulse">
                    ● ACTIVE
                  </span>
                </div>
                <span className="text-xs font-bold text-white block leading-tight mt-0.5">
                  Critical Corridor Congestion
                </span>
              </div>
            </div>

            <button
              onClick={() => setDismissedCongestionAlert(true)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Dismiss warning card"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-slate-900/90 border border-rose-900/50 p-2.5 rounded-xl relative z-10 mb-2.5 space-y-2">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">
                  Corridor Avg Speed
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-mono font-black text-rose-400 animate-pulse">
                    {avgCorridorSpeedKmh.toFixed(1)}
                  </span>
                  <span className="text-xs font-mono text-rose-300 font-semibold">km/h</span>
                  <span className="text-[9px] font-mono text-rose-300 bg-rose-950/80 px-1 py-0.5 rounded border border-rose-800">
                    &lt; {congestionAlertThreshold.toFixed(0)} km/h
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">
                  Alert Threshold
                </span>
                <div className="text-xs font-mono font-bold text-amber-400">
                  {congestionAlertThreshold.toFixed(1)} km/h
                </div>
                <span className="text-[9px] text-rose-400 font-medium">Gridlock Risk</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden p-0.5 border border-slate-800 relative">
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10 shadow-[0_0_4px_#f59e0b]"
                  style={{ left: "20%" }}
                  title="Alert Threshold (10 km/h)"
                />
                <div
                  className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500"
                  style={{
                    width: `${Math.min(100, Math.max(6, (avgCorridorSpeedKmh / 50) * 100))}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-slate-400">
                <span className="text-rose-400 font-bold">Stalled (0)</span>
                <span className="text-amber-400 font-semibold">Threshold (10 km/h)</span>
                <span>Normal (50)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 relative z-10">
            <button
              onClick={() => {
                if (onMitigateCongestion) {
                  onMitigateCongestion();
                } else if (onChangeSpeedFactor) {
                  onChangeSpeedFactor(1.2);
                }
              }}
              className="flex-1 py-1.5 px-2 bg-gradient-to-r from-rose-600 hover:from-rose-500 to-amber-600 hover:to-amber-500 text-white text-xs font-bold rounded-lg shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-200" />
              <span>Mitigate / Boost Pace (1.2x)</span>
            </button>

            {onChangeSpeedFactor && (
              <button
                onClick={() => onChangeSpeedFactor(0.15)}
                className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono rounded-lg transition-colors cursor-pointer"
                title="Simulate severe crawl (< 10 km/h)"
              >
                Crawl
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Real-Time High-Confidence Match Notification Alert with Visual Pulse */}
      {notificationVisible && activeNotification && (
        <div
          style={{
            boxShadow: "0 0 24px rgba(16, 185, 129, 0.45)",
          }}
          className="bg-slate-950/95 border-2 border-emerald-400/90 rounded-2xl p-3.5 text-slate-100 shadow-2xl relative overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-top-2"
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              background: "radial-gradient(circle at 50% 50%, #10b981 0%, transparent 70%)",
            }}
          />

          <div className="flex items-center justify-between mb-2 relative z-10">
            <div className="flex items-center gap-1.5">
              <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block leading-tight">
                  Cross-Camera Re-ID Match
                </span>
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  Confidence: {(activeNotification.combinedScore * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            <button
              onClick={dismissNotification}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 text-xs bg-slate-900/90 border border-emerald-900/40 p-2.5 rounded-xl relative z-10 mb-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Route Link:</span>
              <span className="text-cyan-300 font-bold flex items-center gap-1">
                {activeNotification.sourceCamera} <ArrowRight className="w-3 h-3 text-emerald-400" /> {activeNotification.targetCamera}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Transit Travel Time:</span>
              <span className="font-mono text-emerald-400 font-semibold">
                {activeNotification.transitDeltaSeconds}s ({activeNotification.impliedSpeedKmh} km/h)
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Windshield FASTag Grid:</span>
              <span className="font-mono text-cyan-300 font-semibold">
                {(activeNotification.fastagScore * 100).toFixed(0)}% (Δgrid={activeNotification.fastagGridDiff?.gridSteps ?? 0})
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Tyre Pressure Profiler:</span>
              <span className="font-mono text-emerald-300 font-semibold">
                {(activeNotification.tyrePressureScore * 100).toFixed(0)}% (RMSE={activeNotification.tyrePressureRmse} PSI)
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Non-Plate Visual Re-ID
            </span>
            <button
              onClick={() => {
                onSelectVehicle(activeNotification.candidateVehicleId);
                dismissNotification();
              }}
              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg shadow transition-colors cursor-pointer"
            >
              Inspect Vehicle
            </button>
          </div>
        </div>
      )}

      {/* 4. Active Camera Feed Simulator Card */}
      <div
        className={`bg-slate-950/90 border rounded-2xl shadow-xl overflow-hidden text-slate-200 transition-colors duration-300 ${
          isCongested
            ? "border-rose-500/80 shadow-[0_0_20px_rgba(239,68,68,0.25)]"
            : "border-slate-800"
        }`}
      >
        {/* Header */}
        <div className="px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isCongested ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
            <span className="text-xs font-bold text-white truncate max-w-[150px]">
              {cameraTitles[activeCameraId] || "CCTV Feed"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-1 rounded transition-colors ${
                soundEnabled ? "text-cyan-400 bg-slate-800" : "text-slate-500 hover:text-slate-300"
              }`}
              title={soundEnabled ? "Mute Re-ID & alert audio chimes" : "Enable audio alerts"}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isMinimized ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {!isMinimized && (
          <div className="p-3 space-y-3">
            {/* Simulated Camera Viewfinder */}
            <div
              className={`relative aspect-video bg-slate-900 rounded-xl overflow-hidden border flex items-center justify-center transition-colors duration-300 ${
                isCongested ? "border-rose-500/70" : "border-slate-800"
              }`}
            >
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage:
                    "linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />

              {/* Camera Status HUD */}
              <div className="absolute top-2 left-2 text-[10px] font-mono text-cyan-400 bg-slate-950/80 px-2 py-0.5 rounded border border-cyan-800/60 flex items-center gap-1">
                <Camera className="w-3 h-3" />
                <span>
                  {offlineCameraId === activeCameraId ? "OFFLINE • IMPUTING" : "REC • 30 FPS • 1080p"}
                </span>
              </div>

              {/* Night Mode & Enhancer Indicator */}
              {isNightMode && (
                <div className="absolute bottom-2 right-2 text-[10px] font-mono font-bold text-amber-300 bg-slate-950/90 px-2 py-0.5 rounded border border-amber-500/60 flex items-center gap-1">
                  <span>
                    {enhancerMode === "thermal_ir"
                      ? "IR THERMAL FUSION"
                      : enhancerMode === "retinex_net"
                      ? "RETINEX-NET ENHANCE"
                      : "LOW LIGHT RAW"}
                  </span>
                </div>
              )}

              {/* Outage Banner in Viewfinder */}
              {offlineCameraId === activeCameraId && (
                <div className="absolute inset-0 bg-rose-950/40 backdrop-blur-[1px] flex flex-col items-center justify-center p-3 z-10 text-center pointer-events-none">
                  <div className="px-2 py-0.5 rounded bg-rose-600 text-white font-mono text-[10px] font-black uppercase tracking-wider mb-1">
                    CAMERA FEED OFFLINE
                  </div>
                  <div className="text-xs text-rose-200 font-bold">
                    Bayesian Travel-Time Flow Imputation Active
                  </div>
                </div>
              )}

              <div className="absolute bottom-2 left-2 text-[10px] font-mono text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1.5">
                <span>LPR: DISABLED (NON-PLATE)</span>
                <span className="text-slate-600">•</span>
                <span className="text-cyan-400 font-bold">
                  {visionConfig?.isCpuLowPowerMode
                    ? "YOLO26n (CPU)"
                    : visionConfig?.activeDetector === "yolo27"
                    ? "YOLO27"
                    : "YOLO26s"}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-purple-300">
                  {visionConfig?.forceFallbackEmbedder ? "DINOv2 (384d)" : "OSNet (512d)"}
                </span>
              </div>

              {/* Selected Vehicle Crop Overlay with Real-Time Dynamic Tracklet Status */}
              {selectedVehicle ? (
                <div className="p-3 text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    <span className="inline-block px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 text-xs font-mono font-bold">
                      [ByteTrack #{selectedVehicle.globalId.replace(/\D/g, "") || "42"}]
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                      {visionConfig?.detectorWeights || "yolo26s.pt"}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white capitalize">
                    {selectedVehicle.colorName} {selectedVehicle.type.replace("_", " ")}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Lane: {selectedVehicle.currentLane === -1 ? "Fast" : selectedVehicle.currentLane === 0 ? "Middle" : "Service"} • Spd: {(selectedVehicle.velocity * 3.6).toFixed(0)} km/h
                  </div>

                  {/* YOLOv8m-t42 Real-time Dent Defect Detection Visual Flag */}
                  {selectedVehicle.dentDefects && selectedVehicle.dentDefects.length > 0 && (
                    <div className="mt-1 px-2 py-0.5 rounded bg-amber-950/90 border border-amber-500/80 text-[10px] text-amber-300 font-mono flex items-center justify-center gap-1 animate-pulse">
                      <Wrench className="w-3 h-3 text-amber-400" />
                      <span>
                        YOLOv8m-t42 (NUST): {selectedVehicle.dentDefects[0].label} ({Math.round(selectedVehicle.dentDefects[0].confidence * 100)}% • P:0.86, R:0.84)
                      </span>
                    </div>
                  )}

                  {/* Real-Time Dynamic Tracklet Status linked to live Sparkline */}
                  <div className="pt-1 flex items-center justify-center gap-1 text-[10px] font-mono">
                    <span className="text-slate-400">Tracklet Status:</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      Locked ({latestSparklinePoint ? (latestSparklinePoint.score * 100).toFixed(0) : 88}%)
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center p-3 text-slate-500 text-xs flex flex-col items-center gap-1">
                  <Activity className="w-5 h-5 text-slate-600" />
                  <span>Click any vehicle in 3D scene to inspect visual embedding</span>
                </div>
              )}
            </div>

            {/* Selected Vehicle Visual Signature & Sparkline Breakdown */}
            {selectedVehicle && (
              <div className="space-y-2 text-xs bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                {/* ------------------------------------------------------------- */}
                {/* SPARKLINE GRAPH: Continuous Tracklet Confidence Over Time    */}
                {/* ------------------------------------------------------------- */}
                <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800 relative overflow-hidden space-y-2">
                  {/* Sparkline Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/80">
                        <LineChart className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                            Confidence Sparkline
                          </span>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border bg-emerald-950/80 text-emerald-400 border-emerald-800">
                            STABLE
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-400 block font-mono">
                          Continuous Tracklet Association Over Time
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* SVG Sparkline Canvas */}
                  <div
                    className="relative w-full h-[76px] bg-slate-950 rounded-lg border border-slate-900/90 overflow-hidden"
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    {/* SVG Render */}
                    <svg
                      viewBox="0 0 290 76"
                      className="w-full h-full overflow-visible"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        {/* Area Gradient */}
                        <linearGradient id="trackletConfGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#0284c7" stopOpacity="0.05" />
                        </linearGradient>

                        <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                          <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>

                      {/* 1. Grid Guidelines */}
                      {/* Top (1.00) guideline */}
                      <line x1="28" y1="8" x2="280" y2="8" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.4" />
                      <text x="24" y="11" textAnchor="end" fill="#64748b" fontSize="6.5" fontFamily="monospace">1.0</text>

                      {/* Mid (0.80) guideline */}
                      <line x1="28" y1="18.8" x2="280" y2="18.8" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.3" />
                      <text x="24" y="21" textAnchor="end" fill="#64748b" fontSize="6.5" fontFamily="monospace">0.8</text>

                      {/* Mid (0.60) guideline */}
                      <line x1="28" y1="29.6" x2="280" y2="29.6" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.25" />
                      <text x="24" y="32" textAnchor="end" fill="#64748b" fontSize="6.5" fontFamily="monospace">0.6</text>

                      {/* Bottom (0.00) guideline */}
                      <line x1="28" y1="62" x2="280" y2="62" stroke="#334155" strokeWidth="0.5" opacity="0.5" />
                      <text x="24" y="64" textAnchor="end" fill="#64748b" fontSize="6.5" fontFamily="monospace">0.0</text>

                      {/* 2. Sparkline Data Path */}
                      {currentSparklineData.length >= 2 && (() => {
                        const pts = currentSparklineData.map((pt, idx) => {
                          const x = 28 + (idx / Math.max(1, currentSparklineData.length - 1)) * 252;
                          // Score mapped between y=8 (score=1.0) and y=62 (score=0.0)
                          const y = 8 + (1.0 - Math.max(0, Math.min(1.0, pt.score))) * 54;
                          return { x, y, pt };
                        });

                        const pathD = pts.reduce(
                          (acc, p, i) => (i === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`),
                          ""
                        );
                        const areaD = `${pathD} L ${pts[pts.length - 1].x},62 L ${pts[0].x},62 Z`;

                        const latest = pts[pts.length - 1];

                        return (
                          <>
                            {/* Area Fill */}
                            <path d={areaD} fill="url(#trackletConfGrad)" />

                            {/* Polyline / Curve */}
                            <path
                              d={pathD}
                              fill="none"
                              stroke="#22d3ee"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              filter="url(#neonGlow)"
                            />

                            {/* Milestone points for camera sightings */}
                            {pts.map((p, i) => {
                              const isCheck = !!p.pt.cameraLabel;

                              return isCheck ? (
                                <g key={`pt_${p.pt.id}_${i}`}>
                                  <circle
                                    cx={p.x}
                                    cy={p.y}
                                    r="3"
                                    fill="#38bdf8"
                                    stroke="#0f172a"
                                    strokeWidth="1"
                                  />
                                  <text
                                    x={p.x}
                                    y={Math.max(6, p.y - 4)}
                                    textAnchor="middle"
                                    fill="#38bdf8"
                                    fontSize="6"
                                    fontWeight="bold"
                                    fontFamily="monospace"
                                  >
                                    {p.pt.cameraLabel}
                                  </text>
                                </g>
                              ) : null;
                            })}

                            {/* Active Pulsing Marker on Latest Live Point */}
                            <circle
                              cx={latest.x}
                              cy={latest.y}
                              r="5"
                              fill="#22d3ee"
                              opacity="0.35"
                              className="animate-ping"
                            />
                            <circle
                              cx={latest.x}
                              cy={latest.y}
                              r="3.2"
                              fill="#22d3ee"
                              stroke="#0f172a"
                              strokeWidth="1.2"
                            />

                            {/* Interactive Hover Hit Zones */}
                            {pts.map((p, i) => (
                              <rect
                                key={`hitzone_${i}`}
                                x={p.x - 6}
                                y={0}
                                width={12}
                                height={76}
                                fill="transparent"
                                className="cursor-crosshair"
                                onMouseEnter={() => setHoveredPoint(p.pt)}
                              />
                            ))}
                          </>
                        );
                      })()}

                      {/* Hover Indicator Crosshair */}
                      {hoveredPoint && (() => {
                        const idx = currentSparklineData.findIndex((p) => p.id === hoveredPoint.id);
                        if (idx < 0) return null;
                        const x = 28 + (idx / Math.max(1, currentSparklineData.length - 1)) * 252;
                        const y = 8 + (1.0 - hoveredPoint.score) * 54;

                        return (
                          <g pointerEvents="none">
                            <line x1={x} y1="0" x2={x} y2="76" stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="2 2" />
                            <circle cx={x} cy={y} r="4" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
                          </g>
                        );
                      })()}
                    </svg>

                    {/* Floating Tooltip during Hover */}
                    {hoveredPoint && (
                      <div className="absolute top-1 left-7 bg-slate-950/95 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-mono text-white shadow-xl pointer-events-none flex items-center gap-1.5 z-20">
                        <span className="text-cyan-300 font-bold">
                          {(hoveredPoint.score * 100).toFixed(1)}%
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-300">
                          STABLE TRACKLET
                        </span>
                        {hoveredPoint.cameraLabel && (
                          <span className="text-cyan-400">[{hoveredPoint.cameraLabel}]</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Sparkline Telemetry Metrics Strip */}
                  <div className="grid grid-cols-4 gap-1 pt-1 border-t border-slate-900 font-mono text-[10px]">
                    <div className="bg-slate-900/60 p-1 rounded">
                      <span className="text-slate-500 block text-[9px]">LATEST</span>
                      <span className="font-bold text-cyan-300">
                        {latestSparklinePoint ? (latestSparklinePoint.score * 100).toFixed(1) : "88.0"}%
                      </span>
                    </div>

                    <div className="bg-slate-900/60 p-1 rounded">
                      <span className="text-slate-500 block text-[9px]">MIN / LOW</span>
                      <span className="font-bold text-slate-300">
                        {(minConfidence * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div className="bg-slate-900/60 p-1 rounded">
                      <span className="text-slate-500 block text-[9px]">MEAN CONF</span>
                      <span className="text-slate-300 font-bold">
                        {(avgConfidence * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div className="bg-slate-900/60 p-1 rounded">
                      <span className="text-slate-500 block text-[9px]">TRAJECTORY</span>
                      <span
                        className={`font-bold flex items-center gap-0.5 ${
                          deltaScore < -0.10
                            ? "text-rose-400"
                            : deltaScore < 0
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {deltaScore < 0 ? (
                          <TrendingDown className="w-2.5 h-2.5" />
                        ) : (
                          <TrendingUp className="w-2.5 h-2.5" />
                        )}
                        <span>{deltaScore >= 0 ? "+" : ""}{(deltaScore * 100).toFixed(0)}%</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Windshield Fine Grid FASTag Placement */}
                <div className="bg-slate-950/70 p-2 rounded-lg border border-cyan-900/40">
                  <div className="flex items-center justify-between text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
                    <span>Windshield Fine-Grid FASTag</span>
                    <span className="font-mono text-cyan-300">
                      {selectedVehicle.fastagPlacement?.present ? "TAG DETECTED" : "NO TAG"}
                    </span>
                  </div>
                  {selectedVehicle.fastagPlacement?.present ? (
                    <div className="grid grid-cols-2 gap-1 text-[11px] font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Grid Cell:</span>
                        <span className="text-white font-bold">
                          [{selectedVehicle.fastagPlacement.gridX}, {selectedVehicle.fastagPlacement.gridY}]
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Normalized:</span>
                        <span className="text-cyan-300">
                          ({selectedVehicle.fastagPlacement.normX}, {selectedVehicle.fastagPlacement.normY})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Offset:</span>
                        <span className="text-slate-300">
                          {selectedVehicle.fastagPlacement.offsetMm.dx}mm, {selectedVehicle.fastagPlacement.offsetMm.dy}mm
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Code Snippet:</span>
                        <span className="text-amber-400">{selectedVehicle.fastagPlacement.tagIdSnippet}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-500">No windshield sticker on this vehicle class</span>
                  )}
                </div>

                {/* Road Strip Tyre Pressure Profiler */}
                <div className="bg-slate-950/70 p-2 rounded-lg border border-emerald-900/40">
                  <div className="flex items-center justify-between text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                    <span>Dynamic Tyre Pressure Profiler</span>
                    <span className="font-mono text-emerald-300">
                      Mean {selectedVehicle.tyrePressure?.meanPressure ?? 32} PSI
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] font-mono">
                    {selectedVehicle.tyrePressure?.wheelOrder.map((w) => (
                      <div key={w} className="flex justify-between bg-slate-900/60 px-1.5 py-0.5 rounded">
                        <span className="text-slate-400">{w}:</span>
                        <span className="text-emerald-300 font-bold">
                          {selectedVehicle.tyrePressure.wheelPressures[w]} PSI
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1 flex justify-between">
                    <span>Asymmetry Balance:</span>
                    <span className="text-slate-400">{selectedVehicle.tyrePressure?.asymmetryIndex ?? 0} PSI</span>
                  </div>
                </div>

                {/* YOLOv8m-t42 (NUST) Real-Time Dent & Defect Fingerprint Card */}
                <div className="bg-slate-950/70 p-2.5 rounded-lg border border-amber-900/50 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Wrench className="w-3 h-3 text-amber-400" />
                      YOLOv8m-t42 (NUST) Dent Defect Biometric
                    </span>
                    <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                      P: 0.86 • R: 0.84
                    </span>
                  </div>

                  {selectedVehicle.dentDefects && selectedVehicle.dentDefects.length > 0 ? (
                    <div className="space-y-1.5">
                      {selectedVehicle.dentDefects.map((dent) => (
                        <div
                          key={dent.id}
                          className="bg-slate-900/80 p-2 rounded border border-amber-800/40 text-[11px] font-mono space-y-1"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-white font-bold">{dent.label}</span>
                            <span className="text-amber-400 font-bold">
                              {(dent.confidence * 100).toFixed(0)}% conf
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400">
                            <div>
                              <span>Severity: </span>
                              <span className="text-amber-300 uppercase font-semibold">{dent.severity}</span>
                            </div>
                            <div>
                              <span>Audit: </span>
                              <span className="text-slate-300 truncate">{dent.insuranceAuditCode}</span>
                            </div>
                          </div>
                          <div className="text-[9px] text-slate-500 flex justify-between">
                            <span>Hash: {dent.fingerprintHash}</span>
                            <span>BBox: [{dent.boundingBox.x.toFixed(2)}, {dent.boundingBox.y.toFixed(2)}]</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-900/60 p-2 rounded text-[10px] text-slate-400 flex items-center justify-between font-mono">
                      <span>Panel Condition:</span>
                      <span className="text-emerald-400 font-semibold">Pristine (No Dents Detected)</span>
                    </div>
                  )}

                  <div className="text-[9px] text-slate-500 leading-tight">
                    Real-time dent detection serves as an unforgeable physical biometric for vehicle re-identification and insurance verification without license plates.
                  </div>
                </div>

                {/* Vision AI Model Pipeline Status Pill Bar */}
                <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800 flex items-center justify-between text-[10px] font-mono">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-3 h-3 text-cyan-400" />
                    <span className="text-slate-400">Detector:</span>
                    <span className="text-cyan-300 font-bold">
                      {visionConfig?.isCpuLowPowerMode ? "YOLO26n (CPU)" : visionConfig?.activeDetector === "yolo27" ? "YOLO27" : "YOLO26s"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {onToggleCpuMode && (
                      <button
                        onClick={onToggleCpuMode}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors cursor-pointer ${
                          visionConfig?.isCpuLowPowerMode
                            ? "bg-amber-500 text-slate-950"
                            : "bg-slate-800 text-slate-300 hover:text-white"
                        }`}
                        title="Toggle Low-Power CPU mode (YOLO26n / yolo26n.pt)"
                      >
                        {visionConfig?.isCpuLowPowerMode ? "CPU Mode" : "GPU Mode"}
                      </button>
                    )}

                    {onOpenVisionModels && (
                      <button
                        onClick={onOpenVisionModels}
                        className="px-1.5 py-0.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/80 rounded text-[9px] font-bold transition-colors cursor-pointer"
                        title="Open Vision Models Matrix (YOLO26s, OSNet, ByteTrack, DINOv2, YOLOv8m-t42)"
                      >
                        Model Matrix
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Live Re-ID Match Stream Ticker with Drift Status Flags */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden text-slate-200">
        <div className="px-3.5 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            Live Re-ID Stream
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {recentMatches.length} Matches Logged
          </span>
        </div>

        <div className="max-h-48 overflow-y-auto divide-y divide-slate-800/60 p-1">
          {recentMatches.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-500">
              Vehicles traversing corridor... matches appear when passing downstream cameras.
            </div>
          ) : (
            recentMatches.slice(0, 5).map((m, idx) => {
              const isTrue = m.decision === "TRUE_MATCH";
              const isTopPulse = idx === 0 && isTrue;

              return (
                <div
                  key={`${m.id}_${idx}`}
                  style={
                    isTopPulse && isTrue
                      ? { boxShadow: "0 0 14px rgba(16, 185, 129, 0.35)" }
                      : {}
                  }
                  className={`p-2 text-xs transition-all duration-300 rounded-lg ${
                    isTopPulse && isTrue
                      ? "bg-emerald-950/50 border border-emerald-500/70"
                      : "hover:bg-slate-900/60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-cyan-300 font-bold text-[11px] flex items-center gap-1">
                      {m.sourceCamera} → {m.targetCamera}
                      {idx === 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 text-[9px] font-bold border border-cyan-500/50">
                          NEW
                        </span>
                      )}
                    </span>

                    {/* Status Pill: Confirmed vs Ambiguous */}
                    {isTrue ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" /> CONFIRMED
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-0.5">
                        <AlertCircle className="w-2.5 h-2.5" /> AMBIGUOUS
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 text-[10px] text-slate-400 font-mono mt-0.5">
                    <div>Δt: <span className="text-white">{m.transitDeltaSeconds}s</span> ({m.impliedSpeedKmh} km/h)</div>
                    <div className="text-right">Tag: <span className="text-cyan-300">{(m.fastagScore * 100).toFixed(0)}%</span></div>
                    <div>Tyre: <span className="text-emerald-300">{m.tyrePressureRmse} PSI</span></div>
                    <div className="text-right">
                      <span className={isTrue ? "text-emerald-400 font-bold" : "text-slate-400 font-bold"}>
                        Conf: {(m.combinedScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
