import React, { useState, useMemo } from "react";
import {
  X,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Sliders,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Cpu,
  BarChart3,
  Camera,
  Layers,
  Disc,
  Grid,
  Gauge,
  Clock,
  Car,
  Check,
  AlertCircle,
  Activity,
  Maximize2,
  Wrench,
  Crosshair,
} from "lucide-react";
import { CameraHistogram } from "./CameraHistogram";
import { SimulatedVehicle, WindshieldFastag, TyrePressureProfile, VehicleDentDefect } from "../types/reid";
import {
  calculateWindshieldGridSimilarity,
  calculateTyrePressureSimilarity,
  calculateDentDefectSimilarity,
} from "../lib/reidEngine";

interface DisambiguationLabProps {
  isOpen: boolean;
  onClose: () => void;
  onRunAiAnalysis: (scenario: any) => void;
  isAiLoading: boolean;
  vehicles?: SimulatedVehicle[];
  activeCameraId?: string;
}

export const DisambiguationLab: React.FC<DisambiguationLabProps> = ({
  isOpen,
  onClose,
  onRunAiAnalysis,
  isAiLoading,
  vehicles = [],
  activeCameraId = "CAM_B",
}) => {
  // Navigation tab state inside the Disambiguation Lab
  // Navigation tab state inside the Disambiguation Lab
  const [activeTab, setActiveTab] = useState<
    "evaluator" | "windshieldGrid" | "tyrePressure" | "dentDefects" | "histogram"
  >("evaluator");

  const [selectedHistogramCamera, setSelectedHistogramCamera] = useState<
    "CAM_A" | "CAM_B" | "CAM_C"
  >("CAM_B");

  // Multi-Cue Fusion Weights (Normalized to sum to 1.0)
  const [weightApp, setWeightApp] = useState(0.22);
  const [weightFastag, setWeightFastag] = useState(0.22);
  const [weightPressure, setWeightPressure] = useState(0.20);
  const [weightDents, setWeightDents] = useState(0.18);
  const [weightSt, setWeightSt] = useState(0.18);

  // Spatio-Temporal Traffic Congestion Regime (Transit time distributions)
  const [congestionLevel, setCongestionLevel] = useState<"freeflow" | "normal" | "heavy">("normal");

  // Interactive Windshield Grid selected cell for simulation
  const [selectedWindshieldCell, setSelectedWindshieldCell] = useState<{ gx: number; gy: number } | null>(null);

  // Selected candidate to compare in detail
  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState<number>(1); // default Target

  // Temporal Filter enforcement toggle
  const [enforceTemporalFilter, setEnforceTemporalFilter] = useState(true);

  if (!isOpen) return null;

  // Expected travel times for 500m urban corridor
  const expectedTransitMean =
    congestionLevel === "heavy" ? 115 : congestionLevel === "freeflow" ? 40 : 65;
  const transitStdDev = congestionLevel === "heavy" ? 25 : 12;

  // -----------------------------------------------------------------
  // Authentic Test Dilemma: Visually Identical White Hatchbacks
  // -----------------------------------------------------------------

  // Query Vehicle Sighted at Camera 01 (Entry)
  const queryVehicle = {
    plate: "[RESTRICTED - NO OCR]",
    globalId: "GID-0042",
    make: "Maruti Suzuki Swift",
    colorName: "Arctic White",
    colorHex: "#f0f2f5",
    timeA: "08:30:00",
    lane: "Lane 2 (Middle)",
    osnetSim: 1.0,
    dinov2Sim: 1.0,
    fastag: {
      present: true,
      gridX: 5,
      gridY: 1,
      normX: 0.52,
      normY: 0.14,
      offsetMm: { dx: +24, dy: +15 },
      tagIdSnippet: "FTG-771A",
      tiltDeg: 1.5,
    } as WindshieldFastag,
    tyrePressure: {
      wheelPressures: { FL: 32.4, FR: 31.8, RL: 33.2, RR: 30.6 },
      wheelOrder: ["FL", "FR", "RL", "RR"],
      meanPressure: 32.0,
      asymmetryIndex: 0.6,
      unit: "PSI" as const,
      captureGridPoint: "TPMS-GRID-CAM_A",
      timestamp: 1000,
    } as TyrePressureProfile,
    dentDefects: [
      {
        id: "dent_q_1",
        location: "left_fender" as const,
        label: "LEFT FENDER DENT",
        type: "dent" as const,
        confidence: 0.88,
        precisionBenchmark: 0.86,
        recallBenchmark: 0.84,
        modelSource: "YOLOv8m-t42 (NUST)" as const,
        severity: "minor" as const,
        boundingBox: { x: 0.28, y: 0.42, w: 0.14, h: 0.09 },
        fingerprintHash: "Y8DENT-LEF-880",
        insuranceAuditCode: "INS-AUD-0042-LEFT_FENDER",
      },
    ],
    microFeatures: {
      roofRack: false,
      bumperScratch: true,
      windshieldSticker: true,
      sunfilmTint: "mild" as const,
    },
  };

  // Candidates arriving simultaneously at downstream Camera 02 (500m downstream)
  const candidates = [
    {
      id: "Candidate 1 (Impostor A)",
      name: "White Swift A",
      globalId: "GID-9104",
      timeB: "08:30:21",
      deltaT: 21, // 21s -> 85.7 km/h in dense traffic! Physical anomaly!
      rawVisualSim: 0.90, // Deceptive identical model/color from OSNet
      osnetSim: 0.90,
      dinov2Sim: 0.84, // DINOv2 fallback notices divergence
      fastag: {
        present: true,
        gridX: 2, // Passenger top-left instead of center-top!
        gridY: 1,
        normX: 0.22,
        normY: 0.15,
        offsetMm: { dx: -378, dy: +22 },
        tagIdSnippet: "FTG-409B",
        tiltDeg: -3.0,
      } as WindshieldFastag,
      tyrePressure: {
        wheelPressures: { FL: 35.2, FR: 35.0, RL: 32.1, RR: 32.4 }, // Significant PSI mismatch
        wheelOrder: ["FL", "FR", "RL", "RR"],
        meanPressure: 33.7,
        asymmetryIndex: 0.2,
        unit: "PSI" as const,
        captureGridPoint: "TPMS-GRID-CAM_B",
        timestamp: 1021,
      } as TyrePressureProfile,
      dentDefects: [], // Clean vehicle without fender dent - negative match evidence!
      isGroundTruth: false,
      microFeatures: {
        roofRack: false,
        bumperScratch: false,
        windshieldSticker: true,
        sunfilmTint: "mild" as const,
      },
    },
    {
      id: "Candidate 2 (True Target Vehicle)",
      name: "White Swift B",
      globalId: "GID-0042",
      timeB: "08:31:07",
      deltaT: 67, // 67s -> 26.9 km/h (within expected 65s mean!)
      rawVisualSim: 0.92,
      osnetSim: 0.91,
      dinov2Sim: 0.93,
      fastag: {
        present: true,
        gridX: 5, // Exact same grid cell!
        gridY: 1,
        normX: 0.525, // 0.005 norm diff (tolerable 5mm application noise)
        normY: 0.142,
        offsetMm: { dx: +28, dy: +16 },
        tagIdSnippet: "FTG-771A",
        tiltDeg: 1.5,
      } as WindshieldFastag,
      tyrePressure: {
        wheelPressures: { FL: 32.6, FR: 31.9, RL: 33.4, RR: 30.7 }, // Minor +0.2 PSI thermal expansion
        wheelOrder: ["FL", "FR", "RL", "RR"],
        meanPressure: 32.2,
        asymmetryIndex: 0.7,
        unit: "PSI" as const,
        captureGridPoint: "TPMS-GRID-CAM_B",
        timestamp: 1067,
      } as TyrePressureProfile,
      dentDefects: [
        {
          id: "dent_c2_1",
          location: "left_fender" as const,
          label: "LEFT FENDER DENT",
          type: "dent" as const,
          confidence: 0.87,
          precisionBenchmark: 0.86,
          recallBenchmark: 0.84,
          modelSource: "YOLOv8m-t42 (NUST)" as const,
          severity: "minor" as const,
          boundingBox: { x: 0.29, y: 0.41, w: 0.13, h: 0.09 },
          fingerprintHash: "Y8DENT-LEF-870",
          insuranceAuditCode: "INS-AUD-0042-LEFT_FENDER",
        },
      ],
      isGroundTruth: true,
      microFeatures: {
        roofRack: false,
        bumperScratch: true,
        windshieldSticker: true,
        sunfilmTint: "mild" as const,
      },
    },
    {
      id: "Candidate 3 (Impostor B)",
      name: "White Swift C",
      globalId: "GID-5521",
      timeB: "08:31:12",
      deltaT: 72, // Time is plausible, but physical FASTag/Tyre sensors catch it!
      rawVisualSim: 0.89,
      osnetSim: 0.89,
      dinov2Sim: 0.81,
      fastag: {
        present: true,
        gridX: 8, // Driver top-right!
        gridY: 2,
        normX: 0.81,
        normY: 0.22,
        offsetMm: { dx: +418, dy: +75 },
        tagIdSnippet: "FTG-882E",
        tiltDeg: 4.2,
      } as WindshieldFastag,
      tyrePressure: {
        wheelPressures: { FL: 29.8, FR: 29.5, RL: 30.1, RR: 28.2 }, // Underinflated tyre set
        wheelOrder: ["FL", "FR", "RL", "RR"],
        meanPressure: 29.4,
        asymmetryIndex: 0.3,
        unit: "PSI" as const,
        captureGridPoint: "TPMS-GRID-CAM_B",
        timestamp: 1072,
      } as TyrePressureProfile,
      dentDefects: [
        {
          id: "dent_c3_1",
          location: "rear_bumper" as const,
          label: "REAR BUMPER CREASE",
          type: "crease" as const,
          confidence: 0.82,
          precisionBenchmark: 0.86,
          recallBenchmark: 0.84,
          modelSource: "YOLOv8m-t42 (NUST)" as const,
          severity: "minor" as const,
          boundingBox: { x: 0.65, y: 0.72, w: 0.16, h: 0.10 },
          fingerprintHash: "Y8DENT-REA-820",
          insuranceAuditCode: "INS-AUD-5521-REAR_BUMPER",
        },
      ],
      isGroundTruth: false,
      microFeatures: {
        roofRack: false,
        bumperScratch: false,
        windshieldSticker: true,
        sunfilmTint: "mild" as const,
      },
    },
  ];

  // Evaluate candidate scores based on current multi-cue weights
  const totalWeight = weightApp + weightFastag + weightPressure + weightDents + weightSt || 1.0;

  const evaluated = candidates.map((c) => {
    // 1. Spatio-temporal score
    const z = (c.deltaT - expectedTransitMean) / transitStdDev;
    let stScore = Math.exp(-0.5 * z * z);
    const impliedSpeed = (0.5 / (c.deltaT / 3600)).toFixed(1);

    let temporalPassed = true;
    if (c.deltaT < 25) {
      stScore = 0.02; // physical speed limit violation
      temporalPassed = false;
    }
    if (c.deltaT > 180) {
      stScore = 0.05;
      temporalPassed = false;
    }

    // 2. Windshield Fine Grid FASTag score
    const fastagRes = calculateWindshieldGridSimilarity(queryVehicle.fastag, c.fastag);

    // 3. Dynamic Tyre Pressure Profile score
    const pressureRes = calculateTyrePressureSimilarity(queryVehicle.tyrePressure, c.tyrePressure);

    // 4. YOLOv8m-t42 (NUST) Physical Dent & Defect Detection (Precision 0.86, Recall 0.84)
    const dentRes = calculateDentDefectSimilarity(queryVehicle.dentDefects, c.dentDefects);

    // Composite Weighted Posterior Score
    let composite =
      (weightApp * c.rawVisualSim +
        weightFastag * fastagRes.score +
        weightPressure * pressureRes.score +
        weightDents * dentRes.score +
        weightSt * stScore) /
      totalWeight;

    // Apply temporal plausibility filter
    let filterStatus: "PASSED_PLAUSIBLE" | "REJECTED_TEMPORAL_IMPOSSIBILITY" = "PASSED_PLAUSIBLE";
    if (enforceTemporalFilter && !temporalPassed) {
      composite *= 0.08; // Hard suppression of impossible speed
      filterStatus = "REJECTED_TEMPORAL_IMPOSSIBILITY";
    }

    const confidenceScore = parseFloat((composite * 100).toFixed(1));

    return {
      ...c,
      stScore,
      impliedSpeed,
      temporalPassed,
      filterStatus,
      fastagScore: fastagRes.score,
      fastagDistanceNorm: fastagRes.distanceNorm,
      fastagGridDiff: fastagRes.gridDiff,
      pressureScore: pressureRes.score,
      pressureRmse: pressureRes.rmsePsi,
      pressureDeltas: pressureRes.deltas,
      dentScore: dentRes.score,
      dentMatchingCount: dentRes.matchingCount,
      dentDetails: dentRes.details,
      composite,
      confidenceScore,
    };
  });

  const selectedCandidate = evaluated[selectedCandidateIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 select-none backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Multi-Cue Vehicle Disambiguation Lab
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Zero Plate OCR
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Disambiguating visually identical models using Windshield Fine-Grid Localization, Tyre Pressure Profiling & Bayesian Fusion
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

        {/* Tab Navigation Bar */}
        <div className="px-6 py-2.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveTab("evaluator")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "evaluator"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Multi-Cue Bayesian Fusion</span>
            </button>

            <button
              onClick={() => setActiveTab("windshieldGrid")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "windshieldGrid"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Grid className="w-3.5 h-3.5 text-cyan-400" />
              <span>Windshield Grid Analysis</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                10x10 Grid
              </span>
            </button>

            <button
              onClick={() => setActiveTab("tyrePressure")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "tyrePressure"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Gauge className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tyre Pressure Profiler</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                4-Wheel PSI
              </span>
            </button>

            <button
              onClick={() => setActiveTab("dentDefects")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "dentDefects"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              <span>YOLOv8m-t42 Dent Forensics</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                P: 0.86 • R: 0.84
              </span>
            </button>

            <button
              onClick={() => setActiveTab("histogram")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "histogram"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
              <span>Color Collision Spectrum</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 hidden md:flex items-center gap-2">
            <span>Corridor:</span>
            <span className="font-mono text-cyan-400 font-bold">Silk Board → Koramangala (500m)</span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: Multi-Cue Bayesian Fusion Evaluator */}
          {activeTab === "evaluator" && (
            <div className="space-y-6">
              {/* Query Target Vehicle & Dilemma Banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Query Vehicle Card */}
                <div className="bg-slate-950/90 border border-cyan-800/80 p-4 rounded-xl relative overflow-hidden">
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-cyan-500/20 text-cyan-300 text-[10px] font-bold rounded uppercase">
                    Query Target
                  </div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Captured at Camera 01 (Entry)
                  </h3>
                  <div className="text-sm font-bold text-white mb-0.5">{queryVehicle.make}</div>
                  <div className="text-xs text-slate-300 flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 rounded-full bg-slate-100 border border-slate-400 inline-block" />
                    <span>{queryVehicle.colorName}</span>
                    <span className="font-mono text-[10px] text-slate-500">[{queryVehicle.globalId}]</span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Entry Time:</span>
                      <span className="font-mono text-cyan-300 font-bold">{queryVehicle.timeA}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">FASTag Grid Pos:</span>
                      <span className="text-cyan-400 font-mono font-semibold">
                        Cell [{queryVehicle.fastag.gridX}, {queryVehicle.fastag.gridY}] (u={queryVehicle.fastag.normX})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tyre Profile:</span>
                      <span className="text-emerald-400 font-mono font-semibold">
                        32.4 / 31.8 / 33.2 / 30.6 PSI
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Dents / Scratches:</span>
                      <span className="text-slate-400">None (Visually Pristine)</span>
                    </div>
                  </div>
                </div>

                {/* Problem Explanation & Traffic Regime */}
                <div className="md:col-span-2 bg-slate-950/90 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      The Identical Vehicle Dilemma
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed mb-3">
                      All 3 candidate vehicles arriving downstream are <strong>identical Arctic White Maruti Swifts</strong> with no body dents or stickers. Standard appearance embeddings produce nearly identical cosine scores: <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">0.90 vs 0.92 vs 0.89</code>.
                      Only by fusing <strong>Windshield Fine-Grid FASTag Placement</strong>, <strong>Dynamic Tyre Pressure Profiles</strong>, and <strong>Spatio-Temporal Plausibility</strong> can we accurately disambiguate the true target without reading license plates.
                    </p>
                  </div>

                  {/* Corridor Parameters & Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Corridor Distance:</span>
                      <span className="font-bold text-white">500m (Cam 01 → Cam 02)</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Traffic Congestion:</span>
                      <div className="flex gap-1.5 mt-0.5">
                        {(["freeflow", "normal", "heavy"] as const).map((lvl) => (
                          <button
                            key={lvl}
                            onClick={() => setCongestionLevel(lvl)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                              congestionLevel === lvl
                                ? "bg-cyan-500 text-slate-950"
                                : "bg-slate-800 text-slate-400 hover:text-white"
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Expected Transit Window:</span>
                      <span className="font-bold text-cyan-400 font-mono">
                        {expectedTransitMean}s (±{transitStdDev}s)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-[11px] text-slate-300 flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enforceTemporalFilter}
                          onChange={(e) => setEnforceTemporalFilter(e.target.checked)}
                          className="accent-cyan-400 rounded"
                        />
                        <span>Enforce Speed Filter</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vision AI Model Stack Diagnostic Banner */}
              <div className="bg-slate-950/90 border border-slate-800 p-3 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                    <Crosshair className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-slate-300">
                    Detector: <strong className="text-cyan-300">YOLO26s (yolo26s.pt)</strong> / Low-power <strong className="text-amber-300">YOLO26n (CPU)</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-300">
                    Embedder: <strong className="text-purple-300">OSNet x1.0 (512-d)</strong> + Fallback: <strong className="text-purple-400">DINOv2-small (384-d)</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-300">
                    Tracker: <strong className="text-indigo-300">ByteTrack</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-300">
                    Defect: <strong className="text-emerald-400">YOLOv8m-t42 (0.86 P / 0.84 R)</strong>
                  </span>
                </div>
              </div>

              {/* Interactive 5-Way Bayesian Fusion Weight Sliders */}
              <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    Unified Multi-Modal Sigmoid Fusion Weights (Dynamic Real-Time Tuning):
                  </span>
                  <button
                    onClick={() => {
                      setWeightApp(0.22);
                      setWeightFastag(0.22);
                      setWeightPressure(0.20);
                      setWeightDents(0.18);
                      setWeightSt(0.18);
                    }}
                    className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                  >
                    Reset (22% OSNet / 22% FASTag / 20% Tyre / 18% YOLOv8m Dents / 18% ST)
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
                  {/* Appearance Weight (OSNet x1.0) */}
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">OSNet x1.0 (W_app):</span>
                      <span className="font-mono text-cyan-400 font-bold">
                        {((weightApp / totalWeight) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.8"
                      step="0.05"
                      value={weightApp}
                      onChange={(e) => setWeightApp(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">512-d TorchReID embedding</span>
                  </div>

                  {/* Windshield FASTag Grid Weight */}
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-cyan-900/40">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-cyan-300 font-semibold">FASTag Grid (W_tag):</span>
                      <span className="font-mono text-cyan-400 font-bold">
                        {((weightFastag / totalWeight) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.8"
                      step="0.05"
                      value={weightFastag}
                      onChange={(e) => setWeightFastag(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                    />
                    <span className="text-[10px] text-cyan-500 mt-1 block">Fine-grid (u, v) localization</span>
                  </div>

                  {/* Tyre Pressure Profiler Weight */}
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-emerald-900/40">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-emerald-300 font-semibold">Tyre Pressure (W_psi):</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {((weightPressure / totalWeight) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.8"
                      step="0.05"
                      value={weightPressure}
                      onChange={(e) => setWeightPressure(parseFloat(e.target.value))}
                      className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                    />
                    <span className="text-[10px] text-emerald-500 mt-1 block">4-wheel ground sensor RMSE</span>
                  </div>

                  {/* YOLOv8m-t42 Dent Biometrics Weight */}
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-amber-900/40">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-amber-300 font-semibold">Dent Biometric (W_dent):</span>
                      <span className="font-mono text-amber-400 font-bold">
                        {((weightDents / totalWeight) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.8"
                      step="0.05"
                      value={weightDents}
                      onChange={(e) => setWeightDents(parseFloat(e.target.value))}
                      className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                    />
                    <span className="text-[10px] text-amber-400 mt-1 block">YOLOv8m-t42 (0.86 P / 0.84 R)</span>
                  </div>

                  {/* Spatio-Temporal Plausibility Weight */}
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-indigo-900/40">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-indigo-300 font-semibold">Spatio-Temporal (W_st):</span>
                      <span className="font-mono text-indigo-400 font-bold">
                        {((weightSt / totalWeight) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.8"
                      step="0.05"
                      value={weightSt}
                      onChange={(e) => setWeightSt(parseFloat(e.target.value))}
                      className="w-full accent-indigo-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                    />
                    <span className="text-[10px] text-amber-500 mt-1 block">Transit feasibility curve</span>
                  </div>
                </div>
              </div>

              {/* Evaluated Candidates Comparison Cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Downstream Camera 02 Candidates Evaluated (Simultaneous Arrivals)
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Click any candidate to inspect fine-grid & tyre signatures
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {evaluated.map((c, idx) => {
                    const isSelected = selectedCandidateIndex === idx;
                    const isConfirmed = c.isGroundTruth && c.composite >= 0.76;
                    const isDisqualified = c.filterStatus === "REJECTED_TEMPORAL_IMPOSSIBILITY";

                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCandidateIndex(idx)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${
                          isConfirmed
                            ? "bg-emerald-950/20 border-emerald-500/80 shadow-lg shadow-emerald-950/40 ring-2 ring-emerald-500/50"
                            : isDisqualified
                            ? "bg-rose-950/20 border-rose-600/70 opacity-85"
                            : isSelected
                            ? "bg-slate-900 border-cyan-500/80 ring-1 ring-cyan-500/40"
                            : "bg-slate-950/80 border-slate-800 opacity-90 hover:border-slate-700"
                        }`}
                      >
                        {/* Candidate Card Header */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            {c.name}
                            <span className="text-[10px] font-mono text-slate-500">[{c.globalId}]</span>
                          </span>

                          {isConfirmed ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> MATCH CONFIRMED
                            </span>
                          ) : isDisqualified ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> SPEED ANOMALY
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> REJECTED
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-400 mb-3 flex items-center justify-between font-mono">
                          <span>Seen: {c.timeB}</span>
                          <span className={c.temporalPassed ? "text-cyan-300 font-bold" : "text-rose-400 font-bold"}>
                            Δt = {c.deltaT}s ({c.impliedSpeed} km/h)
                          </span>
                        </div>

                        {/* Breakdown Metrics */}
                        <div className="space-y-2 text-xs bg-slate-900/90 p-3 rounded-lg border border-slate-800 mb-3">
                          {/* 1. Visual Similarity: OSNet x1.0 (512-d) & DINOv2 Fallback */}
                          <div>
                            <div className="flex justify-between text-[11px] mb-0.5">
                              <span className="text-slate-400">1. OSNet x1.0 (512-d):</span>
                              <span className="font-mono text-cyan-400 font-bold">
                                {(c.osnetSim * 100).toFixed(0)}% (DINOv2: {(c.dinov2Sim * 100).toFixed(0)}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                              <div
                                className="bg-cyan-400 h-full rounded-full"
                                style={{ width: `${c.osnetSim * 100}%` }}
                              />
                            </div>
                          </div>

                          {/* 2. FASTag Grid Localization Match */}
                          <div>
                            <div className="flex justify-between text-[11px] mb-0.5">
                              <span className="text-slate-400">2. Windshield FASTag Grid:</span>
                              <span
                                className={`font-mono font-bold ${
                                  c.fastagScore >= 0.75 ? "text-emerald-400" : "text-rose-400"
                                }`}
                              >
                                {(c.fastagScore * 100).toFixed(0)}% (Δgrid={c.fastagGridDiff.gridSteps})
                              </span>
                            </div>
                            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  c.fastagScore >= 0.75 ? "bg-emerald-400" : "bg-rose-500"
                                }`}
                                style={{ width: `${c.fastagScore * 100}%` }}
                              />
                            </div>
                          </div>

                          {/* 3. Tyre Pressure Profiler Match */}
                          <div>
                            <div className="flex justify-between text-[11px] mb-0.5">
                              <span className="text-slate-400">3. Tyre Pressure Signature:</span>
                              <span
                                className={`font-mono font-bold ${
                                  c.pressureScore >= 0.75 ? "text-emerald-400" : "text-amber-400"
                                }`}
                              >
                                {(c.pressureScore * 100).toFixed(0)}% (RMSE={c.pressureRmse} PSI)
                              </span>
                            </div>
                            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  c.pressureScore >= 0.75 ? "bg-emerald-400" : "bg-amber-400"
                                }`}
                                style={{ width: `${c.pressureScore * 100}%` }}
                              />
                            </div>
                          </div>

                          {/* 4. YOLOv8m-t42 (NUST) Dent Defect Biometric */}
                          <div>
                            <div className="flex justify-between text-[11px] mb-0.5">
                              <span className="text-amber-300">4. YOLOv8m-t42 Dent Match:</span>
                              <span
                                className={`font-mono font-bold ${
                                  c.dentScore >= 0.75 ? "text-emerald-400" : "text-amber-400"
                                }`}
                              >
                                {(c.dentScore * 100).toFixed(0)}% ({c.dentMatchingCount > 0 ? "Fender Dent Matched" : "No Defect Match"})
                              </span>
                            </div>
                            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  c.dentScore >= 0.75 ? "bg-emerald-400" : "bg-amber-500"
                                }`}
                                style={{ width: `${c.dentScore * 100}%` }}
                              />
                            </div>
                          </div>

                          {/* 5. Spatio-Temporal Transit Plausibility */}
                          <div>
                            <div className="flex justify-between text-[11px] mb-0.5">
                              <span className="text-slate-400">5. Temporal Feasibility:</span>
                              <span
                                className={`font-mono font-bold ${
                                  c.temporalPassed ? "text-emerald-400" : "text-rose-400"
                                }`}
                              >
                                {(c.stScore * 100).toFixed(0)}% {c.temporalPassed ? "(Valid)" : "(Violated)"}
                              </span>
                            </div>
                            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  c.temporalPassed ? "bg-emerald-400" : "bg-rose-600"
                                }`}
                                style={{ width: `${c.stScore * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Card Footer: Fused Confidence Score */}
                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-300">Fused Confidence:</span>
                          <span
                            className={`text-lg font-mono font-black ${
                              isConfirmed ? "text-emerald-400" : isDisqualified ? "text-rose-400" : "text-slate-400"
                            }`}
                          >
                            {c.confidenceScore}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Windshield Fine-Grid Analysis Deep Dive */}
          {activeTab === "windshieldGrid" && (
            <div className="space-y-6">
              <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Grid className="w-4 h-4 text-cyan-400" />
                    Windshield Fine-Grid Coordinate Analysis
                  </h3>
                  <p className="text-xs text-slate-400">
                    Dividing each windshield into a 10×10 fine coordinate grid to record and compare FASTag placement as a unique geometric fingerprint.
                  </p>
                </div>
                <div className="px-3 py-1 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-800 text-xs font-mono">
                  100 Grid Cells (u, v ∈ [0.0, 1.0])
                </div>
              </div>

              {/* Windshield Coordinate Visualizer Canvas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Windshield Graphic Overlay */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col items-center">
                  <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-semibold text-white">Windshield Surface Coordinate Plane</span>
                    <span className="font-mono text-cyan-400">Aspect Ratio 16:9 • 1350mm × 750mm</span>
                  </div>

                  {/* Windshield Frame & Grid */}
                  <div className="relative w-full aspect-[16/9] bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl border-2 border-slate-700 overflow-hidden shadow-2xl p-4 flex items-center justify-center">
                    {/* Rearview mirror silhouette at center-top */}
                    <div className="absolute top-2 w-12 h-6 bg-slate-800 rounded-b-lg border-b border-x border-slate-600 shadow-md flex items-center justify-center">
                      <div className="w-3 h-1 bg-slate-500 rounded-full" />
                    </div>

                    {/* Windshield fine 10x10 coordinate grid */}
                    <div className="w-full h-full grid grid-cols-10 grid-rows-10 border border-slate-800/80 rounded-2xl overflow-hidden relative">
                      {Array.from({ length: 100 }).map((_, idx) => {
                        const gx = idx % 10;
                        const gy = Math.floor(idx / 10);
                        const isQueryCell = queryVehicle.fastag.gridX === gx && queryVehicle.fastag.gridY === gy;
                        const isCandCell = selectedCandidate.fastag.gridX === gx && selectedCandidate.fastag.gridY === gy;
                        const isSelected = selectedWindshieldCell?.gx === gx && selectedWindshieldCell?.gy === gy;

                        return (
                          <div
                            key={idx}
                            onClick={() => setSelectedWindshieldCell({ gx, gy })}
                            className={`border border-slate-800/40 relative flex items-center justify-center transition-colors cursor-pointer hover:bg-cyan-500/10 ${
                              isSelected ? "bg-cyan-500/20" : ""
                            }`}
                            title={`Cell [${gx}, ${gy}] • u=${(gx * 0.1 + 0.05).toFixed(2)}, v=${(gy * 0.1 + 0.05).toFixed(2)}`}
                          >
                            {/* Query Target FASTag Marker (Cyan) */}
                            {isQueryCell && (
                              <div
                                style={{
                                  transform: `rotate(${queryVehicle.fastag.tiltDeg}deg)`,
                                }}
                                className="w-7 h-4 bg-cyan-500 rounded border border-white text-[8px] font-bold text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/50 z-20"
                                title="Query Vehicle FASTag Placement"
                              >
                                Q
                              </div>
                            )}

                            {/* Candidate FASTag Marker (Amber or Emerald if matching) */}
                            {isCandCell && (
                              <div
                                style={{
                                  transform: `rotate(${selectedCandidate.fastag.tiltDeg}deg)`,
                                }}
                                className={`w-7 h-4 rounded border text-[8px] font-bold text-slate-950 flex items-center justify-center shadow-lg z-10 ${
                                  isQueryCell
                                    ? "bg-emerald-400 border-white translate-x-1 translate-y-1"
                                    : "bg-amber-400 border-amber-200"
                                }`}
                                title={`Candidate: ${selectedCandidate.name}`}
                              >
                                C{selectedCandidateIndex + 1}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Windshield Axis Labels */}
                    <div className="absolute bottom-1 text-[9px] font-mono text-slate-500">
                      Lateral Width u (0 = Left, 1 = Right)
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-4 text-xs mt-3 text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-cyan-500 inline-block border border-white" />
                      <span>Query FASTag [5, 1]</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-amber-400 inline-block border border-white" />
                      <span>{selectedCandidate.name} [{selectedCandidate.fastag.gridX}, {selectedCandidate.fastag.gridY}]</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-emerald-500 inline-block border border-white" />
                      <span>Exact Coordinate Alignment</span>
                    </span>
                  </div>
                </div>

                {/* Coordinate Comparison Audit Table */}
                <div className="space-y-4">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                      <span>FASTag Spatial Coordinates Comparison</span>
                      <span className="text-cyan-400 font-mono">
                        Comparing with {selectedCandidate.name}
                      </span>
                    </h4>

                    <div className="space-y-2 text-xs">
                      <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 font-mono text-center">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Query Grid (u, v)</span>
                          <span className="text-cyan-300 font-bold">
                            [{queryVehicle.fastag.gridX}, {queryVehicle.fastag.gridY}] ({queryVehicle.fastag.normX}, {queryVehicle.fastag.normY})
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Candidate Grid (u, v)</span>
                          <span className="text-amber-300 font-bold">
                            [{selectedCandidate.fastag.gridX}, {selectedCandidate.fastag.gridY}] ({selectedCandidate.fastag.normX}, {selectedCandidate.fastag.normY})
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Grid Cell Distance</span>
                          <span className={selectedCandidate.fastagGridDiff.gridSteps === 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                            Δ = {selectedCandidate.fastagGridDiff.gridSteps} steps
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Millimeter Offset from Mirror Center:</span>
                          <span className="font-mono text-white">
                            Query: ({queryVehicle.fastag.offsetMm.dx}mm, {queryVehicle.fastag.offsetMm.dy}mm) vs Candidate: ({selectedCandidate.fastag.offsetMm.dx}mm, {selectedCandidate.fastag.offsetMm.dy}mm)
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Normalized Euclidean Distance (Δnorm):</span>
                          <span className="font-mono text-cyan-300 font-bold">
                            {selectedCandidate.fastagDistanceNorm} (σ = 0.085)
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Placement Similarity Score:</span>
                          <span className="font-mono font-bold text-sm text-emerald-400">
                            {(selectedCandidate.fastagScore * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Explanatory Technical Note */}
                    <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-xl text-xs text-slate-300 space-y-1">
                      <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Why FASTag Placement Coordinates are Discriminative:</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        FASTag stickers are affixed manually by individual car owners, dealership delivery agents, or toll booth staff. Despite vehicle manufacturing uniformity, the placement $(u, v)$ coordinates exhibit substantial standard deviation across the population. Candidate 1 placed it at $[2, 1]$ (passenger top-left) and Candidate 3 at $[8, 2]$ (driver side), allowing instantaneous mathematical elimination without needing license plates.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Dynamic Tyre Pressure Profiler */}
          {activeTab === "tyrePressure" && (
            <div className="space-y-6">
              <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-emerald-400" />
                    Tyre Pressure Profiling & Disambiguation
                  </h3>
                  <p className="text-xs text-slate-400">
                    Capturing wheel pressure signatures when vehicles pass over the ground piezoelectric grid strip to disambiguate identical models arriving simultaneously.
                  </p>
                </div>
                <div className="px-3 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-xs font-mono">
                  Ground TPMS / WIM Sensor Active
                </div>
              </div>

              {/* 4-Wheel Top-Down Chassis Visualization */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Visual Chassis Diagram */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col items-center">
                  <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-4">
                    <span className="font-semibold text-white">4-Wheel Chassis Sensor Profile</span>
                    <span className="font-mono text-emerald-400">Tolerance: ±0.4 PSI Thermal Drift</span>
                  </div>

                  {/* Chassis outline */}
                  <div className="relative w-48 h-72 border-2 border-slate-700 rounded-3xl bg-slate-900/80 flex flex-col items-center justify-between p-3">
                    {/* Front direction arrow */}
                    <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <span>▲ FRONT AXLE</span>
                    </div>

                    {/* Front Left Wheel */}
                    <div className="absolute -left-5 top-8 bg-slate-950 border-2 border-cyan-500 rounded-lg p-2 text-center shadow-lg">
                      <span className="text-[9px] text-slate-400 block font-mono">FL</span>
                      <span className="text-xs font-mono font-bold text-cyan-300">
                        {queryVehicle.tyrePressure.wheelPressures["FL"]} PSI
                      </span>
                    </div>

                    {/* Front Right Wheel */}
                    <div className="absolute -right-5 top-8 bg-slate-950 border-2 border-cyan-500 rounded-lg p-2 text-center shadow-lg">
                      <span className="text-[9px] text-slate-400 block font-mono">FR</span>
                      <span className="text-xs font-mono font-bold text-cyan-300">
                        {queryVehicle.tyrePressure.wheelPressures["FR"]} PSI
                      </span>
                    </div>

                    {/* Rear Left Wheel */}
                    <div className="absolute -left-5 bottom-8 bg-slate-950 border-2 border-cyan-500 rounded-lg p-2 text-center shadow-lg">
                      <span className="text-[9px] text-slate-400 block font-mono">RL</span>
                      <span className="text-xs font-mono font-bold text-cyan-300">
                        {queryVehicle.tyrePressure.wheelPressures["RL"]} PSI
                      </span>
                    </div>

                    {/* Rear Right Wheel */}
                    <div className="absolute -right-5 bottom-8 bg-slate-950 border-2 border-cyan-500 rounded-lg p-2 text-center shadow-lg">
                      <span className="text-[9px] text-slate-400 block font-mono">RR</span>
                      <span className="text-xs font-mono font-bold text-cyan-300">
                        {queryVehicle.tyrePressure.wheelPressures["RR"]} PSI
                      </span>
                    </div>

                    {/* Center Mean Badge */}
                    <div className="bg-slate-950/90 border border-slate-700 p-2 rounded-xl text-center">
                      <span className="text-[10px] text-slate-400 block">Mean Profile</span>
                      <span className="text-sm font-mono font-black text-emerald-400">
                        {queryVehicle.tyrePressure.meanPressure} PSI
                      </span>
                      <span className="text-[9px] text-slate-500 block font-mono">
                        Asymmetry: {queryVehicle.tyrePressure.asymmetryIndex} PSI
                      </span>
                    </div>

                    {/* Rear direction indicator */}
                    <div className="text-[10px] text-slate-500 font-mono">
                      <span>▼ REAR AXLE</span>
                    </div>
                  </div>
                </div>

                {/* Candidate Comparative Wheel Breakdown Table */}
                <div className="space-y-4">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                      <span>Candidate Tyre Pressure Comparison</span>
                      <span className="text-emerald-400 font-mono">
                        {selectedCandidate.name}
                      </span>
                    </h4>

                    {/* Wheel by Wheel Delta Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left font-mono">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                            <th className="py-2 px-2.5">Wheel</th>
                            <th className="py-2 px-2.5">Query PSI</th>
                            <th className="py-2 px-2.5">Candidate PSI</th>
                            <th className="py-2 px-2.5 text-right">Delta (Δ PSI)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {["FL", "FR", "RL", "RR"].map((wheel) => {
                            const qVal = queryVehicle.tyrePressure.wheelPressures[wheel];
                            const cVal = selectedCandidate.tyrePressure.wheelPressures[wheel];
                            const diff = Math.abs(qVal - cVal);
                            const isClose = diff <= 0.4;

                            return (
                              <tr key={wheel} className="hover:bg-slate-900/50">
                                <td className="py-2 px-2.5 font-bold text-white font-sans">{wheel}</td>
                                <td className="py-2 px-2.5 text-cyan-300">{qVal.toFixed(1)}</td>
                                <td className="py-2 px-2.5 text-white">{cVal.toFixed(1)}</td>
                                <td className="py-2 px-2.5 text-right font-bold">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[11px] ${
                                      isClose
                                        ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800"
                                        : "bg-rose-950/60 text-rose-400 border border-rose-800"
                                    }`}
                                  >
                                    {diff.toFixed(2)} PSI
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Overall RMSE & Gaussian Score */}
                    <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Total Root Mean Square Error (RMSE):</span>
                        <span className="font-mono text-emerald-400 font-bold text-sm">
                          {selectedCandidate.pressureRmse} PSI
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Gaussian Kernel Similarity Score (σ = 1.35 PSI):</span>
                        <span className="font-mono text-emerald-400 font-bold text-sm">
                          {(selectedCandidate.pressureScore * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Physical Interpretation */}
                    <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-xs text-slate-300 space-y-1">
                      <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <Check className="w-4 h-4" />
                        <span>Disambiguation Verdict:</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Candidate 2 shows only a +0.2 PSI delta across all four tyres, perfectly aligning with expected isothermal road friction warming. Candidate 1 (+2.8 PSI higher) and Candidate 3 (-2.6 PSI underinflated) are decisively refuted by the road sensor strip despite identical Arctic White paint.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: YOLOv8m-t42 (NUST) Dent Forensics & Physical Vehicle Fingerprinting */}
          {activeTab === "dentDefects" && (
            <div className="space-y-6">
              <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-amber-400" />
                      YOLOv8m-t42 (NUST) Physical Dent Detection &amp; Panel Forensics
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      Precision: 0.86 • Recall: 0.84
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Real-time dent detection and insurance damage profiling. Uses panel deformities, scratches, and creases as physical biometrics to break identical coating ties without reading license plates.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-lg border border-slate-800 text-xs">
                  <span className="text-slate-400 text-[11px] px-1">Candidate:</span>
                  {evaluated.map((c, idx) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCandidateIndex(idx)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                        selectedCandidateIndex === idx
                          ? "bg-amber-500 text-slate-950 font-bold shadow"
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      Cand {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Side-by-Side Panel Diagram & Dent Localizer */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Query Vehicle Dent Profile */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider font-mono">
                        QUERY VEHICLE [CAM 01 ENTRY]
                      </span>
                      <h4 className="text-sm font-bold text-white">White Swift (GID-0042)</h4>
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800">
                      1 Defect Detected
                    </span>
                  </div>

                  {/* Vehicle Body Schematic with Dent Location Marker */}
                  <div className="relative aspect-[16/9] bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center p-4 overflow-hidden">
                    <div className="text-center space-y-1 z-10">
                      <div className="inline-block px-3 py-1 rounded bg-slate-950/90 border border-slate-700 text-xs font-bold text-white">
                        Arctic White Hatchback Silhouette
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Front Fender • Cabin • Rear Hatch
                      </div>
                    </div>

                    {/* Left Fender Dent Visual Crosshair Indicator */}
                    <div
                      className="absolute left-[26%] top-[38%] p-1.5 rounded-full bg-amber-500/20 border-2 border-amber-400 animate-pulse flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                      title="Left Fender Dent (YOLOv8m-t42)"
                    >
                      <div className="w-2 h-2 rounded-full bg-amber-400" />
                    </div>
                    <div className="absolute left-[26%] top-[56%] bg-slate-950/95 border border-amber-500/80 px-2 py-0.5 rounded text-[9px] font-mono text-amber-300 shadow">
                      YOLOv8m-t42: LEFT FENDER DENT (0.88 conf)
                    </div>
                  </div>

                  {/* Defect Telemetry Box */}
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-amber-900/40 space-y-2 text-xs font-mono">
                    <div className="flex justify-between items-center text-white">
                      <span className="font-bold text-amber-300">LEFT FENDER DENT</span>
                      <span className="text-emerald-400 font-bold">88% conf</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-400">
                      <div>Severity: <strong className="text-amber-300 uppercase">Minor</strong></div>
                      <div>Model: <strong className="text-slate-300">YOLOv8m-t42 (NUST)</strong></div>
                      <div>Audit Code: <strong className="text-slate-300">INS-AUD-0042-LEFT_FENDER</strong></div>
                      <div>Biometric Hash: <strong className="text-amber-400">Y8DENT-LEF-880</strong></div>
                    </div>
                  </div>
                </div>

                {/* Candidate Vehicle Dent Profile & Comparison */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider font-mono">
                        CANDIDATE #{selectedCandidateIndex + 1} [CAM 02 DOWNSTREAM]
                      </span>
                      <h4 className="text-sm font-bold text-white">{selectedCandidate.name}</h4>
                    </div>
                    <span
                      className={`text-xs font-mono px-2 py-0.5 rounded font-bold ${
                        selectedCandidate.dentScore >= 0.75
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : "bg-rose-950 text-rose-400 border border-rose-800"
                      }`}
                    >
                      {selectedCandidate.dentScore >= 0.75 ? "BIOMETRIC MATCH" : "DEFECT MISMATCH"}
                    </span>
                  </div>

                  {/* Candidate Schematic */}
                  <div className="relative aspect-[16/9] bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center p-4 overflow-hidden">
                    <div className="text-center space-y-1 z-10">
                      <div className="inline-block px-3 py-1 rounded bg-slate-950/90 border border-slate-700 text-xs font-bold text-white">
                        {selectedCandidate.name} Body Inspection
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {selectedCandidate.dentDefects.length > 0
                          ? `${selectedCandidate.dentDefects.length} Defect(s) Localized`
                          : "Pristine Panels (Zero Dents Detected)"}
                      </div>
                    </div>

                    {/* Candidate 2 Marker: Matching Left Fender Dent */}
                    {selectedCandidateIndex === 1 && (
                      <>
                        <div
                          className="absolute left-[27%] top-[37%] p-1.5 rounded-full bg-emerald-500/20 border-2 border-emerald-400 animate-pulse flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.6)]"
                          title="Left Fender Dent (YOLOv8m-t42)"
                        >
                          <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        </div>
                        <div className="absolute left-[27%] top-[55%] bg-slate-950/95 border border-emerald-500/80 px-2 py-0.5 rounded text-[9px] font-mono text-emerald-300 shadow">
                          MATCH: LEFT FENDER DENT (0.87 conf)
                        </div>
                      </>
                    )}

                    {/* Candidate 3 Marker: Mismatched Rear Bumper Crease */}
                    {selectedCandidateIndex === 2 && (
                      <>
                        <div
                          className="absolute right-[22%] bottom-[32%] p-1.5 rounded-full bg-rose-500/20 border-2 border-rose-400 animate-pulse flex items-center justify-center shadow-[0_0_12px_rgba(244,63,94,0.6)]"
                          title="Rear Bumper Crease (YOLOv8m-t42)"
                        >
                          <div className="w-2 h-2 rounded-full bg-rose-400" />
                        </div>
                        <div className="absolute right-[14%] bottom-[12%] bg-slate-950/95 border border-rose-500/80 px-2 py-0.5 rounded text-[9px] font-mono text-rose-300 shadow">
                          MISMATCH: REAR BUMPER CREASE (0.82 conf)
                        </div>
                      </>
                    )}
                  </div>

                  {/* Defect Match Audit Details */}
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
                    <div className="flex justify-between items-center text-white">
                      <span className="text-slate-400">Dent Biometric Match Score:</span>
                      <span
                        className={`font-bold text-sm ${
                          selectedCandidate.dentScore >= 0.75 ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        {(selectedCandidate.dentScore * 100).toFixed(1)}%
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 font-sans leading-relaxed pt-1 border-t border-slate-800">
                      {selectedCandidate.dentDetails}
                    </p>
                  </div>
                </div>
              </div>

              {/* Forensic ITS Verdict Card */}
              <div className="p-4 bg-slate-950/90 border border-amber-900/40 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">
                      Multi-Sensor Forensic Triangulation Verdict
                    </h4>
                    <p className="text-slate-400 text-[11px]">
                      YOLOv8m-t42 (Precision 0.86, Recall 0.84) panel defect fingerprinting combines with Windshield FASTag Grid [5,1] and Tyre Pressure Profiling (0.28 PSI RMSE) to establish absolute 1-to-1 vehicle identity without reading number plates.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Camera Color Histogram (Preserved & Enhanced) */}
          {activeTab === "histogram" && (
            <div className="space-y-4">
              <CameraHistogram
                selectedCameraId={selectedHistogramCamera}
                onSelectCamera={setSelectedHistogramCamera}
                vehicles={vehicles}
                queryColorHex="#f0f2f5"
                queryColorName="Arctic White"
              />
            </div>
          )}
        </div>

        {/* Modal Footer with Gemini 4 Deep Reasoning & Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Multi-Sensor Bayesian Fusion complies with zero-license-plate privacy standards.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                onRunAiAnalysis({
                  queryVehicle: {
                    ...queryVehicle,
                    fastagGrid: queryVehicle.fastag,
                    tyrePressures: queryVehicle.tyrePressure.wheelPressures,
                  },
                  candidates: evaluated.map((c) => ({
                    candidateId: c.name,
                    globalId: c.globalId,
                    visualEmbeddingSimilarity: c.rawVisualSim,
                    fastagCoordinates: {
                      gridX: c.fastag.gridX,
                      gridY: c.fastag.gridY,
                      normX: c.fastag.normX,
                      normY: c.fastag.normY,
                    },
                    fastagScore: c.fastagScore,
                    tyrePressuresPSI: c.tyrePressure.wheelPressures,
                    tyrePressureRMSE: c.pressureRmse,
                    tyrePressureScore: c.pressureScore,
                    travelTimeSeconds: c.deltaT,
                    impliedSpeedKmh: c.impliedSpeed,
                    temporalFilterStatus: c.filterStatus,
                    fusedConfidenceScore: c.confidenceScore,
                  })),
                  spatioTemporalPrior: {
                    distanceMeters: 500,
                    expectedMeanSeconds: expectedTransitMean,
                    stdDevSeconds: transitStdDev,
                    congestionRegime: congestionLevel,
                    weights: {
                      visualAppearance: weightApp,
                      windshieldGridFastag: weightFastag,
                      tyrePressureProfiling: weightPressure,
                      spatioTemporalPlausibility: weightSt,
                    },
                  },
                })
              }
              disabled={isAiLoading}
              className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg cursor-pointer disabled:opacity-50 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>{isAiLoading ? "Analyzing via Gemini 4..." : "Deep Audit via Gemini-4-Argon (High Thinking)"}</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition-colors cursor-pointer"
            >
              Close Lab
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
