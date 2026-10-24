import * as THREE from "three";
import { VehicleType, MicroFeatures, WindshieldFastag, TyrePressureProfile } from "../types/reid";

// Helper: Procedural soft contact shadow texture
let _cachedShadowTexture: THREE.CanvasTexture | null = null;
function getContactShadowTexture(): THREE.CanvasTexture {
  if (_cachedShadowTexture) return _cachedShadowTexture;
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 60);
  gradient.addColorStop(0, "rgba(0, 0, 0, 0.7)");
  gradient.addColorStop(0.5, "rgba(0, 0, 0, 0.3)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  _cachedShadowTexture = new THREE.CanvasTexture(canvas);
  _cachedShadowTexture.colorSpace = THREE.SRGBColorSpace;
  return _cachedShadowTexture;
}

function createContactShadowMesh(width: number, length: number): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(width, length);
  const mat = new THREE.MeshBasicMaterial({
    map: getContactShadowTexture(),
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.02; // avoid z-fighting
  mesh.renderOrder = 1;
  return mesh;
}

// Procedural Wheels
function createWheel(radius: number, thickness: number): THREE.Group {
  const group = new THREE.Group();
  // Tire
  const tireGeo = new THREE.CylinderGeometry(radius, radius, thickness, 16);
  tireGeo.rotateZ(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.9,
    metalness: 0.1,
  });
  const tire = new THREE.Mesh(tireGeo, tireMat);
  group.add(tire);

  // Silver Rim
  const rimGeo = new THREE.CylinderGeometry(radius * 0.58, radius * 0.58, thickness * 1.05, 12);
  rimGeo.rotateZ(Math.PI / 2);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d8,
    roughness: 0.25,
    metalness: 0.85,
  });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  group.add(rim);

  return group;
}

// 1. Procedural Auto-Rickshaw (3-Wheeled Bajaj RE type)
export function createAutoRickshawMesh(
  primaryHex: string,
  secondaryHex: string,
  micro: MicroFeatures
): THREE.Group {
  const root = new THREE.Group();

  // Contact shadow
  root.add(createContactShadowMesh(1.8, 2.8));

  // Chassis bottom frame
  const chassisMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.8, metalness: 0.4 });
  const chassisGeo = new THREE.BoxGeometry(1.3, 0.2, 2.2);
  const chassis = new THREE.Mesh(chassisGeo, chassisMat);
  chassis.position.set(0, 0.4, 0);
  root.add(chassis);

  // Lower Body Shell (Green or Yellow)
  const bodyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(primaryHex),
    roughness: 0.35,
    metalness: 0.3,
  });
  const bodyGeo = new THREE.BoxGeometry(1.35, 0.7, 2.2);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.set(0, 0.8, 0);
  root.add(body);

  // Front tapered nose
  const noseGeo = new THREE.CylinderGeometry(0.35, 0.65, 0.65, 8);
  const nose = new THREE.Mesh(noseGeo, bodyMat);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 0.75, 1.25);
  root.add(nose);

  // Canvas Top Canopy (Black or Yellow)
  const canopyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(secondaryHex || 0x18181b),
    roughness: 0.9,
    metalness: 0.05,
  });
  const canopyGeo = new THREE.BoxGeometry(1.32, 0.85, 1.7);
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.set(0, 1.5, -0.2);
  root.add(canopy);

  // Windshield
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x93c5fd,
    roughness: 0.1,
    metalness: 0.9,
    transparent: true,
    opacity: 0.7,
  });
  const windshieldGeo = new THREE.PlaneGeometry(1.1, 0.55);
  const windshield = new THREE.Mesh(windshieldGeo, glassMat);
  windshield.position.set(0, 1.45, 0.65);
  windshield.rotation.x = 0.2;
  root.add(windshield);

  // Wheels: 1 front, 2 rear
  const frontWheel = createWheel(0.28, 0.18);
  frontWheel.position.set(0, 0.28, 1.1);
  root.add(frontWheel);

  const rearWheelL = createWheel(0.3, 0.2);
  rearWheelL.position.set(-0.68, 0.3, -0.65);
  root.add(rearWheelL);

  const rearWheelR = createWheel(0.3, 0.2);
  rearWheelR.position.set(0.68, 0.3, -0.65);
  root.add(rearWheelR);

  // Headlamp
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfef08a, emissiveIntensity: 0.5 });
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12), lampMat);
  lamp.rotation.x = Math.PI / 2;
  lamp.position.set(0, 0.8, 1.55);
  root.add(lamp);

  return root;
}

// 2. Procedural Two-Wheeler / Scooter with Rider & Helmet
export function createTwoWheelerMesh(colorHex: string, micro: MicroFeatures): THREE.Group {
  const root = new THREE.Group();

  root.add(createContactShadowMesh(1.0, 2.0));

  // Scooter Body / Apron
  const bodyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    roughness: 0.3,
    metalness: 0.4,
  });
  const bodyGeo = new THREE.BoxGeometry(0.45, 0.45, 1.5);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.set(0, 0.45, 0);
  root.add(body);

  // Front Apron Shield
  const apronGeo = new THREE.BoxGeometry(0.5, 0.6, 0.15);
  const apron = new THREE.Mesh(apronGeo, bodyMat);
  apron.position.set(0, 0.75, 0.6);
  apron.rotation.x = -0.2;
  root.add(apron);

  // Handlebars
  const handleMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.5, metalness: 0.6 });
  const handleGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.65, 8);
  handleGeo.rotateZ(Math.PI / 2);
  const handle = new THREE.Mesh(handleGeo, handleMat);
  handle.position.set(0, 1.05, 0.55);
  root.add(handle);

  // Wheels
  const frontWheel = createWheel(0.24, 0.12);
  frontWheel.position.set(0, 0.24, 0.65);
  root.add(frontWheel);

  const rearWheel = createWheel(0.24, 0.12);
  rearWheel.position.set(0, 0.24, -0.65);
  root.add(rearWheel);

  // Seat
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 0.7), seatMat);
  seat.position.set(0, 0.72, -0.15);
  root.add(seat);

  // Rider Torso
  const jacketMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.6, 0.3), jacketMat);
  torso.position.set(0, 1.15, -0.1);
  root.add(torso);

  // Rider Helmet (CRITICAL DISCRIMINATOR)
  const helmetColorMap: Record<string, number> = {
    black: 0x18181b,
    white: 0xf8fafc,
    red: 0xdc2626,
    yellow: 0xfacc15,
    none: 0x334155,
  };
  const helmetMat = new THREE.MeshStandardMaterial({
    color: helmetColorMap[micro.helmetColor || "black"],
    roughness: 0.25,
    metalness: 0.4,
  });
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), helmetMat);
  helmet.position.set(0, 1.58, -0.08);
  root.add(helmet);

  return root;
}

// 3. Procedural Hatchback / Sedan (White Swift, Silver WagonR, etc.)
export function createHatchbackMesh(
  colorHex: string,
  secondaryHex: string,
  micro: MicroFeatures,
  fastag?: WindshieldFastag
): THREE.Group {
  const root = new THREE.Group();

  root.add(createContactShadowMesh(2.2, 4.4));

  // Car Body Hull
  const bodyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    roughness: 0.28,
    metalness: 0.35,
  });
  const hullGeo = new THREE.BoxGeometry(1.8, 0.65, 3.8);
  const hull = new THREE.Mesh(hullGeo, bodyMat);
  hull.position.set(0, 0.6, 0);
  root.add(hull);

  // Cabin / Greenhouse
  const cabinGeo = new THREE.BoxGeometry(1.55, 0.58, 2.1);
  const cabin = new THREE.Mesh(cabinGeo, bodyMat);
  cabin.position.set(0, 1.15, -0.2);
  root.add(cabin);

  // Windows / Glass
  const glassMat = new THREE.MeshStandardMaterial({
    color: micro.sunfilmTint === "dark" ? 0x0f172a : micro.sunfilmTint === "mild" ? 0x334155 : 0x93c5fd,
    roughness: 0.1,
    metalness: 0.9,
    transparent: true,
    opacity: 0.8,
  });
  // Front Windshield
  const windshield = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.6), glassMat);
  windshield.position.set(0, 1.12, 0.87);
  windshield.rotation.x = 0.4;
  root.add(windshield);

  // Rear Window
  const rearGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 0.5), glassMat);
  rearGlass.position.set(0, 1.15, -1.26);
  rearGlass.rotation.x = -0.3;
  root.add(rearGlass);

  // 4 Wheels
  const wheelL1 = createWheel(0.35, 0.22);
  wheelL1.position.set(-0.95, 0.35, 1.1);
  root.add(wheelL1);

  const wheelR1 = createWheel(0.35, 0.22);
  wheelR1.position.set(0.95, 0.35, 1.1);
  root.add(wheelR1);

  const wheelL2 = createWheel(0.35, 0.22);
  wheelL2.position.set(-0.95, 0.35, -1.1);
  root.add(wheelL2);

  const wheelR2 = createWheel(0.35, 0.22);
  wheelR2.position.set(0.95, 0.35, -1.1);
  root.add(wheelR2);

  // Headlights
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.6 });
  const lightL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.1), lightMat);
  lightL.position.set(-0.65, 0.68, 1.9);
  root.add(lightL);

  const lightR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.1), lightMat);
  lightR.position.set(0.65, 0.68, 1.9);
  root.add(lightR);

  // Taillights
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.5 });
  const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.1), tailMat);
  tailL.position.set(-0.65, 0.72, -1.9);
  root.add(tailL);

  const tailR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.1), tailMat);
  tailR.position.set(0.65, 0.72, -1.9);
  root.add(tailR);

  // Fine-grained Micro-Feature 1: Roof Carrier Rack
  if (micro.roofRack) {
    const rackMat = new THREE.MeshStandardMaterial({ color: 0x71717a, roughness: 0.3, metalness: 0.8 });
    const barGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.4, 8);
    barGeo.rotateZ(Math.PI / 2);
    const bar1 = new THREE.Mesh(barGeo, rackMat);
    bar1.position.set(0, 1.48, 0.3);
    root.add(bar1);

    const bar2 = new THREE.Mesh(barGeo, rackMat);
    bar2.position.set(0, 1.48, -0.6);
    root.add(bar2);

    const sideBarGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.1, 8);
    const side1 = new THREE.Mesh(sideBarGeo, rackMat);
    side1.position.set(-0.68, 1.48, -0.15);
    root.add(side1);
    const side2 = new THREE.Mesh(sideBarGeo, rackMat);
    side2.position.set(0.68, 1.48, -0.15);
    root.add(side2);
  }

  // Fine-grained Micro-Feature 2: Visible bumper scratch / dent
  if (micro.bumperScratch) {
    const scratchMat = new THREE.MeshBasicMaterial({ color: 0x1c1917 });
    const scratch = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.06), scratchMat);
    scratch.position.set(0.6, 0.5, -1.91);
    root.add(scratch);
  }

  // Fine-grained Micro-Feature 3: FASTag toll tag positioned at fine grid coordinates
  const isTagPresent = fastag ? fastag.present : micro.windshieldSticker;
  if (isTagPresent) {
    const stickerMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const sticker = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.07), stickerMat);
    
    // Windshield surface coordinate mapping:
    // normX: 0 = left edge, 1 = right edge. Windshield width = 1.35
    // normY: 0 = top edge, 1 = bottom edge. Windshield height = 0.55
    const u = fastag ? fastag.normX : 0.45;
    const v = fastag ? fastag.normY : 0.20;
    
    // Center is (0.5, 0.5)
    const posX = (u - 0.5) * 1.15;
    // Slanted windshield along X-rotation = 0.4 rad
    const posY = 1.25 - (v - 0.1) * 0.45 * Math.cos(0.4);
    const posZ = 0.82 + (v - 0.1) * 0.45 * Math.sin(0.4);
    
    sticker.position.set(posX, posY, posZ);
    sticker.rotation.x = 0.4;
    if (fastag?.tiltDeg) {
      sticker.rotation.z = (fastag.tiltDeg * Math.PI) / 180;
    }
    root.add(sticker);
    
    // RFID chip metallic core
    const chipMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const chip = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.04), chipMat);
    chip.position.set(posX, posY + 0.002, posZ + 0.002);
    chip.rotation.x = 0.4;
    root.add(chip);
  }

  return root;
}

// 4. Procedural Transit Bus (BMTC style)
export function createCityBusMesh(primaryHex: string): THREE.Group {
  const root = new THREE.Group();

  root.add(createContactShadowMesh(2.8, 9.5));

  // Main Bus Body
  const busMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(primaryHex),
    roughness: 0.4,
    metalness: 0.2,
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 8.8), busMat);
  body.position.set(0, 1.4, 0);
  root.add(body);

  // Panoramic Window Strip
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.1,
    metalness: 0.8,
  });
  const winStrip = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.7, 7.8), windowMat);
  winStrip.position.set(0, 1.65, -0.2);
  root.add(winStrip);

  // Destination Route Board (Orange LED text glow)
  const signMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    emissive: 0xf97316,
    emissiveIntensity: 0.8,
  });
  const sign = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.25, 0.1), signMat);
  sign.position.set(0, 2.25, 4.42);
  root.add(sign);

  // 6 Wheels (Front single, rear dual axle)
  const wFL = createWheel(0.45, 0.28);
  wFL.position.set(-1.25, 0.45, 2.8);
  root.add(wFL);

  const wFR = createWheel(0.45, 0.28);
  wFR.position.set(1.25, 0.45, 2.8);
  root.add(wFR);

  const wRL1 = createWheel(0.45, 0.28);
  wRL1.position.set(-1.25, 0.45, -2.4);
  root.add(wRL1);

  const wRR1 = createWheel(0.45, 0.28);
  wRR1.position.set(1.25, 0.45, -2.4);
  root.add(wRR1);

  const wRL2 = createWheel(0.45, 0.28);
  wRL2.position.set(-1.25, 0.45, -3.4);
  root.add(wRL2);

  const wRR2 = createWheel(0.45, 0.28);
  wRR2.position.set(1.25, 0.45, -3.4);
  root.add(wRR2);

  // Roof AC Units
  const acMat = new THREE.MeshStandardMaterial({ color: 0xe4e4e7, roughness: 0.5 });
  const ac = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 2.4), acMat);
  ac.position.set(0, 2.65, 0.5);
  root.add(ac);

  return root;
}

// 5. Procedural Mini-Truck (Tata Ace style)
export function createTruckMesh(primaryHex: string, micro: MicroFeatures): THREE.Group {
  const root = new THREE.Group();

  root.add(createContactShadowMesh(2.2, 4.8));

  // Front Driver Cab
  const cabMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(primaryHex),
    roughness: 0.35,
    metalness: 0.3,
  });
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.4, 1.4), cabMat);
  cab.position.set(0, 1.05, 1.2);
  root.add(cab);

  // Open Rear Flatbed
  const bedMat = new THREE.MeshStandardMaterial({ color: 0x52525b, roughness: 0.7, metalness: 0.4 });
  const bed = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.45, 2.6), bedMat);
  bed.position.set(0, 0.7, -0.8);
  root.add(bed);

  // Cargo Load (Tarpaulin or Crates)
  if (micro.cargoType === "tarpaulin") {
    const tarpMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 });
    const tarp = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.8, 2.4), tarpMat);
    tarp.position.set(0, 1.3, -0.8);
    root.add(tarp);
  } else {
    const crateMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 });
    const crate1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 1.0), crateMat);
    crate1.position.set(-0.4, 1.15, -0.5);
    root.add(crate1);

    const crate2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 1.0), crateMat);
    crate2.position.set(0.4, 1.15, -1.1);
    root.add(crate2);
  }

  // 4 Wheels
  const wFL = createWheel(0.35, 0.22);
  wFL.position.set(-0.9, 0.35, 1.2);
  root.add(wFL);

  const wFR = createWheel(0.35, 0.22);
  wFR.position.set(0.9, 0.35, 1.2);
  root.add(wFR);

  const wRL = createWheel(0.35, 0.22);
  wRL.position.set(-0.9, 0.35, -1.2);
  root.add(wRL);

  const wRR = createWheel(0.35, 0.22);
  wRR.position.set(0.9, 0.35, -1.2);
  root.add(wRR);

  return root;
}

// Master Vehicle Factory
export function buildProceduralVehicleMesh(
  type: VehicleType,
  primaryHex: string,
  secondaryHex: string,
  micro: MicroFeatures,
  fastag?: WindshieldFastag
): THREE.Group {
  switch (type) {
    case "auto_rickshaw":
      return createAutoRickshawMesh(primaryHex, secondaryHex, micro);
    case "two_wheeler":
      return createTwoWheelerMesh(primaryHex, micro);
    case "bus":
      return createCityBusMesh(primaryHex);
    case "truck":
      return createTruckMesh(primaryHex, micro);
    case "hatchback":
    default:
      return createHatchbackMesh(primaryHex, secondaryHex, micro, fastag);
  }
}
