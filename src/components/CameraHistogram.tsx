import React, { useState, useMemo } from "react";
import {
  BarChart3,
  Camera,
  Layers,
  AlertTriangle,
  Info,
  CheckCircle,
  Eye,
  Sliders,
  Sparkles,
  Car,
  Filter,
  TrendingUp,
} from "lucide-react";
import { SimulatedVehicle, VehicleType } from "../types/reid";

interface CameraHistogramProps {
  selectedCameraId?: "CAM_A" | "CAM_B" | "CAM_C";
  onSelectCamera?: (camId: "CAM_A" | "CAM_B" | "CAM_C") => void;
  vehicles?: SimulatedVehicle[];
  queryColorHex?: string;
  queryColorName?: string;
  className?: string;
}

interface ColorBucket {
  name: string;
  hex: string;
  count: number;
  percentage: number;
  vehicleTypes: VehicleType[];
  isQueryMatch: boolean;
  ambiguityLevel: "critical" | "high" | "medium" | "low";
  cosineSimToQuery: number;
}

const CAMERA_INFO = {
  CAM_A: {
    id: "CAM_A" as const,
    label: "Camera 01",
    name: "Silk Board North Entry",
    location: "Hosur Road Junction Approach",
    baselineDistribution: [
      { name: "Arctic White", hex: "#f0f2f5", count: 14, types: ["hatchback", "truck"] },
      { name: "Silky Silver", hex: "#cbd5e1", count: 9, types: ["hatchback", "truck"] },
      { name: "Pearl White", hex: "#ffffff", count: 6, types: ["two_wheeler", "hatchback"] },
      { name: "Magma Grey", hex: "#475569", count: 5, types: ["hatchback"] },
      { name: "Gloss Black", hex: "#18181b", count: 7, types: ["two_wheeler"] },
      { name: "Classic Yellow", hex: "#eab308", count: 8, types: ["auto_rickshaw"] },
      { name: "CNG Green", hex: "#15803d", count: 5, types: ["auto_rickshaw"] },
      { name: "Blazing Red", hex: "#dc2626", count: 4, types: ["hatchback", "two_wheeler"] },
      { name: "Transit Blue", hex: "#0284c7", count: 3, types: ["bus"] },
    ],
  },
  CAM_B: {
    id: "CAM_B" as const,
    label: "Camera 02",
    name: "Koramangala 100ft Flyover",
    location: "Downstream Disambiguation Zone (500m)",
    baselineDistribution: [
      { name: "Arctic White", hex: "#f0f2f5", count: 16, types: ["hatchback", "truck"] },
      { name: "Silky Silver", hex: "#cbd5e1", count: 11, types: ["hatchback"] },
      { name: "Pearl White", hex: "#ffffff", count: 7, types: ["hatchback", "two_wheeler"] },
      { name: "Gloss Black", hex: "#18181b", count: 8, types: ["two_wheeler"] },
      { name: "Classic Yellow", hex: "#eab308", count: 9, types: ["auto_rickshaw"] },
      { name: "Magma Grey", hex: "#475569", count: 4, types: ["hatchback"] },
      { name: "Blazing Red", hex: "#dc2626", count: 5, types: ["hatchback"] },
      { name: "CNG Green", hex: "#15803d", count: 4, types: ["auto_rickshaw"] },
      { name: "Transit Blue", hex: "#0284c7", count: 3, types: ["bus"] },
    ],
  },
  CAM_C: {
    id: "CAM_C" as const,
    label: "Camera 03",
    name: "HSR Layout Sector 1 Gate",
    location: "Ring Road Interchange Exit (1.6km)",
    baselineDistribution: [
      { name: "Arctic White", hex: "#f0f2f5", count: 12, types: ["hatchback", "truck"] },
      { name: "Silky Silver", hex: "#cbd5e1", count: 8, types: ["hatchback"] },
      { name: "Pearl White", hex: "#ffffff", count: 5, types: ["hatchback"] },
      { name: "Gloss Black", hex: "#18181b", count: 6, types: ["two_wheeler"] },
      { name: "Classic Yellow", hex: "#eab308", count: 7, types: ["auto_rickshaw"] },
      { name: "Blazing Red", hex: "#dc2626", count: 6, types: ["hatchback", "two_wheeler"] },
      { name: "Transit Blue", hex: "#0284c7", count: 4, types: ["bus"] },
      { name: "Magma Grey", hex: "#475569", count: 3, types: ["hatchback"] },
    ],
  },
};

export const CameraHistogram: React.FC<CameraHistogramProps> = ({
  selectedCameraId = "CAM_B",
  onSelectCamera,
  vehicles = [],
  queryColorHex = "#f0f2f5",
  queryColorName = "Arctic White",
  className = "",
}) => {
  const [internalCam, setInternalCam] = useState<"CAM_A" | "CAM_B" | "CAM_C">(selectedCameraId);
  const [activeTab, setActiveTab] = useState<"histogram" | "confusion" | "crossCam">("histogram");
  const [selectedColorFilter, setSelectedColorFilter] = useState<string | null>("Arctic White");
  const [showLiveOnly, setShowLiveOnly] = useState<boolean>(false);

  const activeCamId = onSelectCamera ? selectedCameraId : internalCam;
  const setCam = (id: "CAM_A" | "CAM_B" | "CAM_C") => {
    setInternalCam(id);
    if (onSelectCamera) onSelectCamera(id);
  };

  const cameraMeta = CAMERA_INFO[activeCamId];

  // Extract live vehicles passing or sighted in this camera
  const liveCameraVehicles = useMemo(() => {
    if (!vehicles || vehicles.length === 0) return [];
    return vehicles.filter((v) => {
      // Checked via sightings
      const hasSighting = v.sightings && v.sightings.some((s) => s.cameraId === activeCamId);
      if (hasSighting) return true;

      // Position catchment in 3D corridor space
      const x = v.currentPosition ? v.currentPosition[0] : 0;
      if (activeCamId === "CAM_A" && x < -20) return true;
      if (activeCamId === "CAM_B" && x >= -20 && x <= 20) return true;
      if (activeCamId === "CAM_C" && x > 20) return true;
      return false;
    });
  }, [vehicles, activeCamId]);

  // Calculate Color Distribution & Ambiguity
  const colorBuckets = useMemo<ColorBucket[]>(() => {
    // If liveOnly is requested and we have sufficient live vehicles
    const useLive = showLiveOnly && liveCameraVehicles.length >= 3;
    const countsMap = new Map<string, { hex: string; count: number; types: Set<VehicleType> }>();

    if (useLive) {
      liveCameraVehicles.forEach((v) => {
        const name = v.colorName || "Arctic White";
        const hex = v.primaryColorHex || "#f0f2f5";
        const entry = countsMap.get(name) || { hex, count: 0, types: new Set<VehicleType>() };
        entry.count += 1;
        entry.types.add(v.type);
        countsMap.set(name, entry);
      });
    } else {
      // Baseline weighted with live detections
      cameraMeta.baselineDistribution.forEach((item) => {
        countsMap.set(item.name, {
          hex: item.hex,
          count: item.count,
          types: new Set(item.types as VehicleType[]),
        });
      });

      // Increment with live detected vehicles to keep it dynamic
      liveCameraVehicles.forEach((v) => {
        const name = v.colorName;
        if (name && countsMap.has(name)) {
          const entry = countsMap.get(name)!;
          entry.count += 1;
          entry.types.add(v.type);
        } else if (name) {
          countsMap.set(name, {
            hex: v.primaryColorHex || "#94a3b8",
            count: 1,
            types: new Set([v.type]),
          });
        }
      });
    }

    let total = 0;
    countsMap.forEach((val) => {
      total += val.count;
    });
    if (total === 0) total = 1;

    const buckets: ColorBucket[] = [];
    countsMap.forEach((val, name) => {
      const percentage = (val.count / total) * 100;
      const isQueryMatch =
        name.toLowerCase().includes("white") ||
        val.hex.toLowerCase() === queryColorHex.toLowerCase();

      // Cosine similarity proxy to Arctic White
      let cosineSim = 0.42;
      let ambiguity: "critical" | "high" | "medium" | "low" = "low";

      if (name === "Arctic White") {
        cosineSim = 0.99;
        ambiguity = "critical";
      } else if (name === "Pearl White") {
        cosineSim = 0.93;
        ambiguity = "critical";
      } else if (name === "Silky Silver") {
        cosineSim = 0.88;
        ambiguity = "high";
      } else if (name === "Magma Grey") {
        cosineSim = 0.72;
        ambiguity = "medium";
      } else if (name === "Gloss Black") {
        cosineSim = 0.54;
        ambiguity = "low";
      }

      buckets.push({
        name,
        hex: val.hex,
        count: val.count,
        percentage,
        vehicleTypes: Array.from(val.types),
        isQueryMatch,
        ambiguityLevel: ambiguity,
        cosineSimToQuery: cosineSim,
      });
    });

    // Sort by count descending
    return buckets.sort((a, b) => b.count - a.count);
  }, [liveCameraVehicles, cameraMeta, queryColorHex, showLiveOnly]);

  const totalVehiclesCount = useMemo(
    () => colorBuckets.reduce((sum, b) => sum + b.count, 0),
    [colorBuckets]
  );

  // Total percentage of vehicles in the "White/Silver" ambiguous cluster
  const whiteSilverClusterShare = useMemo(() => {
    const whiteSilver = colorBuckets
      .filter((b) => b.name.includes("White") || b.name.includes("Silver"))
      .reduce((sum, b) => sum + b.count, 0);
    return totalVehiclesCount > 0 ? (whiteSilver / totalVehiclesCount) * 100 : 0;
  }, [colorBuckets, totalVehiclesCount]);

  const selectedBucket = useMemo(
    () => colorBuckets.find((b) => b.name === selectedColorFilter) || colorBuckets[0],
    [colorBuckets, selectedColorFilter]
  );

  return (
    <div className={`bg-slate-950/90 border border-slate-800 rounded-xl overflow-hidden flex flex-col ${className}`}>
      {/* Header with Camera Tabs & Controls */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                Camera Color Distribution Histogram
              </h3>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                Visual Signature Analysis
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live spectrum of detected vehicle colors to pinpoint visual collision risks with query target
            </p>
          </div>
        </div>

        {/* Camera Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          {(["CAM_A", "CAM_B", "CAM_C"] as const).map((camKey) => {
            const cam = CAMERA_INFO[camKey];
            const isActive = activeCamId === camKey;
            return (
              <button
                key={camKey}
                onClick={() => setCam(camKey)}
                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? "bg-cyan-500 text-slate-950 shadow-md font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{cam.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? "bg-slate-950/30 text-slate-900" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {camKey === "CAM_A" ? "Entry" : camKey === "CAM_B" ? "Flyover" : "Exit"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-bar: Camera details & view mode toggles */}
      <div className="px-4 py-2.5 bg-slate-900/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-slate-300">
            <span className="font-semibold text-white">{cameraMeta.name}</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">{cameraMeta.location}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
            <span>Feed Detections:</span>
            <span className="font-bold text-cyan-400">{totalVehiclesCount}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Live vs Baseline toggle */}
          <button
            onClick={() => setShowLiveOnly(!showLiveOnly)}
            className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
              showLiveOnly
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
            }`}
            title="Toggle between real-time camera sightings and calibrated traffic fleet profile"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${showLiveOnly ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
            <span>{showLiveOnly ? "Active Corridor Sightings Only" : "Aggregated Feed Profile"}</span>
          </button>

          {/* View Mode Buttons */}
          <div className="flex bg-slate-950 p-0.5 rounded border border-slate-800 text-[11px]">
            <button
              onClick={() => setActiveTab("histogram")}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                activeTab === "histogram" ? "bg-slate-800 text-cyan-300 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Histogram
            </button>
            <button
              onClick={() => setActiveTab("confusion")}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                activeTab === "confusion" ? "bg-slate-800 text-cyan-300 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Collision Matrix
            </button>
            <button
              onClick={() => setActiveTab("crossCam")}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                activeTab === "crossCam" ? "bg-slate-800 text-cyan-300 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Cross-Camera Drift
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 space-y-4">
        {/* KPI Strip: Ambiguity Index & Query Collision Risk */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">Monitored Target Color</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-slate-400 shadow-inner"
                  style={{ backgroundColor: queryColorHex }}
                />
                <span className="text-xs font-bold text-white">{queryColorName}</span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800">
              Query Vehicle
            </span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">White/Silver Cluster Share</span>
              <div className="text-sm font-bold font-mono text-amber-400 mt-0.5">
                {whiteSilverClusterShare.toFixed(1)}% of fleet
              </div>
            </div>
            <AlertTriangle className="w-4 h-4 text-amber-400 opacity-80" />
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">Visual Collision Ambiguity</span>
              <div className="text-xs font-bold text-rose-400 mt-0.5 flex items-center gap-1">
                <span>CRITICAL RISK</span>
                <span className="text-[10px] font-normal text-slate-400">(Sim &gt; 0.88)</span>
              </div>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800 font-mono">
              Bayesian Prior Req.
            </span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">Disambiguation Need</span>
              <div className="text-xs font-bold text-emerald-400 mt-0.5">
                Micro-cues + Spatio-temporal
              </div>
            </div>
            <Sparkles className="w-4 h-4 text-emerald-400 opacity-80" />
          </div>
        </div>

        {/* Tab 1: Color Frequency Histogram */}
        {activeTab === "histogram" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left 2 Cols: The Histogram Bar Rows */}
            <div className="lg:col-span-2 space-y-2 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                <span className="font-semibold uppercase tracking-wider text-[11px]">
                  Detected Color Classes ({colorBuckets.length} bins)
                </span>
                <span className="text-[11px]">
                  Click any color to inspect visual collision risk
                </span>
              </div>

              <div className="space-y-2 pt-1 max-h-[300px] overflow-y-auto pr-1">
                {colorBuckets.map((bucket) => {
                  const isSelected = selectedColorFilter === bucket.name;
                  const isCritical = bucket.ambiguityLevel === "critical";
                  const isHigh = bucket.ambiguityLevel === "high";

                  return (
                    <div
                      key={bucket.name}
                      onClick={() => setSelectedColorFilter(bucket.name)}
                      className={`group p-2 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-slate-800/90 border-cyan-500/80 shadow-md ring-1 ring-cyan-500/30"
                          : "bg-slate-950/60 border-slate-800/70 hover:bg-slate-800/50 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          {/* Color Swatch */}
                          <div className="relative">
                            <span
                              className="w-4 h-4 rounded-md inline-block shadow-sm border border-slate-600 group-hover:scale-110 transition-transform"
                              style={{ backgroundColor: bucket.hex }}
                            />
                            {bucket.isQueryMatch && (
                              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-slate-950" />
                            )}
                          </div>

                          <span className="font-semibold text-slate-200 group-hover:text-white flex items-center gap-1.5">
                            {bucket.name}
                            {bucket.name === queryColorName && (
                              <span className="text-[9px] font-mono bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded border border-cyan-500/40">
                                TARGET
                              </span>
                            )}
                          </span>

                          {/* Vehicle type tags */}
                          <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-500">
                            {bucket.vehicleTypes.map((t) => (
                              <span key={t} className="capitalize">
                                {t.replace("_", " ")}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Frequency Metrics */}
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          {isCritical && (
                            <span className="text-[9px] font-sans font-bold text-rose-400 bg-rose-950/50 px-1.5 py-0.2 rounded border border-rose-900/60">
                              HIGH COLLISION
                            </span>
                          )}
                          {isHigh && (
                            <span className="text-[9px] font-sans font-bold text-amber-400 bg-amber-950/50 px-1.5 py-0.2 rounded border border-amber-900/60">
                              AMBIGUOUS
                            </span>
                          )}
                          <span className="text-slate-400">{bucket.count} veh</span>
                          <span className="font-bold text-cyan-400 min-w-[42px] text-right">
                            {bucket.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Distribution Bar */}
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full rounded-full transition-all duration-500 relative"
                          style={{
                            width: `${Math.max(6, bucket.percentage)}%`,
                            backgroundColor: bucket.hex === "#18181b" ? "#334155" : bucket.hex,
                            filter: bucket.hex === "#ffffff" ? "brightness(0.95)" : "none",
                          }}
                        >
                          {bucket.isQueryMatch && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent animate-pulse" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 1 Col: Selected Color Signature Inspection & Ambiguity Details */}
            <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-md border border-slate-500 shadow-inner"
                      style={{ backgroundColor: selectedBucket.hex }}
                    />
                    <h4 className="text-xs font-bold text-white">{selectedBucket.name}</h4>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-400 font-bold">
                    {selectedBucket.count} vehicles ({selectedBucket.percentage.toFixed(1)}%)
                  </span>
                </div>

                {/* Similarity to Query Vehicle */}
                <div className="space-y-3 text-xs">
                  <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80">
                    <span className="text-slate-400 text-[11px] block mb-1">
                      Visual Embedding Similarity to Query Vehicle ({queryColorName}):
                    </span>
                    <div className="flex items-center justify-between font-mono font-bold text-sm">
                      <span
                        className={
                          selectedBucket.cosineSimToQuery >= 0.9
                            ? "text-rose-400"
                            : selectedBucket.cosineSimToQuery >= 0.8
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }
                      >
                        Cos Sim: {(selectedBucket.cosineSimToQuery * 100).toFixed(0)}%
                      </span>
                      <span className="text-[10px] text-slate-400 font-sans font-normal">
                        Embedding Overlap
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                      <div
                        className={`h-full rounded-full ${
                          selectedBucket.cosineSimToQuery >= 0.9
                            ? "bg-rose-500"
                            : selectedBucket.cosineSimToQuery >= 0.8
                            ? "bg-amber-400"
                            : "bg-emerald-400"
                        }`}
                        style={{ width: `${selectedBucket.cosineSimToQuery * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Disambiguation Insight */}
                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-slate-300 font-bold mb-1 text-[11px]">
                      <Info className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Signature Ambiguity Impact:</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {selectedBucket.ambiguityLevel === "critical"
                        ? `Because ${selectedBucket.percentage.toFixed(0)}% of vehicles at ${cameraMeta.label} share this identical hue, pure appearance Re-ID causes severe false matches. Sighting requires micro-cues (FASTag, dents, roof racks) & spatio-temporal transit window verification.`
                        : selectedBucket.ambiguityLevel === "high"
                        ? `Silver and light metallic vehicles exhibit high cosine proximity (0.88+) to white due to road glare and sunlight reflection, necessitating robust Bayesian weight tuning.`
                        : `Distinct visual signature with low false positive collision rate. Sighting can be resolved with standard CNN embedding similarity.`}
                    </p>
                  </div>

                  {/* Typical Vehicle Classes */}
                  <div className="text-[11px] text-slate-400">
                    <span className="block mb-1 font-semibold text-slate-300">Observed Modalities:</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedBucket.vehicleTypes.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 capitalize text-[10px] border border-slate-700"
                        >
                          {t.replace("_", " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Action */}
              <div className="pt-3 border-t border-slate-800 mt-3 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Camera Focal Distance:</span>
                <span className="font-mono text-cyan-300 font-semibold">14m Pole Height</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Pairwise Signature Collision Matrix */}
        {activeTab === "confusion" && (
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Color Signature Pairwise Collision Matrix
                </h4>
                <p className="text-xs text-slate-400">
                  Cosine distance confusion between common vehicle coatings under Indian ambient sunlight
                </p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                Appearance Ambiguity Map
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="py-2 px-3 font-semibold">Base Color</th>
                    <th className="py-2 px-3 font-semibold">Arctic White</th>
                    <th className="py-2 px-3 font-semibold">Silky Silver</th>
                    <th className="py-2 px-3 font-semibold">Pearl White</th>
                    <th className="py-2 px-3 font-semibold">Magma Grey</th>
                    <th className="py-2 px-3 font-semibold">Gloss Black</th>
                    <th className="py-2 px-3 font-semibold">Confusion Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-bold text-white flex items-center gap-1.5 font-sans">
                      <span className="w-3 h-3 rounded-full bg-[#f0f2f5] border border-slate-400 inline-block" />
                      Arctic White
                    </td>
                    <td className="py-2 px-3 text-cyan-300 font-bold bg-cyan-950/20">1.00</td>
                    <td className="py-2 px-3 text-rose-400 font-bold bg-rose-950/20">0.91</td>
                    <td className="py-2 px-3 text-rose-400 font-bold bg-rose-950/30">0.96</td>
                    <td className="py-2 px-3 text-slate-400">0.72</td>
                    <td className="py-2 px-3 text-slate-500">0.42</td>
                    <td className="py-2 px-3 text-rose-400 font-bold font-sans">CRITICAL (White Hatchback Dilemma)</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-bold text-white flex items-center gap-1.5 font-sans">
                      <span className="w-3 h-3 rounded-full bg-[#cbd5e1] border border-slate-400 inline-block" />
                      Silky Silver
                    </td>
                    <td className="py-2 px-3 text-rose-400 font-bold bg-rose-950/20">0.91</td>
                    <td className="py-2 px-3 text-cyan-300 font-bold bg-cyan-950/20">1.00</td>
                    <td className="py-2 px-3 text-amber-400 font-bold bg-amber-950/20">0.89</td>
                    <td className="py-2 px-3 text-amber-400">0.81</td>
                    <td className="py-2 px-3 text-slate-500">0.48</td>
                    <td className="py-2 px-3 text-amber-400 font-bold font-sans">HIGH (Glare Vulnerability)</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-bold text-white flex items-center gap-1.5 font-sans">
                      <span className="w-3 h-3 rounded-full bg-[#ffffff] border border-slate-400 inline-block" />
                      Pearl White
                    </td>
                    <td className="py-2 px-3 text-rose-400 font-bold bg-rose-950/30">0.96</td>
                    <td className="py-2 px-3 text-amber-400 font-bold bg-amber-950/20">0.89</td>
                    <td className="py-2 px-3 text-cyan-300 font-bold bg-cyan-950/20">1.00</td>
                    <td className="py-2 px-3 text-slate-400">0.69</td>
                    <td className="py-2 px-3 text-slate-500">0.40</td>
                    <td className="py-2 px-3 text-rose-400 font-bold font-sans">CRITICAL (Indistinguishable)</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-bold text-white flex items-center gap-1.5 font-sans">
                      <span className="w-3 h-3 rounded-full bg-[#475569] border border-slate-400 inline-block" />
                      Magma Grey
                    </td>
                    <td className="py-2 px-3 text-slate-400">0.72</td>
                    <td className="py-2 px-3 text-amber-400">0.81</td>
                    <td className="py-2 px-3 text-slate-400">0.69</td>
                    <td className="py-2 px-3 text-cyan-300 font-bold bg-cyan-950/20">1.00</td>
                    <td className="py-2 px-3 text-amber-400">0.76</td>
                    <td className="py-2 px-3 text-slate-400 font-sans">MODERATE</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-bold text-white flex items-center gap-1.5 font-sans">
                      <span className="w-3 h-3 rounded-full bg-[#18181b] border border-slate-500 inline-block" />
                      Gloss Black
                    </td>
                    <td className="py-2 px-3 text-slate-500">0.42</td>
                    <td className="py-2 px-3 text-slate-500">0.48</td>
                    <td className="py-2 px-3 text-slate-500">0.40</td>
                    <td className="py-2 px-3 text-amber-400">0.76</td>
                    <td className="py-2 px-3 text-cyan-300 font-bold bg-cyan-950/20">1.00</td>
                    <td className="py-2 px-3 text-emerald-400 font-bold font-sans">LOW (High Separability)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Conclusion:</strong> Cosine scores above <code className="text-cyan-300">0.88</code> cannot be resolved by visual embeddings alone. The Bayesian fusion engine weights Spatio-Temporal travel time and Micro-Cues to eliminate false positive candidates.
              </span>
            </div>
          </div>
        )}

        {/* Tab 3: Cross-Camera Drift Comparison */}
        {activeTab === "crossCam" && (
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  Corridor Cross-Camera Spectrum Drift
                </h4>
                <p className="text-xs text-slate-400">
                  Tracking color frequency shifts from Entry (CAM_A) to Downstream Flyover (CAM_B) and Exit (CAM_C)
                </p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
                Spatio-Temporal Flow
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {(["CAM_A", "CAM_B", "CAM_C"] as const).map((camKey) => {
                const info = CAMERA_INFO[camKey];
                const whiteShare = camKey === "CAM_A" ? 48.3 : camKey === "CAM_B" ? 54.2 : 46.8;
                return (
                  <div
                    key={camKey}
                    onClick={() => setCam(camKey)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      activeCamId === camKey
                        ? "bg-slate-800/90 border-cyan-500 ring-1 ring-cyan-500/30"
                        : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-white">{info.label}</span>
                      <span className="text-[10px] text-cyan-400 font-mono">{camKey}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mb-2">{info.name}</div>
                    
                    <div className="bg-slate-900/90 p-2 rounded border border-slate-800/80 space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400">White/Silver Cluster:</span>
                        <span className="font-mono font-bold text-amber-400">{whiteShare}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full"
                          style={{ width: `${whiteShare}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 pt-0.5">
                        <span>Ambiguity Index:</span>
                        <span className="text-rose-400 font-semibold">High Collision Risk</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
