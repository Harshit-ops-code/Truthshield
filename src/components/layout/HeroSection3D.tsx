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
  { x: 0, y: -1.2, z: 0 },         // 0: Crown top
  { x: -0.6, y: -0.9, z: 0.4 },     // 1: Forehead left
  { x: 0.6, y: -0.9, z: 0.4 },      // 2: Forehead right
  { x: 0, y: -0.9, z: 0.7 },        // 3: Forehead center
  { x: -0.4, y: -0.5, z: 0.85 },     // 4: Left eye inner
  { x: -0.8, y: -0.4, z: 0.6 },     // 5: Left eye outer
  { x: 0.4, y: -0.5, z: 0.85 },      // 6: Right eye inner
  { x: 0.8, y: -0.4, z: 0.6 },      // 7: Right eye outer
  { x: 0, y: -0.4, z: 0.85 },       // 8: Nose origin
  { x: 0, y: 0, z: 1.1, label: "Biometric Apex" }, // 9: Nose tip
  { x: -0.25, y: 0.1, z: 0.7 },     // 10: Left nostril
  { x: 0.25, y: 0.1, z: 0.7 },      // 11: Right nostril
  { x: -0.7, y: 0.1, z: 0.5 },      // 12: Left cheekbone
  { x: 0.7, y: 0.1, z: 0.5 },       // 13: Right cheekbone
  { x: -0.35, y: 0.35, z: 0.8 },    // 14: Left mouth corner
  { x: 0.35, y: 0.35, z: 0.8 },     // 15: Right mouth corner
  { x: 0, y: 0.28, z: 0.9 },        // 16: Top Lip center
  { x: 0, y: 0.42, z: 0.9 },        // 17: Bottom Lip center
  { x: -0.8, y: 0.3, z: 0.1 },      // 18: Left jaw top
  { x: 0.8, y: 0.3, z: 0.1 },       // 19: Right jaw top
  { x: -0.5, y: 0.7, z: 0.4 },      // 20: Left jaw angle
  { x: 0.5, y: 0.7, z: 0.4 },       // 21: Right jaw angle
  { x: 0, y: 0.95, z: 0.65, label: "Nodal Anchor Z" }, // 22: Chin tip
  { x: -0.5, y: -0.5, z: -0.8 },    // 23
  { x: 0.5, y: -0.5, z: -0.8 },     // 24
  { x: 0, y: 0.5, z: -0.9 },        // 25
];

const connections: Connection[] = [
  { from: 0, to: 1 }, { from: 0, to: 2 }, { from: 0, to: 3 },
  { from: 1, to: 3 }, { from: 2, to: 3 },
  { from: 1, to: 5 }, { from: 2, to: 7 },
  { from: 4, to: 5 }, { from: 6, to: 7 },
  { from: 3, to: 8 }, { from: 8, to: 4 }, { from: 8, to: 6 },
  { from: 8, to: 9 }, { from: 9, to: 10 }, { from: 9, to: 11 },
  { from: 10, to: 12 }, { from: 11, to: 13 },
  { from: 5, to: 12 }, { from: 7, to: 13 },
  { from: 12, to: 18 }, { from: 13, to: 19 },
  { from: 18, to: 20 }, { from: 19, to: 21 },
  { from: 20, to: 22 }, { from: 21, to: 22 },
  { from: 10, to: 16 }, { from: 11, to: 16 },
  { from: 14, to: 16 }, { from: 15, to: 16 },
  { from: 14, to: 17 }, { from: 15, to: 17 },
  { from: 17, to: 22 },
  { from: 0, to: 23 }, { from: 0, to: 24 },
  { from: 23, to: 25 }, { from: 24, to: 25 },
  { from: 18, to: 23 }, { from: 19, to: 24 },
  { from: 25, to: 22 }
];

interface HeroSection3DProps {
  isLoggedIn?: boolean;
  onOpenAuth?: () => void;
}

export function HologramCanvas({ isLoggedIn, onOpenAuth }: HeroSection3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentPointsRef = useRef<Point3D[]>([]);
  const [shapeType, setShapeType] = useState<"star" | "circle" | "lasers">("star");

  const { points } = React.useMemo(() => {
    const pts: Point3D[] = [];

    if (shapeType === "circle") {
      // 3D Sphere of points (large radius)
      const rings = 3;
      const countPerRing = 8;
      for (let r = 0; r < rings; r++) {
        const phi = (Math.PI / (rings + 1)) * (r + 1);
        const yVal = Math.cos(phi) * 0.85;
        const radius = Math.sin(phi) * 0.85;
        for (let i = 0; i < countPerRing; i++) {
          const theta = (i / countPerRing) * Math.PI * 2;
          pts.push({
            x: Math.cos(theta) * radius,
            y: yVal,
            z: Math.sin(theta) * radius,
            label: (r === 1 && i === 0) ? "CORE_ORBIT" : undefined
          });
        }
      }
      // Poles
      pts.push({ x: 0, y: 0.85, z: 0, label: "NORTH_POLE" });
      pts.push({ x: 0, y: -0.85, z: 0, label: "SOUTH_POLE" });
    } else if (shapeType === "lasers") {
      // 3D Laser Grid (large scale)
      const size = 5;
      for (let i = 0; i < size; i++) {
        const xVal = -0.85 + (i / (size - 1)) * 1.7;
        for (let j = 0; j < size; j++) {
          const yVal = -0.85 + (j / (size - 1)) * 1.7;
          pts.push({
            x: xVal,
            y: yVal,
            z: 0.25 * Math.sin(i * 1.5 + j * 1.5),
            label: (i === 2 && j === 2) ? "SCAN_TARGET" : undefined
          });
        }
      }
    } else {
      // 3D Star Shape (large outer radius)
      const outerRadius = 0.9;
      const innerRadius = 0.45;
      const starPoints = 5;
      for (let i = 0; i < starPoints * 2; i++) {
        const angle = (i / (starPoints * 2)) * Math.PI * 2 - Math.PI / 2;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        pts.push({
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          z: 0,
          label: i === 0 ? "STAR_APEX" : undefined
        });
      }
      pts.push({ x: 0, y: 0, z: 0.75, label: "FRONT_VERTEX" });
      pts.push({ x: 0, y: 0, z: -0.75, label: "BACK_VERTEX" });
    }

    return { points: pts };
  }, [shapeType]);

  const activeConnections = React.useMemo(() => {
    if (shapeType === "circle") {
      const conns: Connection[] = [];
      const rings = 3;
      const countPerRing = 8;
      for (let r = 0; r < rings; r++) {
        const offset = r * countPerRing;
        for (let i = 0; i < countPerRing; i++) {
          conns.push({ from: offset + i, to: offset + ((i + 1) % countPerRing) });
          if (r < rings - 1) {
            conns.push({ from: offset + i, to: offset + countPerRing + i });
          }
        }
      }
      const topPole = rings * countPerRing;
      const bottomPole = topPole + 1;
      for (let i = 0; i < countPerRing; i++) {
        conns.push({ from: i, to: topPole });
        conns.push({ from: (rings - 1) * countPerRing + i, to: bottomPole });
      }
      return conns;
    } else if (shapeType === "lasers") {
      const conns: Connection[] = [];
      const size = 5;
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const idx = i * size + j;
          if (i < size - 1) conns.push({ from: idx, to: idx + size });
          if (j < size - 1) conns.push({ from: idx, to: idx + 1 });
        }
      }
      return conns;
    } else {
      const conns: Connection[] = [];
      const starPoints = 5;
      const totalStarRing = starPoints * 2;
      for (let i = 0; i < totalStarRing; i++) {
        conns.push({ from: i, to: (i + 1) % totalStarRing });
      }
      const frontApex = 10;
      const backApex = 11;
      for (let i = 0; i < totalStarRing; i++) {
        conns.push({ from: i, to: frontApex });
        conns.push({ from: i, to: backApex });
      }
      return conns;
    }
  }, [shapeType]);

  const [isRotating, setIsRotating] = useState(true);
  const [scanMode, setScanMode] = useState<"biometric" | "refraction" | "anomaly">("biometric");
  const [noiseIntensity, setNoiseIntensity] = useState(15);
  const [rotationAngle, setRotationAngle] = useState({ x: 0.15, y: -0.45, z: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!isRotating || isDragging) return;
    const interval = setInterval(() => {
      setRotationAngle((prev) => ({
        ...prev,
        y: prev.y + 0.006,
        x: 0.15 + Math.sin(Date.now() * 0.001) * 0.08
      }));
    }, 16);
    return () => clearInterval(interval);
  }, [isRotating, isDragging]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
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
      const height = 460;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const baseCenter = { x: width / 2, y: height / 2 - 10 };
      const scale = Math.min(width, height) * 0.42;

      // Make canvas background fully transparent so the global site grid flows underneath
      ctx.clearRect(0, 0, width, height);

      floaters.forEach(f => {
        f.y -= f.speed;
        if (f.y < 0) {
          f.y = height;
          f.x = Math.random() * width;
        }
        ctx.fillStyle = `rgba(37, 99, 235, ${f.alpha * 0.45})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
        ctx.fill();
      });

      const cosX = Math.cos(rotationAngle.x);
      const sinX = Math.sin(rotationAngle.x);
      const cosY = Math.cos(rotationAngle.y);
      const sinY = Math.sin(rotationAngle.y);
      const cosZ = Math.cos(rotationAngle.z);
      const sinZ = Math.sin(rotationAngle.z);

      const projected: { x: number; y: number; z: number; originalId: number; label?: string }[] = [];

      if (currentPointsRef.current.length !== points.length) {
        currentPointsRef.current = points.map(pt => ({ ...pt }));
      } else {
        for (let i = 0; i < points.length; i++) {
          const current = currentPointsRef.current[i];
          const target = points[i];
          if (current && target) {
            current.x += (target.x - current.x) * 0.12;
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

        projected.push({ x: xProj, y: yProj, z: z2, originalId: idx, label: pt.label });
      });

      for (let i = 1; i <= 4; i++) {
        if (scanMode === "refraction") {
          const waveRadius = ((scale * 0.52 * i) + (Date.now() * 0.04) % (scale * 0.52)) % (scale * 2.5);
          ctx.strokeStyle = `rgba(37, 99, 235, ${Math.max(0, 0.35 - (waveRadius / (scale * 2.5)) * 0.35)})`;
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.arc(baseCenter.x, baseCenter.y, waveRadius, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.strokeStyle = i === 4 ? "rgba(15, 23, 42, 0.08)" : "rgba(15, 23, 42, 0.03)";
          ctx.lineWidth = i === 4 ? 1.5 : 0.8;
          ctx.setLineDash(i % 2 === 0 ? [12, 12] : [6, 6]);
          ctx.beginPath();
          const radius = (scale * 0.52) * i;
          const rotationDirection = i % 2 === 0 ? 1 : -1;
          const angleOffset = Date.now() * 0.0003 * rotationDirection;
          ctx.arc(baseCenter.x, baseCenter.y, radius, angleOffset, angleOffset + Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      activeConnections.forEach((conn, idx) => {
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
            ctx.strokeStyle = `rgba(239, 68, 68, ${opacity * 1.1})`;
            ctx.lineWidth = 2.0;
          } else {
            ctx.strokeStyle = `rgba(15, 23, 42, ${opacity * 0.2})`;
            ctx.lineWidth = 1.2;
          }
        } else if (scanMode === "refraction") {
          ctx.strokeStyle = `rgba(37, 99, 235, ${opacity * 0.65})`;
          ctx.lineWidth = 1.4;
        } else {
          ctx.strokeStyle = `rgba(79, 70, 229, ${opacity * 0.35})`;
          ctx.lineWidth = 1.2;
        }
        ctx.stroke();

        if (idx % 4 === 0) {
          const t = (Date.now() * 0.0008 + idx * 0.15) % 1;
          const pulseX = p1.x + (p2.x - p1.x) * t;
          const pulseY = p1.y + (p2.y - p1.y) * t;
          ctx.fillStyle = scanMode === "anomaly" ? "rgba(239, 68, 68, 0.9)" : "rgba(37, 99, 235, 0.9)";
          ctx.beginPath();
          ctx.arc(pulseX, pulseY, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      const sweepY = baseCenter.y + Math.sin(Date.now() * 0.0018) * (scale * 1.2);
      ctx.beginPath();
      ctx.moveTo(baseCenter.x - scale * 1.3, sweepY);
      ctx.lineTo(baseCenter.x + scale * 1.3, sweepY);
      const gradient = ctx.createLinearGradient(baseCenter.x - scale, sweepY, baseCenter.x + scale, sweepY);
      if (scanMode === "anomaly") {
        gradient.addColorStop(0, "rgba(239, 68, 68, 0)");
        gradient.addColorStop(0.5, "rgba(239, 68, 68, 0.25)");
        gradient.addColorStop(1, "rgba(239, 68, 68, 0)");
      } else {
        gradient.addColorStop(0, "rgba(37, 99, 235, 0)");
        gradient.addColorStop(0.5, "rgba(37, 99, 235, 0.15)");
        gradient.addColorStop(1, "rgba(37, 99, 235, 0)");
      }
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2.0;
      ctx.stroke();

      projected.forEach((p, idx) => {
        const isAnomalousNode = scanMode === "anomaly" && Math.sin(idx + Date.now() * 0.015) * 100 > 100 - noiseIntensity;
        let nodeColor = "rgba(79, 70, 229, 0.75)";
        if (isAnomalousNode) {
          nodeColor = "rgba(239, 68, 68, 0.95)";
        } else if (scanMode === "refraction") {
          nodeColor = "rgba(37, 99, 235, 0.9)";
        }
        const rSize = Math.max(3.5, Math.min(6.5, (p.z + 1.2) * 2.8)); 
        ctx.fillStyle = nodeColor;
        ctx.beginPath();
        if (scanMode === "anomaly" && isAnomalousNode) {
          ctx.rect(p.x - rSize, p.y - rSize, rSize * 2, rSize * 2);
          ctx.fill();
        } else {
          ctx.arc(p.x, p.y, rSize, 0, Math.PI * 2);
          ctx.fill();
        }

        if (scanMode === "refraction" && idx % 6 === 0) {
          ctx.strokeStyle = "rgba(37, 99, 235, 0.35)";
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

        if (scanMode === "anomaly" && isAnomalousNode) {
          ctx.fillStyle = "rgba(239, 68, 68, 0.95)";
          ctx.font = "bold 7px monospace";
          ctx.fillText(`ANOM:${(Math.random() * 9.9).toFixed(1)}`, p.x + 8, p.y - 4);
        } else if (scanMode === "biometric" && idx % 10 === 0) {
          ctx.strokeStyle = "rgba(15, 23, 42, 0.1)";
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + 12, p.y - 12);
          ctx.lineTo(p.x + 28, p.y - 12);
          ctx.stroke();
          ctx.fillStyle = "rgba(15, 23, 42, 0.5)";
          ctx.font = "bold 6px monospace";
          ctx.fillText(`V_${idx}:[${(p.x - baseCenter.x).toFixed(0)},${(p.y - baseCenter.y).toFixed(0)}]`, p.x + 13, p.y - 14);
        }
      });

      const apex = projected.find(p => p.label === "NEURAL_APEX") || projected[0];
      if (apex && scanMode !== "anomaly") {
        ctx.strokeStyle = "rgba(15, 23, 42, 0.3)";
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

        ctx.fillStyle = "rgba(15, 23, 42, 0.6)";
        ctx.font = "bold 6.5px monospace";
        ctx.fillText("NEURAL_APEX", apex.x + boxSize + 3, apex.y + 2);
      }

      ctx.strokeStyle = "rgba(15, 23, 42, 0.08)";
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

      const crossSize = 8;
      ctx.strokeStyle = "rgba(15, 23, 42, 0.08)";
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

      ctx.fillStyle = "#0F172A";
      ctx.font = "bold 10px monospace";
      ctx.fillText(`SENTINEL COMPILER: V1.5`, 30, 35);
      ctx.fillText(`SAFETY_STANCE: ACTIVE`, 30, 48);
      ctx.fillText(`GRID_VELOCITY: ${isRotating ? "0.06 RAD" : "LOCKED"}`, 30, 61);
      ctx.fillText(`TAMPER_INDEX: ${noiseIntensity}%`, 30, 74);
 
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.fillRect(width - 145, 30, 115, 60);
      ctx.strokeStyle = "rgba(15, 23, 42, 0.15)";
      ctx.strokeRect(width - 145, 30, 115, 60);
 
      ctx.fillStyle = "#2563EB";
      ctx.font = "bold 9px monospace";
      ctx.fillText(`BIOMETRIC SCANS`, width - 137, 44);
      ctx.fillStyle = "#0F172A";
      ctx.font = "bold 8.5px sans-serif";
      ctx.fillText(`Integrity: SECURE`, width - 137, 58);
      ctx.fillText(`System: ${scanMode === "anomaly" ? "ALERT" : "OPERATIONAL"}`, width - 137, 72);
      
      ctx.fillStyle = scanMode === "anomaly" ? "rgba(239, 68, 68, 0.95)" : "rgba(79, 70, 229, 0.75)";
      ctx.beginPath();
      ctx.arc(width - 145 + 100, 54, 3.5, 0, Math.PI * 2);
      ctx.fill();

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
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

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="relative overflow-hidden flex flex-col justify-between space-y-4">
      
      <div className="flex justify-between items-center z-20 pb-2 mb-1 border-b border-slate-200/50 font-mono">
        <span className="text-[8px] text-slate-900 uppercase tracking-widest flex items-center gap-1.5 font-bold">
          <span className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-ping shrink-0" /> Live Hologram Canvas Feed
        </span>
        <span className="text-[8px] bg-white border border-slate-200 text-slate-900 px-2 py-0.5 rounded-md uppercase font-bold tracking-wider shadow-sm">
          {scanMode} mode
        </span>
      </div>

      <div className="relative group rounded-2xl overflow-hidden border border-slate-200/40 bg-slate-500/[0.02]">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="w-full h-[360px] cursor-grab active:cursor-grabbing transition-transform duration-300"
          title="Drag to rotate"
        />
        <div className="absolute bottom-3 left-3 right-3 bg-white/90 text-[9px] text-slate-900 p-2 border border-slate-200/60 rounded-xl leading-normal pointer-events-none text-center shadow-sm">
          <span className="font-semibold text-brand-accent">Tip:</span> Drag directly over the canvas above to rotate the biometric model.
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="space-y-1">
            <span className="block text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest text-left">
              Target Model Shape
            </span>
            <div className="flex gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200/60 w-max">
              <button 
                onClick={() => setShapeType("face")}
                className={`px-2.5 py-1 rounded-md text-[9px] font-mono font-bold transition-all uppercase cursor-pointer ${
                  shapeType === "face" 
                    ? "bg-brand-primary text-white" 
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Face Mesh
              </button>
              <button 
                onClick={() => setShapeType("voice")}
                className={`px-2.5 py-1 rounded-md text-[9px] font-mono font-bold transition-all uppercase cursor-pointer ${
                  shapeType === "voice" 
                    ? "bg-brand-primary text-white" 
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Audio Wave
              </button>
              <button 
                onClick={() => setShapeType("text")}
                className={`px-2.5 py-1 rounded-md text-[9px] font-mono font-bold transition-all uppercase cursor-pointer ${
                  shapeType === "text" 
                    ? "bg-brand-primary text-white" 
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Vector Grid
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <span className="block text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest text-left md:text-right">
              Biometric Mesh Filter
            </span>
            <div className="flex gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200/60 w-max md:ml-auto">
              <button 
                onClick={() => setScanMode("biometric")}
                className={`px-2.5 py-1 rounded-md text-[9px] font-mono font-bold transition-all uppercase cursor-pointer ${
                  scanMode === "biometric" 
                    ? "bg-brand-primary text-white" 
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Biometric
              </button>
              <button 
                onClick={() => setScanMode("refraction")}
                className={`px-2.5 py-1 rounded-md text-[9px] font-mono font-bold transition-all uppercase cursor-pointer ${
                  scanMode === "refraction" 
                    ? "bg-brand-primary text-white" 
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Specular
              </button>
              <button 
                onClick={() => setScanMode("anomaly")}
                className={`px-2.5 py-1 rounded-md text-[9px] font-mono font-bold transition-all uppercase cursor-pointer ${
                  scanMode === "anomaly" 
                    ? "bg-brand-primary text-white" 
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Anomaly
              </button>
            </div>
          </div>

        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-200/40">
          <div className="flex items-center gap-3">
            <span className="block text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest">
              Simulation Physics:
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setIsRotating(!isRotating)}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-mono uppercase font-semibold tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors border ${
                  isRotating 
                    ? "bg-brand-primary/10 border-brand-primary/20 text-brand-primary" 
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
                  setShapeType("face");
                }}
                title="Reset vectors"
                className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-900 hover:text-slate-900 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-48 justify-end">
            <span className="block text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest shrink-0">
              Noise
            </span>
            <input 
              type="range" 
              min="1" 
              max="80" 
              value={noiseIntensity} 
              onChange={(e) => setNoiseIntensity(parseInt(e.target.value))}
              className="w-full accent-brand-accent border-0 bg-slate-100 rounded-lg cursor-pointer h-1" 
            />
            <span className="font-mono text-[10px] text-slate-900 font-bold shrink-0 min-w-[24px] text-right">
              {noiseIntensity}%
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}

export default function HeroSection3D({ isLoggedIn, onOpenAuth }: HeroSection3DProps) {
  return (
    <div id="truthshield-hero-3d" className="py-6 sm:py-10 relative">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative z-10 items-center">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-5 space-y-6 py-2 text-left">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-indigo-50 border border-indigo-200/50 text-indigo-600 text-[9px] font-mono font-bold rounded-full uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-indigo-500 animate-pulse" /> Sandbox v1.5
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-ping" />
            <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase font-bold">
              Active Defense
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-extrabold leading-tight tracking-tight text-slate-900">
              Unmask Deceptive AI <br />
              <span className="text-brand-accent block mt-1">
                With Safety Biometrics
              </span>
            </h1>
            
            <p className="text-slate-600 text-xs sm:text-sm font-sans leading-relaxed max-w-sm">
              Generative synthesis leaves trace spatial anomalies in mouth nodes, ocular lens reflections, and speech timelines. Securely verify file authenticity using our safety sandbox.
            </p>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-start gap-2">
              <span className="p-1 rounded bg-slate-100 text-slate-800 border border-slate-200 shrink-0">
                <Crosshair className="w-3.5 h-3.5 text-brand-accent" />
              </span>
              <div>
                <h4 className="text-[11px] font-bold text-slate-900 tracking-wide">Secure Mesh Mapping</h4>
                <p className="text-[10px] text-slate-500">Interactive vertex geometry verification.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <span className="p-1 rounded bg-slate-100 text-slate-800 border border-slate-200 shrink-0">
                <Radio className="w-3.5 h-3.5 text-brand-gold" />
              </span>
              <div>
                <h4 className="text-[11px] font-bold text-slate-900 tracking-wide">Specular Refraction</h4>
                <p className="text-[10px] text-slate-500">Calibrates visual reflections automatically.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => {
                if (!isLoggedIn && onOpenAuth) {
                  onOpenAuth();
                } else {
                  const workspace = document.getElementById("diagnostics-sandbox-panel") || document.getElementById("truthshield-hero-3d");
                  if (workspace) {
                    window.scrollTo({
                      top: workspace.offsetTop - 80,
                      behavior: "smooth"
                    });
                  }
                }
              }}
              className="px-5 py-2.5 bg-brand-accent hover:bg-blue-700 text-white rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all duration-200 transform hover:-translate-y-0.5 shadow-md shadow-brand-accent/20 active:translate-y-0 cursor-pointer"
            >
              Verify Suspect Media
            </button>
            
            <button
              onClick={() => {
                if (!isLoggedIn && onOpenAuth) {
                  onOpenAuth();
                } else {
                  const element = document.getElementById("extension-simulator-panel");
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth" });
                  }
                }
              }}
              className="px-5 py-2.5 bg-transparent hover:bg-slate-50 text-slate-800 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all duration-200 border border-slate-200 cursor-pointer"
            >
              Extension Mockup
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Hologram Canvas Feed Restored */}
        <div className="lg:col-span-7 w-full relative">
          <HologramCanvas isLoggedIn={isLoggedIn} onOpenAuth={onOpenAuth} />
        </div>

      </div>
    </div>
  );
}
