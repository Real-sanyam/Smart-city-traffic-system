export type VehicleType =
  | "two_wheeler"
  | "auto_rickshaw"
  | "hatchback"
  | "bus"
  | "truck";

export type CameraId = "CAM_A" | "CAM_B" | "CAM_C" | "CAM_D";

export interface WindshieldFastag {
  present: boolean;
  gridX: number; // 0 to 9 (10x10 fine coordinate grid column)
  gridY: number; // 0 to 9 (10x10 fine coordinate grid row)
  normX: number; // 0.00 to 1.00 normalized lateral position (0 = left, 1 = right)
  normY: number; // 0.00 to 1.00 normalized vertical position (0 = top, 1 = bottom)
  offsetMm: { dx: number; dy: number }; // Millimeter deviation from windshield rearview mirror center
  tagIdSnippet: string; // Sensor detection code snippet (non-plate)
  tiltDeg: number; // Manual application angle tilt (-5° to +5°)
}

export interface TyrePressureProfile {
  wheelPressures: Record<string, number>; // e.g. { FL: 32.4, FR: 31.8, RL: 33.1, RR: 30.5 } in PSI
  wheelOrder: string[]; // ["FL", "FR", "RL", "RR"] or ["Front", "Rear"]
  meanPressure: number; // average PSI
  asymmetryIndex: number; // Left vs Right or Front vs Rear imbalance
  unit: "PSI";
  captureGridPoint: string; // Dynamic road surface grid point identifier
  timestamp: number;
}

export interface MicroFeatures {
  helmetColor?: "black" | "white" | "red" | "yellow" | "none";
  roofRack: boolean;
  bumperScratch: boolean;
  windshieldSticker: boolean;
  cargoType?: "none" | "crates" | "tarpaulin" | "luggage";
  sunfilmTint: "clear" | "mild" | "dark";
}

export interface VehicleDentDefect {
  id: string;
  location:
    | "front_bumper"
    | "rear_bumper"
    | "left_fender"
    | "right_fender"
    | "hood"
    | "left_door"
    | "right_door"
    | "trunk"
    | "roof";
  label: string;
  type: "dent" | "scratch" | "crease" | "paint_peel";
  confidence: number; // e.g. 0.88
  precisionBenchmark: number; // 0.86 for YOLOv8m-t42 (NUST)
  recallBenchmark: number; // 0.84 for YOLOv8m-t42 (NUST)
  modelSource: "YOLOv8m-t42 (NUST)";
  severity: "minor" | "moderate" | "severe";
  boundingBox: { x: number; y: number; w: number; h: number }; // normalized 0-1
  fingerprintHash: string;
  insuranceAuditCode: string;
}

export type DetectorModelId = "yolo26s" | "yolo27" | "yolo26n";
export type EmbedderModelId = "osnet_x1_0" | "dinov2_vits14";
export type TrackerModelId = "bytetrack";
export type DentDetectorModelId = "yolov8m_t42_nust";

export interface VisionModelPipelineConfig {
  primaryDetector: DetectorModelId;
  activeDetector: DetectorModelId;
  isCpuLowPowerMode: boolean; // switches to yolo26n.pt
  detectorWeights: string; // e.g. "yolo26s.pt", "yolo27.pt", "yolo26n.pt"
  reidEmbedder: EmbedderModelId; // "osnet_x1_0" (osnet_v1, 512-dim, TorchReID)
  fallbackEmbedder: EmbedderModelId; // "dinov2_vits14" (384-dim, Meta)
  forceFallbackEmbedder: boolean;
  tracker: TrackerModelId; // "bytetrack" (Ultralytics built-in)
  trackerHighConfThreshold: number; // default 0.60
  trackerLowConfThreshold: number; // default 0.10
  dentDetector: DentDetectorModelId; // "yolov8m_t42_nust" (Precision 0.86, Recall 0.84)
  dentConfidenceThreshold: number; // default 0.45
  dentDisambiguationWeight: number; // default 0.20
  targetFps: number;
}

export interface CameraSighting {
  cameraId: CameraId;
  timestamp: number; // in simulation seconds
  lane: number;
  speedKmh: number;
  extractedEmbedding: number[]; // 512-d OSNet or 384-d DINOv2
  osnetEmbedding512?: number[]; // 512-dim OSNet x1.0 (TorchReID)
  dinov2Embedding384?: number[]; // 384-dim DINOv2-small (Meta)
  embedderUsed: EmbedderModelId;
  detectedBox: { x: number; y: number; w: number; h: number };
  detectorModelUsed: DetectorModelId;
  detectorConfidence: number;
  trackletId: number;
  trackletStage: 1 | 2; // ByteTrack Stage 1 (high conf) or Stage 2 (low conf recovery)
  dentDefectsObserved?: VehicleDentDefect[];
  snapshotUrl?: string;
  illuminationLux: number;
  fastagObserved?: WindshieldFastag;
  tyrePressureObserved?: TyrePressureProfile;
  rfidHashObserved?: string;
  isNightCapture?: boolean;
}

export interface SimulatedVehicle {
  id: string;
  globalId: string;
  type: VehicleType;
  colorName: string;
  primaryColorHex: string;
  secondaryColorHex: string;
  microFeatures: MicroFeatures;
  dentDefects: VehicleDentDefect[]; // Detected by YOLOv8m-t42 (NUST) Precision 0.86, Recall 0.84
  fastagPlacement: WindshieldFastag;
  tyrePressure: TyrePressureProfile;
  rfidHashedToken: string; // SHA-256 edge hash snippet
  acousticSignature: number[]; // 4-band pavement resonance
  motionEmbedding: { speedKmh: number; acceleration: number; laneOffset: number };
  trueEmbedding: number[]; // 16-d normalized base vector
  osnetEmbedding512: number[]; // 512-dim OSNet x1.0 (osnet_v1 TorchReID)
  dinov2Embedding384: number[]; // 384-dim DINOv2-small (dinov2_vits14 Meta)
  originCamera: CameraId;
  destinationCamera: CameraId | "EXIT_RAMP";
  routeProgress: number; // 0 to 1
  currentPosition: [number, number, number];
  velocity: number; // units/sec
  currentLane: number;
  sightings: CameraSighting[];
  isActive: boolean;
  thermalSignatureKelvin: number; // 310K-360K for thermal imaging
}

export interface CameraNode {
  id: CameraId;
  name: string;
  junctionTitle: string;
  worldPos: [number, number, number];
  viewDirection: [number, number, number];
  fov: number;
  roadDistanceToNextKm: number;
  typicalTransitSeconds: { min: number; max: number; mean: number; stdDev: number };
  status: "online" | "degraded" | "offline";
  lastHeartbeatSeconds: number;
  adaptationStatus: "calibrated" | "adapting" | "uncalibrated";
  nightEnhancement: boolean;
  installedModel: string;
}

export interface ReIdMatchResult {
  id: string;
  queryVehicleId: string;
  candidateVehicleId: string;
  sourceCamera: string;
  targetCamera: string;
  timeA: number;
  timeB: number;
  transitDeltaSeconds: number;
  impliedSpeedKmh: number;
  
  // Vision AI Model Stack Pipeline Details
  detectorModelUsed: DetectorModelId; // "yolo26s" | "yolo27" | "yolo26n"
  embedderModelUsed: EmbedderModelId; // "osnet_x1_0" (primary) | "dinov2_vits14" (fallback)
  isFallbackEmbedderActive: boolean; // true if DINOv2-small was invoked
  trackerModelUsed: TrackerModelId; // "bytetrack"
  byteTrackletId?: number;

  // 1. Appearance Visual Embedding (OSNet x1.0 512-dim / DINOv2 384-dim)
  appearanceSimilarity: number;
  osnetSimilarity512: number;
  dinov2Similarity384?: number;
  partLevelAttentionScore?: number; // wheels, headlamps, FASTag quadrant
  
  // 2. Windshield Fine-Grid FASTag Placement
  fastagScore: number;
  fastagDistanceNorm: number;
  fastagGridDiff: { dx: number; dy: number; gridSteps: number };
  queryFastag: WindshieldFastag;
  candidateFastag: WindshieldFastag;
  
  // 3. Dynamic Tyre Pressure Profiling
  tyrePressureScore: number;
  tyrePressureRmse: number;
  tyrePressureDeltas: Record<string, number>;
  queryPressure: TyrePressureProfile;
  candidatePressure: TyrePressureProfile;

  // 4. YOLOv8m-t42 (NUST) Physical Dent & Defect Fingerprinting
  dentScore: number; // 0.0 to 1.0 (matching panel damage/dent location)
  dentMatchingDentsCount: number;
  queryDents: VehicleDentDefect[];
  candidateDents: VehicleDentDefect[];
  dentModelBenchmark: { precision: number; recall: number }; // 0.86, 0.84
  
  // 5. Auxiliary Sensor Cues (Edge Hashed RF & Motion)
  rfHashedMatchScore: number; // 1.0 if identical SHA256 snippet, 0.0 otherwise
  motionEmbeddingScore: number; // kinematic consistency (speed, acceleration)
  
  // 6. Spatio-Temporal & Route Plausibility Filters
  spatioTemporalProbability: number;
  temporalFilterPassed: boolean;
  routePlausibilityPassed: boolean;
  filterStatus: "PASSED_PLAUSIBLE" | "REJECTED_TEMPORAL_IMPOSSIBILITY" | "REJECTED_ROUTE_MISMATCH";
  
  // Multi-Modal Sigmoid Score Fusion
  weightsUsed: {
    appearance: number;
    fastag: number;
    tyrePressure: number;
    dents: number;
    spatioTemporal: number;
    motion: number;
    rfHashed: number;
  };
  rawFusionLogit: number;
  combinedScore: number; // 0.0 - 1.0 (via sigmoid activation)
  confidenceScore: number; // 0 - 100%
  
  isGroundTruthMatch: boolean;
  decision: "TRUE_MATCH" | "AMBIGUOUS" | "FALSE_ALARM";
  reasoning: string;
  isNightMatch?: boolean;
}

export interface RouteTravelTimeStat {
  meanSeconds: number;
  stdDev: number;
  samples: number;
  minSeconds: number;
  maxSeconds: number;
}

// Origin-Destination Matrix with Privacy and Imputation Options
export interface OriginDestinationMatrix {
  nodes: CameraId[];
  trips: Record<string, Record<string, number>>; // Ground truth / raw counted trips
  imputedTrips: Record<string, Record<string, number>>; // Flow after Bayesian/temporal imputation for offline cameras
  transitionProbabilities: Record<string, Record<string, number>>; // P(D_j | O_i)
  travelTimeStats: Record<string, Record<string, RouteTravelTimeStat>>;
  modalSplit: Record<VehicleType, number>;
  totalReIdentified: number;
  totalTripsLogged: number;
  avgCorridorSpeedKmh: number;
  confidenceThreshold: number;
  corridorThroughputVehPerHour: number;
  
  // Privacy Preservation Overlays
  privacyModeActive: boolean;
  minGroupSize: number; // Default 10
  suppressedCellCount: number;
  differentialPrivacyEpsilon: number; // e.g. 1.0 (Laplace mechanism)
  privacyProtectedTrips?: Record<string, Record<string, { display: string; count: number; isSuppressed: boolean; noiseAdded: number }>>;
}

// Night Enhancement Settings
export interface NightModeSettings {
  isNight: boolean;
  enhancer: "none" | "retinex_net" | "thermal_ir";
  illuminationLux: number; // Day: 12000 lux, Night: 8 lux
  domainAdversarialActive: boolean;
  partLevelAttention: boolean;
}

// Camera Outage & Flow Imputation State
export interface CameraOutageState {
  offlineCameraId: CameraId | null;
  outageDurationMinutes: number;
  imputationModel: "bayesian_graph" | "temporal_convnet" | "historical_gmm";
  isImputing: boolean;
  flowErrorBaselineRmse: number;
  flowErrorOutageRmse: number;
  imputationErrorIncreasePct: number;
}

// Unsupervised Domain Adaptation for Newly Commissioned Cameras
export interface DomainAdaptationState {
  newCameraId: CameraId;
  cameraName: string;
  status: "uncalibrated" | "contrastive_pretraining" | "adversarial_alignment" | "pseudo_labeling" | "converged";
  epoch: number;
  maxEpochs: number;
  clusterPurity: number; // 0.0 - 1.0
  pseudoLabelsGenerated: number;
  reIdAccuracyBefore: number;
  reIdAccuracyCurrent: number;
  isAdapting: boolean;
}

// Benchmark Evaluation Report
export interface ReIdBenchmarkReport {
  idf1Day: number;
  idf1Night: number;
  idf1GainRetinex: number;
  flowErrorMape: number;
  flowErrorRmse: number;
  imputationErrorPct: number;
  adaptationPurity: number;
  dpEpsilon: number;
  suppressedOdCells: number;
  totalEvaluatedVehicles: number;
  evaluatedAt: string;
}
