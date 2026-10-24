import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { X, Flame, Eye, Layers, Sliders, Maximize2, Minimize2, MapPin, Activity } from "lucide-react";
import { SimulatedVehicle } from "../types/reid";
import { CAMERA_NODES } from "../lib/reidEngine";

interface TrafficHeatmapProps {
  vehicles: SimulatedVehicle[];
  activeCameraId: "CAM_A" | "CAM_B" | "CAM_C" | "CAM_D" | "overview" | "chase";
  selectedVehicleId: string | null;
  onSelectVehicle: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const TrafficHeatmap: React.FC<TrafficHeatmapProps> = ({
  vehicles,
  activeCameraId,
  selectedVehicleId,
  onSelectVehicle,
  isOpen,
  onClose,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [colorScheme, setColorScheme] = useState<"turbo" | "inferno" | "plasma" | "viridis">("turbo");
  const [viewMode, setViewMode] = useState<"contours" | "grid" | "scatter">("contours");
  const [showVehicles, setShowVehicles] = useState(true);
  const [bandwidth, setBandwidth] = useState(16); // KDE smoothing bandwidth
  const [isMaximized, setIsMaximized] = useState(false);
  const [hoveredVehicle, setHoveredVehicle] = useState<SimulatedVehicle | null>(null);

  // Compute live corridor density stats
  const densityStats = useMemo(() => {
    let cam1Count = 0;
    let cam2Count = 0;
    let cam3Count = 0;
    let blindZoneCount = 0;

    vehicles.forEach((v) => {
      const x = v.currentPosition[0];
      if (Math.abs(x - (-45)) <= 8) cam1Count++;
      else if (Math.abs(x - 0) <= 8) cam2Count++;
      else if (Math.abs(x - 45) <= 8) cam3Count++;
      else blindZoneCount++;
    });

    return {
      cam1Count,
      cam2Count,
      cam3Count,
      blindZoneCount,
      totalVehicles: vehicles.length,
    };
  }, [vehicles]);

  useEffect(() => {
    if (!isOpen || !svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clean previous frame

    const width = containerRef.current.clientWidth || 800;
    const height = isMaximized ? 460 : 320;
    const margin = { top: 40, right: 35, bottom: 50, left: 55 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr("width", width).attr("height", height);

    // Setup X & Y Scales based on 3D corridor coordinate system
    // X axis: -65m (entry) to +65m (exit)
    const xScale = d3.scaleLinear().domain([-65, 65]).range([0, innerWidth]);

    // Y axis: Road lateral lanes (-5m to +5m)
    const yScale = d3.scaleLinear().domain([-4.5, 4.5]).range([innerHeight, 0]);

    // Color interpolators
    const interpolator =
      colorScheme === "inferno"
        ? d3.interpolateInferno
        : colorScheme === "plasma"
        ? d3.interpolatePlasma
        : colorScheme === "viridis"
        ? d3.interpolateViridis
        : d3.interpolateTurbo;

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // 1. Draw Road Background & Lanes
    const roadYMin = yScale(3.5);
    const roadYMax = yScale(-3.5);
    const roadH = Math.abs(roadYMax - roadYMin);

    g.append("rect")
      .attr("x", 0)
      .attr("y", roadYMin)
      .attr("width", innerWidth)
      .attr("height", roadH)
      .attr("fill", "#0f172a")
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 1.5)
      .attr("rx", 6);

    // Lane divider dashed lines
    for (let l of [-2.4, 0, 2.4]) {
      g.append("line")
        .attr("x1", 0)
        .attr("x2", innerWidth)
        .attr("y1", yScale(l))
        .attr("y2", yScale(l))
        .attr("stroke", l === 0 ? "#eab308" : "#334155")
        .attr("stroke-width", l === 0 ? 1.5 : 1)
        .attr("stroke-dasharray", l === 0 ? "none" : "6,6")
        .attr("opacity", 0.6);
    }

    // 2. Blind Corridor Overlay (Unmonitored zones between cameras)
    const blindZones = [
      { from: -37, to: -8, label: "Blind Zone 1 (300m unmonitored)" },
      { from: 8, to: 37, label: "Blind Zone 2 (300m unmonitored)" },
    ];
    blindZones.forEach((bz) => {
      const bx = xScale(bz.from);
      const bw = xScale(bz.to) - bx;
      g.append("rect")
        .attr("x", bx)
        .attr("y", roadYMin)
        .attr("width", bw)
        .attr("height", roadH)
        .attr("fill", "#020617")
        .attr("opacity", 0.45)
        .attr("stroke", "#334155")
        .attr("stroke-dasharray", "4,4");

      g.append("text")
        .attr("x", bx + bw / 2)
        .attr("y", roadYMin + 14)
        .attr("text-anchor", "middle")
        .attr("fill", "#64748b")
        .attr("font-size", "10px")
        .attr("font-family", "monospace")
        .text("BLIND CORRIDOR");
    });

    // 3. Camera Coverage Frustum Bands
    CAMERA_NODES.forEach((cam) => {
      const cx = cam.worldPos[0];
      const camLeft = xScale(cx - 7.5);
      const camWidth = xScale(cx + 7.5) - camLeft;

      // Camera zone highlight
      g.append("rect")
        .attr("x", camLeft)
        .attr("y", roadYMin)
        .attr("width", camWidth)
        .attr("height", roadH)
        .attr("fill", "#0284c7")
        .attr("opacity", 0.12)
        .attr("stroke", "#06b6d4")
        .attr("stroke-dasharray", "3,3");

      // Camera Marker pin
      const camPx = xScale(cx);
      g.append("circle")
        .attr("cx", camPx)
        .attr("cy", roadYMin - 12)
        .attr("r", 5)
        .attr("fill", "#06b6d4")
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 1.5);

      g.append("text")
        .attr("x", camPx)
        .attr("y", roadYMin - 20)
        .attr("text-anchor", "middle")
        .attr("fill", "#38bdf8")
        .attr("font-size", "10.5px")
        .attr("font-weight", "bold")
        .text(cam.id === "CAM_A" ? "CAM 01 (Entry)" : cam.id === "CAM_B" ? "CAM 02 (Flyover)" : "CAM 03 (Exit)");
    });

    // 4. Render Vehicle Density (KDE Contours or Grid Bins)
    const points: [number, number][] = vehicles.map((v) => [
      xScale(v.currentPosition[0]),
      yScale(v.currentPosition[2]),
    ]);

    if (viewMode === "contours" && points.length > 2) {
      // 2D Kernel Density Estimation using d3-contour
      const densityData = (d3 as any)
        .contourDensity()
        .x((d: any) => d[0])
        .y((d: any) => d[1])
        .size([innerWidth, innerHeight])
        .bandwidth(bandwidth)
        .thresholds(12)(points);

      const values: number[] = densityData.map((d: any) => Number(d.value) || 0);
      const maxVal = values.length > 0 ? Math.max(0.005, ...values) : 0.005;
      const colorScale = (d3.scaleSequential(interpolator) as any).domain([0, maxVal]);
      const pathGenerator = d3.geoPath() as any;

      g.append("g")
        .attr("class", "contours")
        .selectAll("path")
        .data(densityData)
        .enter()
        .append("path")
        .attr("d", (d: any) => pathGenerator(d) || "")
        .attr("fill", (d: any) => colorScale(d.value))
        .attr("opacity", 0.6)
        .attr("stroke", (d: any) => colorScale(d.value))
        .attr("stroke-width", 0.5);
    } else if (viewMode === "grid") {
      // 2D Spatial Grid Bins along corridor coordinates
      const binWidthMeters = 5; // 5 meter cells
      const numBinsX = Math.ceil(130 / binWidthMeters);
      const gridCounts: Record<string, number> = {};

      vehicles.forEach((v) => {
        const binX = Math.floor((v.currentPosition[0] + 65) / binWidthMeters);
        const laneKey = v.currentLane;
        const key = `${binX}_${laneKey}`;
        gridCounts[key] = (gridCounts[key] || 0) + 1;
      });

      const countValues: number[] = Object.values(gridCounts).map((v) => Number(v) || 0);
      const maxCount = countValues.length > 0 ? Math.max(1, ...countValues) : 1;
      const cellColor = (d3.scaleSequential(interpolator) as any).domain([0, maxCount]);

      for (let bx = 0; bx < numBinsX; bx++) {
        const xVal = -65 + bx * binWidthMeters;
        const xPos = xScale(xVal);
        const wPos = xScale(xVal + binWidthMeters) - xPos;

        [-1, 0, 1].forEach((lane) => {
          const count = gridCounts[`${bx}_${lane}`] || 0;
          if (count > 0) {
            const laneCenter = lane === -1 ? -2.4 : lane === 0 ? 0 : 2.4;
            const yPos = yScale(laneCenter + 1.1);
            const hPos = Math.abs(yScale(laneCenter - 1.1) - yPos);

            g.append("rect")
              .attr("x", xPos)
              .attr("y", yPos)
              .attr("width", Math.max(1, wPos - 1))
              .attr("height", Math.max(1, hPos - 1))
              .attr("fill", cellColor(count))
              .attr("opacity", 0.75)
              .attr("rx", 3);
          }
        });
      }
    }

    // 5. Draw Individual Vehicle Dots / Pips
    if (showVehicles) {
      const vehicleGroup = g.append("g").attr("class", "vehicles");

      vehicles.forEach((v) => {
        const vx = xScale(v.currentPosition[0]);
        const vy = yScale(v.currentPosition[2]);
        const isSelected = v.id === selectedVehicleId;

        const node = vehicleGroup
          .append("g")
          .attr("transform", `translate(${vx},${vy})`)
          .style("cursor", "pointer")
          .on("click", () => onSelectVehicle(v.id))
          .on("mouseenter", () => setHoveredVehicle(v))
          .on("mouseleave", () => setHoveredVehicle(null));

        // Vehicle dot
        node
          .append("circle")
          .attr("r", isSelected ? 6.5 : v.type === "bus" ? 5.5 : v.type === "truck" ? 4.8 : 3.8)
          .attr("fill", isSelected ? "#38bdf8" : v.primaryColorHex)
          .attr("stroke", isSelected ? "#ffffff" : "#0f172a")
          .attr("stroke-width", isSelected ? 2 : 1.2);

        // Direction arrow heading east (+X)
        node
          .append("path")
          .attr("d", "M 2,0 L -2,-2.5 L -1,0 L -2,2.5 Z")
          .attr("fill", isSelected ? "#0f172a" : "#ffffff")
          .attr("opacity", 0.85);
      });
    }

    // 6. Coordinate Axes
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(10)
      .tickFormat((d) => `${d}m`);

    const yAxis = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickFormat((d) => (d === -2.4 ? "Fast" : d === 0 ? "Mid" : d === 2.4 ? "Slow" : ""));

    // X Axis
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis)
      .attr("color", "#64748b")
      .selectAll("text")
      .attr("font-size", "10px")
      .attr("font-family", "monospace");

    // Y Axis
    g.append("g")
      .call(yAxis)
      .attr("color", "#64748b")
      .selectAll("text")
      .attr("font-size", "10px")
      .attr("font-family", "monospace");

    // X Axis Label
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height - 12)
      .attr("text-anchor", "middle")
      .attr("fill", "#94a3b8")
      .attr("font-size", "11px")
      .attr("font-weight", "500")
      .text("Corridor Longitudinal Distance (Entry -65m → Flyover 0m → Exit +65m)");

    // Y Axis Label
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 16)
      .attr("text-anchor", "middle")
      .attr("fill", "#94a3b8")
      .attr("font-size", "11px")
      .attr("font-weight", "500")
      .text("Lateral Road Lanes");
  }, [vehicles, isOpen, colorScheme, viewMode, showVehicles, bandwidth, isMaximized, selectedVehicleId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 select-none">
      <div
        ref={containerRef}
        className={`bg-slate-900 border border-slate-700 w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
          isMaximized ? "max-w-6xl max-h-[96vh]" : "max-w-4xl max-h-[90vh]"
        }`}
      >
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                D3 Multi-Camera Traffic Density Heatmap
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  2D KDE Coordinate Overlay
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Live spatial kernel density and intensity distribution across Cam 01, Cam 02, Cam 03, and unmonitored blind corridors
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title={isMaximized ? "Restore size" : "Maximize heatmap"}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Density Stats Ticker */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-6 py-2.5 bg-slate-950/60 border-b border-slate-800/80 text-xs">
          <div className="flex items-center justify-between bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400">Cam 01 Entry:</span>
            <span className="font-mono font-bold text-cyan-400">{densityStats.cam1Count} veh</span>
          </div>
          <div className="flex items-center justify-between bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400">Cam 02 Flyover:</span>
            <span className="font-mono font-bold text-amber-400">{densityStats.cam2Count} veh</span>
          </div>
          <div className="flex items-center justify-between bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400">Cam 03 Exit:</span>
            <span className="font-mono font-bold text-emerald-400">{densityStats.cam3Count} veh</span>
          </div>
          <div className="flex items-center justify-between bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400">In Blind Corridors:</span>
            <span className="font-mono font-bold text-violet-400">{densityStats.blindZoneCount} veh</span>
          </div>
        </div>

        {/* Main D3 Canvas Viewport */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center">
          <div className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl p-2 relative shadow-inner overflow-hidden">
            <svg ref={svgRef} className="w-full select-none" />

            {/* Hovered Vehicle Mini Tooltip */}
            {hoveredVehicle && (
              <div className="absolute top-4 left-4 bg-slate-900/95 border border-cyan-800 p-2.5 rounded-xl shadow-xl text-xs space-y-1 pointer-events-none z-10">
                <div className="font-mono font-bold text-cyan-300">
                  Track: [{hoveredVehicle.globalId}]
                </div>
                <div className="text-slate-200 capitalize font-medium">
                  {hoveredVehicle.colorName} {hoveredVehicle.type.replace("_", " ")}
                </div>
                <div className="text-[11px] text-slate-400">
                  Corridor X: {hoveredVehicle.currentPosition[0].toFixed(1)}m • Speed: {(hoveredVehicle.velocity * 3.6).toFixed(0)} km/h
                </div>
              </div>
            )}
          </div>

          {/* Interactive D3 Visualization Controls Bar */}
          <div className="w-full mt-4 bg-slate-950/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 px-1.5">Style:</span>
              <button
                onClick={() => setViewMode("contours")}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === "contours"
                    ? "bg-cyan-500 text-slate-950 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                2D Contours (KDE)
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === "grid"
                    ? "bg-cyan-500 text-slate-950 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Grid Bin Cells
              </button>
            </div>

            {/* Color Palette Selector */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">Palette:</span>
              <div className="flex gap-1">
                {(["turbo", "inferno", "plasma", "viridis"] as const).map((pal) => (
                  <button
                    key={pal}
                    onClick={() => setColorScheme(pal)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono capitalize transition-colors ${
                      colorScheme === pal
                        ? "bg-slate-800 text-cyan-300 border border-cyan-600 font-bold"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {pal}
                  </button>
                ))}
              </div>
            </div>

            {/* Bandwidth Smoothing Slider */}
            {viewMode === "contours" && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px]">KDE Bandwidth:</span>
                <input
                  type="range"
                  min="8"
                  max="35"
                  value={bandwidth}
                  onChange={(e) => setBandwidth(parseInt(e.target.value))}
                  className="w-20 accent-cyan-400 h-1 bg-slate-800 rounded cursor-pointer"
                />
                <span className="font-mono text-cyan-400 text-xs w-6">{bandwidth}</span>
              </div>
            )}

            {/* Toggle Individual Vehicle Markers */}
            <button
              onClick={() => setShowVehicles(!showVehicles)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                showVehicles
                  ? "bg-slate-800 text-cyan-300 border border-slate-700"
                  : "bg-slate-900 text-slate-500"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showVehicles ? "Hide Vehicles" : "Show Vehicles"}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
            <span>Real-time density calculated from 3D corridor positions and camera sighting intervals.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors cursor-pointer"
          >
            Close Heatmap
          </button>
        </div>
      </div>
    </div>
  );
};
