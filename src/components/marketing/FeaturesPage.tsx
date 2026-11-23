"use client";

import { useState } from "react";
import { LayoutGrid, Share2, Route, Maximize2, Accessibility, Layers, Sun, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Table, Th, Td, Tr } from "@/components/ui/Table";
import { Section, SectionHeading } from "./Section";
import { cn } from "@/lib/utils";

type FeatureId = "space" | "adjacency" | "circulation" | "efficiency" | "accessibility" | "optimization";

interface Feature {
  id: FeatureId;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  short: string;
  detail: string;
  method: string;
  output: string;
  status: "mvp" | "planned";
}

const features: Feature[] = [
  {
    id: "space",
    icon: LayoutGrid,
    title: "Space Planning",
    short: "Organize rooms, corridors, stairs, toilets, entrances and open areas.",
    detail:
      "Every space is a rectangle with a required area, minimum width and depth, and a type. The planner keeps rooms, corridors, stairs, toilets, the entrance and open areas as first-class elements so the planner can reason about all of them together.",
    method: "Rectangular rooms on a rectangular plot",
    output: "Structured spatial requirements",
    status: "mvp",
  },
  {
    id: "adjacency",
    icon: Share2,
    title: "Adjacency Graph",
    short: "Represent desired relationships between spaces as weighted graph edges.",
    detail:
      "Rooms become nodes and each preference (“office near reception”, weight 3) becomes a weighted edge. Satisfied edges reward a layout; unsatisfied heavy edges raise its cost, which makes design intent measurable.",
    method: "Weighted adjacency graph",
    output: "Adjacency satisfaction score",
    status: "mvp",
  },
  {
    id: "circulation",
    icon: Route,
    title: "Circulation Analysis",
    short: "Shortest paths and walking distances between important spaces.",
    detail:
      "The corridor network is a graph; A* or Dijkstra finds the shortest path from the entrance to every important room. Long or indirect routes increase the circulation cost and the corridor-to-ideal-path ratio.",
    method: "Shortest-path search (A* / Dijkstra)",
    output: "Walking distances, circulation ratio",
    status: "mvp",
  },
  {
    id: "efficiency",
    icon: Maximize2,
    title: "Area Efficiency",
    short: "Evaluate usable area against total built area.",
    detail:
      "Usable area divided by total built area gives a single efficiency figure. Excess corridor and unused plot area both lower it, which keeps the optimizer from solving circulation by adding hallways everywhere.",
    method: "Usable area / total built area",
    output: "Efficiency percentage",
    status: "mvp",
  },
  {
    id: "accessibility",
    icon: Accessibility,
    title: "Accessibility",
    short: "Configurable corridor widths, turning areas and accessible routes.",
    detail:
      "Minimum corridor widths and turning areas are constraints, not afterthoughts. The planner can check that an accessible route exists from the entrance to each required space and flag corridors that are too narrow.",
    method: "Configurable width and turning-area constraints",
    output: "Accessibility score, violations",
    status: "mvp",
  },
  {
    id: "optimization",
    icon: Layers,
    title: "Layout Optimization",
    short: "Generate and compare multiple feasible floor-plan alternatives.",
    detail:
      "Candidates are generated, filtered by constraints and scored with a configurable weighted cost function. Instead of one answer, the frontend presents several low-cost layouts so trade-offs can be inspected.",
    method: "Constraint-based generation + weighted cost search",
    output: "3–5 candidate layouts with metrics",
    status: "mvp",
  },
];

/* --- inline SVG illustrations (120 × 72 viewBox) --------------------------------- */

function Illustration({ id, active }: { id: FeatureId; active: boolean }) {
  const ink = "#101b3c";
  const blue = "#1649d8";
  const light = active ? "#d6e4ff" : "#eaf1ff";
  const common = { stroke: ink, strokeWidth: 1.2, fill: light } as const;
  switch (id) {
    case "space":
      return (
        <svg viewBox="0 0 120 72" className="h-full w-full" aria-hidden>
          <rect x="6" y="6" width="108" height="60" fill="#fbfcff" stroke={ink} strokeWidth="1.5" />
          <rect x="6" y="6" width="36" height="24" {...common} />
          <rect x="42" y="6" width="36" height="24" {...common} />
          <rect x="78" y="6" width="36" height="24" {...common} />
          <rect x="6" y="30" width="108" height="10" fill="#fff0cc" stroke={ink} strokeWidth="1.2" />
          <rect x="6" y="40" width="24" height="26" fill="#d7f5e3" stroke={ink} strokeWidth="1.2" />
          <rect x="44" y="44" width="32" height="22" fill="#e4dcff" stroke={ink} strokeWidth="1.2" />
          <rect x="92" y="40" width="22" height="12" fill="#ffe0e6" stroke={ink} strokeWidth="1.2" />
          <line x1="54" y1="66" x2="66" y2="66" stroke="#fbfcff" strokeWidth="3" />
        </svg>
      );
    case "adjacency": {
      const nodes = [
        { x: 20, y: 36, l: "R" },
        { x: 60, y: 14, l: "C" },
        { x: 100, y: 36, l: "C" },
        { x: 60, y: 58, l: "O" },
      ];
      const edges = [
        [0, 1, 4],
        [1, 2, 4],
        [0, 3, 3],
        [2, 3, 1],
      ];
      return (
        <svg viewBox="0 0 120 72" className="h-full w-full" aria-hidden>
          {edges.map(([a, b, w]) => (
            <g key={`${a}-${b}`}>
              <line x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} stroke={blue} strokeWidth={w / 2 + 0.5} />
              <rect x={(nodes[a].x + nodes[b].x) / 2 - 6} y={(nodes[a].y + nodes[b].y) / 2 - 5} width="12" height="10" fill="#fff" stroke={blue} strokeWidth="1" />
              <text x={(nodes[a].x + nodes[b].x) / 2} y={(nodes[a].y + nodes[b].y) / 2 + 3} textAnchor="middle" fontSize="7" fontWeight="700" fill={blue}>
                {w}
              </text>
            </g>
          ))}
          {nodes.map((n) => (
            <g key={`${n.x}-${n.y}`}>
              <rect x={n.x - 9} y={n.y - 9} width="18" height="18" fill={light} stroke={ink} strokeWidth="1.2" />
              <text x={n.x} y={n.y + 3.5} textAnchor="middle" fontSize="9" fontWeight="700" fill={ink}>
                {n.l}
              </text>
            </g>
          ))}
        </svg>
      );
    }
    case "circulation":
      return (
        <svg viewBox="0 0 120 72" className="h-full w-full" aria-hidden>
          <rect x="6" y="6" width="108" height="60" fill="#fbfcff" stroke={ink} strokeWidth="1.5" />
          <rect x="6" y="6" width="54" height="24" {...common} />
          <rect x="60" y="6" width="54" height="24" {...common} />
          <rect x="6" y="30" width="108" height="10" fill="#fff0cc" stroke={ink} strokeWidth="1.2" />
          <rect x="6" y="40" width="40" height="26" {...common} />
          <rect x="80" y="40" width="34" height="26" fill="#e4dcff" stroke={ink} strokeWidth="1.2" />
          <rect x="46" y="40" width="34" height="26" fill="#fff0cc" stroke={ink} strokeWidth="1.2" />
          <polyline points="63,66 63,35 20,35 20,18" fill="none" stroke={blue} strokeWidth="2" strokeDasharray="4 2" />
          <polyline points="63,66 63,35 100,35 100,18" fill="none" stroke={blue} strokeWidth="2" strokeDasharray="4 2" />
          <circle cx="63" cy="66" r="3" fill={blue} />
          <text x="66" y="58" fontSize="7" fill={blue} fontWeight="700">
            A*
          </text>
        </svg>
      );
    case "efficiency":
      return (
        <svg viewBox="0 0 120 72" className="h-full w-full" aria-hidden>
          <text x="8" y="16" fontSize="7" fill="#596780">
            built
          </text>
          <rect x="34" y="8" width="80" height="12" fill="#e9edf5" stroke={ink} strokeWidth="1" />
          <text x="8" y="36" fontSize="7" fill="#596780">
            usable
          </text>
          <rect x="34" y="28" width="80" height="12" fill="#e9edf5" stroke={ink} strokeWidth="1" />
          <rect x="34" y="28" width={80 * 0.86} height="12" fill={blue} />
          <text x="34" y="56" fontSize="8" fill={ink} fontWeight="700">
            usable / built
          </text>
          <text x="114" y="56" fontSize="10" fill={blue} fontWeight="700" textAnchor="end">
            86%
          </text>
          <line x1="34" y1="62" x2="114" y2="62" stroke="#d7e0f0" />
        </svg>
      );
    case "accessibility":
      return (
        <svg viewBox="0 0 120 72" className="h-full w-full" aria-hidden>
          <rect x="6" y="6" width="108" height="60" fill="#fbfcff" stroke={ink} strokeWidth="1.5" />
          <rect x="6" y="6" width="108" height="20" {...common} />
          <rect x="6" y="46" width="108" height="20" {...common} />
          <rect x="6" y="26" width="108" height="20" fill="#fff0cc" stroke={ink} strokeWidth="1.2" />
          <line x1="30" y1="26" x2="30" y2="46" stroke={blue} strokeWidth="1" />
          <line x1="26" y1="26" x2="34" y2="26" stroke={blue} strokeWidth="1" />
          <line x1="26" y1="46" x2="34" y2="46" stroke={blue} strokeWidth="1" />
          <text x="34" y="39" fontSize="7" fill={blue} fontWeight="700">
            ≥ 1.5 m
          </text>
          <circle cx="90" cy="36" r="8" fill="none" stroke={blue} strokeWidth="1.2" strokeDasharray="2 2" />
          <text x="90" y="39" fontSize="6" fill={blue} textAnchor="middle" fontWeight="700">
            turn
          </text>
        </svg>
      );
    case "optimization":
      return (
        <svg viewBox="0 0 120 72" className="h-full w-full" aria-hidden>
          {[0, 1, 2].map((i) => {
            const x = 6 + i * 38;
            const best = i === 0;
            return (
              <g key={i}>
                <rect x={x} y="8" width="32" height="40" fill="#fbfcff" stroke={best ? blue : ink} strokeWidth={best ? 2 : 1.2} />
                <rect x={x} y="8" width="32" height="14" fill={light} stroke={ink} strokeWidth="1" />
                <rect x={x} y="22" width="32" height="6" fill="#fff0cc" stroke={ink} strokeWidth="1" />
                <rect x={x + (i === 1 ? 16 : 0)} y="28" width="16" height="20" fill="#d7f5e3" stroke={ink} strokeWidth="1" />
                <rect x={x + (i === 1 ? 0 : 16)} y={i === 2 ? 34 : 28} width="16" height={i === 2 ? 14 : 20} fill="#e4dcff" stroke={ink} strokeWidth="1" />
                <text x={x + 16} y="62" textAnchor="middle" fontSize="8" fontWeight="700" fill={best ? blue : "#596780"}>
                  {["86%", "83%", "81%"][i]}
                </text>
              </g>
            );
          })}
        </svg>
      );
  }
}

const comparisonRows = features.map((f) => ({ feature: f.title, method: f.method, output: f.output }));

export function FeaturesPage() {
  const [selected, setSelected] = useState<FeatureId>("space");
  const active = features.find((f) => f.id === selected)!;

  return (
    <>
      <Section>
        <SectionHeading
          as="h1"
          eyebrow="Features"
          title="Six capabilities, one repeatable engine"
          description="ArchOpt keeps the architectural scope deliberately focused — space planning, adjacency, circulation, area efficiency and accessibility — so the software and algorithms can be done properly."
        />

        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <ul aria-label="Capabilities" className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => {
              const isActive = f.id === selected;
              return (
                <li key={f.id} className="flex">
                <button
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setSelected(f.id)}
                  className={cn(
                    "flex w-full flex-col border bg-surface p-4 text-left shadow-card rounded-md transition-colors",
                    isActive ? "border-primary ring-1 ring-primary" : "border-line hover:border-line-strong",
                  )}
                >
                  <div className="h-[88px] w-full border border-line bg-bg p-1.5 rounded-sm">
                    <Illustration id={f.id} active={isActive} />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <f.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted")} />
                    <h2 className="text-sm font-semibold text-ink">{f.title}</h2>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted">{f.short}</p>
                </button>
                </li>
              );
            })}
          </ul>

          <aside aria-live="polite" className="h-fit border border-line bg-surface p-5 shadow-card rounded-md lg:sticky lg:top-24">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center border border-line bg-highlight text-primary rounded-sm">
                <active.icon className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-ink">{active.title}</h2>
                <p className="text-xs text-muted">{active.method}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted">{active.detail}</p>
            <dl className="mt-4 border border-line rounded-sm">
              <div className="flex justify-between gap-3 border-b border-line px-3 py-2 text-sm">
                <dt className="text-muted">Output</dt>
                <dd className="text-right font-medium text-ink">{active.output}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <dt className="text-muted">Status</dt>
                <dd>
                  <Badge tone="success" size="sm">
                    <CheckCircle2 className="h-3 w-3" /> Implemented in MVP scope
                  </Badge>
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </Section>

      <Section tone="surface">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
          <div className="border border-dashed border-line-strong bg-bg p-5 rounded-md">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center border border-line bg-surface text-warning rounded-sm">
                <Sun className="h-5 w-5" />
              </span>
              <Badge tone="warning" size="sm">
                <Clock className="h-3 w-3" /> Planned
              </Badge>
            </div>
            <h2 className="mt-4 text-base font-semibold text-ink">Daylight analysis</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              A simplified daylight score based on external walls, window placement and room depth. Scheduled after the core
              geometry, graph and optimization work; not part of the current build.
            </p>
            <svg viewBox="0 0 120 40" className="mt-4 h-auto w-full" aria-hidden>
              <rect x="4" y="4" width="112" height="32" fill="#fbfcff" stroke="#101b3c" strokeWidth="1.2" />
              <rect x="4" y="4" width="40" height="32" fill="#fff8e1" stroke="#101b3c" strokeWidth="1" />
              <rect x="44" y="4" width="40" height="32" fill="#fdf3cf" stroke="#101b3c" strokeWidth="1" />
              <rect x="84" y="4" width="32" height="32" fill="#e9edf5" stroke="#101b3c" strokeWidth="1" />
              <line x1="4" y1="12" x2="4" y2="28" stroke="#b45309" strokeWidth="3" />
              <text x="10" y="24" fontSize="7" fill="#b45309">
                window
              </text>
              <text x="100" y="22" fontSize="6" fill="#596780" textAnchor="middle">
                deep
              </text>
            </svg>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-ink">Capability summary</h2>
            <p className="mb-4 mt-1 text-sm text-muted">What each capability computes, and what the designer gets back.</p>
            <Table>
              <thead>
                <tr>
                  <Th>Feature</Th>
                  <Th>Method</Th>
                  <Th>Output</Th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((r) => (
                  <Tr key={r.feature}>
                    <Td className="font-medium">{r.feature}</Td>
                    <Td className="whitespace-normal text-muted">{r.method}</Td>
                    <Td className="whitespace-normal">{r.output}</Td>
                  </Tr>
                ))}
                <Tr>
                  <Td className="font-medium">Daylight (planned)</Td>
                  <Td className="whitespace-normal text-muted">External walls, windows, room depth</Td>
                  <Td className="whitespace-normal">Simplified daylight score</Td>
                </Tr>
              </tbody>
            </Table>
          </div>
        </div>
      </Section>
    </>
  );
}
