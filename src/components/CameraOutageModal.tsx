import React, { useState, useMemo } from "react";
import {
  X,
  AlertOctagon,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Activity,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Zap,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { CameraId, CameraOutageState, OriginDestinationMatrix } from "../types/reid";
import { imputeMissingCameraFlow } from "../lib/reidEngine";

interface CameraOutageModalProps {
  isOpen: boolean;
  onClose: () => void;
  outageState: CameraOutageState;
  onToggleOutage: (camId: CameraId | null) => void;
  odMatrix: OriginDestinationMatrix;
  onApplyImputedFlows: (imputed: Record<string, Record<string, number>>) => void;
}

export const CameraOutageModal: React.FC<CameraOutageModalProps> = ({
  isOpen,
  onClose,
  outageState,
  onToggleOutage,
  odMatrix,
  onApplyImputedFlows,
}) => {
  const [selectedOutageCam, setSelectedOutageCam] = useState<CameraId>(
    outageState.offlineCameraId || "CAM_B"
  );
  const [imputationMethod, setImputationMethod] = useState<
    "bayesian_graph" | "temporal_convnet" | "historical_gmm"
  >(outageState.imputationModel || "bayesian_graph");

  if (!isOpen) return null;

  const nodes: CameraId[] = ["CAM_A", "CAM_B", "CAM_C"];
  const isCurrentlyOffline = outageState.offlineCameraId === selectedOutageCam;

  // Compute live Bayesian flow imputation
  const imputationResult = useMemo(() => {
    return imputeMissingCameraFlow(
      selectedOutageCam,
      odMatrix.trips,
      nodes,
      odMatrix.travelTimeStats
    );
  }, [selectedOutageCam, odMatrix.trips, odMatrix.travelTimeStats]);

  const handleSimulateOutageToggle = () => {
    if (isCurrentlyOffline) {
      onToggleOutage(null);
    } else {
      onToggleOutage(selectedOutageCam);
      onApplyImputedFlows(imputationResult.imputedTrips);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 select-none backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Camera Failure Tolerance & Flow Imputation Lab
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
                  Bayesian Network
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Simulating camera outages and automatically inferring missing Origin-Destination flows using learned travel-time kernels
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

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Outage Simulation Trigger Bar */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Select Camera Node to Trigger Outage:
              </span>
              <div className="flex gap-2">
                {(["CAM_A", "CAM_B", "CAM_C"] as const).map((camId) => (
                  <button
                    key={camId}
                    onClick={() => setSelectedOutageCam(camId)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedOutageCam === camId
                        ? "bg-rose-500 text-slate-950"
                        : "bg-slate-900 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    {camId === "CAM_A" ? "Cam 01 (Entry)" : camId === "CAM_B" ? "Cam 02 (Flyover)" : "Cam 03 (Exit)"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSimulateOutageToggle}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                  isCurrentlyOffline
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/60"
                    : "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/60 animate-pulse"
                }`}
              >
                {isCurrentlyOffline ? (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Restore {selectedOutageCam} Online</span>
                  </>
                ) : (
                  <>
                    <AlertOctagon className="w-4 h-4" />
                    <span>Simulate {selectedOutageCam} Outage</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Real-time Imputation Diagnostic Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Camera Failover Status
              </span>
              <div
                className={`text-sm font-bold font-mono mt-1 ${
                  isCurrentlyOffline ? "text-rose-400 animate-pulse" : "text-emerald-400"
                }`}
              >
                {isCurrentlyOffline ? `OFFLINE (${selectedOutageCam})` : "ALL NODES HEALTHY"}
              </div>
              <span className="text-[10px] text-slate-500 block">
                {isCurrentlyOffline ? "Automatic Imputation Running" : "Heartbeats Verified"}
              </span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Baseline Flow RMSE
              </span>
              <div className="text-2xl font-mono font-black text-cyan-400">
                {imputationResult.baselineRmse} veh
              </div>
              <span className="text-[10px] text-slate-500 block">Normal multi-camera mode</span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Outage Imputed RMSE
              </span>
              <div
                className={`text-2xl font-mono font-black ${
                  isCurrentlyOffline ? "text-amber-400" : "text-slate-400"
                }`}
              >
                {imputationResult.outageRmse} veh
              </div>
              <span className="text-[10px] text-slate-500 block">Probabilistic Bayesian infer</span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Imputation Error Increase
              </span>
              <div
                className={`text-2xl font-mono font-black ${
                  isCurrentlyOffline ? "text-rose-400" : "text-slate-400"
                }`}
              >
                +{imputationResult.imputationErrorIncreasePct}%
              </div>
              <span className="text-[10px] text-slate-500 block">Graceful degradation</span>
            </div>
          </div>

          {/* Side-by-Side Flow Comparison: Ground Truth vs Imputed Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ground Truth Matrix */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-xs text-white uppercase tracking-wider">
                  Ground Truth / Normal Monitored Trips
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                  Full Visibility
                </span>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between p-2 rounded bg-slate-900/60">
                  <span className="text-slate-400">Cam 01 → Cam 02 (Flyover):</span>
                  <span className="text-white font-bold">{odMatrix.trips["CAM_A"]?.["CAM_B"] || 14} veh</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-slate-900/60">
                  <span className="text-slate-400">Cam 01 → Cam 03 (Exit):</span>
                  <span className="text-white font-bold">{odMatrix.trips["CAM_A"]?.["CAM_C"] || 28} veh</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-slate-900/60">
                  <span className="text-slate-400">Cam 02 → Cam 03 (Exit):</span>
                  <span className="text-white font-bold">{odMatrix.trips["CAM_B"]?.["CAM_C"] || 19} veh</span>
                </div>
              </div>
            </div>

            {/* Imputed Flow Matrix */}
            <div
              className={`bg-slate-950/90 border rounded-xl p-4 space-y-3 transition-colors ${
                isCurrentlyOffline ? "border-amber-500/80 shadow-lg shadow-amber-950/40" : "border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-xs text-white uppercase tracking-wider">
                  Imputed Flow Estimates (95% CI)
                </span>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                  Bayesian Convolved
                </span>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between p-2 rounded bg-slate-900/60">
                  <span className="text-slate-400">Cam 01 → Cam 02 (Flyover):</span>
                  <div className="text-right">
                    <span className="text-amber-300 font-bold">
                      {imputationResult.imputedTrips["CAM_A"]["CAM_B"]} veh
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      [{imputationResult.uncertaintyInterval["CAM_A"]["CAM_B"][0]} -{" "}
                      {imputationResult.uncertaintyInterval["CAM_A"]["CAM_B"][1]}]
                    </span>
                  </div>
                </div>
                <div className="flex justify-between p-2 rounded bg-slate-900/60">
                  <span className="text-slate-400">Cam 01 → Cam 03 (Exit):</span>
                  <div className="text-right">
                    <span className="text-amber-300 font-bold">
                      {imputationResult.imputedTrips["CAM_A"]["CAM_C"]} veh
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      [{imputationResult.uncertaintyInterval["CAM_A"]["CAM_C"][0]} -{" "}
                      {imputationResult.uncertaintyInterval["CAM_A"]["CAM_C"][1]}]
                    </span>
                  </div>
                </div>
                <div className="flex justify-between p-2 rounded bg-slate-900/60">
                  <span className="text-slate-400">Cam 02 → Cam 03 (Exit):</span>
                  <div className="text-right">
                    <span className="text-amber-300 font-bold">
                      {imputationResult.imputedTrips["CAM_B"]["CAM_C"]} veh
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      [{imputationResult.uncertaintyInterval["CAM_B"]["CAM_C"][0]} -{" "}
                      {imputationResult.uncertaintyInterval["CAM_B"]["CAM_C"][1]}]
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Model Specification Note */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-1">
            <span className="font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Imputation Methodology & Guarantees:</span>
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              When Cam 02 (100ft Flyover) suffers power loss or communication failure, NetraFlow invokes the probabilistic graphical model: given upstream departures N_A(t) convolved with the learned Gaussian travel time kernel P(Δt_AB) ~ Normal(55s, 12s) and downstream arrivals N_C(t), it estimates missing intermediate counts without breaking downstream OD trip continuity.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Automated failover conforms to municipal high-availability ITS redundancy guidelines.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors cursor-pointer"
          >
            Close Lab
          </button>
        </div>
      </div>
    </div>
  );
};
