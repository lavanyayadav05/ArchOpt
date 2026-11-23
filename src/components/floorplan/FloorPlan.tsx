"use client";

import { useMemo } from "react";
import type { Room, Plot } from "@/lib/types";
import { cn } from "@/lib/utils";
import { roomsTouch } from "@/lib/geometry";

/**
 * SVG floor-plan renderer.
 *
 * Draws a rectangular plot, rectangular rooms (coloured by space type), door
 * openings between rooms and circulation, an entrance marker and optional
 * dimension lines. Everything is expressed in metres and scaled through the
 * SVG viewBox so the component is resolution independent.
 */

export const zoneFill: Record<Room["type"], string> = {
  classroom: "#d6e4ff",
  office: "#d7f5e3",
  reception: "#e4dcff",
  toilets: "#ffe0e6",
  storage: "#e9edf5",
  circulation: "#fff0cc",
  corridor: "#fff0cc",
  entrance: "#eaf1ff",
  open: "#f3f6fc",
};

export const zoneLabel: Record<Room["type"], string> = {
  classroom: "Classroom",
  office: "Office",
  reception: "Reception",
  toilets: "Toilets",
  storage: "Storage",
  circulation: "Circulation",
  corridor: "Corridor",
  entrance: "Entrance",
  open: "Open area",
};

export interface FloorPlanProps {
  plot: Plot;
  rooms: Room[];
  /** Compact thumbnail: no labels, thinner strokes. */
  thumbnail?: boolean;
  showLabels?: boolean;
  showDimensions?: boolean;
  showDoors?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  /** Room ids to tint for version diffs. */
  diff?: { added?: string[]; removed?: string[]; modified?: string[] };
  /** Ids of rooms with constraint violations. */
  invalidIds?: string[];
  /** Overlay a circulation path (sequence of points in metres). */
  path?: { x: number; y: number }[];
  className?: string;
  ariaLabel?: string;
  /** Scale factor (SVG units per metre). */
  scale?: number;
}

const isCirc = (r: Room) => r.type === "circulation" || r.type === "corridor" || r.type === "open";

export function FloorPlan({
  plot,
  rooms,
  thumbnail,
  showLabels = !thumbnail,
  showDimensions = !thumbnail,
  showDoors = true,
  selectedId,
  onSelect,
  diff,
  invalidIds,
  path,
  className,
  ariaLabel = "Floor plan",
  scale = 20,
}: FloorPlanProps) {
  const s = scale;
  const margin = showDimensions ? { l: 36, t: 30, r: 14, b: 14 } : { l: 2, t: 2, r: 2, b: 2 };
  const W = plot.width * s + margin.l + margin.r;
  const H = plot.height * s + margin.t + margin.b;
  const ox = margin.l;
  const oy = margin.t;

  const doors = useMemo(() => {
    if (!showDoors) return [];
    const circ = rooms.filter(isCirc);
    const out: { x: number; y: number; dir: "h" | "v" }[] = [];
    for (const r of rooms) {
      if (isCirc(r)) continue;
      const neighbour = circ.find((c) => roomsTouch(r, c));
      if (!neighbour) continue;
      // shared vertical edge?
      if (Math.abs(r.x + r.width - neighbour.x) < 0.01 || Math.abs(neighbour.x + neighbour.width - r.x) < 0.01) {
        const x = Math.abs(r.x + r.width - neighbour.x) < 0.01 ? r.x + r.width : r.x;
        const top = Math.max(r.y, neighbour.y);
        const bottom = Math.min(r.y + r.height, neighbour.y + neighbour.height);
        if (bottom - top >= 1.2) out.push({ x, y: (top + bottom) / 2, dir: "v" });
      } else {
        const y = Math.abs(r.y + r.height - neighbour.y) < 0.01 ? r.y + r.height : r.y;
        const left = Math.max(r.x, neighbour.x);
        const right = Math.min(r.x + r.width, neighbour.x + neighbour.width);
        if (right - left >= 1.2) out.push({ x: (left + right) / 2, y, dir: "h" });
      }
    }
    return out;
  }, [rooms, showDoors]);

  // Entrance: the reception's edge on the plot boundary, else bottom centre.
  const entrance = useMemo(() => {
    const rc = rooms.find((r) => r.type === "reception");
    if (rc && Math.abs(rc.y + rc.height - plot.height) < 0.01) return { x: rc.x + rc.width / 2, y: plot.height };
    if (rc && rc.y < 0.01) return { x: rc.x + rc.width / 2, y: 0 };
    return { x: plot.width / 2, y: plot.height };
  }, [rooms, plot]);

  const strokeW = thumbnail ? 1 : 1.5;
  const doorHalf = 0.6; // metres

  const diffFill = (id: string): string | null => {
    if (diff?.added?.includes(id)) return "#d7f5e3";
    if (diff?.removed?.includes(id)) return "#ffe0e6";
    if (diff?.modified?.includes(id)) return "#e4dcff";
    return null;
  };

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={cn("block h-auto w-full select-none bg-[#fbfcff] rounded-xs", className)}
      role={onSelect ? "listbox" : "img"}
      aria-label={ariaLabel}
      onClick={(e) => {
        if (onSelect && e.target === e.currentTarget) onSelect(null);
      }}
    >
      {/* plot */}
      <rect x={ox} y={oy} width={plot.width * s} height={plot.height * s} fill="#fbfcff" stroke="#101b3c" strokeWidth={thumbnail ? 1.25 : 2} />

      {/* rooms */}
      {rooms.map((r) => {
        const selected = r.id === selectedId;
        const invalid = invalidIds?.includes(r.id);
        const fill = diffFill(r.id) ?? zoneFill[r.type];
        const area = r.width * r.height;
        const fontSize = Math.max(8, Math.min(12, (Math.min(r.width, r.height) * s) / 4));
        return (
          <g
            key={r.id}
            role={onSelect ? "option" : undefined}
            aria-selected={onSelect ? selected : undefined}
            aria-label={`${r.name}, ${area} square metres`}
            tabIndex={onSelect ? 0 : undefined}
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(r.id);
            }}
            onKeyDown={(e) => {
              if (onSelect && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onSelect(r.id);
              }
            }}
            className={cn(onSelect && "cursor-pointer focus:outline-none")}
          >
            <rect
              x={ox + r.x * s}
              y={oy + r.y * s}
              width={r.width * s}
              height={r.height * s}
              fill={fill}
              stroke={invalid ? "#b91c1c" : selected ? "#1649d8" : "#101b3c"}
              strokeWidth={selected || invalid ? strokeW + 1 : strokeW}
              strokeDasharray={invalid ? "4 2" : undefined}
            />
            {showLabels && !isCirc(r) ? (
              <>
                <text
                  x={ox + (r.x + r.width / 2) * s}
                  y={oy + (r.y + r.height / 2) * s - 2}
                  textAnchor="middle"
                  fontSize={fontSize}
                  fontWeight="600"
                  fill="#101b3c"
                >
                  {r.name}
                </text>
                <text
                  x={ox + (r.x + r.width / 2) * s}
                  y={oy + (r.y + r.height / 2) * s + fontSize}
                  textAnchor="middle"
                  fontSize={fontSize - 1}
                  fill="#596780"
                >
                  ({area} m²)
                </text>
              </>
            ) : null}
          </g>
        );
      })}

      {/* doors: opening (gap in wall) + swing arc */}
      {doors.map((d, i) => {
        const px = ox + d.x * s;
        const py = oy + d.y * s;
        const half = doorHalf * s;
        if (d.dir === "v") {
          return (
            <g key={i} pointerEvents="none">
              <line x1={px} y1={py - half} x2={px} y2={py + half} stroke="#fbfcff" strokeWidth={strokeW + 1.5} />
              {!thumbnail ? (
                <path d={`M${px},${py - half} A${half * 2},${half * 2} 0 0 1 ${px + half * 2},${py + half}`} fill="none" stroke="#101b3c" strokeWidth="1" />
              ) : null}
            </g>
          );
        }
        return (
          <g key={i} pointerEvents="none">
            <line x1={px - half} y1={py} x2={px + half} y2={py} stroke="#fbfcff" strokeWidth={strokeW + 1.5} />
            {!thumbnail ? (
              <path d={`M${px - half},${py} A${half * 2},${half * 2} 0 0 1 ${px + half},${py + half * 2}`} fill="none" stroke="#101b3c" strokeWidth="1" />
            ) : null}
          </g>
        );
      })}

      {/* entrance (double door on the plot boundary) */}
      {(() => {
        const ex = ox + entrance.x * s;
        const ey = oy + entrance.y * s;
        const half = 1 * s;
        const up = entrance.y === 0 ? 1 : -1;
        return (
          <g pointerEvents="none">
            <line x1={ex - half} y1={ey} x2={ex + half} y2={ey} stroke="#fbfcff" strokeWidth={thumbnail ? 2.5 : 4} />
            {!thumbnail ? (
              <>
                <path d={`M${ex - half},${ey} A${half},${half} 0 0 ${up === -1 ? 1 : 0} ${ex},${ey + up * half}`} fill="none" stroke="#101b3c" strokeWidth="1" />
                <path d={`M${ex + half},${ey} A${half},${half} 0 0 ${up === -1 ? 0 : 1} ${ex},${ey + up * half}`} fill="none" stroke="#101b3c" strokeWidth="1" />
              </>
            ) : null}
          </g>
        );
      })()}

      {/* optional circulation path overlay */}
      {path && path.length > 1 ? (
        <polyline
          points={path.map((p) => `${ox + p.x * s},${oy + p.y * s}`).join(" ")}
          fill="none"
          stroke="#1649d8"
          strokeWidth="2"
          strokeDasharray="6 4"
          pointerEvents="none"
        />
      ) : null}

      {/* dimension lines */}
      {showDimensions ? (
        <g pointerEvents="none" fill="#101b3c" stroke="#101b3c" strokeWidth="1">
          {/* width */}
          <line x1={ox} y1={oy - 14} x2={ox + plot.width * s} y2={oy - 14} />
          <line x1={ox} y1={oy - 18} x2={ox} y2={oy - 10} />
          <line x1={ox + plot.width * s} y1={oy - 18} x2={ox + plot.width * s} y2={oy - 10} />
          <text x={ox + (plot.width * s) / 2} y={oy - 18} textAnchor="middle" fontSize="11" fontWeight="600" stroke="none">
            {plot.width.toFixed(1)} m
          </text>
          {/* height */}
          <line x1={ox - 16} y1={oy} x2={ox - 16} y2={oy + plot.height * s} />
          <line x1={ox - 20} y1={oy} x2={ox - 12} y2={oy} />
          <line x1={ox - 20} y1={oy + plot.height * s} x2={ox - 12} y2={oy + plot.height * s} />
          <text
            x={ox - 22}
            y={oy + (plot.height * s) / 2}
            textAnchor="middle"
            fontSize="11"
            fontWeight="600"
            stroke="none"
            transform={`rotate(-90 ${ox - 22} ${oy + (plot.height * s) / 2})`}
          >
            {plot.height.toFixed(1)} m
          </text>
        </g>
      ) : null}
    </svg>
  );
}

/** Legend chips for zone colours. */
export function ZoneLegend({ types, className }: { types?: Room["type"][]; className?: string }) {
  const list = types ?? (["classroom", "office", "reception", "toilets", "storage", "circulation"] as Room["type"][]);
  return (
    <ul className={cn("m-0 flex list-none flex-wrap gap-x-4 gap-y-1.5 p-0 text-xs text-muted", className)}>
      {list.map((t) => (
        <li key={t} className="flex items-center gap-1.5">
          <span className="h-3 w-3 border border-ink/40" style={{ background: zoneFill[t] }} aria-hidden />
          {zoneLabel[t]}
        </li>
      ))}
    </ul>
  );
}
