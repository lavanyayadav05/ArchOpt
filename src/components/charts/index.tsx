"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import type { TrendPoint } from "@/lib/types";

/**
 * Dependency-free SVG charts sized through viewBox so they scale with their
 * container without layout shift. Colours follow the ArchOpt palette.
 */

export const chartColors = {
  primary: "#1649d8",
  secondary: "#3769e8",
  light: "#9db8f5",
  lighter: "#c9d9ff",
  lightest: "#e3ecff",
  grid: "var(--color-line)",
  axis: "var(--color-muted)",
  success: "#15803d",
};

/** Sequential blues for categorical series, darkest first. */
export const seriesBlues = ["#1649d8", "#3769e8", "#6a8ff0", "#9db8f5", "#c9d9ff", "#e3ecff"];

/** Zone palette used by floor plans and distribution charts. */
export const zoneColors: Record<string, string> = {
  classroom: "#9db8f5",
  reception: "#b4a6f2",
  office: "#9ad8b4",
  toilets: "#f4b3c0",
  storage: "#c3cbd9",
  circulation: "#f5d78e",
  corridor: "#f5d78e",
  entrance: "#1649d8",
  open: "#e3ecff",
};

/* ------------------------------------------------------------------ */
/* Line chart                                                          */
/* ------------------------------------------------------------------ */

export interface LineChartProps {
  data: TrendPoint[];
  height?: number;
  yMin?: number;
  yMax?: number;
  yTicks?: number;
  formatY?: (v: number) => string;
  highlightLast?: boolean;
  area?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function LineChart({
  data,
  height = 220,
  yMin,
  yMax,
  yTicks = 5,
  formatY = (v) => `${v}%`,
  highlightLast = true,
  area = true,
  className,
  ariaLabel = "Line chart",
}: LineChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const gradId = useId();
  const W = 600;
  const H = height;
  const pad = { l: 44, r: 16, t: 28, b: 28 };
  const values = data.map((d) => d.value);
  const lo = yMin ?? Math.floor(Math.min(...values) / 5) * 5;
  const hi = yMax ?? Math.ceil(Math.max(...values) / 5) * 5;
  const x = (i: number) => pad.l + (i / Math.max(1, data.length - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - lo) / Math.max(0.0001, hi - lo)) * (H - pad.t - pad.b);
  const path = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
  const areaPath = `${path} L${x(data.length - 1).toFixed(1)},${(H - pad.b).toFixed(1)} L${x(0).toFixed(1)},${(H - pad.b).toFixed(1)} Z`;
  const ticks = Array.from({ length: yTicks }, (_, i) => lo + ((hi - lo) * i) / (yTicks - 1));
  const labelEvery = Math.max(1, Math.ceil(data.length / 7));
  const active = hover ?? (highlightLast ? data.length - 1 : null);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={cn("h-auto w-full", className)}
      role="img"
      aria-label={ariaLabel}
      onMouseLeave={() => setHover(null)}
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={chartColors.primary} stopOpacity="0.16" />
          <stop offset="100%" stopColor={chartColors.primary} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke={chartColors.grid} strokeWidth="1" />
          <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill={chartColors.axis}>
            {formatY(t)}
          </text>
        </g>
      ))}
      {area ? <path d={areaPath} fill={`url(#${gradId})`} /> : null}
      <path d={path} fill="none" stroke={chartColors.primary} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <g key={d.label}>
          <circle cx={x(i)} cy={y(d.value)} r={i === active ? 4.5 : 3} fill="#fff" stroke={chartColors.primary} strokeWidth="2" />
          {i % labelEvery === 0 || i === data.length - 1 ? (
            <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill={chartColors.axis}>
              {d.label}
            </text>
          ) : null}
          {/* hit area */}
          <rect
            x={x(i) - (W - pad.l - pad.r) / data.length / 2}
            y={pad.t}
            width={(W - pad.l - pad.r) / data.length}
            height={H - pad.t - pad.b}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        </g>
      ))}
      {active !== null ? (
        <g pointerEvents="none">
          <line x1={x(active)} x2={x(active)} y1={pad.t} y2={H - pad.b} stroke={chartColors.primary} strokeDasharray="3 3" strokeWidth="1" />
          {(() => {
            const bx = Math.min(W - pad.r - 64, Math.max(pad.l, x(active) - 32));
            const by = Math.max(2, y(data[active].value) - 34);
            return (
              <g>
                <rect x={bx} y={by} width="64" height="22" fill="#fff" stroke={chartColors.primary} strokeWidth="1" />
                <text x={bx + 32} y={by + 15} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--color-ink)">
                  {formatY(data[active].value)}
                </text>
              </g>
            );
          })()}
        </g>
      ) : null}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Bar chart                                                           */
/* ------------------------------------------------------------------ */

export interface BarChartProps {
  data: TrendPoint[];
  height?: number;
  yMin?: number;
  yMax?: number;
  yTicks?: number;
  formatY?: (v: number) => string;
  /** Index of the bar to emphasise (others are lighter). */
  emphasis?: number | null;
  colors?: string[];
  showValues?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function BarChart({
  data,
  height = 200,
  yMin = 0,
  yMax,
  yTicks = 5,
  formatY = (v) => `${v}`,
  emphasis = 0,
  colors,
  showValues = true,
  className,
  ariaLabel = "Bar chart",
}: BarChartProps) {
  const W = 400;
  const H = height;
  const pad = { l: 38, r: 8, t: 20, b: 26 };
  const hi = yMax ?? Math.ceil(Math.max(...data.map((d) => d.value)) * 1.1);
  const innerW = W - pad.l - pad.r;
  const slot = innerW / data.length;
  const barW = Math.min(44, slot * 0.6);
  const y = (v: number) => pad.t + (1 - (v - yMin) / Math.max(0.0001, hi - yMin)) * (H - pad.t - pad.b);
  const ticks = Array.from({ length: yTicks }, (_, i) => yMin + ((hi - yMin) * i) / (yTicks - 1));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cn("h-auto w-full", className)} role="img" aria-label={ariaLabel}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke={chartColors.grid} />
          <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill={chartColors.axis}>
            {formatY(Math.round(t * 10) / 10)}
          </text>
        </g>
      ))}
      {data.map((d, i) => {
        const cx = pad.l + slot * i + slot / 2;
        const fill = colors?.[i] ?? (emphasis === null ? chartColors.primary : i === emphasis ? chartColors.primary : seriesBlues[Math.min(5, i + 2)]);
        return (
          <g key={d.label}>
            <rect x={cx - barW / 2} y={y(d.value)} width={barW} height={Math.max(0, H - pad.b - y(d.value))} fill={fill} />
            {showValues ? (
              <text x={cx} y={y(d.value) - 6} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--color-ink)">
                {formatY(d.value)}
              </text>
            ) : null}
            <text x={cx} y={H - 8} textAnchor="middle" fontSize="11" fill={chartColors.axis}>
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Donut chart                                                         */
/* ------------------------------------------------------------------ */

export interface DonutSlice {
  key: string;
  label: string;
  value: number;
  color?: string;
}

export interface DonutChartProps {
  data: DonutSlice[];
  size?: number;
  thickness?: number;
  centerLabel?: React.ReactNode;
  centerSub?: string;
  legend?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function DonutChart({ data, size = 150, thickness = 22, centerLabel, centerSub, legend = true, className, ariaLabel = "Donut chart" }: DonutChartProps) {
  const [hover, setHover] = useState<string | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = size / 2 - thickness / 2 - 2;
  const c = 2 * Math.PI * r;
  // Cumulative arc offsets, computed up front (no mutation during render).
  const offsets = data.reduce<number[]>((acc, d, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + (data[i - 1].value / total) * c);
    return acc;
  }, []);

  return (
    <div className={cn("flex items-center gap-5", className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={ariaLabel} className="shrink-0">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={chartColors.grid} strokeWidth={thickness} />
        {data.map((d, i) => {
          const frac = d.value / total;
          const dash = `${(frac * c).toFixed(2)} ${(c - frac * c).toFixed(2)}`;
          return (
            <circle
              key={d.key}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={d.color ?? zoneColors[d.key] ?? seriesBlues[i % seriesBlues.length]}
              strokeWidth={hover === d.key ? thickness + 4 : thickness}
              strokeDasharray={dash}
              strokeDashoffset={-offsets[i]}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              onMouseEnter={() => setHover(d.key)}
              onMouseLeave={() => setHover(null)}
              style={{ transition: "stroke-width 120ms" }}
            />
          );
        })}
        {centerLabel !== undefined ? (
          <text x={size / 2} y={size / 2 - (centerSub ? 2 : -5)} textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--color-ink)">
            {centerLabel}
          </text>
        ) : null}
        {centerSub ? (
          <text x={size / 2} y={size / 2 + 15} textAnchor="middle" fontSize="10" fill={chartColors.axis}>
            {centerSub}
          </text>
        ) : null}
      </svg>
      {legend ? (
        <ul className="m-0 flex min-w-0 flex-1 list-none flex-col gap-1.5 p-0">
          {data.map((d, i) => (
            <li
              key={d.key}
              onMouseEnter={() => setHover(d.key)}
              onMouseLeave={() => setHover(null)}
              className={cn("flex items-center justify-between gap-3 text-xs", hover === d.key ? "text-ink" : "text-muted")}
            >
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0" style={{ background: d.color ?? zoneColors[d.key] ?? seriesBlues[i % seriesBlues.length] }} aria-hidden />
                {d.label}
              </span>
              <span className="font-semibold text-ink">{Math.round((d.value / total) * 100)}%</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sparkline + horizontal bars                                         */
/* ------------------------------------------------------------------ */

export function Sparkline({ data, width = 90, height = 28, className }: { data: number[]; width?: number; height?: number; className?: string }) {
  const lo = Math.min(...data);
  const hi = Math.max(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - 2 - ((v - lo) / Math.max(0.0001, hi - lo)) * (height - 4)}`);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden>
      <polyline points={pts.join(" ")} fill="none" stroke={chartColors.primary} strokeWidth="1.5" />
    </svg>
  );
}

export function HBarList({
  data,
  max,
  format = (v) => `${v}`,
  className,
}: {
  data: { label: string; value: number; color?: string }[];
  max?: number;
  format?: (v: number) => string;
  className?: string;
}) {
  const hi = max ?? Math.max(...data.map((d) => d.value));
  return (
    <ul className={cn("m-0 flex list-none flex-col gap-2.5 p-0", className)}>
      {data.map((d, i) => (
        <li key={d.label} className="grid grid-cols-[100px_1fr_48px] items-center gap-3 text-xs">
          <span className="truncate text-muted">{d.label}</span>
          <span className="h-2 w-full bg-line rounded-xs">
            <span className="block h-full rounded-xs" style={{ width: `${(d.value / hi) * 100}%`, background: d.color ?? seriesBlues[i % 3] }} />
          </span>
          <span className="text-right font-semibold text-ink">{format(d.value)}</span>
        </li>
      ))}
    </ul>
  );
}
