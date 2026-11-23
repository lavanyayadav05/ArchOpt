"use client";

import { useMemo } from "react";
import type { Room, Plot } from "@/lib/types";
import { zoneFill } from "@/components/floorplan/FloorPlan";
import { cn } from "@/lib/utils";

const COS30 = Math.cos(Math.PI / 6);
const SIN30 = Math.sin(Math.PI / 6);

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amount));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (n & 255) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/** Rotate a rectangle 90° clockwise `k` times inside the plot. */
function rotateRoom(room: Room, plot: Plot, k: number): { room: Room; plot: Plot } {
  let r = { ...room };
  let p = { ...plot };
  for (let i = 0; i < k; i += 1) {
    r = { ...r, x: p.height - (r.y + r.height), y: r.x, width: r.height, height: r.width };
    p = { width: p.height, height: p.width };
  }
  return { room: r, plot: p };
}

export interface IsometricProps {
  rooms: Room[];
  plot: Plot;
  /** 0–3 quarter turns. */
  turn: number;
  showCirculation: boolean;
  className?: string;
}

const isCirc = (r: Room) => r.type === "circulation" || r.type === "corridor" || r.type === "open";

/** Isometric extrusion of a layout, drawn straight from room geometry. */
export function Isometric({ rooms, plot, turn, showCirculation, className }: IsometricProps) {
  const s = 14; // px per metre
  const wallH = 3 * s; // 3 m walls
  const slabH = 0.3 * s;

  const scene = useMemo(() => {
    const rotatedPlot = turn % 2 === 0 ? plot : { width: plot.height, height: plot.width };
    const boxes = rooms
      .filter((r) => showCirculation || !isCirc(r))
      .map((r) => rotateRoom(r, plot, turn % 4).room)
      .sort((a, b) => a.x + a.y + a.width + a.height - (b.x + b.y + b.width + b.height));
    return { rotatedPlot, boxes };
  }, [rooms, plot, turn, showCirculation]);

  const { rotatedPlot, boxes } = scene;
  const px = (x: number, y: number, z: number) => ({ x: (x - y) * COS30 * s, y: (x + y) * SIN30 * s - z });

  // Bounding box for the viewBox.
  const corners = [
    px(0, 0, wallH),
    px(rotatedPlot.width, 0, wallH),
    px(0, rotatedPlot.height, wallH),
    px(rotatedPlot.width, rotatedPlot.height, 0),
  ];
  const minX = Math.min(...corners.map((c) => c.x)) - 20;
  const maxX = Math.max(...corners.map((c) => c.x)) + 20;
  const minY = Math.min(...corners.map((c) => c.y)) - 20;
  const maxY = Math.max(...corners.map((c) => c.y)) + 30;

  const poly = (pts: { x: number; y: number }[]) => pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  return (
    <svg
      viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
      className={cn("block h-auto w-full", className)}
      role="img"
      aria-label="Isometric preview of the layout"
    >
      {/* plot slab */}
      <polygon
        points={poly([px(0, 0, 0), px(rotatedPlot.width, 0, 0), px(rotatedPlot.width, rotatedPlot.height, 0), px(0, rotatedPlot.height, 0)])}
        fill="#f1f4fb"
        stroke="#101b3c"
        strokeWidth="1.5"
      />
      {boxes.map((r) => {
        const h = isCirc(r) ? slabH : wallH;
        const base = zoneFill[r.type];
        const x0 = r.x;
        const y0 = r.y;
        const x1 = r.x + r.width;
        const y1 = r.y + r.height;
        const topFace = [px(x0, y0, h), px(x1, y0, h), px(x1, y1, h), px(x0, y1, h)];
        const leftFace = [px(x0, y1, h), px(x1, y1, h), px(x1, y1, 0), px(x0, y1, 0)];
        const rightFace = [px(x1, y0, h), px(x1, y1, h), px(x1, y1, 0), px(x1, y0, 0)];
        const centre = px((x0 + x1) / 2, (y0 + y1) / 2, h);
        return (
          <g key={r.id}>
            <polygon points={poly(leftFace)} fill={shade(base, -40)} stroke="#101b3c" strokeWidth="0.8" />
            <polygon points={poly(rightFace)} fill={shade(base, -22)} stroke="#101b3c" strokeWidth="0.8" />
            <polygon points={poly(topFace)} fill={base} stroke="#101b3c" strokeWidth="0.8" />
            {!isCirc(r) && r.width * r.height >= 18 ? (
              <text x={centre.x} y={centre.y + 3} textAnchor="middle" fontSize="8" fontWeight="600" fill="#101b3c">
                {r.name}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
