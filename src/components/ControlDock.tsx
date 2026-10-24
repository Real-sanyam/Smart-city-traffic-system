import React, { useState } from "react";
import {
  Video,
  Eye,
  Sliders,
  Sparkles,
  BookOpen,
  BarChart3,
  HelpCircle,
  Play,
  RotateCcw,
  Layers,
  ChevronDown,
  ChevronUp,
  Flame,
  Activity,
  Grid,
  Moon,
  Sun,
  AlertOctagon,
  Cpu,
  ShieldCheck,
  Lock,
} from "lucide-react";

interface ControlDockProps {
  activeCameraView: "overview" | "CAM_A" | "CAM_B" | "CAM_C" | "CAM_D" | "chase";
  onSelectCameraView: (view: "overview" | "CAM_A" | "CAM_B" | "CAM_C" | "CAM_D" | "chase") => void;
  showFrustums: boolean;
  onToggleFrustums: () => void;
  showTrajectories?: boolean;
  onToggleTrajectories?: () => void;
  showCalibration?: boolean;
  onToggleCalibration?: () => void;
  congestionSpeedFactor: number;
  onChangeSpeedFactor: (val: number) => void;
  onOpenLab: () => void;
  onOpenArchitecture: () => void;
  onOpenDashboard: () => void;
  onOpenAiReasoner: () => void;
  onOpenHeatmap: () => void;
  onResetSimulation: () => void;
  isAiLoading: boolean;
  isNightMode?: boolean;
  onOpenNightMode?: () => void;
  onOpenOutage?: () => void;
  hasActiveOutage?: boolean;
  onOpenAdaptation?: () => void;
  adaptationStatus?: string;
  onOpenPrivacy?: () => void;
  onOpenVisionModels?: () => void;
  activeDetector?: string;
  isCpuMode?: boolean;
  onToggleCpuMode?: () => void;
}

export const ControlDock: React.FC<ControlDockProps> = ({
  activeCameraView,
  onSelectCameraView,
  showFrustums,
  onToggleFrustums,
  showTrajectories = true,
  onToggleTrajectories,
  showCalibration = false,
  onToggleCalibration,
  congestionSpeedFactor,
  onChangeSpeedFactor,
  onOpenLab,
  onOpenArchitecture,
  onOpenDashboard,
  onOpenAiReasoner,
  onOpenHeatmap,
  onResetSimulation,
  isAiLoading,
  isNightMode = false,
  onOpenNightMode,
  onOpenOutage,
  hasActiveOutage = false,
  onOpenAdaptation,
  adaptationStatus,
  onOpenPrivacy,
  onOpenVisionModels,
  activeDetector = "yolo26s",
  isCpuMode = false,
  onToggleCpuMode,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      style={{
        position: "fixed",
        bottom: isCollapsed ? "-105px" : "18px",
        left: "50%",
        transform: "translateX(-50%)",
        maxWidth: "min(1240px, 98vw)",
        zIndex: 40,
        transition: "bottom 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      className="w-full flex flex-col items-center select-none"
    >
      {/* Collapse / Expand Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="mb-1.5 px-3 py-1 bg-slate-900/90 text-cyan-400 hover:text-cyan-300 border border-slate-700/80 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-lg cursor-pointer transition-colors"
      >
        {isCollapsed ? (
          <>
            <ChevronUp className="w-3.5 h-3.5" />
            <span>Show Re-ID Control Deck</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5" />
            <span>Hide Control Deck (Zen Mode)</span>
          </>
        )}
      </button>

      {/* Main Glassmorphic Control Dock (Solid/rgba surfaces - no backdrop-filter over WebGL) */}
      <div className="w-full bg-slate-950/95 border border-slate-800 rounded-2xl shadow-2xl p-2.5 px-3.5 flex flex-wrap items-center justify-between gap-2.5 text-slate-200">
        {/* Left: Camera Feed Switcher */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 px-1.5 flex items-center gap-1">
            <Video className="w-3 h-3 text-cyan-400" />
            Feeds:
          </span>
          <button
            onClick={() => onSelectCameraView("overview")}
            className={`px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeCameraView === "overview"
                ? "bg-cyan-500 text-slate-950 font-bold"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            3D God View
          </button>
          <button
            onClick={() => onSelectCameraView("CAM_A")}
            className={`px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeCameraView === "CAM_A"
                ? "bg-cyan-500 text-slate-950 font-bold"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            Cam 01 Entry
          </button>
          <button
            onClick={() => onSelectCameraView("CAM_B")}
            className={`px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeCameraView === "CAM_B"
                ? "bg-cyan-500 text-slate-950 font-bold"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            Cam 02 Flyover
          </button>
          <button
            onClick={() => onSelectCameraView("CAM_C")}
            className={`px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeCameraView === "CAM_C"
                ? "bg-cyan-500 text-slate-950 font-bold"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            Cam 03 Exit
          </button>
          <button
            onClick={() => onSelectCameraView("CAM_D")}
            className={`px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeCameraView === "CAM_D"
                ? "bg-emerald-400 text-slate-950 font-bold"
                : "text-emerald-400/80 hover:bg-slate-800"
            }`}
            title="Newly Commissioned Camera 04 (HSR Link)"
          >
            Cam 04 HSR
          </button>
          <button
            onClick={() => onSelectCameraView("chase")}
            className={`px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeCameraView === "chase"
                ? "bg-amber-400 text-slate-950 font-bold"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            Chase Cam
          </button>
        </div>

        {/* Center: Traffic Flow Speed & Frustums */}
        <div className="flex items-center gap-3 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
          <button
            onClick={onToggleFrustums}
            className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              showFrustums
                ? "bg-cyan-950/80 text-cyan-300 border border-cyan-800/80"
                : "bg-slate-800 text-slate-400"
            }`}
            title="Toggle CCTV Field-of-View Visual Frustums"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>FOV Frustums</span>
          </button>

          <button
            onClick={onToggleTrajectories}
            className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              showTrajectories
                ? "bg-cyan-950/80 text-cyan-300 border border-cyan-800/80"
                : "bg-slate-800 text-slate-400"
            }`}
            title="Toggle Vehicle Trajectory Lines & Spatio-Temporal Flow Conduits"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Trajectory Lines</span>
          </button>

          <button
            onClick={onToggleCalibration}
            className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              showCalibration
                ? "bg-amber-950/80 text-amber-300 border border-amber-800/80 shadow-sm"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
            title="Toggle Homography Ground Calibration Grids & Metric Rays (IPM)"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Homography Grid</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Sliders className="w-3 h-3 text-cyan-400" />
              Traffic Pace:
            </span>
            <input
              type="range"
              min="0.1"
              max="2.2"
              step="0.05"
              value={congestionSpeedFactor}
              onChange={(e) => onChangeSpeedFactor(parseFloat(e.target.value))}
              className="w-20 accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              title="Adjust traffic speed factor (drag below ~0.25x to trigger <10 km/h alert)"
            />
            <span
              className={`text-xs font-mono font-bold w-9 ${
                congestionSpeedFactor <= 0.25 ? "text-rose-400 animate-pulse" : "text-cyan-400"
              }`}
            >
              {congestionSpeedFactor.toFixed(2)}x
            </span>
          </div>

          <button
            onClick={onResetSimulation}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            title="Reset Vehicle Fleet"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Specialized Re-ID Action Modals */}
        <div className="flex items-center flex-wrap gap-1.5">
          {/* Vision AI Model Matrix & Pipeline Config */}
          {onOpenVisionModels && (
            <button
              onClick={onOpenVisionModels}
              className="px-2.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer ring-1 ring-cyan-400/50"
              title="Vision AI Models: Ultralytics YOLO26s/27/26n • OSNet x1.0 512-d • ByteTrack • DINOv2 Fallback • YOLOv8m-t42 Dent Detector"
            >
              <Cpu className="w-3.5 h-3.5 text-slate-950" />
              <span>AI Models: {isCpuMode ? "YOLO26n (CPU)" : activeDetector === "yolo27" ? "YOLO27" : "YOLO26s"}</span>
            </button>
          )}

          {/* Low-Power CPU Toggle */}
          {onToggleCpuMode && (
            <button
              onClick={onToggleCpuMode}
              className={`px-2 py-1.5 text-xs font-mono font-bold rounded-xl flex items-center gap-1 border transition-all cursor-pointer ${
                isCpuMode
                  ? "bg-amber-950/90 text-amber-300 border-amber-500 shadow-sm"
                  : "bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-700"
              }`}
              title="Toggle Low-Power CPU Mode (YOLO26n / yolo26n.pt @ 28 FPS)"
            >
              <span>{isCpuMode ? "CPU Low-Power (28 FPS)" : "GPU (60 FPS)"}</span>
            </button>
          )}

          {/* Day / Night Low-Light Robustness */}
          {onOpenNightMode && (
            <button
              onClick={onOpenNightMode}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
                isNightMode
                  ? "bg-gradient-to-r from-indigo-700 to-purple-800 text-indigo-100 border border-indigo-500/80 shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              }`}
              title="Night-time Low-Light Robustness (RetinexNet / IR-Thermal Fusion + Part Attention)"
            >
              {isNightMode ? (
                <Moon className="w-3.5 h-3.5 text-amber-300" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-yellow-400" />
              )}
              <span>{isNightMode ? "Night Mode" : "Day/Night"}</span>
            </button>
          )}

          {/* Camera Outage & Flow Imputation */}
          {onOpenOutage && (
            <button
              onClick={onOpenOutage}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
                hasActiveOutage
                  ? "bg-rose-950/90 text-rose-300 border border-rose-500 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.4)]"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              }`}
              title="Camera Failure Tolerance & Bayesian Flow Imputation"
            >
              <AlertOctagon className={`w-3.5 h-3.5 ${hasActiveOutage ? "text-rose-400" : "text-amber-400"}`} />
              <span>{hasActiveOutage ? "Outage: Imputing" : "Outage Sim"}</span>
            </button>
          )}

          {/* Unsupervised Domain Adaptation for Cam 04 */}
          {onOpenAdaptation && (
            <button
              onClick={onOpenAdaptation}
              className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              title="Unsupervised Domain Adaptation for New Camera 04 (MoCo/SimCLR + DANN + Pseudo-Labels)"
            >
              <Cpu className="w-3.5 h-3.5 text-slate-950" />
              <span>Cam 04 Adapt</span>
              {adaptationStatus && (
                <span className="text-[10px] font-mono font-black bg-slate-950/40 text-emerald-100 px-1 py-0.2 rounded">
                  {adaptationStatus}
                </span>
              )}
            </button>
          )}

          {/* Privacy Preservation & DP Center */}
          {onOpenPrivacy && (
            <button
              onClick={onOpenPrivacy}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-medium rounded-xl flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
              title="Privacy-Preserving Outputs (k>=10 Suppression, Laplace DP) & IDF1 Benchmarks"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Privacy &amp; DP</span>
            </button>
          )}

          {/* Multi-Cue Windshield Grid & Tyre Pressure Disambiguation Lab */}
          <button
            onClick={onOpenLab}
            className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-transform active:scale-95 cursor-pointer"
            title="Open Disambiguation Lab: Windshield 10x10 Fine Grid + Dynamic Tyre Pressure Profiler"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Disambiguate Identical Cars</span>
          </button>

          {/* AI Spatio-Temporal Reasoner */}
          <button
            onClick={onOpenAiReasoner}
            disabled={isAiLoading}
            className="px-2.5 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Gemini 4</span>
          </button>

          {/* D3 Traffic Heatmap */}
          <button
            onClick={onOpenHeatmap}
            className="px-2.5 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-transform active:scale-95 cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Heatmap</span>
          </button>

          {/* OD Flow Matrix */}
          <button
            onClick={onOpenDashboard}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium rounded-xl flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>OD Flows</span>
          </button>

          {/* Technical Architecture & Methodology Guide */}
          <button
            onClick={onOpenArchitecture}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Methodology</span>
          </button>
        </div>
      </div>
    </div>
  );
};
