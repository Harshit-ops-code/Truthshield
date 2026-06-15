import React, { useRef, useEffect, useState } from "react";
import { Sparkles, Radio, Play, RotateCcw, Crosshair } from "lucide-react";

interface Point3D {
  x: number;
  y: number;
  z: number;
  label?: string;
}

interface Connection {
  from: number;
  to: number;
}

// 3D Wireframe Cybernetic Avatar coordinates
const baseAvatarPoints: Point3D[] = [
  // Skull top & Crown
  { x: 0, y: -1.2, z: 0 },         // 0: Crown top
  { x: -0.6, y: -0.9, z: 0.4 },     // 1: Forehead left
  { x: 0.6, y: -0.9, z: 0.4 },      // 2: Forehead right
  { x: 0, y: -0.9, z: 0.7 },        // 3: Forehead center
  
  // Sci-Fi Visor / Eyes
  { x: -0.4, y: -0.5, z: 0.8 },     // 4: Left eye inner
  { x: -0.8, y: -0.4, z: 0.6 },     // 5: Left eye outer
  { x: 0.4, y: -0.5, z: 0.8 },      // 6: Right eye inner
  { x: 0.8, y: -0.4, z: 0.6 },      // 7: Right eye outer
  
  // Nose Bridge & Tip
  { x: 0, y: -0.4, z: 0.85 },       // 8: Nose origin
  { x: 0, y: 0, z: 1.1, label: "Biometric Apex" }, // 9: Nose tip
  { x: -0.25, y: 0.1, z: 0.7 },     // 10: Left nostril
  { x: 0.25, y: 0.1, z: 0.7 },      // 11: Right nostril
  
  // Cheeks
  { x: -0.7, y: 0.1, z: 0.5 },      // 12: Left cheekbone
  { x: 0.7, y: 0.1, z: 0.5 },       // 13: Right cheekbone
  
  // Mouth
  { x: -0.35, y: 0.35, z: 0.8 },    // 14: Left mouth corner
  { x: 0.35, y: 0.35, z: 0.8 },     // 15: Right mouth corner
  { x: 0, y: 0.28, z: 0.9 },        // 16: Top Lip center
  { x: 0, y: 0.42, z: 0.9 },        // 17: Bottom Lip center
  
  // Jawline & Chin
  { x: -0.8, y: 0.3, z: 0.1 },      // 18: Left jaw top
  { x: 0.8, y: 0.3, z: 0.1 },       // 19: Right jaw top
  { x: -0.5, y: 0.7, z: 0.4 },      // 20: Left jaw angle
  { x: 0.5, y: 0.7, z: 0.4 },       // 21: Right jaw angle
  { x: 0, y: 0.95, z: 0.65, label: "Nodal Anchor Z" }, // 22: Chin tip
  
  // Back of head (for 3D depth)
  { x: -0.5, y: -0.5, z: -0.8 },    // 23
  { x: 0.5, y: -0.5, z: -0.8 },     // 24
  { x: 0, y: 0.5, z: -0.9 },        // 25
];

// Structural connectors for wireframe cybernetic face mapping mesh
const connections: Connection[] = [
  // Forehead outline
  { from: 0, to: 1 }, { from: 0, to: 2 }, { from: 0, to: 3 },
  { from: 1, to: 3 }, { from: 2, to: 3 },
  { from: 1, to: 5 }, { from: 2, to: 7 },
  
  // Visor / Eyes mapping
  { from: 4, to: 5 }, { from: 6, to: 7 },
  { from: 3, to: 8 }, { from: 8, to: 4 }, { from: 8, to: 6 },
  
  // Nose Outlines
  { from: 8, to: 9 }, { from: 9, to: 10 }, { from: 9, to: 11 },
  { from: 10, to: 12 }, { from: 11, to: 13 },
  
  // cheeks to jaw
  { from: 5, to: 12 }, { from: 7, to: 13 },
  { from: 12, to: 18 }, { from: 13, to: 19 },
  { from: 18, to: 20 }, { from: 19, to: 21 },
  { from: 20, to: 22 }, { from: 21, to: 22 },
  
  // Mouth shape controls
  { from: 10, to: 16 }, { from: 11, to: 16 },
  { from: 14, to: 16 }, { from: 15, to: 16 },
  { from: 14, to: 17 }, { from: 15, to: 17 },
  { from: 17, to: 22 },
  
  // Back skull support
  { from: 0, to: 23 }, { from: 0, to: 24 },
  { from: 23, to: 25 }, { from: 24, to: 25 },
  { from: 18, to: 23 }, { from: 19, to: 24 },
  { from: 25, to: 22 }
];

export default function HeroSection3D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const currentPointsRef = useRef<Point3D[]>([]);
  const [activeTab, setActiveTab] = useState<string>("image");

  // Synchronize active tab from workspace custom events
  useEffect(() => {
    const handleTabChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail);
      }
    };
    window.addEventListener("truthshield_tab_changed", handleTabChange);
    return () => {
      window.removeEventListener("truthshield_tab_changed", handleTabChange);
    };
  }, []);

  // Programmatically generate dynamic morphing shapes based on activeTab
  const { points, connections } = React.useMemo(() => {
    const pts: Point3D[] = [];
    const conns: Connection[] = [];

    if (activeTab === "video") {
      // 1. Biometric Lip Sync waveform (Mouth mesh)
      const coreCount = 14;
      for (let i = 0; i < coreCount; i++) {
        const xVal = -0.85 + (i / (coreCount - 1)) * 1.7;
        const yVal = Math.sin(i * 1.2) * 0.15 + 0.1;
        pts.push({ x: xVal, y: yVal, z: 0.1 * Math.cos(i), label: i === 6 ? "SPEECH_WAVE" : undefined });
        if (i > 0) conns.push({ from: pts.length - 2, to: pts.length - 1 });
      }

      const outerCount = 18;
      const startOuterIdx = pts.length;
      for (let i = 0; i < outerCount; i++) {
        const angle = (i / outerCount) * Math.PI * 2;
        const rx = 0.65;
        const ry = 0.45;
        pts.push({
          x: Math.cos(angle) * rx,
          y: Math.sin(angle) * ry - 0.15,
          z: Math.sin(angle * 2) * 0.25,
          label: i === 0 ? "ORAL_COMMISSURE" : undefined
        });
        const currentIdx = pts.length - 1;
        const nextIdx = startOuterIdx + ((i + 1) % outerCount);
        conns.push({ from: currentIdx, to: nextIdx });

        if (i % 2 === 0) {
          const coreIdx = Math.floor((i / outerCount) * coreCount);
          conns.push({ from: currentIdx, to: coreIdx });
        }
      }

      pts.push({ x: -0.65, y: -0.65, z: 0, label: "AUDIO_LATCH" });
      pts.push({ x: 0.65, y: -0.65, z: 0, label: "LIP_SYNC" });
      conns.push({ from: pts.length - 2, to: startOuterIdx + 4 });
      conns.push({ from: pts.length - 1, to: startOuterIdx + 14 });

    } else if (activeTab === "text") {
      // 2. Structured Neural lattice
      const l1 = 4;
      const l1Start = pts.length;
      for (let i = 0; i < l1; i++) {
        pts.push({ x: -0.75, y: -0.6 + (i / (l1 - 1)) * 1.2, z: 0, label: i === 0 ? "INPUT_LEX" : undefined });
      }

      const l2 = 6;
      const l2Start = pts.length;
      for (let i = 0; i < l2; i++) {
        pts.push({ x: -0.25, y: -0.7 + (i / (l2 - 1)) * 1.4, z: 0.15, label: i === 2 ? "PERPLEXITY" : undefined });
        for (let j = 0; j < l1; j++) {
          conns.push({ from: l1Start + j, to: l2Start + i });
        }
      }

      const l3 = 6;
      const l3Start = pts.length;
      for (let i = 0; i < l3; i++) {
        pts.push({ x: 0.25, y: -0.7 + (i / (l3 - 1)) * 1.4, z: -0.15, label: i === 3 ? "BURSTINESS" : undefined });
        for (let j = 0; j < l2; j++) {
          conns.push({ from: l2Start + j, to: l3Start + i });
        }
      }

      const l4 = 3;
      const l4Start = pts.length;
      for (let i = 0; i < l4; i++) {
        pts.push({ x: 0.75, y: -0.4 + (i / (l4 - 1)) * 0.8, z: 0, label: i === 1 ? "TAMPER_OUT" : undefined });
        for (let j = 0; j < l3; j++) {
          conns.push({ from: l3Start + j, to: l4Start + i });
        }
      }

    } else if (activeTab === "rumor") {
      // 3. Solar fact solar system (Claim core + sources)
      pts.push({ x: 0, y: -0.05, z: 0, label: "CLAIM_CORE" });
      const coreIdx = pts.length - 1;

      const count = 14;
      const startIdx = pts.length;
      for (let i = 0; i < count; i++) {
        const theta = (i / count) * Math.PI * 2;
        const radius = 0.65 + (i % 2 === 0 ? 0.15 : -0.1);
        pts.push({
          x: Math.cos(theta) * radius,
          y: Math.sin(theta) * radius * 0.45,
          z: Math.sin(theta) * radius * 0.85,
          label: i === 0 ? "SOURCE_AFP" : i === 4 ? "SOURCE_FACTCHECK" : undefined
        });
        const currentIdx = pts.length - 1;
        conns.push({ from: currentIdx, to: coreIdx });

        const prevIdx = startIdx + ((i - 1 + count) % count);
        conns.push({ from: currentIdx, to: prevIdx });
      }

    } else if (activeTab === "message") {
      // 4. Protective Shield mesh outline
      const shieldPoints = [
        { x: 0, y: -0.75, z: 0 },
        { x: -0.55, y: -0.5, z: 0.2 },
        { x: -0.7, y: 0, z: 0.4 },
        { x: -0.55, y: 0.5, z: 0.2 },
        { x: 0, y: 0.9, z: 0, label: "SHIELD_BASE" },
        { x: 0.55, y: 0.5, z: -0.2 },
        { x: 0.7, y: 0, z: -0.4 },
        { x: 0.55, y: -0.5, z: -0.2 }
      ];

      const startIdx = pts.length;
      shieldPoints.forEach((sp, idx) => {
        pts.push({ ...sp, label: idx === 0 ? "SHIELD_APEX" : undefined });
        if (idx > 0) conns.push({ from: pts.length - 2, to: pts.length - 1 });
      });
      conns.push({ from: pts.length - 1, to: startIdx });

      const coreCount = 10;
      const startCoreIdx = pts.length;
      for (let i = 0; i < coreCount; i++) {
        const theta = (i / coreCount) * Math.PI * 2;
        pts.push({
          x: Math.cos(theta) * 0.3,
          y: Math.sin(theta) * 0.35 - 0.05,
          z: Math.sin(theta) * 0.2,
          label: i === 0 ? "SMS_PAYLOAD" : undefined
        });
        const currentIdx = pts.length - 1;
        const nextIdx = startCoreIdx + ((i + 1) % coreCount);
        conns.push({ from: currentIdx, to: nextIdx });

        const shieldTarget = startIdx + (i % shieldPoints.length);
        conns.push({ from: currentIdx, to: shieldTarget });
      }

    } else {
      // 5. Default: Geodesic Neural Sphere
      const coreCount = 8;
      for (let i = 0; i < coreCount; i++) {
        const angle = (i / coreCount) * Math.PI * 2;
        pts.push({
          x: Math.cos(angle) * 0.2,
          y: (i % 2 === 0 ? 0.15 : -0.15),
          z: Math.sin(angle) * 0.2,
          label: i === 0 ? "CORE_SYNC" : undefined
        });
      }

      const rings = 5;
      const ptsPerRing = [6, 10, 14, 10, 6];
      const latitudes = [-Math.PI/3, -Math.PI/6, 0, Math.PI/6, Math.PI/3];

      pts.push({ x: 0, y: -0.8, z: 0, label: "NEURAL_APEX" });
      const pole1Idx = pts.length - 1;
      pts.push({ x: 0, y: 0.8, z: 0, label: "QUANTUM_BASE" });
      const pole2Idx = pts.length - 1;

      const ringStartIndices: number[] = [];

      for (let r = 0; r < rings; r++) {
        const lat = latitudes[r];
        const count = ptsPerRing[r];
        const radius = Math.cos(lat) * 0.75;
        const yVal = Math.sin(lat) * 0.75;
        
        ringStartIndices.push(pts.length);

        for (let i = 0; i < count; i++) {
          const theta = (i / count) * Math.PI * 2;
          pts.push({
            x: Math.cos(theta) * radius,
            y: yVal,
            z: Math.sin(theta) * radius,
            label: (r === 2 && i === 0) ? "DATA_LINK" : undefined
          });

          const currentIdx = pts.length - 1;
          const nextIdx = ringStartIndices[r] + ((i + 1) % count);
          conns.push({ from: currentIdx, to: nextIdx });

          if (r === 0) conns.push({ from: currentIdx, to: pole1Idx });
          if (r === rings - 1) conns.push({ from: currentIdx, to: pole2Idx });

          if (r > 0) {
            const prevRingStart = ringStartIndices[r - 1];
            const prevCount = ptsPerRing[r - 1];
            const prevIdx = prevRingStart + Math.floor((i / count) * prevCount) % prevCount;
            conns.push({ from: currentIdx, to: prevIdx });
            
            const prevIdxCross = prevRingStart + (Math.floor((i / count) * prevCount) + 1) % prevCount;
            conns.push({ from: currentIdx, to: prevIdxCross });
          }

          if ((currentIdx + i) % 4 === 0) {
            const coreIdx = (currentIdx) % coreCount;
            conns.push({ from: currentIdx, to: coreIdx });
          }
        }
      }
    }

    return { points: pts, connections: conns };
  }, [activeTab]);
  
  // Interactive control states
  const [isRotating, setIsRotating] = useState(true);
  const [scanMode, setScanMode] = useState<"biometric" | "refraction" | "anomaly">("biometric");
  const [noiseIntensity, setNoiseIntensity] = useState(15); // Percentage of manipulation noise
  const [rotationAngle, setRotationAngle] = useState({ x: 0.15, y: -0.45, z: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Auto rotation step
  useEffect(() => {
    if (!isRotating || isDragging) return;
    const interval = setInterval(() => {
      setRotationAngle((prev) => ({
        ...prev,
        y: prev.y + 0.006, // subtle circular rotation
        x: 0.15 + Math.sin(Date.now() * 0.001) * 0.1 // subtle bobbing effect
      }));
    }, 16);
    return () => clearInterval(interval);
  }, [isRotating, isDragging]);

  // High performance Canvas Redraw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    // Initialize decorative glowing floaters
    const floaters: { x: number; y: number; speed: number; size: number; alpha: number }[] = [];
    for (let i = 0; i < 20; i++) {
      floaters.push({
        x: Math.random() * 600,
        y: Math.random() * 460,
        speed: 0.15 + Math.random() * 0.2,
        size: 1 + Math.random() * 1.5,
        alpha: 0.2 + Math.random() * 0.4
      });
    }

    const render = () => {
      const width = canvas.parentElement?.clientWidth || 500;
      const height = 460; // Increased height from 330px to 460px
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      // Fill canvas with a beautiful light-table holographic radial gradient
      const baseCenter = { x: width / 2, y: height / 2 - 10 };
      const scale = Math.min(width, height) * 0.42; // Decreased scale from 0.62 to 0.42 to fit the model fully within the screen boundaries

      const canvasGrad = ctx.createRadialGradient(baseCenter.x, baseCenter.y, scale * 0.2, baseCenter.x, baseCenter.y, scale * 1.3);
      canvasGrad.addColorStop(0, "rgba(240, 253, 250, 0.85)"); // Very light mint
      canvasGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.95)");
      canvasGrad.addColorStop(1, "rgba(248, 250, 252, 1)"); // Slate-50 background
      ctx.fillStyle = canvasGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw floating particles
      floaters.forEach(f => {
        f.y -= f.speed;
        if (f.y < 0) {
          f.y = height;
          f.x = Math.random() * width;
        }
        ctx.fillStyle = `rgba(16, 185, 129, ${f.alpha * 0.45})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Project 3D points
      const cosX = Math.cos(rotationAngle.x);
      const sinX = Math.sin(rotationAngle.x);
      const cosY = Math.cos(rotationAngle.y);
      const sinY = Math.sin(rotationAngle.y);
      const cosZ = Math.cos(rotationAngle.z);
      const sinZ = Math.sin(rotationAngle.z);

      const projected: { x: number; y: number; z: number; originalId: number; label?: string }[] = [];

      // Smooth morphing interpolation of point positions in real-time
      if (currentPointsRef.current.length !== points.length) {
        currentPointsRef.current = points.map(pt => ({ ...pt }));
      } else {
        for (let i = 0; i < points.length; i++) {
          const current = currentPointsRef.current[i];
          const target = points[i];
          if (current && target) {
            current.x += (target.x - current.x) * 0.12; // 12% linear shift per frame
            current.y += (target.y - current.y) * 0.12;
            current.z += (target.z - current.z) * 0.12;
            current.label = target.label;
          }
        }
      }

      currentPointsRef.current.forEach((pt, idx) => {
        let x1 = pt.x * cosY - pt.z * sinY;
        let z1 = pt.z * cosY + pt.x * sinY;
        let y2 = pt.y * cosX - z1 * sinX;
        let z2 = z1 * cosX + pt.y * sinX;
        let x2 = x1 * cosZ - y2 * sinZ;
        let y3 = y2 * cosZ + x1 * sinZ;
 
        // Real-time physical glitch coordinate jittering in Anomaly Mode
        if (scanMode === "anomaly") {
          const glitchTrigger = Math.sin(idx * 7.7 + Date.now() * 0.04) > 0.4;
          if (glitchTrigger) {
            const jitterFactor = (noiseIntensity / 100) * 0.22;
            x2 += (Math.random() - 0.5) * jitterFactor;
            y3 += (Math.random() - 0.5) * jitterFactor;
          }
        }
 
        const distance = 2.5; 
        const perspective = distance / (distance - z2);

        const xProj = baseCenter.x + x2 * scale * perspective;
        const yProj = baseCenter.y + y3 * scale * perspective;

        projected.push({
          x: xProj,
          y: yProj,
          z: z2,
          originalId: idx,
          label: pt.label
        });
      });

      // Advanced Concentric Tech Radar Rings / Expanding Light Ripples
      for (let i = 1; i <= 4; i++) {
        if (scanMode === "refraction") {
          // Drawing expanding light wavefronts in Specular mode!
          const waveRadius = ((scale * 0.52 * i) + (Date.now() * 0.04) % (scale * 0.52)) % (scale * 2.5);
          ctx.strokeStyle = `rgba(6, 182, 212, ${Math.max(0, 0.28 - (waveRadius / (scale * 2.5)) * 0.28)})`;
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.arc(baseCenter.x, baseCenter.y, waveRadius, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.strokeStyle = i === 4 ? "rgba(16, 185, 129, 0.16)" : "rgba(16, 185, 129, 0.06)";
          ctx.lineWidth = i === 4 ? 1.5 : 0.8;
          ctx.setLineDash(i % 2 === 0 ? [12, 12] : [6, 6]);
          
          ctx.beginPath();
          const radius = (scale * 0.52) * i;
          const rotationDirection = i % 2 === 0 ? 1 : -1;
          const angleOffset = Date.now() * 0.0003 * rotationDirection;
          
          ctx.arc(baseCenter.x, baseCenter.y, radius, angleOffset, angleOffset + Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]); // Reset line dash
        }
      }

      // Draw connections & moving signal data packets
      connections.forEach((conn, idx) => {
        const p1 = projected[conn.from];
        const p2 = projected[conn.to];
        
        if (!p1 || !p2) return;

        const avgDepth = (p1.z + p2.z) / 2;
        const opacity = Math.max(0.15, Math.min(0.85, (avgDepth + 1.2) / 2));
        
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);

        if (scanMode === "anomaly") {
          const hasAnomalousDistort = Math.random() * 100 < noiseIntensity;
          if (hasAnomalousDistort) {
            ctx.strokeStyle = `rgba(220, 38, 38, ${opacity * 1.1})`;
            ctx.lineWidth = 2.0;
          } else {
            ctx.strokeStyle = `rgba(5, 150, 105, ${opacity * 0.45})`;
            ctx.lineWidth = 1.2;
          }
        } else if (scanMode === "refraction") {
          ctx.strokeStyle = `rgba(8, 145, 178, ${opacity * 0.65})`;
          ctx.lineWidth = 1.4;
        } else {
          ctx.strokeStyle = `rgba(5, 150, 105, ${opacity * 0.65})`;
          ctx.lineWidth = 1.2;
        }

        ctx.stroke();

        // Draw dynamic moving data packets along connection lines
        if (idx % 4 === 0) {
          const t = (Date.now() * 0.0008 + idx * 0.15) % 1;
          const pulseX = p1.x + (p2.x - p1.x) * t;
          const pulseY = p1.y + (p2.y - p1.y) * t;
          
          ctx.fillStyle = scanMode === "anomaly" ? "rgba(239, 68, 68, 0.9)" : "rgba(16, 185, 129, 0.9)";
          ctx.beginPath();
          ctx.arc(pulseX, pulseY, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw scanner laser line
      const sweepY = baseCenter.y + Math.sin(Date.now() * 0.0018) * (scale * 1.2);
      ctx.beginPath();
      ctx.moveTo(baseCenter.x - scale * 1.3, sweepY);
      ctx.lineTo(baseCenter.x + scale * 1.3, sweepY);
      
      const gradient = ctx.createLinearGradient(baseCenter.x - scale, sweepY, baseCenter.x + scale, sweepY);
      if (scanMode === "anomaly") {
        gradient.addColorStop(0, "rgba(220, 38, 38, 0)");
        gradient.addColorStop(0.5, "rgba(220, 38, 38, 0.35)");
        gradient.addColorStop(1, "rgba(220, 38, 38, 0)");
      } else {
        gradient.addColorStop(0, "rgba(5, 150, 105, 0)");
        gradient.addColorStop(0.5, "rgba(5, 150, 105, 0.35)");
        gradient.addColorStop(1, "rgba(5, 150, 105, 0)");
      }
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2.0;
      ctx.stroke();

      // Render custom HUD nodes with mode-specific advanced visuals
      projected.forEach((p, idx) => {
        const isAnomalousNode = scanMode === "anomaly" && Math.sin(idx + Date.now() * 0.015) * 100 > 100 - noiseIntensity;
        
        let nodeColor = "rgba(5, 150, 105, 0.9)";
        if (isAnomalousNode) {
          nodeColor = "rgba(220, 38, 38, 0.95)";
        } else if (scanMode === "refraction") {
          nodeColor = "rgba(8, 145, 178, 0.9)";
        }
 
        const rSize = Math.max(3.5, Math.min(6.5, (p.z + 1.2) * 2.8)); 
 
        ctx.fillStyle = nodeColor;
        ctx.beginPath();
        if (scanMode === "anomaly" && isAnomalousNode) {
          // Render warning square for glitched nodes
          ctx.rect(p.x - rSize, p.y - rSize, rSize * 2, rSize * 2);
          ctx.fill();
        } else {
          ctx.arc(p.x, p.y, rSize, 0, Math.PI * 2);
          ctx.fill();
        }
 
        // Draw node outline rings based on active mode
        if (scanMode === "refraction" && idx % 6 === 0) {
          // Specular refraction halos
          ctx.strokeStyle = "rgba(8, 145, 178, 0.35)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, rSize + 5, 0, Math.PI * 2);
          ctx.stroke();
        } else if (idx === 9 || isAnomalousNode) {
          ctx.strokeStyle = nodeColor;
          ctx.beginPath();
          ctx.arc(p.x, p.y, rSize + 4, 0, Math.PI * 2);
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
 
        // Mode-specific text decorations
        if (scanMode === "anomaly" && isAnomalousNode) {
          ctx.fillStyle = "rgba(220, 38, 38, 0.95)";
          ctx.font = "bold 7px monospace";
          ctx.fillText(`ANOM:${(Math.random() * 9.9).toFixed(1)}`, p.x + 8, p.y - 4);
        } else if (scanMode === "biometric" && idx % 10 === 0) {
          // Coordinate leader pointers in biometric mode
          ctx.strokeStyle = "rgba(5, 150, 105, 0.3)";
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + 12, p.y - 12);
          ctx.lineTo(p.x + 28, p.y - 12);
          ctx.stroke();
 
          ctx.fillStyle = "rgba(5, 150, 105, 0.75)";
          ctx.font = "bold 6px monospace";
          ctx.fillText(`V_${idx}:[${(p.x - baseCenter.x).toFixed(0)},${(p.y - baseCenter.y).toFixed(0)}]`, p.x + 13, p.y - 14);
        }
      });

      // Target lock-on brackets
      const apex = projected.find(p => p.label === "NEURAL_APEX") || projected[0];
      if (apex && scanMode !== "anomaly") {
        ctx.strokeStyle = "rgba(5, 150, 105, 0.6)";
        ctx.lineWidth = 1.2;
        const boxSize = 14;
        
        ctx.beginPath();
        ctx.moveTo(apex.x - boxSize, apex.y - boxSize);
        ctx.lineTo(apex.x - boxSize + 4, apex.y - boxSize);
        ctx.moveTo(apex.x - boxSize, apex.y - boxSize);
        ctx.lineTo(apex.x - boxSize, apex.y - boxSize + 4);
        ctx.moveTo(apex.x + boxSize, apex.y + boxSize);
        ctx.lineTo(apex.x + boxSize - 4, apex.y + boxSize);
        ctx.moveTo(apex.x + boxSize, apex.y + boxSize);
        ctx.lineTo(apex.x + boxSize, apex.y + boxSize - 4);
        ctx.stroke();

        ctx.fillStyle = "rgba(5, 150, 105, 0.85)";
        ctx.font = "bold 6.5px monospace";
        ctx.fillText("NEURAL_APEX", apex.x + boxSize + 3, apex.y + 2);
      }

      // Draw diagnostic waveform
      ctx.strokeStyle = "rgba(5, 150, 105, 0.2)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let x = 30; x < width - 30; x += 4) {
        const sine = Math.sin(x * 0.06 + Date.now() * 0.006) * 5;
        const noise = (Math.random() - 0.5) * 1.5;
        const yVal = height - 25 + sine + noise;
        if (x === 30) ctx.moveTo(x, yVal);
        else ctx.lineTo(x, yVal);
      }
      ctx.stroke();

      // Screen Frame borders
      const crossSize = 8;
      ctx.strokeStyle = "rgba(5, 150, 105, 0.2)";
      ctx.lineWidth = 1;
      
      ctx.beginPath();
      ctx.moveTo(20, 20); ctx.lineTo(20 + crossSize, 20);
      ctx.moveTo(20, 20); ctx.lineTo(20, 20 + crossSize);
      ctx.moveTo(width - 20, 20); ctx.lineTo(width - 20 - crossSize, 20);
      ctx.moveTo(width - 20, 20); ctx.lineTo(width - 20, 20 + crossSize);
      ctx.moveTo(20, height - 20); ctx.lineTo(20 + crossSize, height - 20);
      ctx.moveTo(20, height - 20); ctx.lineTo(20, height - 20 - crossSize);
      ctx.moveTo(width - 20, height - 20); ctx.lineTo(width - 20 - crossSize, height - 20);
      ctx.moveTo(width - 20, height - 20); ctx.lineTo(width - 20, height - 20 - crossSize);
      ctx.stroke();

      // Shrunk text overlays for minimal obstruction - High contrast styling
      ctx.fillStyle = "#0f172a"; // Deep Slate for clear visibility
      ctx.font = "bold 10px monospace";
      ctx.fillText(`SENTINEL COMPILER: V1.5`, 30, 35);
      ctx.fillText(`SAFETY_STANCE: ACTIVE`, 30, 48);
      ctx.fillText(`GRID_VELOCITY: ${isRotating ? "0.06 RAD" : "LOCKED"}`, 30, 61);
      ctx.fillText(`TAMPER_INDEX: ${noiseIntensity}%`, 30, 74);
 
      // Biometric HUD status card - High contrast styling and increased size
      ctx.fillStyle = "rgba(255, 255, 255, 0.98)";
      ctx.fillRect(width - 145, 30, 115, 60);
      ctx.strokeStyle = "rgba(5, 150, 105, 0.5)"; // Stronger emerald green border
      ctx.strokeRect(width - 145, 30, 115, 60);
 
      ctx.fillStyle = "#0f172a"; // High contrast font
      ctx.font = "bold 9px monospace";
      ctx.fillText(`BIOMETRIC SCANS`, width - 137, 44);
      ctx.font = "bold 8.5px sans-serif";
      ctx.fillText(`Integrity: SECURE`, width - 137, 58);
      ctx.fillText(`System: ${scanMode === "anomaly" ? "ALERT" : "OPERATIONAL"}`, width - 137, 72);
      
      ctx.fillStyle = scanMode === "anomaly" ? "rgba(220, 38, 38, 0.95)" : "rgba(5, 150, 105, 0.95)";
      ctx.beginPath();
      ctx.arc(width - 145 + 100, 54, 3.5, 0, Math.PI * 2);
      ctx.fill();

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [rotationAngle, scanMode, noiseIntensity, isRotating]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setRotationAngle((prev) => ({
      ...prev,
      y: prev.y + dx * 0.007,
      x: prev.x + dy * 0.007
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div id="truthshield-hero-3d" className="glass-panel neon-border-hover p-6 sm:p-10 overflow-hidden relative">
      <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#10b981_1px,transparent_1px),linear-gradient(to_bottom,#10b981_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      
      {/* Background radial glows */}
      <div className="absolute -top-24 -left-20 w-80 h-80 bg-pink-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-24 -right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-60 h-60 bg-violet-500/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Changed layout ratio: lg:col-span-4 (left text) and lg:col-span-8 (right canvas) to make the animation window much wider */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative z-10 items-center">
        
        {/* LEFT COLUMN: Shrunk text to maximize canvas viewport */}
        <div className="lg:col-span-4 space-y-6 py-2 text-left">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9px] font-mono font-bold rounded-full uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" /> Sandbox v1.5
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[9px] text-slate-400 font-mono tracking-widest uppercase">
              Operational
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-light leading-tight tracking-tight text-slate-900">
              Unmask Deceptive AI <br />
              <span className="font-semibold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                With Safety Biometrics
              </span>
            </h1>
            
            <p className="text-slate-500 text-xs sm:text-sm font-sans leading-relaxed max-w-sm">
              Generative synthesis leaves trace spatial anomalies in mouth nodes, ocular lens reflections, and speech timelines. Securely verify file authenticity using our safety sandbox.
            </p>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-start gap-2">
              <span className="p-1 rounded bg-emerald-50 text-emerald-600 border border-emerald-100/40 shrink-0">
                <Crosshair className="w-3 h-3" />
              </span>
              <div>
                <h4 className="text-[11px] font-bold text-slate-800 tracking-wide">Secure Mesh Mapping</h4>
                <p className="text-[10px] text-slate-400">Interactive vertex geometry verification.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <span className="p-1 rounded bg-teal-50 text-teal-600 border border-teal-100/40 shrink-0">
                <Radio className="w-3 h-3" />
              </span>
              <div>
                <h4 className="text-[11px] font-bold text-slate-800 tracking-wide">Specular Refraction</h4>
                <p className="text-[10px] text-slate-400">Calibrates visual reflections automatically.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => {
                const workspace = document.getElementById("diagnostics-sandbox-panel") || document.getElementById("truthshield-hero-3d");
                if (workspace) {
                  window.scrollTo({
                    top: workspace.offsetTop - 80,
                    behavior: "smooth"
                  });
                }
              }}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all duration-200 transform hover:-translate-y-0.5 shadow-md shadow-emerald-600/10 active:translate-y-0 cursor-pointer"
            >
              Verify Suspect Media
            </button>
            
            <button
              onClick={() => {
                const element = document.getElementById("extension-simulator-panel");
                if (element) {
                  element.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all duration-200 border border-slate-200 cursor-pointer"
            >
              Extension Mockup
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Holographic 3D Interactive Canvas - Expanded to lg:col-span-8 */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-50/50 rounded-3xl border border-emerald-100/60 p-3 sm:p-4 relative overflow-hidden flex flex-col justify-between shadow-xs backdrop-blur-xs">
            
            <div className="flex justify-between items-center z-20 pb-2 mb-1 border-b border-emerald-100/40 font-mono">
              <span className="text-[8px] text-slate-500 uppercase tracking-widest flex items-center gap-1.5 font-bold">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping shrink-0" /> Live Hologram Canvas Feed
              </span>
              <span className="text-[8px] bg-white border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md uppercase font-bold tracking-wider shadow-2xs">
                {scanMode} mode
              </span>
            </div>

            {/* Height of wrapper set to 460px */}
            <div className="relative group bg-slate-50/60 rounded-2xl overflow-hidden border border-emerald-100/40 shadow-2xs">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="w-full h-[460px] cursor-grab active:cursor-grabbing transition-transform duration-300"
                title="Drag to rotate"
              />
              
              <div className="absolute bottom-3 left-3 right-3 bg-white/95 text-[9px] text-slate-500 p-2 border border-emerald-100/40 rounded-xl leading-normal pointer-events-none text-center shadow-xs">
                <span className="font-semibold text-emerald-700">Tip:</span> Drag directly over the canvas above to rotate the biometric model.
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-emerald-100/40 space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                
                <div className="space-y-1">
                  <span className="block text-[8px] font-mono font-bold text-slate-400 uppercase tracking-widest text-left">
                    Biometric Mesh Filter
                  </span>
                  <div className="flex gap-1.5 p-0.5 bg-white rounded-lg border border-emerald-100/50 shadow-2xs">
                    <button 
                      onClick={() => setScanMode("biometric")}
                      className={`px-2 py-1 rounded-md text-[9px] font-mono font-bold transition-all uppercase cursor-pointer ${
                        scanMode === "biometric" 
                          ? "bg-emerald-600 text-white" 
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      Biometric
                    </button>
                    <button 
                      onClick={() => setScanMode("refraction")}
                      className={`px-2 py-1 rounded-md text-[9px] font-mono font-bold transition-all uppercase cursor-pointer ${
                        scanMode === "refraction" 
                          ? "bg-cyan-600 text-white" 
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      Specular
                    </button>
                    <button 
                      onClick={() => setScanMode("anomaly")}
                      className={`px-2 py-1 rounded-md text-[9px] font-mono font-bold transition-all uppercase cursor-pointer ${
                        scanMode === "anomaly" 
                          ? "bg-rose-600 text-white" 
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      Anomaly
                    </button>
                  </div>
                </div>

                <div className="flex flex-col justify-end gap-1">
                  <span className="block text-[8px] font-mono font-bold text-slate-400 uppercase tracking-widest sm:text-right text-left">
                    Simulation Physics
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setIsRotating(!isRotating)}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-mono uppercase font-semibold tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors border ${
                        isRotating 
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                          : "bg-white border-slate-200 text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      <Play className="w-2.5 h-2.5 shrink-0" />
                      <span>{isRotating ? "Orbiting" : "Static"}</span>
                    </button>

                    <button 
                      onClick={() => {
                        setRotationAngle({ x: 0.15, y: -0.45, z: 0 });
                        setNoiseIntensity(15);
                        setScanMode("biometric");
                      }}
                      title="Reset vectors"
                      className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-950 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                </div>

              </div>

              <div className="p-2.5 bg-white rounded-xl border border-emerald-100/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                <div className="space-y-0.5 text-left">
                  <span className="block text-[8px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                    Procedural Synthesis Noise
                  </span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-48">
                  <input 
                    type="range" 
                    min="1" 
                    max="80" 
                    value={noiseIntensity} 
                    onChange={(e) => setNoiseIntensity(parseInt(e.target.value))}
                    className="w-full accent-emerald-600 border-0 bg-slate-100 rounded-lg cursor-pointer h-1" 
                  />
                  <span className="font-mono text-[10px] text-emerald-700 font-bold shrink-0 min-w-[24px] text-right">
                    {noiseIntensity}%
                  </span>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
