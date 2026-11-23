"use client";

import { cn } from "@/lib/utils";

export interface ElevationProps {
  sky: string;
  ambient: string;
  /** Main facade material colour. */
  facade: string;
  /** Secondary material colour (used for the slatted bay). */
  accent?: string;
  /** Percentage of the ground-floor facade that is glazed (0–100). */
  glazing: number;
  /** Distance between vertical timber slats in SVG units (4–24). */
  slatSpacing?: number;
  /** Canopy projection in SVG units (0–80). */
  canopyDepth?: number;
  /** Sun azimuth in degrees (0–180). Drives the ground shadow. */
  sunAngle?: number;
  night?: boolean;
  compact?: boolean;
  label?: string;
  className?: string;
}

/**
 * Parametric SVG building elevation used throughout the Design Lab.
 * Everything is drawn from props so lighting, materials and facade settings
 * change the picture immediately — no raster renders are involved.
 */
export function Elevation({
  sky,
  ambient,
  facade,
  accent = "#c48a4a",
  glazing,
  slatSpacing = 10,
  canopyDepth = 40,
  sunAngle = 120,
  night,
  compact,
  label = "Community Centre",
  className,
}: ElevationProps) {
  const W = 600;
  const H = 320;
  const ground = 262;
  const bx = 90;
  const bw = 420;
  const top = 86;
  const floorLine = 176;
  const g = Math.max(0, Math.min(100, glazing)) / 100;

  // Ground-floor glazing width grows with the glazing percentage.
  const glazedW = Math.round((bw - 150) * g + 60);
  const glassFill = night ? "#f8dd9c" : "#bcd6f3";
  const glassStroke = night ? "#b8893b" : "#6f9bca";
  const slatX = bx + bw - 120;
  const slats: number[] = [];
  for (let x = slatX + 4; x < bx + bw - 4; x += Math.max(4, slatSpacing)) slats.push(x);

  // Shadow: parallelogram skewed by the sun azimuth.
  const rad = ((sunAngle - 90) * Math.PI) / 180;
  const shadowLen = 70 * Math.abs(Math.cos(rad)) + 30;
  const dx = Math.sin(rad) * shadowLen;
  const shadowOpacity = night ? 0.08 : 0.18;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={cn("block h-auto w-full", className)}
      role="img"
      aria-label={`Elevation preview of ${label}`}
    >
      {/* sky and ground */}
      <rect width={W} height={H} fill={sky} />
      <rect y={ground} width={W} height={H - ground} fill={night ? "#2a3350" : "#dfe6f2"} />
      <line x1="0" y1={ground} x2={W} y2={ground} stroke={night ? "#4a5578" : "#9aa8c4"} strokeWidth="1.5" />
      {night ? (
        <>
          <circle cx="520" cy="46" r="10" fill="#f5efd2" />
          <circle cx="110" cy="30" r="1.2" fill="#fff" />
          <circle cx="160" cy="58" r="1" fill="#fff" />
          <circle cx="330" cy="36" r="1.2" fill="#fff" />
        </>
      ) : (
        <circle cx={bx + bw * (1 - sunAngle / 180)} cy="44" r="12" fill={ambient} stroke="#f0c27a" strokeWidth="1.5" />
      )}

      {/* ground shadow */}
      <polygon
        points={`${bx},${ground} ${bx + bw},${ground} ${bx + bw + dx},${ground + 26} ${bx + dx},${ground + 26}`}
        fill="#101b3c"
        opacity={shadowOpacity}
      />

      {/* building mass */}
      <rect x={bx} y={top} width={bw} height={ground - top} fill={facade} stroke="#101b3c" strokeWidth="1.5" />
      {/* roof slab */}
      <rect x={bx - 10} y={top - 8} width={bw + 20} height="8" fill={night ? "#3c4664" : "#e9eef7"} stroke="#101b3c" strokeWidth="1.5" />
      {/* floor slab line */}
      <rect x={bx} y={floorLine} width={bw} height="6" fill={night ? "#3c4664" : "#e9eef7"} stroke="#101b3c" strokeWidth="1" />

      {/* upper storey glazed band */}
      <rect x={bx + 18} y={top + 16} width={bw - 160} height={floorLine - top - 32} fill={glassFill} stroke={glassStroke} strokeWidth="1" />
      {Array.from({ length: 7 }, (_, i) => (
        <line
          key={i}
          x1={bx + 18 + ((bw - 160) / 7) * (i + 1)}
          y1={top + 16}
          x2={bx + 18 + ((bw - 160) / 7) * (i + 1)}
          y2={floorLine - 16}
          stroke={glassStroke}
          strokeWidth="1"
        />
      ))}

      {/* slatted bay (timber) */}
      <rect x={slatX} y={top + 10} width={bx + bw - slatX - 8} height={ground - top - 10} fill={accent} stroke="#101b3c" strokeWidth="1" />
      {slats.map((x) => (
        <line key={x} x1={x} y1={top + 12} x2={x} y2={ground - 1} stroke="#101b3c" strokeOpacity="0.45" strokeWidth="1.5" />
      ))}

      {/* ground-floor glazing (entrance) */}
      <rect x={bx + 18} y={floorLine + 14} width={glazedW} height={ground - floorLine - 14} fill={glassFill} stroke={glassStroke} strokeWidth="1" />
      {Array.from({ length: Math.max(1, Math.round(glazedW / 48)) }, (_, i) => (
        <line
          key={i}
          x1={bx + 18 + (glazedW / Math.max(1, Math.round(glazedW / 48))) * (i + 1)}
          y1={floorLine + 14}
          x2={bx + 18 + (glazedW / Math.max(1, Math.round(glazedW / 48))) * (i + 1)}
          y2={ground}
          stroke={glassStroke}
        />
      ))}
      {/* door */}
      <rect x={bx + 36} y={floorLine + 30} width="34" height={ground - floorLine - 30} fill={night ? "#ffe9b5" : "#eaf1ff"} stroke="#101b3c" strokeWidth="1" />
      <line x1={bx + 53} y1={floorLine + 30} x2={bx + 53} y2={ground} stroke="#101b3c" />

      {/* canopy */}
      {canopyDepth > 0 ? (
        <>
          <rect x={bx + 18 - canopyDepth} y={floorLine + 8} width={canopyDepth + 80} height="7" fill={night ? "#3c4664" : "#f4f7fc"} stroke="#101b3c" strokeWidth="1.5" />
          <line x1={bx + 18 - canopyDepth + 10} y1={floorLine + 15} x2={bx + 18 - canopyDepth + 10} y2={ground} stroke="#101b3c" strokeWidth="2" />
        </>
      ) : null}

      {/* sign */}
      {!compact ? (
        <text x={bx + 160} y={floorLine + 44} fontSize="13" fontWeight="700" fill={night ? "#fff2cc" : "#101b3c"} fontFamily="Inter, system-ui, sans-serif">
          {label}
        </text>
      ) : null}

      {/* trees */}
      <rect x="40" y={ground - 40} width="6" height="40" fill="#6b4b2a" />
      <circle cx="43" cy={ground - 52} r="22" fill={night ? "#2f5b3a" : "#5f9d4e"} />
      <rect x="548" y={ground - 32} width="5" height="32" fill="#6b4b2a" />
      <circle cx="550" cy={ground - 44} r="18" fill={night ? "#2f5b3a" : "#7bb562"} />
      {/* bench */}
      <rect x="556" y={ground - 10} width="30" height="4" fill="#9aa8c4" />
      <rect x="558" y={ground - 6} width="3" height="6" fill="#9aa8c4" />
      <rect x="581" y={ground - 6} width="3" height="6" fill="#9aa8c4" />
    </svg>
  );
}
