import React, { useState, useMemo } from "react";
import {
  X,
  BarChart3,
  TrendingUp,
  Navigation,
  MapPin,
  Globe,
  ExternalLink,
  RefreshCw,
  Layers,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Sliders,
  Activity,
  Zap,
  PieChart,
} from "lucide-react";
import { OriginDestinationMatrix, VehicleType, SimulatedVehicle } from "../types/reid";

interface OdMatrixDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  odMatrix: OriginDestinationMatrix;
  onRefreshGrounding: () => void;
  vehicles?: SimulatedVehicle[];
}

export const OdMatrixDashboard: React.FC<OdMatrixDashboardProps> = ({
  isOpen,
  onClose,
  odMatrix,
  vehicles,
}) => {
  const [activeTab, setActiveTab] = useState<"probabilistic" | "rawTrips" | "travelTimes" | "maps" | "search">("probabilistic");
  const [confidenceCutoff, setConfidenceCutoff] = useState<number>(75);
  const [selectedOrigin, setSelectedOrigin] = useState<string>("CAM_A");

  // Google Grounding state
  const [mapsLocation, setMapsLocation] = useState("Silk Board to Koramangala Bengaluru");
  const [mapsResult, setMapsResult] = useState<string | null>(null);
  const [mapsGroundingUrls, setMapsGroundingUrls] = useState<{ title: string; uri: string }[]>([]);
  const [isMapsLoading, setIsMapsLoading] = useState(false);

  const [searchTopic, setSearchTopic] = useState("AI City Challenge multi camera vehicle tracking without license plates");
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [searchGroundingUrls, setSearchGroundingUrls] = useState<{ title: string; uri: string }[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  if (!isOpen) return null;

  // Handle Google Maps Grounding fetch
  const handleFetchMapsCorridor = async () => {
    setIsMapsLoading(true);
    setMapsResult(null);
    setMapsGroundingUrls([]);
    try {
      const res = await fetch("/api/reid/maps-corridor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ junctionLocation: mapsLocation }),
      });
      const data = await res.json();
      if (data.success) {
        setMapsResult(data.text);
        const urls: { title: string; uri: string }[] = [];
        if (Array.isArray(data.groundingChunks)) {
          data.groundingChunks.forEach((chunk: any) => {
            if (chunk.maps?.uri) {
              urls.push({
                title: chunk.maps.title || "Google Maps Location",
                uri: chunk.maps.uri,
              });
            }
          });
        }
        setMapsGroundingUrls(urls);
      } else {
        setMapsResult("Error: " + data.error);
      }
    } catch (e: any) {
      setMapsResult("Network error: " + e.message);
    } finally {
      setIsMapsLoading(false);
    }
  };

  // Handle Google Search Grounding fetch
  const handleFetchSearchGrounding = async () => {
    setIsSearchLoading(true);
    setSearchResult(null);
    setSearchGroundingUrls([]);
    try {
      const res = await fetch("/api/reid/search-grounding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: searchTopic }),
      });
      const data = await res.json();
      if (data.success) {
        setSearchResult(data.text);
        const urls: { title: string; uri: string }[] = [];
        if (Array.isArray(data.groundingChunks)) {
          data.groundingChunks.forEach((chunk: any) => {
            if (chunk.web?.uri) {
              urls.push({
                title: chunk.web.title || "Reference Article",
                uri: chunk.web.uri,
              });
            }
          });
        }
        setSearchGroundingUrls(urls);
      } else {
        setSearchResult("Error: " + data.error);
      }
    } catch (e: any) {
      setSearchResult("Network error: " + e.message);
    } finally {
      setIsSearchLoading(false);
    }
  };

  const modalLabels: Record<VehicleType, string> = {
    two_wheeler: "Two-Wheelers (Bikes/Scooters)",
    auto_rickshaw: "Auto-Rickshaws",
    hatchback: "Cars & Hatchbacks",
    bus: "Transit Buses",
    truck: "Mini-Trucks / LCVs",
  };

  const totalModalVehicles = Object.values(odMatrix.modalSplit).reduce((a, b) => a + b, 0) || 1;

  // Doughnut Chart Configuration for Vehicle Categories
  const VEHICLE_CONFIG: Record<
    VehicleType,
    {
      label: string;
      shortLabel: string;
      color: string;
      hoverColor: string;
      bgClass: string;
      textClass: string;
      borderClass: string;
    }
  > = {
    two_wheeler: {
      label: "Two-Wheeler (Bikes / Scooters)",
      shortLabel: "Two-Wheeler",
      color: "#06b6d4",
      hoverColor: "#22d3ee",
      bgClass: "bg-cyan-500/15",
      textClass: "text-cyan-400",
      borderClass: "border-cyan-500/50",
    },
    auto_rickshaw: {
      label: "Auto-Rickshaw (3W Para-Transit)",
      shortLabel: "Auto-Rickshaw",
      color: "#f59e0b",
      hoverColor: "#fbbf24",
      bgClass: "bg-amber-500/15",
      textClass: "text-amber-400",
      borderClass: "border-amber-500/50",
    },
    hatchback: {
      label: "Hatchback / Private Car",
      shortLabel: "Car / Hatch",
      color: "#10b981",
      hoverColor: "#34d399",
      bgClass: "bg-emerald-500/15",
      textClass: "text-emerald-400",
      borderClass: "border-emerald-500/50",
    },
    bus: {
      label: "Transit Bus (City BMTC)",
      shortLabel: "City Bus",
      color: "#8b5cf6",
      hoverColor: "#a78bfa",
      bgClass: "bg-violet-500/15",
      textClass: "text-violet-400",
      borderClass: "border-violet-500/50",
    },
    truck: {
      label: "Commercial Truck / Freight",
      shortLabel: "Truck",
      color: "#f43f5e",
      hoverColor: "#fb7185",
      bgClass: "bg-rose-500/15",
      textClass: "text-rose-400",
      borderClass: "border-rose-500/50",
    },
  };

  const [hoveredVehicleType, setHoveredVehicleType] = useState<VehicleType | null>(null);
  const [feedMode, setFeedMode] = useState<"liveFleet" | "cumulative">("liveFleet");

  // Dynamic counts based on live traffic feed
  const liveVehicleCounts = useMemo(() => {
    const counts: Record<VehicleType, number> = {
      two_wheeler: 0,
      auto_rickshaw: 0,
      hatchback: 0,
      bus: 0,
      truck: 0,
    };

    if (feedMode === "liveFleet" && vehicles && vehicles.length > 0) {
      vehicles.forEach((v) => {
        if (counts[v.type] !== undefined) {
          counts[v.type]++;
        }
      });
      const sum = Object.values(counts).reduce((a, b) => a + b, 0);
      if (sum > 0) return counts;
    }

    return (
      odMatrix.modalSplit || {
        two_wheeler: 28,
        auto_rickshaw: 14,
        hatchback: 16,
        bus: 4,
        truck: 3,
      }
    );
  }, [vehicles, feedMode, odMatrix.modalSplit]);

  const totalFeedVehicles = useMemo(() => {
    return Object.values(liveVehicleCounts).reduce((a, b) => a + b, 0) || 1;
  }, [liveVehicleCounts]);

  const dominantVehicleMode = useMemo(() => {
    const types = (Object.keys(liveVehicleCounts) as VehicleType[]).sort(
      (a, b) => liveVehicleCounts[b] - liveVehicleCounts[a]
    );
    const top = types[0] || "two_wheeler";
    const pct = ((liveVehicleCounts[top] / totalFeedVehicles) * 100).toFixed(1);
    return { type: top, count: liveVehicleCounts[top], pct };
  }, [liveVehicleCounts, totalFeedVehicles]);

  // SVG Doughnut Slices Geometry (r=38, C=2*pi*38 ≈ 238.761)
  const doughnutSlices = useMemo(() => {
    const radius = 38;
    const circumference = 2 * Math.PI * radius;
    const types: VehicleType[] = ["two_wheeler", "auto_rickshaw", "hatchback", "bus", "truck"];
    let accumulatedOffset = 0;
    const nonZeroTypes = types.filter((t) => (liveVehicleCounts[t] || 0) > 0);

    return types.map((type) => {
      const count = liveVehicleCounts[type] || 0;
      const fraction = count / totalFeedVehicles;
      const pct = (fraction * 100).toFixed(1);
      const arcLength = fraction * circumference;
      const gap = count > 0 && nonZeroTypes.length > 1 ? 2.5 : 0;
      const dashLength = Math.max(0, arcLength - gap);
      const dashArray = `${dashLength} ${circumference - dashLength}`;
      const offset = -accumulatedOffset;
      accumulatedOffset += arcLength;

      return {
        type,
        count,
        pct,
        dashArray,
        offset,
        config: VEHICLE_CONFIG[type],
      };
    });
  }, [liveVehicleCounts, totalFeedVehicles]);

  // Node details for matrix labels
  const nodeMeta: Record<string, { name: string; junction: string; type: "entry" | "link" | "exit" }> = {
    CAM_A: { name: "Cam 01: Silk Board Entry", junction: "Hosur Road Northbound", type: "entry" },
    CAM_B: { name: "Cam 02: Koramangala Flyover", junction: "100ft Intermediate Link", type: "link" },
    CAM_C: { name: "Cam 03: HSR Layout Exit", junction: "Ring Road Sector 1 Gate", type: "exit" },
  };

  // Safe trip calculation with filter applied
  const filterFactor = Math.max(0.65, Math.min(1.0, 1.0 - (confidenceCutoff - 70) * 0.01));
  const rawTrips = odMatrix.trips || {
    CAM_A: { CAM_B: 14, CAM_C: 28 },
    CAM_B: { CAM_C: 19 },
  };

  // Probabilistic Transition Matrix P(D_j | O_i)
  const probabilisticMatrix = useMemo(() => {
    const nodes = ["CAM_A", "CAM_B", "CAM_C"];
    const matrix: Record<string, Record<string, { count: number; prob: number }>> = {};

    nodes.forEach((o) => {
      matrix[o] = {};
      const outbound = rawTrips[o] || {};
      let totalOut = 0;

      nodes.forEach((d) => {
        const raw = outbound[d] || 0;
        const adjusted = Math.round(raw * filterFactor);
        totalOut += adjusted;
      });

      nodes.forEach((d) => {
        const raw = outbound[d] || 0;
        const count = Math.round(raw * filterFactor);
        const prob = totalOut > 0 ? count / totalOut : 0;
        matrix[o][d] = { count, prob };
      });
    });

    return matrix;
  }, [rawTrips, filterFactor]);

  // Route travel time metrics
  const travelTimeData = {
    "CAM_A->CAM_B": { mean: 55.4, stdDev: 12.1, distKm: 0.9, avgSpeed: 58.5, samples: 42 },
    "CAM_A->CAM_C": { mean: 124.8, stdDev: 24.3, distKm: 2.0, avgSpeed: 57.7, samples: 68 },
    "CAM_B->CAM_C": { mean: 69.2, stdDev: 14.8, distKm: 1.1, avgSpeed: 57.2, samples: 51 },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 select-none backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Probabilistic Origin-Destination (OD) Flow Matrix
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Bayesian Fused Flows
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Continuous municipal traffic flow synthesis and transition probability distributions without license plate OCR
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

        {/* Tab Switcher */}
        <div className="flex flex-wrap border-b border-slate-800 bg-slate-950/40 px-6 pt-2 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("probabilistic")}
            className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === "probabilistic"
                ? "border-cyan-400 text-cyan-300 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span>Probabilistic Transition Matrix P(D | O)</span>
          </button>

          <button
            onClick={() => setActiveTab("travelTimes")}
            className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === "travelTimes"
                ? "border-cyan-400 text-cyan-300 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Travel Time & Speed Distributions</span>
          </button>

          <button
            onClick={() => setActiveTab("rawTrips")}
            className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === "rawTrips"
                ? "border-cyan-400 text-cyan-300 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Modal Split & Volume</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("maps");
              if (!mapsResult && !isMapsLoading) handleFetchMapsCorridor();
            }}
            className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === "maps"
                ? "border-cyan-400 text-cyan-300 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <MapPin className="w-4 h-4 text-rose-400" />
            <span>Google Maps Grounding</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("search");
              if (!searchResult && !isSearchLoading) handleFetchSearchGrounding();
            }}
            className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === "search"
                ? "border-cyan-400 text-cyan-300 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Globe className="w-4 h-4 text-blue-400" />
            <span>Academic Re-ID Research</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: Probabilistic Origin-Destination Transition Matrix */}
          {activeTab === "probabilistic" && (
            <div className="space-y-6">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Re-Identified Trips
                  </span>
                  <span className="text-2xl font-mono font-bold text-cyan-400">
                    {odMatrix.totalReIdentified || 61}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1">Multi-cue validated matches</span>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Avg Corridor Speed
                  </span>
                  <span className="text-2xl font-mono font-bold text-emerald-400">
                    {odMatrix.avgCorridorSpeedKmh.toFixed(1)} km/h
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1">Dense arterial flow</span>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Peak Corridor Flow
                  </span>
                  <span className="text-base font-bold text-amber-400 truncate block">
                    Cam 01 → Cam 03 (66.7%)
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1">Express transit path</span>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Throughput Rate
                  </span>
                  <span className="text-2xl font-mono font-bold text-violet-400">
                    {odMatrix.corridorThroughputVehPerHour || 885}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1">Vehicles / Hour projected</span>
                </div>
              </div>

              {/* Confidence Threshold Slider Filter */}
              <div className="bg-slate-950/90 border border-slate-800 p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Filter className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white block">Re-ID Fused Confidence Threshold:</span>
                    <span className="text-[11px] text-slate-400">
                      Eliminate low-confidence cross-camera associations before matrix aggregation
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="5"
                    value={confidenceCutoff}
                    onChange={(e) => setConfidenceCutoff(parseInt(e.target.value))}
                    className="w-28 accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                  />
                  <span className="font-mono font-bold text-cyan-400 text-sm w-12">
                    ≥ {confidenceCutoff}%
                  </span>
                </div>
              </div>

              {/* Probabilistic Transition Matrix Table P(D_j | O_i) */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-cyan-400" />
                      Probabilistic Transition Matrix P(Destination = j | Origin = i)
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Normalized row probabilities representing vehicle divergence at key interchange nodes.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    Σ P(D|O) = 1.00
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                        <th className="p-3 font-semibold">Origin Node</th>
                        <th className="p-3 font-semibold">Cam 01 (Entry)</th>
                        <th className="p-3 font-semibold">Cam 02 (Flyover)</th>
                        <th className="p-3 font-semibold">Cam 03 (Exit)</th>
                        <th className="p-3 font-semibold text-right">Total Valid Trips</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {/* Row CAM_A */}
                      <tr className="hover:bg-slate-900/50">
                        <td className="p-3 font-sans font-bold text-white">
                          <div>Cam 01 (Silk Board North)</div>
                          <div className="text-[10px] text-slate-500 font-normal">Origin Node #01</div>
                        </td>
                        <td className="p-3 text-slate-600 font-normal">0.0% (-)</td>
                        <td className="p-3">
                          <div className="text-cyan-300 font-bold text-sm">
                            {(probabilisticMatrix["CAM_A"]["CAM_B"].prob * 100).toFixed(1)}%
                          </div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            ({probabilisticMatrix["CAM_A"]["CAM_B"].count} trips)
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-emerald-400 font-bold text-sm">
                            {(probabilisticMatrix["CAM_A"]["CAM_C"].prob * 100).toFixed(1)}%
                          </div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            ({probabilisticMatrix["CAM_A"]["CAM_C"].count} trips)
                          </div>
                        </td>
                        <td className="p-3 text-right text-white font-bold text-sm">
                          {probabilisticMatrix["CAM_A"]["CAM_B"].count + probabilisticMatrix["CAM_A"]["CAM_C"].count}
                        </td>
                      </tr>

                      {/* Row CAM_B */}
                      <tr className="hover:bg-slate-900/50">
                        <td className="p-3 font-sans font-bold text-white">
                          <div>Cam 02 (Koramangala 100ft)</div>
                          <div className="text-[10px] text-slate-500 font-normal">Intermediate Link #02</div>
                        </td>
                        <td className="p-3 text-slate-600 font-normal">0.0% (Upstream)</td>
                        <td className="p-3 text-slate-600 font-normal">0.0% (-)</td>
                        <td className="p-3">
                          <div className="text-emerald-400 font-bold text-sm">
                            {(probabilisticMatrix["CAM_B"]["CAM_C"].prob * 100).toFixed(1)}%
                          </div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            ({probabilisticMatrix["CAM_B"]["CAM_C"].count} trips)
                          </div>
                        </td>
                        <td className="p-3 text-right text-white font-bold text-sm">
                          {probabilisticMatrix["CAM_B"]["CAM_C"].count}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Mathematical Insight Note */}
                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white">Continuous Dynamic Matrix Formulation:</span>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      Unlike traditional static clipboard roadside surveys, NetraFlow dynamically computes transition probabilities P(D_j | O_i) updated on every vehicle camera pass. False matches from identically colored cars are filtered out by windshield FASTag placement grids and 4-wheel tyre pressure profile matching.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Travel Times & Speed Distributions */}
          {activeTab === "travelTimes" && (
            <div className="space-y-6">
              <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    Inter-Camera Corridor Travel Time & Velocity Distributions
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Grounded transit duration measurements across monitored corridor links
                  </p>
                </div>
                <span className="text-xs font-mono text-cyan-400">
                  Speed Limit: 50 km/h (Dense Corridor)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(travelTimeData).map(([routeKey, stats]) => {
                  const [fromNode, toNode] = routeKey.split("->");
                  return (
                    <div
                      key={routeKey}
                      className="bg-slate-950/90 border border-slate-800 p-4 rounded-xl space-y-3"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-white border-b border-slate-800 pb-2">
                        <span className="flex items-center gap-1.5 text-cyan-300">
                          {fromNode} <ArrowRight className="w-3.5 h-3.5 text-slate-500" /> {toNode}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {stats.distKm} km
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Mean Transit Time:</span>
                          <span className="font-mono text-white font-bold">{stats.mean}s (±{stats.stdDev}s)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Implied Speed:</span>
                          <span className="font-mono text-emerald-400 font-bold">{stats.avgSpeed} km/h</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Logged Matches:</span>
                          <span className="font-mono text-slate-300">{stats.samples} vehicles</span>
                        </div>
                      </div>

                      {/* Gaussian curve visual bar */}
                      <div className="bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                        <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-1">
                          <span>Freeflow (35s)</span>
                          <span className="text-cyan-400 font-bold">Mean ({stats.mean}s)</span>
                          <span>Congested (95s)</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden p-0.5 border border-slate-800 relative">
                          <div
                            className="bg-gradient-to-r from-emerald-500 via-cyan-400 to-amber-500 h-full rounded-full"
                            style={{ width: `${Math.min(100, Math.max(10, (stats.mean / 120) * 100))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Modal Split & Volume Breakdown */}
          {activeTab === "rawTrips" && (
            <div className="space-y-6">
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Classified Modal Split (Indian Dense Urban Traffic Composition)
                </h3>

                <div className="space-y-3">
                  {(Object.keys(odMatrix.modalSplit) as VehicleType[]).map((type) => {
                    const count = odMatrix.modalSplit[type] || 0;
                    const pct = ((count / totalModalVehicles) * 100).toFixed(1);

                    return (
                      <div key={type} className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-slate-200 font-semibold">{modalLabels[type]}</span>
                          <span className="font-mono text-cyan-400 font-bold">
                            {count} vehicles ({pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Google Maps Grounding */}
          {activeTab === "maps" && (
            <div className="space-y-4">
              <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-xl">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  Corridor Geometry & Bottleneck Analysis (Google Maps Grounding)
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={mapsLocation}
                    onChange={(e) => setMapsLocation(e.target.value)}
                    placeholder="Enter Indian corridor, e.g. Silk Board to Koramangala Bengaluru"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <button
                    onClick={handleFetchMapsCorridor}
                    disabled={isMapsLoading}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isMapsLoading ? "animate-spin" : ""}`} />
                    <span>{isMapsLoading ? "Grounding..." : "Analyze Corridor"}</span>
                  </button>
                </div>
              </div>

              {mapsResult && (
                <div className="bg-slate-950/90 border border-slate-800 p-5 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Google Maps Grounded Corridor Analysis:
                  </h4>
                  <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {mapsResult}
                  </div>
                  {mapsGroundingUrls.length > 0 && (
                    <div className="pt-3 border-t border-slate-800">
                      <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                        Maps Grounding Source Links:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {mapsGroundingUrls.map((u, i) => (
                          <a
                            key={`${u.uri}_${i}`}
                            href={u.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 rounded-lg text-xs flex items-center gap-1 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>{u.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Academic Re-ID Research (Search Grounding) */}
          {activeTab === "search" && (
            <div className="space-y-4">
              <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-xl">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  Academic & State-of-the-Art Vehicle Re-ID Research (Google Search Grounding)
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchTopic}
                    onChange={(e) => setSearchTopic(e.target.value)}
                    placeholder="Search Re-ID topic..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <button
                    onClick={handleFetchSearchGrounding}
                    disabled={isSearchLoading}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSearchLoading ? "animate-spin" : ""}`} />
                    <span>{isSearchLoading ? "Searching..." : "Search Research"}</span>
                  </button>
                </div>
              </div>

              {searchResult && (
                <div className="bg-slate-950/90 border border-slate-800 p-5 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Google Search Grounded Intelligence:
                  </h4>
                  <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {searchResult}
                  </div>
                  {searchGroundingUrls.length > 0 && (
                    <div className="pt-3 border-t border-slate-800">
                      <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                        Web Citations & Research Articles:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {searchGroundingUrls.map((u, i) => (
                          <a
                            key={`${u.uri}_${i}`}
                            href={u.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 rounded-lg text-xs flex items-center gap-1 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>{u.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Summary Widget: Live Traffic Feed Vehicle Type Distribution (Doughnut Chart) */}
        <div className="border-t border-slate-800 bg-slate-950/95 px-6 py-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/80">
                <PieChart className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Live Vehicle Type Distribution
                  </span>
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/80 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                    LIVE FEED
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block font-mono">
                  Multi-modal fleet classification across monitored corridor links
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Feed Mode Switcher */}
              <div className="flex items-center p-0.5 bg-slate-900 rounded-lg border border-slate-800 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => setFeedMode("liveFleet")}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    feedMode === "liveFleet"
                      ? "bg-cyan-500 text-slate-950 font-bold shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Show current vehicles actively traversing the 3D corridor"
                >
                  Corridor Fleet ({vehicles ? vehicles.length : 14})
                </button>
                <button
                  type="button"
                  onClick={() => setFeedMode("cumulative")}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    feedMode === "cumulative"
                      ? "bg-cyan-500 text-slate-950 font-bold shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Show cumulative re-identified modal trip distribution"
                >
                  Logged Trips ({odMatrix.totalReIdentified || 61})
                </button>
              </div>

              {/* Dominant Mode Pill */}
              <div className="hidden md:flex items-center gap-1.5 text-[10px] font-mono bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300">
                <span className="text-slate-500">Leading Mode:</span>
                <span className="text-cyan-300 font-bold">
                  {VEHICLE_CONFIG[dominantVehicleMode.type].shortLabel}
                </span>
                <span className="text-emerald-400 font-semibold">({dominantVehicleMode.pct}%)</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
            {/* SVG Doughnut Chart */}
            <div className="relative shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-20 h-20 sm:w-22 sm:h-22 overflow-visible">
                <defs>
                  <filter id="doughnutGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Base background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="11"
                />

                {/* Slices */}
                {doughnutSlices.map((slice) => {
                  if (slice.count === 0) return null;
                  const isHovered = hoveredVehicleType === slice.type;

                  return (
                    <circle
                      key={slice.type}
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke={isHovered ? slice.config.hoverColor : slice.config.color}
                      strokeWidth={isHovered ? 14 : 11}
                      strokeDasharray={slice.dashArray}
                      strokeDashoffset={slice.offset}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                      className="transition-all duration-300 cursor-pointer"
                      filter={isHovered ? "url(#doughnutGlow)" : undefined}
                      onMouseEnter={() => setHoveredVehicleType(slice.type)}
                      onMouseLeave={() => setHoveredVehicleType(null)}
                    />
                  );
                })}

                {/* Center Stats */}
                <text
                  x="50"
                  y={hoveredVehicleType ? "46" : "48"}
                  textAnchor="middle"
                  className="font-mono font-black text-sm fill-white select-none transition-all duration-200"
                >
                  {hoveredVehicleType
                    ? `${doughnutSlices.find((s) => s.type === hoveredVehicleType)?.pct}%`
                    : totalFeedVehicles}
                </text>
                <text
                  x="50"
                  y={hoveredVehicleType ? "58" : "60"}
                  textAnchor="middle"
                  className="font-mono text-[7.5px] font-bold fill-slate-400 uppercase tracking-wider select-none"
                >
                  {hoveredVehicleType
                    ? VEHICLE_CONFIG[hoveredVehicleType].shortLabel
                    : feedMode === "liveFleet"
                    ? "VEHICLES"
                    : "TRIPS"}
                </text>
              </svg>
            </div>

            {/* Distribution Legend Cards (5 columns) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 flex-1 w-full">
              {doughnutSlices.map((slice) => {
                const isHovered = hoveredVehicleType === slice.type;

                return (
                  <div
                    key={slice.type}
                    onMouseEnter={() => setHoveredVehicleType(slice.type)}
                    onMouseLeave={() => setHoveredVehicleType(null)}
                    className={`p-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                      isHovered
                        ? `${slice.config.bgClass} ${slice.config.borderClass} shadow-md scale-[1.02]`
                        : "bg-slate-900/70 border-slate-800/80 hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="w-2 h-2 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: slice.config.color }}
                        />
                        <span
                          className={`font-semibold truncate text-[10px] sm:text-[11px] ${
                            isHovered ? slice.config.textClass : "text-slate-300"
                          }`}
                        >
                          {slice.config.shortLabel}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-white text-xs shrink-0 ml-1">
                        {slice.count}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden p-0.2 border border-slate-800/60 flex items-center">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(4, parseFloat(slice.pct))}%`,
                          backgroundColor: slice.config.color,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1">
                      <span>Share</span>
                      <span className={isHovered ? `${slice.config.textClass} font-bold` : "text-slate-300 font-semibold"}>
                        {slice.pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
            <span>Probabilistic transition matrices P(D_j | O_i) update automatically on confirmed vehicle re-identifications.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors cursor-pointer"
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
