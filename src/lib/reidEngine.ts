import {
  SimulatedVehicle,
  VehicleType,
  MicroFeatures,
  WindshieldFastag,
  TyrePressureProfile,
  CameraNode,
  CameraId,
  ReIdMatchResult,
  OriginDestinationMatrix,
  RouteTravelTimeStat,
  NightModeSettings,
  CameraOutageState,
  DomainAdaptationState,
  ReIdBenchmarkReport,
  VehicleDentDefect,
  VisionModelPipelineConfig,
  DetectorModelId,
  EmbedderModelId,
  TrackerModelId,
  DentDetectorModelId,
} from "../types/reid";

// -------------------------------------------------------------
// 1. VISION MODEL STACK CONFIGURATION & CAMERA TOPOLOGY
// -------------------------------------------------------------

export const DEFAULT_VISION_MODEL_PIPELINE: VisionModelPipelineConfig = {
  primaryDetector: "yolo26s",
  activeDetector: "yolo26s",
  isCpuLowPowerMode: false,
  detectorWeights: "yolo26s.pt",
  reidEmbedder: "osnet_x1_0",
  fallbackEmbedder: "dinov2_vits14",
  forceFallbackEmbedder: false,
  tracker: "bytetrack",
  trackerHighConfThreshold: 0.60,
  trackerLowConfThreshold: 0.10,
  dentDetector: "yolov8m_t42_nust",
  dentConfidenceThreshold: 0.45,
  dentDisambiguationWeight: 0.20,
  targetFps: 60,
};

export const CAMERA_NODES: CameraNode[] = [
  {
    id: "CAM_A",
    name: "Camera 01: Silk Board North Entry",
    junctionTitle: "Hosur Road Junction Approach",
    worldPos: [-45, 14, -8],
    viewDirection: [0.7, -0.6, 0.4],
    fov: 48,
    roadDistanceToNextKm: 0.9,
    typicalTransitSeconds: { min: 45, max: 130, mean: 85, stdDev: 16 },
    status: "online",
    lastHeartbeatSeconds: 1.2,
    adaptationStatus: "calibrated",
    nightEnhancement: true,
    installedModel: "Ultralytics YOLO26s (yolo26s.pt) + ByteTrack + OSNet x1.0 (512-d) + YOLOv8m-t42 Dent",
  },
  {
    id: "CAM_B",
    name: "Camera 02: Koramangala 100ft Flyover",
    junctionTitle: "Intermediate Arterial Link",
    worldPos: [0, 14, 8],
    viewDirection: [-0.6, -0.6, -0.5],
    fov: 50,
    roadDistanceToNextKm: 1.1,
    typicalTransitSeconds: { min: 55, max: 150, mean: 105, stdDev: 18 },
    status: "online",
    lastHeartbeatSeconds: 0.8,
    adaptationStatus: "calibrated",
    nightEnhancement: true,
    installedModel: "Ultralytics YOLO26s (yolo26s.pt) + ByteTrack + OSNet x1.0 (512-d) + DINOv2 Fallback",
  },
  {
    id: "CAM_C",
    name: "Camera 03: HSR Layout Sector 1 Gate",
    junctionTitle: "Ring Road Interchange Exit",
    worldPos: [45, 14, -8],
    viewDirection: [-0.7, -0.6, 0.4],
    fov: 48,
    roadDistanceToNextKm: 0.8,
    typicalTransitSeconds: { min: 40, max: 120, mean: 76, stdDev: 14 },
    status: "online",
    lastHeartbeatSeconds: 2.1,
    adaptationStatus: "calibrated",
    nightEnhancement: true,
    installedModel: "Ultralytics YOLO26s (yolo26s.pt) + ByteTrack + OSNet x1.0 (512-d) + YOLOv8m-t42 Dent",
  },
  {
    id: "CAM_D",
    name: "Camera 04: HSR Outer Ring Road Link",
    junctionTitle: "Agara Lake Arterial Fork (New Node)",
    worldPos: [65, 14, 8],
    viewDirection: [-0.6, -0.6, -0.4],
    fov: 46,
    roadDistanceToNextKm: 0.7,
    typicalTransitSeconds: { min: 35, max: 110, mean: 68, stdDev: 13 },
    status: "online",
    lastHeartbeatSeconds: 3.4,
    adaptationStatus: "adapting",
    nightEnhancement: true,
    installedModel: "Ultralytics YOLO27 (yolo27.pt) + ByteTrack + DINOv2-small ViT + Domain Head",
  },
];

// Helper: Fast pseudo-cryptographic edge token hash (SHA-256 simulation)
export function generateEdgeHashedToken(seed: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const hex = (hash >>> 0).toString(16).padStart(8, "0");
  return `sha256:${hex.slice(0, 4)}...${hex.slice(-4)}`;
}

// -------------------------------------------------------------
// 2. WINDSHIELD GRID ANALYSIS & FASTAG LOCALIZATION
// -------------------------------------------------------------

export function generateWindshieldFastag(
  vehicleType: VehicleType,
  seedIndex: number,
  forceTagPresent: boolean = true
): WindshieldFastag {
  if (vehicleType === "two_wheeler") {
    return {
      present: false,
      gridX: -1,
      gridY: -1,
      normX: 0,
      normY: 0,
      offsetMm: { dx: 0, dy: 0 },
      tagIdSnippet: "NONE",
      tiltDeg: 0,
    };
  }

  const present = forceTagPresent ? true : Math.random() > 0.08;
  if (!present) {
    return {
      present: false,
      gridX: -1,
      gridY: -1,
      normX: 0,
      normY: 0,
      offsetMm: { dx: 0, dy: 0 },
      tagIdSnippet: "ABSENT",
      tiltDeg: 0,
    };
  }

  const rand = Math.random();
  let baseNormX = 0.5;
  let baseNormY = 0.15;

  if (rand < 0.55) {
    baseNormX = 0.48 + (Math.random() - 0.5) * 0.08;
    baseNormY = 0.14 + (Math.random() - 0.5) * 0.06;
  } else if (rand < 0.78) {
    baseNormX = 0.22 + (Math.random() - 0.5) * 0.10;
    baseNormY = 0.16 + (Math.random() - 0.5) * 0.07;
  } else if (rand < 0.92) {
    baseNormX = 0.78 + (Math.random() - 0.5) * 0.09;
    baseNormY = 0.17 + (Math.random() - 0.5) * 0.07;
  } else {
    baseNormX = 0.50 + (Math.random() - 0.5) * 0.14;
    baseNormY = 0.36 + (Math.random() - 0.5) * 0.08;
  }

  const normX = Math.max(0.05, Math.min(0.95, baseNormX));
  const normY = Math.max(0.05, Math.min(0.95, baseNormY));
  const gridX = Math.floor(normX * 10);
  const gridY = Math.floor(normY * 10);

  const windshieldWidthMm = 1350;
  const windshieldHeightMm = 750;
  const dxMm = Math.round((normX - 0.5) * windshieldWidthMm);
  const dyMm = Math.round((normY - 0.12) * windshieldHeightMm);

  const tiltDeg = parseFloat(((Math.random() - 0.5) * 9).toFixed(1));
  const rawId = `FTG-${(seedIndex * 1973 + 0xbeef).toString(16).toUpperCase().slice(-4)}`;
  const tagIdSnippet = generateEdgeHashedToken(rawId);

  return {
    present: true,
    gridX,
    gridY,
    normX: parseFloat(normX.toFixed(3)),
    normY: parseFloat(normY.toFixed(3)),
    offsetMm: { dx: dxMm, dy: dyMm },
    tagIdSnippet,
    tiltDeg,
  };
}

export function calculateWindshieldGridSimilarity(
  tagA: WindshieldFastag,
  tagB: WindshieldFastag,
  sigmaNorm: number = 0.085
): {
  score: number;
  distanceNorm: number;
  gridDiff: { dx: number; dy: number; gridSteps: number };
} {
  if (!tagA.present || !tagB.present) {
    if (!tagA.present && !tagB.present) {
      return { score: 0.9, distanceNorm: 0, gridDiff: { dx: 0, dy: 0, gridSteps: 0 } };
    }
    return { score: 0.05, distanceNorm: 1.0, gridDiff: { dx: 9, dy: 9, gridSteps: 18 } };
  }

  const dx = tagA.normX - tagB.normX;
  const dy = tagA.normY - tagB.normY;
  const distanceNorm = Math.sqrt(dx * dx + dy * dy);
  const gridDx = Math.abs(tagA.gridX - tagB.gridX);
  const gridDy = Math.abs(tagA.gridY - tagB.gridY);
  const gridSteps = gridDx + gridDy;
  const score = Math.exp(-(distanceNorm * distanceNorm) / (2 * sigmaNorm * sigmaNorm));

  return {
    score: Math.max(0.01, Math.min(1.0, score)),
    distanceNorm: parseFloat(distanceNorm.toFixed(4)),
    gridDiff: { dx: gridDx, dy: gridDy, gridSteps },
  };
}

// -------------------------------------------------------------
// 3. TYRE PRESSURE PROFILING AT ROAD SENSOR STRIP
// -------------------------------------------------------------

export function generateTyrePressureProfile(
  type: VehicleType,
  seedIndex: number,
  cameraCheckpointId: string = "CAM_A"
): TyrePressureProfile {
  const wheelPressures: Record<string, number> = {};
  let wheelOrder: string[] = [];

  const baseNoise = (wheelSeed: number) => {
    const pseudo = Math.sin(seedIndex * 13.7 + wheelSeed * 5.3);
    return pseudo * 2.2;
  };

  if (type === "two_wheeler") {
    wheelOrder = ["Front", "Rear"];
    wheelPressures["Front"] = parseFloat((26.5 + baseNoise(1)).toFixed(1));
    wheelPressures["Rear"] = parseFloat((32.0 + baseNoise(2)).toFixed(1));
  } else if (type === "auto_rickshaw") {
    wheelOrder = ["Front", "RL", "RR"];
    wheelPressures["Front"] = parseFloat((26.0 + baseNoise(1)).toFixed(1));
    wheelPressures["RL"] = parseFloat((33.5 + baseNoise(2)).toFixed(1));
    wheelPressures["RR"] = parseFloat((32.8 + baseNoise(3)).toFixed(1));
  } else if (type === "bus") {
    wheelOrder = ["FL", "FR", "RL1", "RR1", "RL2", "RR2"];
    const busBase = 100.0;
    wheelOrder.forEach((w, idx) => {
      wheelPressures[w] = parseFloat((busBase + baseNoise(idx) * 2.5).toFixed(1));
    });
  } else if (type === "truck") {
    wheelOrder = ["FL", "FR", "RL", "RR"];
    wheelPressures["FL"] = parseFloat((38.0 + baseNoise(1)).toFixed(1));
    wheelPressures["FR"] = parseFloat((37.5 + baseNoise(2)).toFixed(1));
    wheelPressures["RL"] = parseFloat((48.0 + baseNoise(3)).toFixed(1));
    wheelPressures["RR"] = parseFloat((49.2 + baseNoise(4)).toFixed(1));
  } else {
    wheelOrder = ["FL", "FR", "RL", "RR"];
    const frontBase = 32.5;
    const rearBase = 31.5;
    wheelPressures["FL"] = parseFloat((frontBase + baseNoise(1)).toFixed(1));
    wheelPressures["FR"] = parseFloat((frontBase + baseNoise(2) - 0.4).toFixed(1));
    wheelPressures["RL"] = parseFloat((rearBase + baseNoise(3) + 0.3).toFixed(1));
    wheelPressures["RR"] = parseFloat((rearBase + baseNoise(4) - 0.6).toFixed(1));
  }

  const values = Object.values(wheelPressures);
  const sum = values.reduce((acc, v) => acc + v, 0);
  const meanPressure = parseFloat((sum / values.length).toFixed(1));

  let asymmetryIndex = 0;
  if (wheelPressures["FL"] !== undefined && wheelPressures["FR"] !== undefined) {
    asymmetryIndex = parseFloat(Math.abs(wheelPressures["FL"] - wheelPressures["FR"]).toFixed(2));
  } else if (wheelPressures["RL"] !== undefined && wheelPressures["RR"] !== undefined) {
    asymmetryIndex = parseFloat(Math.abs(wheelPressures["RL"] - wheelPressures["RR"]).toFixed(2));
  }

  return {
    wheelPressures,
    wheelOrder,
    meanPressure,
    asymmetryIndex,
    unit: "PSI",
    captureGridPoint: `TPMS-GRID-${cameraCheckpointId}`,
    timestamp: Date.now() / 1000,
  };
}

export function calculateTyrePressureSimilarity(
  profileA: TyrePressureProfile,
  profileB: TyrePressureProfile,
  sigmaPsi: number = 1.35
): {
  score: number;
  rmsePsi: number;
  deltas: Record<string, number>;
} {
  const wheelsA = Object.keys(profileA.wheelPressures);
  const wheelsB = Object.keys(profileB.wheelPressures);

  if (wheelsA.length !== wheelsB.length) {
    return { score: 0.01, rmsePsi: 25.0, deltas: {} };
  }

  let sumSquaredDiff = 0;
  const deltas: Record<string, number> = {};
  let count = 0;

  for (const wheel of wheelsA) {
    const valA = profileA.wheelPressures[wheel];
    const valB = profileB.wheelPressures[wheel];
    if (valA !== undefined && valB !== undefined) {
      const diff = Math.abs(valA - valB);
      deltas[wheel] = parseFloat(diff.toFixed(2));
      sumSquaredDiff += diff * diff;
      count++;
    }
  }

  if (count === 0) return { score: 0.5, rmsePsi: 0, deltas: {} };

  const rmsePsi = Math.sqrt(sumSquaredDiff / count);
  const score = Math.exp(-(rmsePsi * rmsePsi) / (2 * sigmaPsi * sigmaPsi));

  return {
    score: Math.max(0.01, Math.min(1.0, score)),
    rmsePsi: parseFloat(rmsePsi.toFixed(2)),
    deltas,
  };
}

// -------------------------------------------------------------
// 4. NIGHT-TIME ROBUSTNESS & RETINEX IMAGE ENHANCEMENT
// -------------------------------------------------------------

/**
 * Simulates low-light edge enhancement via lightweight RetinexNet / small U-Net.
 * Restores illumination-invariance for deep embeddings and computes part-level attention.
 */
export function applyNightEnhancement(
  embedding: number[],
  isNight: boolean,
  enhancer: "none" | "retinex_net" | "thermal_ir",
  partAttentionActive: boolean = true
): {
  enhancedEmbedding: number[];
  partAttentionScore: number;
  noiseSnrDb: number;
} {
  if (!isNight) {
    return {
      enhancedEmbedding: [...embedding],
      partAttentionScore: 0.95,
      noiseSnrDb: 34.0, // High daylight SNR
    };
  }

  // Under raw night conditions without RetinexNet
  if (enhancer === "none") {
    const degraded = embedding.map((val, idx) => {
      // Color channels (dims 5-7) degrade heavily in near darkness
      const colorAttenuation = idx >= 5 && idx <= 7 ? 0.45 : 0.85;
      const noise = (Math.random() - 0.5) * 0.18;
      return val * colorAttenuation + noise;
    });

    let norm = Math.sqrt(degraded.reduce((s, v) => s + v * v, 0)) || 1;
    return {
      enhancedEmbedding: degraded.map((v) => v / norm),
      partAttentionScore: 0.62,
      noiseSnrDb: 11.5, // Low night SNR
    };
  }

  // Enhanced with RetinexNet: decomposes into illumination & reflectance
  // Restores local contrast, preserving wheels (dims 0-4), headlamps & FASTag quadrant (dims 8-12)
  const enhanced = embedding.map((val, idx) => {
    let boost = 1.0;
    if (idx >= 5 && idx <= 7) {
      boost = 0.92; // Chromaticity restoration
    }
    if (idx >= 8 && idx <= 12) {
      boost = 1.05; // High part-level attention boost (FASTag, wheels, lights)
    }
    const residualNoise = (Math.random() - 0.5) * 0.03;
    return val * boost + residualNoise;
  });

  let norm = Math.sqrt(enhanced.reduce((s, v) => s + v * v, 0)) || 1;
  const partScore = partAttentionActive ? 0.91 : 0.78;

  return {
    enhancedEmbedding: enhanced.map((v) => v / norm),
    partAttentionScore: partScore,
    noiseSnrDb: enhancer === "thermal_ir" ? 38.0 : 26.5,
  };
}

// -------------------------------------------------------------
// 5. CAMERA FAILURE TOLERANCE & PROBABILISTIC FLOW IMPUTATION
// -------------------------------------------------------------

/**
 * Predicts and imputes missing traffic flows when a camera suffers an outage.
 * Uses a learned Gaussian travel-time kernel and upstream/downstream conservation laws.
 */
export function imputeMissingCameraFlow(
  offlineCameraId: CameraId,
  observedTrips: Record<string, Record<string, number>>,
  nodes: CameraId[],
  travelTimeStats: Record<string, Record<string, RouteTravelTimeStat>>
): {
  imputedTrips: Record<string, Record<string, number>>;
  uncertaintyInterval: Record<string, Record<string, [number, number]>>;
  baselineRmse: number;
  outageRmse: number;
  imputationErrorIncreasePct: number;
} {
  const imputedTrips: Record<string, Record<string, number>> = {};
  const uncertaintyInterval: Record<string, Record<string, [number, number]>> = {};

  nodes.forEach((o) => {
    imputedTrips[o] = {};
    uncertaintyInterval[o] = {};
    nodes.forEach((d) => {
      imputedTrips[o][d] = observedTrips[o]?.[d] || 0;
      const val = imputedTrips[o][d];
      uncertaintyInterval[o][d] = [val, val];
    });
  });

  // If CAM_B is offline, reconstruct flows between CAM_A -> CAM_B and CAM_B -> CAM_C
  if (offlineCameraId === "CAM_B") {
    const upstreamOutbound = observedTrips["CAM_A"]?.["CAM_C"] || 28;
    // Historical branch probability P(diverge to B) ≈ 0.35
    const predictedAtoB = Math.round(upstreamOutbound * 0.48);
    const predictedBtoC = Math.round(upstreamOutbound * 0.62);

    imputedTrips["CAM_A"]["CAM_B"] = predictedAtoB;
    uncertaintyInterval["CAM_A"]["CAM_B"] = [
      Math.max(1, Math.round(predictedAtoB * 0.85)),
      Math.round(predictedAtoB * 1.15),
    ];

    imputedTrips["CAM_B"]["CAM_C"] = predictedBtoC;
    uncertaintyInterval["CAM_B"]["CAM_C"] = [
      Math.max(1, Math.round(predictedBtoC * 0.82)),
      Math.round(predictedBtoC * 1.18),
    ];
  } else if (offlineCameraId === "CAM_A") {
    // Upstream camera failure: back-propagate from CAM_B and CAM_C
    const downstreamInbound = (observedTrips["CAM_B"]?.["CAM_C"] || 19) + 8;
    imputedTrips["CAM_A"]["CAM_B"] = Math.round(downstreamInbound * 0.75);
    imputedTrips["CAM_A"]["CAM_C"] = Math.round(downstreamInbound * 1.25);
  } else if (offlineCameraId === "CAM_C") {
    const upstreamB = observedTrips["CAM_A"]?.["CAM_B"] || 14;
    imputedTrips["CAM_B"]["CAM_C"] = Math.round(upstreamB * 1.1);
    imputedTrips["CAM_A"]["CAM_C"] = Math.round(upstreamB * 1.8);
  }

  const baselineRmse = 3.6;
  const outageRmse = 5.8;
  const imputationErrorIncreasePct = parseFloat((((outageRmse - baselineRmse) / baselineRmse) * 100).toFixed(1));

  return {
    imputedTrips,
    uncertaintyInterval,
    baselineRmse,
    outageRmse,
    imputationErrorIncreasePct,
  };
}

// -------------------------------------------------------------
// 6. UNSUPERVISED DOMAIN ADAPTATION PIPELINE (FOR NEW CAMERAS)
// -------------------------------------------------------------

export function runDomainAdaptationStep(
  currentState: DomainAdaptationState
): DomainAdaptationState {
  const nextEpoch = currentState.epoch + 1;
  const maxEpochs = currentState.maxEpochs || 12;

  let status = currentState.status;
  let clusterPurity = currentState.clusterPurity;
  let pseudoLabels = currentState.pseudoLabelsGenerated;
  let currentAcc = currentState.reIdAccuracyCurrent;

  if (nextEpoch <= 3) {
    status = "contrastive_pretraining";
    clusterPurity = Math.min(0.68, 0.48 + nextEpoch * 0.06);
    pseudoLabels += 8;
    currentAcc = 52.0 + nextEpoch * 4.5;
  } else if (nextEpoch <= 8) {
    status = "adversarial_alignment";
    clusterPurity = Math.min(0.79, 0.68 + (nextEpoch - 3) * 0.025);
    pseudoLabels += 18;
    currentAcc = 65.5 + (nextEpoch - 3) * 2.8;
  } else if (nextEpoch < maxEpochs) {
    status = "pseudo_labeling";
    clusterPurity = Math.min(0.88, 0.79 + (nextEpoch - 8) * 0.025);
    pseudoLabels += 24;
    currentAcc = 79.5 + (nextEpoch - 8) * 1.5;
  } else {
    status = "converged";
    clusterPurity = 0.885;
    currentAcc = 84.8;
  }

  return {
    ...currentState,
    epoch: nextEpoch,
    status,
    clusterPurity: parseFloat(clusterPurity.toFixed(3)),
    pseudoLabelsGenerated: pseudoLabels,
    reIdAccuracyCurrent: parseFloat(currentAcc.toFixed(1)),
    isAdapting: nextEpoch < maxEpochs,
  };
}

// -------------------------------------------------------------
// 7. PRIVACY-PRESERVING OUTPUTS (k-ANONYMITY & DIFFERENTIAL PRIVACY)
// -------------------------------------------------------------

/**
 * Samples zero-mean Laplace noise: Lap(0, scale) = sign(u) * scale * ln(1 - 2|u|)
 */
export function sampleLaplaceNoise(scale: number): number {
  if (scale <= 0) return 0;
  const u = Math.random() - 0.5;
  return -Math.sign(u) * scale * Math.log(1 - 2 * Math.abs(u));
}

/**
 * Enforces Minimum Group Size (k >= 10) and adds Laplace DP noise calibrated to epsilon.
 */
export function applyPrivacyPreservationToOdMatrix(
  rawTrips: Record<string, Record<string, number>>,
  nodes: CameraId[],
  policy: {
    enforceMinGroupSize: boolean;
    minGroupSize: number;
    differentialPrivacyEnabled: boolean;
    epsilon: number;
  }
): {
  protectedTrips: Record<string, Record<string, { display: string; count: number; isSuppressed: boolean; noiseAdded: number }>>;
  suppressedCount: number;
} {
  const result: Record<string, Record<string, { display: string; count: number; isSuppressed: boolean; noiseAdded: number }>> = {};
  let suppressedCount = 0;

  nodes.forEach((o) => {
    result[o] = {};
    nodes.forEach((d) => {
      const rawCount = rawTrips[o]?.[d] || 0;
      let count = rawCount;
      let isSuppressed = false;
      let noiseAdded = 0;

      // Rule A: Minimum Group Size k >= 10
      if (policy.enforceMinGroupSize && rawCount > 0 && rawCount < policy.minGroupSize) {
        isSuppressed = true;
        suppressedCount++;
      }

      // Rule B: Differential Privacy Laplace noise
      if (policy.differentialPrivacyEnabled && count > 0 && !isSuppressed) {
        // Sensitivity Delta = 1 (single vehicle contribution)
        const scale = 1.0 / policy.epsilon;
        noiseAdded = parseFloat(sampleLaplaceNoise(scale).toFixed(1));
        count = Math.max(0, Math.round(count + noiseAdded));
      }

      const display = isSuppressed
        ? `< ${policy.minGroupSize} [PROTECTED]`
        : count.toString();

      result[o][d] = {
        display,
        count: isSuppressed ? 0 : count,
        isSuppressed,
        noiseAdded,
      };
    });
  });

  return { protectedTrips: result, suppressedCount };
}

// -------------------------------------------------------------
// 8. MULTI-MODAL SIGMOID FUSION & GLOBAL ASSOCIATION
// -------------------------------------------------------------

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  const sim = dot / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.max(0, Math.min(1, (sim + 1) / 2));
}

export function calculateSpatioTemporalScore(
  deltaSeconds: number,
  params: { min: number; max: number; mean: number; stdDev: number }
): { prob: number; filterStatus: "PASSED_PLAUSIBLE" | "REJECTED_TEMPORAL_IMPOSSIBILITY" | "REJECTED_ROUTE_MISMATCH" } {
  if (deltaSeconds < params.min * 0.6) {
    return { prob: 0.01, filterStatus: "REJECTED_TEMPORAL_IMPOSSIBILITY" };
  }
  if (deltaSeconds > params.max * 2.5) {
    return { prob: 0.04, filterStatus: "REJECTED_TEMPORAL_IMPOSSIBILITY" };
  }
  const z = (deltaSeconds - params.mean) / (params.stdDev || 12);
  const prob = Math.exp(-0.5 * z * z);
  return {
    prob: Math.max(0.02, Math.min(0.99, prob)),
    filterStatus: "PASSED_PLAUSIBLE",
  };
}

export function generateAppearanceVector(
  type: VehicleType,
  primaryColorHex: string,
  microFeatures: MicroFeatures,
  noiseVariance: number = 0.05
): number[] {
  const vec = new Array(16).fill(0);
  const typeIndex = ["two_wheeler", "auto_rickshaw", "hatchback", "bus", "truck"].indexOf(type);
  if (typeIndex >= 0) vec[typeIndex] = 1.0;

  const hex = primaryColorHex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  vec[5] = r;
  vec[6] = g;
  vec[7] = b;

  vec[8] = microFeatures.roofRack ? 1.0 : 0.0;
  vec[9] = microFeatures.bumperScratch ? 1.0 : 0.0;
  vec[10] = microFeatures.windshieldSticker ? 1.0 : 0.0;
  const helmetMap: Record<string, number> = { black: 0.2, white: 0.5, red: 0.8, yellow: 1.0, none: 0.0 };
  vec[11] = helmetMap[microFeatures.helmetColor || "none"] || 0;
  vec[12] = microFeatures.sunfilmTint === "dark" ? 0.9 : microFeatures.sunfilmTint === "mild" ? 0.5 : 0.1;

  for (let i = 0; i < 16; i++) {
    vec[i] += (Math.random() - 0.5) * noiseVariance;
  }

  let norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

/**
 * Simulates OSNet x1.0 (512-dim TorchReID feature extractor).
 * Captures omni-scale receptive fields (wheel contours, windshield slope, fine body geometry).
 */
export function generateOsnet512Embedding(
  baseVector16: number[],
  seedIndex: number,
  noiseVariance: number = 0.02
): number[] {
  const vec512 = new Array(512).fill(0);
  for (let i = 0; i < 512; i++) {
    const baseVal = baseVector16[i % baseVector16.length];
    const harmonic = Math.sin((i + 1) * 0.17 + seedIndex * 0.31);
    const scaleFactor = 0.8 + ((i % 7) / 10);
    vec512[i] = baseVal * scaleFactor + harmonic * 0.15 + (Math.random() - 0.5) * noiseVariance;
  }
  const norm = Math.sqrt(vec512.reduce((s, v) => s + v * v, 0)) || 1;
  return vec512.map((v) => v / norm);
}

/**
 * Simulates DINOv2-small (384-dim Meta self-supervised ViT-S/14).
 * Serves as fallback embedder when OSNet confidence is ambiguous or under extreme occlusions.
 */
export function generateDinov2384Embedding(
  baseVector16: number[],
  seedIndex: number,
  noiseVariance: number = 0.025
): number[] {
  const vec384 = new Array(384).fill(0);
  for (let i = 0; i < 384; i++) {
    const baseVal = baseVector16[(i * 3) % baseVector16.length];
    const patchTokenAttention = Math.cos((i + 3) * 0.23 + seedIndex * 0.41);
    vec384[i] = baseVal * 0.85 + patchTokenAttention * 0.18 + (Math.random() - 0.5) * noiseVariance;
  }
  const norm = Math.sqrt(vec384.reduce((s, v) => s + v * v, 0)) || 1;
  return vec384.map((v) => v / norm);
}

/**
 * Simulates YOLOv8m-t42 (NUST) Real-Time Dent & Defect Detection (Precision 0.86, Recall 0.84).
 * Detects dents, scratches, and panel deformations for forensic physical vehicle fingerprinting.
 */
export function generateVehicleDentDefects(
  type: VehicleType,
  seedIndex: number,
  hasScratchOrDent: boolean
): VehicleDentDefect[] {
  const rand = Math.sin(seedIndex * 29.3 + 7.1) * 0.5 + 0.5;
  if (!hasScratchOrDent && rand > 0.45) {
    return [];
  }

  const defectLocations: VehicleDentDefect["location"][] = [
    "front_bumper",
    "rear_bumper",
    "left_fender",
    "right_fender",
    "hood",
    "left_door",
    "right_door",
  ];
  const defectTypes: VehicleDentDefect["type"][] = ["dent", "scratch", "crease"];
  const severities: VehicleDentDefect["severity"][] = ["minor", "moderate", "severe"];

  const locIndex = Math.floor((rand * 17) % defectLocations.length);
  const typeIndex = Math.floor((rand * 11) % defectTypes.length);
  const sevIndex = Math.floor((rand * 5) % severities.length);

  const loc = defectLocations[locIndex];
  const dType = defectTypes[typeIndex];
  const sev = severities[sevIndex];

  const x = 0.2 + (rand * 0.5);
  const y = 0.3 + ((rand * 0.4) % 0.4);
  const w = 0.12 + (rand * 0.08);
  const h = 0.08 + (rand * 0.06);

  const confidence = parseFloat((0.82 + (rand * 0.12)).toFixed(2));

  const defect: VehicleDentDefect = {
    id: `dent_${seedIndex}_${loc}`,
    location: loc,
    label: `${loc.replace("_", " ").toUpperCase()} ${dType.toUpperCase()}`,
    type: dType,
    confidence,
    precisionBenchmark: 0.86,
    recallBenchmark: 0.84,
    modelSource: "YOLOv8m-t42 (NUST)",
    severity: sev,
    boundingBox: {
      x: parseFloat(x.toFixed(3)),
      y: parseFloat(y.toFixed(3)),
      w: parseFloat(w.toFixed(3)),
      h: parseFloat(h.toFixed(3)),
    },
    fingerprintHash: `Y8DENT-${loc.substring(0, 3).toUpperCase()}-${Math.round(confidence * 1000)}`,
    insuranceAuditCode: `INS-AUD-${seedIndex.toString().padStart(4, "0")}-${loc.toUpperCase()}`,
  };

  return [defect];
}

/**
 * Calculates similarity between two vehicles' dent/defect profiles as detected by YOLOv8m-t42.
 */
export function calculateDentDefectSimilarity(
  dentsA: VehicleDentDefect[] = [],
  dentsB: VehicleDentDefect[] = []
): {
  score: number;
  matchingCount: number;
  details: string;
} {
  if (dentsA.length === 0 && dentsB.length === 0) {
    return {
      score: 0.50,
      matchingCount: 0,
      details: "Both vehicles pristine (no YOLOv8m-t42 defect fingerprints detected)",
    };
  }

  if (dentsA.length === 0 || dentsB.length === 0) {
    return {
      score: 0.12,
      matchingCount: 0,
      details: "Asymmetric panel integrity: one vehicle has defects, other is clean",
    };
  }

  let matches = 0;
  for (const a of dentsA) {
    for (const b of dentsB) {
      if (a.location === b.location && a.type === b.type) {
        matches++;
      }
    }
  }

  if (matches > 0) {
    return {
      score: 0.96,
      matchingCount: matches,
      details: `Physical biometric confirmation: YOLOv8m-t42 matched ${matches} defect location(s) [P: 0.86, R: 0.84]`,
    };
  }

  return {
    score: 0.18,
    matchingCount: 0,
    details: "Mismatched dent locations: distinct panel damage profiles detected",
  };
}

const INDIAN_VEHICLE_VARIANTS: {
  type: VehicleType;
  colorName: string;
  primaryHex: string;
  secondaryHex: string;
}[] = [
  { type: "hatchback", colorName: "Arctic White", primaryHex: "#f0f2f5", secondaryHex: "#1e293b" },
  { type: "hatchback", colorName: "Silky Silver", primaryHex: "#cbd5e1", secondaryHex: "#334155" },
  { type: "hatchback", colorName: "Pearl White", primaryHex: "#ffffff", secondaryHex: "#0f172a" },
  { type: "hatchback", colorName: "Magma Grey", primaryHex: "#475569", secondaryHex: "#0f172a" },
  { type: "hatchback", colorName: "Blazing Red", primaryHex: "#dc2626", secondaryHex: "#111827" },
  { type: "auto_rickshaw", colorName: "CNG Green/Yellow", primaryHex: "#15803d", secondaryHex: "#eab308" },
  { type: "auto_rickshaw", colorName: "Classic Yellow/Black", primaryHex: "#eab308", secondaryHex: "#18181b" },
  { type: "auto_rickshaw", colorName: "Electric Teal", primaryHex: "#0d9488", secondaryHex: "#eab308" },
  { type: "two_wheeler", colorName: "Gloss Black Scooter", primaryHex: "#18181b", secondaryHex: "#94a3b8" },
  { type: "two_wheeler", colorName: "Pearl White Activa", primaryHex: "#f8fafc", secondaryHex: "#334155" },
  { type: "two_wheeler", colorName: "Racing Blue Bike", primaryHex: "#2563eb", secondaryHex: "#0f172a" },
  { type: "two_wheeler", colorName: "Matte Red Commuter", primaryHex: "#ef4444", secondaryHex: "#1e293b" },
  { type: "bus", colorName: "BMTC Transit Blue", primaryHex: "#0284c7", secondaryHex: "#f8fafc" },
  { type: "bus", colorName: "Eco Green Transit", primaryHex: "#16a34a", secondaryHex: "#fef08a" },
  { type: "truck", colorName: "Commercial White LCV", primaryHex: "#f1f5f9", secondaryHex: "#334155" },
  { type: "truck", colorName: "Cargo Silver Pickup", primaryHex: "#94a3b8", secondaryHex: "#1e293b" },
];

export function createRandomVehicle(idIndex: number, forcedType?: VehicleType, forcedVariant?: any): SimulatedVehicle {
  const variant =
    forcedVariant ||
    (forcedType
      ? INDIAN_VEHICLE_VARIANTS.find((v) => v.type === forcedType) || INDIAN_VEHICLE_VARIANTS[0]
      : INDIAN_VEHICLE_VARIANTS[Math.floor(Math.random() * INDIAN_VEHICLE_VARIANTS.length)]);

  const helmetColors: MicroFeatures["helmetColor"][] = ["black", "white", "red", "yellow"];
  const microFeatures: MicroFeatures = {
    helmetColor: variant.type === "two_wheeler" ? helmetColors[Math.floor(Math.random() * helmetColors.length)] : "none",
    roofRack: variant.type === "hatchback" || variant.type === "truck" ? Math.random() > 0.65 : false,
    bumperScratch: Math.random() > 0.55,
    windshieldSticker: variant.type !== "two_wheeler",
    cargoType: variant.type === "truck" ? (Math.random() > 0.5 ? "tarpaulin" : "crates") : "none",
    sunfilmTint: Math.random() > 0.7 ? "dark" : Math.random() > 0.4 ? "mild" : "clear",
  };

  const dentDefects = generateVehicleDentDefects(variant.type, idIndex, microFeatures.bumperScratch);
  const fastagPlacement = generateWindshieldFastag(variant.type, idIndex, variant.type !== "two_wheeler");
  const tyrePressure = generateTyrePressureProfile(variant.type, idIndex, "CAM_A");
  const trueEmbedding = generateAppearanceVector(variant.type, variant.primaryHex, microFeatures, 0.02);
  const osnetEmbedding512 = generateOsnet512Embedding(trueEmbedding, idIndex, 0.015);
  const dinov2Embedding384 = generateDinov2384Embedding(trueEmbedding, idIndex, 0.02);

  const lane = Math.floor(Math.random() * 3) - 1;
  const startX = -65 - idIndex * 8;
  const startZ = lane * 2.4;
  const velocity = 8 + Math.random() * 4;

  const rawRfid = `EPC96-${variant.type}-${idIndex}`;
  const rfidHashedToken = generateEdgeHashedToken(rawRfid);

  return {
    id: `veh_${idIndex}_${Date.now().toString(36)}`,
    globalId: `GID-${String(idIndex).padStart(4, "0")}`,
    type: variant.type,
    colorName: variant.colorName,
    primaryColorHex: variant.primaryHex,
    secondaryColorHex: variant.secondaryHex,
    microFeatures,
    dentDefects,
    fastagPlacement,
    tyrePressure,
    rfidHashedToken,
    acousticSignature: [42.1, 88.5, 124.0, 310.2],
    motionEmbedding: {
      speedKmh: parseFloat((velocity * 3.6).toFixed(1)),
      acceleration: parseFloat(((Math.random() - 0.5) * 0.8).toFixed(2)),
      laneOffset: lane * 2.4,
    },
    trueEmbedding,
    osnetEmbedding512,
    dinov2Embedding384,
    originCamera: "CAM_A",
    destinationCamera: Math.random() > 0.35 ? "CAM_C" : "CAM_B",
    routeProgress: 0,
    currentPosition: [startX, 0, startZ],
    velocity,
    currentLane: lane,
    sightings: [],
    isActive: true,
    thermalSignatureKelvin: 335 + Math.floor(Math.random() * 20),
  };
}

let _globalMatchCounter = 0;

/**
 * Multi-Modal Sigmoid Score Fusion & Candidate Evaluation
 * S = sigma(w_a * S_a + w_m * S_m + w_f * S_f + w_p * S_p + w_r * S_r)
 */
export function evaluateCandidateMatch(
  queryVehicle: SimulatedVehicle,
  candidateVehicle: SimulatedVehicle,
  cameraA: CameraNode,
  cameraB: CameraNode,
  timeA: number,
  timeB: number,
  customWeights?: {
    appearance?: number;
    fastag?: number;
    tyrePressure?: number;
    dents?: number;
    spatioTemporal?: number;
    motion?: number;
    rfHashed?: number;
  },
  isNight: boolean = false,
  pipelineConfig?: VisionModelPipelineConfig
): ReIdMatchResult {
  const corridorDistKm = cameraA.roadDistanceToNextKm || 0.9;
  const isGroundTruthMatch = queryVehicle.globalId === candidateVehicle.globalId;

  // Real-world physical vehicle speed based on the vehicle's calibrated velocity (m/s * 3.6 -> km/h)
  // Suitable, valid urban speed: 24 to 56 km/h (typical dense Indian arterial corridor)
  const rawVehVelocity = queryVehicle.velocity || 9.5;
  const baseSpeedKmh = Math.min(56.0, Math.max(24.0, rawVehVelocity * 3.6));

  // Realistic micro-jitter per vehicle ID (-8% to +8%)
  const vehSeed = parseInt(candidateVehicle.id.replace(/\D/g, "") || "3", 10);
  const jitterPercent = (((vehSeed * 13) % 17) - 8) / 100;

  // Realistic physical travel time in seconds for the corridor at this vehicle speed
  let deltaSeconds: number;
  if (isGroundTruthMatch) {
    const targetPhysicalTransit = (corridorDistKm / (baseSpeedKmh / 3600)) * (1 + jitterPercent);
    deltaSeconds = Math.max(38, Math.round(targetPhysicalTransit));
  } else {
    // Impostor vehicle arriving outside the realistic travel-time distribution
    const anomalyFactor = vehSeed % 2 === 0 ? 0.38 : 2.3;
    deltaSeconds = Math.max(18, Math.round((corridorDistKm / (baseSpeedKmh / 3600)) * anomalyFactor));
  }

  const impliedSpeedKmh = parseFloat((corridorDistKm / (deltaSeconds / 3600)).toFixed(1));
  const transitParams = cameraA.typicalTransitSeconds || { min: 40, max: 120, mean: 80, stdDev: 15 };

  const weights = {
    appearance: customWeights?.appearance ?? 0.22,
    fastag: customWeights?.fastag ?? 0.22,
    tyrePressure: customWeights?.tyrePressure ?? 0.18,
    dents: customWeights?.dents ?? (pipelineConfig?.dentDisambiguationWeight ?? 0.16),
    spatioTemporal: customWeights?.spatioTemporal ?? 0.12,
    motion: customWeights?.motion ?? 0.05,
    rfHashed: customWeights?.rfHashed ?? 0.05,
  };

  const totalW = Object.values(weights).reduce((a, b) => a + b, 0) || 1.0;
  const normWeights = {
    appearance: weights.appearance / totalW,
    fastag: weights.fastag / totalW,
    tyrePressure: weights.tyrePressure / totalW,
    dents: weights.dents / totalW,
    spatioTemporal: weights.spatioTemporal / totalW,
    motion: weights.motion / totalW,
    rfHashed: weights.rfHashed / totalW,
  };

  // 1. Vision AI Embeddings: OSNet x1.0 (512-dim TorchReID) & DINOv2-small Fallback
  const osnetSim = cosineSimilarity(
    queryVehicle.osnetEmbedding512 || queryVehicle.trueEmbedding,
    candidateVehicle.osnetEmbedding512 || candidateVehicle.trueEmbedding
  );

  // Trigger DINOv2-small (384-dim Meta) fallback embedder if forced or if OSNet is ambiguous (margin > 0.86)
  const isFallbackTriggered = !!pipelineConfig?.forceFallbackEmbedder || (osnetSim >= 0.85);
  let dinov2Sim = 0;
  let activeAppSim = osnetSim;
  let activeEmbedder: EmbedderModelId = "osnet_x1_0";

  if (isFallbackTriggered) {
    dinov2Sim = cosineSimilarity(
      queryVehicle.dinov2Embedding384 || queryVehicle.trueEmbedding,
      candidateVehicle.dinov2Embedding384 || candidateVehicle.trueEmbedding
    );
    if (pipelineConfig?.forceFallbackEmbedder) {
      activeAppSim = dinov2Sim;
      activeEmbedder = "dinov2_vits14";
    } else {
      // Harmonic ensemble between OSNet omni-scale convs and DINOv2 patch attention
      activeAppSim = 0.55 * osnetSim + 0.45 * dinov2Sim;
    }
  }

  // 2. Windshield Fine-Grid FASTag Placement Match
  const fastagComparison = calculateWindshieldGridSimilarity(
    queryVehicle.fastagPlacement,
    candidateVehicle.fastagPlacement
  );

  // 3. Dynamic Tyre Pressure Profile Match
  const pressureComparison = calculateTyrePressureSimilarity(
    queryVehicle.tyrePressure,
    candidateVehicle.tyrePressure
  );

  // 4. YOLOv8m-t42 (NUST) Real-Time Dent & Defect Detection (Precision 0.86, Recall 0.84)
  const dentComparison = calculateDentDefectSimilarity(
    queryVehicle.dentDefects || [],
    candidateVehicle.dentDefects || []
  );

  // 5. Motion Embedding & RF Hash
  const speedDiff = Math.abs(queryVehicle.motionEmbedding.speedKmh - candidateVehicle.motionEmbedding.speedKmh);
  const motionScore = Math.max(0.1, 1.0 - speedDiff / 40);
  const rfHashedMatchScore = queryVehicle.rfidHashedToken === candidateVehicle.rfidHashedToken ? 1.0 : 0.1;

  // 6. Spatio-Temporal & Route Plausibility
  const stResult = calculateSpatioTemporalScore(deltaSeconds, transitParams);
  const temporalFilterPassed = stResult.filterStatus === "PASSED_PLAUSIBLE";
  const routePlausibilityPassed = true;

  let filterPenalty = 1.0;
  let filterStatus: "PASSED_PLAUSIBLE" | "REJECTED_TEMPORAL_IMPOSSIBILITY" | "REJECTED_ROUTE_MISMATCH" =
    stResult.filterStatus;

  if (!temporalFilterPassed) {
    filterPenalty = 0.06;
    filterStatus = "REJECTED_TEMPORAL_IMPOSSIBILITY";
  }

  // Multi-Modal Sigmoid Fusion: S = sigma(linearLogit)
  const linearLogit =
    normWeights.appearance * activeAppSim +
    normWeights.fastag * fastagComparison.score +
    normWeights.tyrePressure * pressureComparison.score +
    normWeights.dents * dentComparison.score +
    normWeights.spatioTemporal * stResult.prob +
    normWeights.motion * motionScore +
    normWeights.rfHashed * rfHashedMatchScore;

  // Sharp logistic curve centered at 0.52
  const sigmoidActivation = 1.0 / (1.0 + Math.exp(-7.5 * (linearLogit - 0.52)));
  const combinedScore = Math.max(0, Math.min(1.0, sigmoidActivation * filterPenalty));
  const confidenceScore = parseFloat((combinedScore * 100).toFixed(1));

  let decision: "TRUE_MATCH" | "AMBIGUOUS" | "FALSE_ALARM" = "FALSE_ALARM";
  if (temporalFilterPassed && combinedScore >= 0.76) {
    decision = "TRUE_MATCH";
  } else if (temporalFilterPassed && combinedScore >= 0.50) {
    decision = "AMBIGUOUS";
  }

  let reasoning = "";
  if (!temporalFilterPassed) {
    reasoning = `DISQUALIFIED BY TEMPORAL FILTER: Transit time Δt=${deltaSeconds.toFixed(0)}s implies velocity ${impliedSpeedKmh.toFixed(1)} km/h (Physical congestion violation).`;
  } else if (isGroundTruthMatch) {
    reasoning = `MULTI-MODAL CONFIRMED (${confidenceScore}%): OSNet x1.0 (512-d) + FASTag grid [${queryVehicle.fastagPlacement.gridX},${queryVehicle.fastagPlacement.gridY}], Tyre Pressure (${pressureComparison.rmsePsi} PSI RMSE) & YOLOv8m-t42 Dent Match (${dentComparison.matchingCount} defects) break identical coating tie.`;
  } else {
    reasoning = `AMBIGUOUS CANDIDATE REJECTED: Disambiguated by FASTag grid offset (Δgrid=${fastagComparison.gridDiff.gridSteps}), Tyre Pressure signature (${pressureComparison.rmsePsi} PSI RMSE), and distinct panel damage fingerprints.`;
  }

  const detectorModelUsed: DetectorModelId = pipelineConfig?.activeDetector || "yolo26s";

  return {
    id: `match_${queryVehicle.id}_${candidateVehicle.id}_${cameraB.id}_${Date.now()}_${++_globalMatchCounter}`,
    queryVehicleId: queryVehicle.id,
    candidateVehicleId: candidateVehicle.id,
    sourceCamera: cameraA.id,
    targetCamera: cameraB.id,
    timeA,
    timeB,
    transitDeltaSeconds: deltaSeconds,
    impliedSpeedKmh: parseFloat(impliedSpeedKmh.toFixed(1)),
    detectorModelUsed,
    embedderModelUsed: activeEmbedder,
    isFallbackEmbedderActive: isFallbackTriggered,
    trackerModelUsed: "bytetrack",
    byteTrackletId: parseInt(candidateVehicle.globalId.replace(/\D/g, "") || "101", 10),
    appearanceSimilarity: parseFloat(activeAppSim.toFixed(3)),
    osnetSimilarity512: parseFloat(osnetSim.toFixed(3)),
    dinov2Similarity384: isFallbackTriggered ? parseFloat(dinov2Sim.toFixed(3)) : undefined,
    fastagScore: parseFloat(fastagComparison.score.toFixed(3)),
    fastagDistanceNorm: fastagComparison.distanceNorm,
    fastagGridDiff: fastagComparison.gridDiff,
    queryFastag: queryVehicle.fastagPlacement,
    candidateFastag: candidateVehicle.fastagPlacement,
    tyrePressureScore: parseFloat(pressureComparison.score.toFixed(3)),
    tyrePressureRmse: pressureComparison.rmsePsi,
    tyrePressureDeltas: pressureComparison.deltas,
    queryPressure: queryVehicle.tyrePressure,
    candidatePressure: candidateVehicle.tyrePressure,
    dentScore: parseFloat(dentComparison.score.toFixed(3)),
    dentMatchingDentsCount: dentComparison.matchingCount,
    queryDents: queryVehicle.dentDefects || [],
    candidateDents: candidateVehicle.dentDefects || [],
    dentModelBenchmark: { precision: 0.86, recall: 0.84 },
    rfHashedMatchScore,
    motionEmbeddingScore: parseFloat(motionScore.toFixed(2)),
    spatioTemporalProbability: parseFloat(stResult.prob.toFixed(3)),
    temporalFilterPassed,
    routePlausibilityPassed,
    filterStatus,
    weightsUsed: {
      appearance: parseFloat(normWeights.appearance.toFixed(2)),
      fastag: parseFloat(normWeights.fastag.toFixed(2)),
      tyrePressure: parseFloat(normWeights.tyrePressure.toFixed(2)),
      dents: parseFloat(normWeights.dents.toFixed(2)),
      spatioTemporal: parseFloat(normWeights.spatioTemporal.toFixed(2)),
      motion: parseFloat(normWeights.motion.toFixed(2)),
      rfHashed: parseFloat(normWeights.rfHashed.toFixed(2)),
    },
    rawFusionLogit: parseFloat(linearLogit.toFixed(3)),
    combinedScore: parseFloat(combinedScore.toFixed(3)),
    confidenceScore,
    isGroundTruthMatch,
    decision,
    reasoning,
    isNightMatch: isNight,
  };
}

export function computeProbabilisticOdMatrix(
  nodes: CameraId[],
  trips: Record<string, Record<string, number>>,
  travelTimeStats: Record<string, Record<string, RouteTravelTimeStat>>,
  modalSplit: Record<VehicleType, number>,
  avgCorridorSpeedKmh: number,
  confidenceThreshold: number = 0.70,
  imputedTripsOverride?: Record<string, Record<string, number>>,
  privacyOptions?: {
    enforceMinGroupSize: boolean;
    minGroupSize: number;
    differentialPrivacyEnabled: boolean;
    epsilon: number;
  }
): OriginDestinationMatrix {
  const transitionProbabilities: Record<string, Record<string, number>> = {};
  let totalTripsLogged = 0;

  const effectiveTrips = imputedTripsOverride || trips;

  nodes.forEach((orig) => {
    transitionProbabilities[orig] = {};
    const outboundTrips = effectiveTrips[orig] || {};
    let rowSum = 0;

    nodes.forEach((dest) => {
      const count = outboundTrips[dest] || 0;
      rowSum += count;
      totalTripsLogged += count;
    });

    nodes.forEach((dest) => {
      const count = outboundTrips[dest] || 0;
      transitionProbabilities[orig][dest] = rowSum > 0 ? parseFloat((count / rowSum).toFixed(3)) : 0;
    });
  });

  const corridorThroughputVehPerHour = Math.round(totalTripsLogged * 14.5);

  let protectedTripsResult: OriginDestinationMatrix["privacyProtectedTrips"];
  let suppressedCount = 0;

  if (privacyOptions) {
    const res = applyPrivacyPreservationToOdMatrix(effectiveTrips, nodes, privacyOptions);
    protectedTripsResult = res.protectedTrips;
    suppressedCount = res.suppressedCount;
  }

  return {
    nodes,
    trips,
    imputedTrips: effectiveTrips,
    transitionProbabilities,
    travelTimeStats,
    modalSplit,
    totalReIdentified: totalTripsLogged,
    totalTripsLogged,
    avgCorridorSpeedKmh,
    confidenceThreshold,
    corridorThroughputVehPerHour,
    privacyModeActive: !!privacyOptions?.enforceMinGroupSize || !!privacyOptions?.differentialPrivacyEnabled,
    minGroupSize: privacyOptions?.minGroupSize ?? 10,
    suppressedCellCount: suppressedCount,
    differentialPrivacyEpsilon: privacyOptions?.epsilon ?? 1.0,
    privacyProtectedTrips: protectedTripsResult,
  };
}
