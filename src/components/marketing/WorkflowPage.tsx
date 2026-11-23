"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FloorPlan } from "@/components/floorplan/FloorPlan";
import { layouts, communityCentrePlot } from "@/lib/mock";
import { Section, SectionHeading, CodeBlock } from "./Section";
import { pipelineStages } from "./Pipeline";
import { cn } from "@/lib/utils";

const ink = "#101b3c";
const blue = "#1649d8";

/* --- one illustration per stage (240 × 150 viewBox) --------------------------- */
function StageIllustration({ id }: { id: string }) {
  switch (id) {
    case "requirements":
      return (
        <svg viewBox="0 0 240 150" className="h-auto w-full" aria-hidden>
          <rect x="10" y="10" width="220" height="130" fill="#fff" stroke={ink} strokeWidth="1.5" />
          {["Plot 30 m × 20 m", "Reception 36 m²  min 6 × 4", "Classroom ×2  60 m²  min 8 × 6", "Office 24 m²  min 4 × 4", "Toilets 18 m²  ·  Storage 12 m²"].map((t, i) => (
            <g key={t}>
              <rect x="22" y={24 + i * 22} width="196" height="16" fill="#f7f9fd" stroke="#d7e0f0" />
              <text x="30" y={35 + i * 22} fontSize="9" fill={ink}>
                {t}
              </text>
            </g>
          ))}
          <rect x="150" y="118" width="68" height="14" fill={blue} />
          <text x="184" y="128" fontSize="8" fill="#fff" textAnchor="middle" fontWeight="700">
            Submit brief
          </text>
        </svg>
      );
    case "graph": {
      const nodes = [
        { x: 40, y: 75, l: "Reception" },
        { x: 120, y: 30, l: "Classroom 1" },
        { x: 200, y: 30, l: "Classroom 2" },
        { x: 120, y: 120, l: "Office" },
        { x: 200, y: 120, l: "Toilets" },
      ];
      const edges: [number, number, number][] = [
        [1, 2, 4],
        [0, 3, 3],
        [0, 1, 2],
        [3, 4, 1],
        [2, 4, 4],
      ];
      return (
        <svg viewBox="0 0 240 150" className="h-auto w-full" aria-hidden>
          {edges.map(([a, b, w]) => (
            <g key={`${a}${b}`}>
              <line x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} stroke={blue} strokeWidth={w * 0.7} />
              <rect x={(nodes[a].x + nodes[b].x) / 2 - 8} y={(nodes[a].y + nodes[b].y) / 2 - 7} width="16" height="14" fill="#fff" stroke={blue} />
              <text x={(nodes[a].x + nodes[b].x) / 2} y={(nodes[a].y + nodes[b].y) / 2 + 4} fontSize="9" fontWeight="700" fill={blue} textAnchor="middle">
                {w}
              </text>
            </g>
          ))}
          {nodes.map((n) => (
            <g key={n.l}>
              <rect x={n.x - 30} y={n.y - 11} width="60" height="22" fill="#eaf1ff" stroke={ink} strokeWidth="1.2" />
              <text x={n.x} y={n.y + 3.5} fontSize="8.5" fontWeight="600" fill={ink} textAnchor="middle">
                {n.l}
              </text>
            </g>
          ))}
        </svg>
      );
    }
    case "candidates":
      return (
        <svg viewBox="0 0 240 150" className="h-auto w-full" aria-hidden>
          <rect x="10" y="10" width="220" height="130" fill="#fbfcff" stroke={ink} strokeWidth="1.5" />
          {[
            [20, 20, 60, 40, "#d6e4ff"],
            [86, 20, 60, 40, "#d6e4ff"],
            [152, 20, 60, 40, "#d6e4ff"],
            [20, 80, 40, 50, "#d7f5e3"],
            [70, 90, 60, 40, "#e4dcff"],
            [160, 80, 50, 24, "#ffe0e6"],
          ].map(([x, y, w, h, f], i) => (
            <rect key={i} x={x} y={y} width={w} height={h} fill={f as string} stroke={ink} strokeWidth="1.2" strokeDasharray={i > 3 ? "4 2" : undefined} />
          ))}
          <g stroke={blue} strokeWidth="1" strokeDasharray="3 2" fill="none">
            <rect x="96" y="30" width="60" height="40" />
            <rect x="76" y="76" width="60" height="40" />
            <rect x="170" y="100" width="50" height="24" />
          </g>
          <text x="20" y="72" fontSize="8" fill="#596780">
            candidate positions ×n
          </text>
        </svg>
      );
    case "constraints":
      return (
        <svg viewBox="0 0 240 150" className="h-auto w-full" aria-hidden>
          <rect x="10" y="10" width="220" height="130" fill="#fbfcff" stroke={ink} strokeWidth="1.5" />
          <rect x="20" y="20" width="70" height="44" fill="#d6e4ff" stroke={ink} strokeWidth="1.2" />
          <rect x="70" y="40" width="70" height="44" fill="#ffe0e6" stroke="#b91c1c" strokeWidth="1.5" strokeDasharray="4 2" />
          <text x="105" y="36" fontSize="8" fill="#b91c1c" fontWeight="700">
            overlap
          </text>
          <rect x="180" y="90" width="70" height="40" fill="#ffe0e6" stroke="#b91c1c" strokeWidth="1.5" strokeDasharray="4 2" />
          <text x="150" y="118" fontSize="8" fill="#b91c1c" fontWeight="700" textAnchor="end">
            boundary
          </text>
          <rect x="24" y="96" width="30" height="14" fill="#ffe0e6" stroke="#b91c1c" strokeWidth="1.5" strokeDasharray="4 2" />
          <text x="60" y="106" fontSize="8" fill="#b91c1c" fontWeight="700">
            &lt; min 4 × 4
          </text>
          <rect x="150" y="20" width="60" height="44" fill="#d7f5e3" stroke="#15803d" strokeWidth="1.5" />
          <text x="180" y="46" fontSize="8" fill="#15803d" fontWeight="700" textAnchor="middle">
            valid
          </text>
        </svg>
      );
    case "optimization": {
      const pts = [220, 190, 170, 160, 140, 135, 120, 112, 108, 100, 98, 95, 94];
      const path = pts.map((v, i) => `${20 + i * 17},${20 + (v - 90) * 0.75}`).join(" ");
      return (
        <svg viewBox="0 0 240 150" className="h-auto w-full" aria-hidden>
          <line x1="20" y1="130" x2="230" y2="130" stroke={ink} />
          <line x1="20" y1="15" x2="20" y2="130" stroke={ink} />
          {[40, 70, 100].map((y) => (
            <line key={y} x1="20" y1={y} x2="230" y2={y} stroke="#e6edf9" />
          ))}
          <polyline points={path} fill="none" stroke={blue} strokeWidth="2" />
          {pts.map((v, i) => (
            <circle key={i} cx={20 + i * 17} cy={20 + (v - 90) * 0.75} r="2.5" fill="#fff" stroke={blue} strokeWidth="1.5" />
          ))}
          <text x="230" y="142" fontSize="8" fill="#596780" textAnchor="end">
            iterations
          </text>
          <text x="26" y="22" fontSize="8" fill="#596780">
            cost
          </text>
          <text x="226" y="20" fontSize="8" fill={blue} fontWeight="700" textAnchor="end">
            lower-cost layout
          </text>
        </svg>
      );
    }
    case "evaluation": {
      const bars = [
        ["Area efficiency", 87],
        ["Circulation", 92],
        ["Adjacency", 89],
        ["Accessibility", 94],
      ] as const;
      return (
        <svg viewBox="0 0 240 150" className="h-auto w-full" aria-hidden>
          {bars.map(([l, v], i) => (
            <g key={l}>
              <text x="10" y={30 + i * 30} fontSize="9" fill={ink}>
                {l}
              </text>
              <rect x="95" y={20 + i * 30} width="120" height="14" fill="#e9edf5" stroke="#d7e0f0" />
              <rect x="95" y={20 + i * 30} width={1.2 * v} height="14" fill={blue} />
              <text x="222" y={31 + i * 30} fontSize="9" fontWeight="700" fill={ink}>
                {v}%
              </text>
            </g>
          ))}
          <text x="10" y="143" fontSize="7" fill="#596780">
            illustrative values from the proposal
          </text>
        </svg>
      );
    }
    case "visualization":
      return (
        <div className="grid grid-cols-3 gap-2">
          {layouts.slice(0, 3).map((l) => (
            <div key={l.id} className={cn("border bg-surface p-1.5 rounded-sm", l.recommended ? "border-primary" : "border-line")}>
              <FloorPlan plot={communityCentrePlot} rooms={l.rooms} thumbnail ariaLabel={`${l.name} thumbnail`} />
              <p className="mt-1 text-center text-[11px] font-semibold text-ink">
                {l.name} · {l.metrics.areaEfficiency}%
              </p>
            </div>
          ))}
        </div>
      );
  }
  return null;
}

const phases = [
  { id: "A", title: "Randomized constraint search", text: "Start from random packings, keep every improving move and discard infeasible layouts.", status: "mvp" as const },
  { id: "B", title: "Simulated annealing", text: "Perturb room order, band depth and corridor width, accepting some worse moves early to escape local minima.", status: "mvp" as const },
  { id: "C", title: "Genetic algorithm", text: "Maintain a population of layouts with selection, crossover and mutation.", status: "planned" as const },
  { id: "D", title: "Parallel evaluation", text: "Evaluate candidates concurrently in Web Workers so large sites stay responsive.", status: "planned" as const },
];

const exampleRequirements = [
  "Reception close to entrance",
  "Classrooms close to each other",
  "Toilets accessible from common circulation",
  "Office near reception",
  "Minimum room dimensions and area requirements",
  "No room may overlap the plot boundary",
];

const costFunction = `Cost = w1 · overlap
     + w2 · boundary violations
     + w3 · bad adjacency
     + w4 · excess corridor
     + w5 · poor circulation
     + w6 · unused area

// weights w1…w6 are configurable so different
// design priorities can be tested on the same brief`;

export function WorkflowPage() {
  const [index, setIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const stage = pipelineStages[index];

  const go = (next: number) => {
    const n = (next + pipelineStages.length) % pipelineStages.length;
    setIndex(n);
    listRef.current?.querySelectorAll<HTMLButtonElement>("[role=tab]")[n]?.focus();
  };

  return (
    <>
      <Section>
        <SectionHeading
          as="h1"
          eyebrow="Workflow"
          title="From a brief to comparable candidate layouts in seven stages"
          description="Each stage has a clear input and output, so each stage can be tested and benchmarked on its own."
        />

        <div
          ref={listRef}
          role="tablist"
          aria-label="Pipeline stages"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") {
              e.preventDefault();
              go(index + 1);
            } else if (e.key === "ArrowLeft") {
              e.preventDefault();
              go(index - 1);
            } else if (e.key === "Home") {
              e.preventDefault();
              go(0);
            } else if (e.key === "End") {
              e.preventDefault();
              go(pipelineStages.length - 1);
            }
          }}
          className="grid gap-2 sm:grid-cols-4 lg:grid-cols-7"
        >
          {pipelineStages.map((s, i) => {
            const active = i === index;
            return (
              <button
                key={s.id}
                role="tab"
                type="button"
                id={`stage-tab-${s.id}`}
                aria-selected={active}
                aria-controls="stage-panel"
                tabIndex={active ? 0 : -1}
                onClick={() => setIndex(i)}
                className={cn(
                  "flex items-center gap-2.5 border p-2.5 text-left rounded-md transition-colors lg:flex-col lg:items-start",
                  active ? "border-primary bg-primary text-white" : "border-line bg-surface text-ink hover:border-line-strong",
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-6 w-6 shrink-0 items-center justify-center border font-mono text-[11px] font-semibold rounded-xs",
                    active ? "border-white/60 bg-white/15 text-white" : "border-primary bg-highlight text-primary",
                  )}
                >
                  {s.index}
                </span>
                <span className="text-xs font-semibold leading-4">{s.title}</span>
              </button>
            );
          })}
        </div>

        <div
          id="stage-panel"
          role="tabpanel"
          aria-labelledby={`stage-tab-${stage.id}`}
          className="mt-6 grid gap-6 border border-line bg-surface p-5 shadow-card rounded-md lg:grid-cols-[1fr_1.1fr] lg:p-6"
        >
          <div className="flex flex-col">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Stage {stage.index} of {pipelineStages.length}
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink">{stage.title}</h2>
            <p className="mt-1 text-sm font-medium text-primary">{stage.summary}</p>
            <p className="mt-4 text-sm leading-6 text-muted">{stage.detail}</p>
            <div className="mt-auto flex items-center gap-2 pt-6">
              <Button variant="outline" size="sm" leftIcon={<ChevronLeft className="h-4 w-4" />} onClick={() => go(index - 1)} aria-label="Previous stage">
                Previous
              </Button>
              <Button variant="outline" size="sm" rightIcon={<ChevronRight className="h-4 w-4" />} onClick={() => go(index + 1)} aria-label="Next stage">
                Next
              </Button>
              <span className="ml-auto text-xs text-muted">← → to navigate</span>
            </div>
          </div>
          <div className="blueprint-grid border border-line p-3 rounded-sm">
            <StageIllustration id={stage.id} />
          </div>
        </div>
      </Section>

      <Section tone="surface">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-ink">Optimization objective</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              A candidate layout is evaluated with a weighted cost function. Overlaps and boundary violations carry the heaviest
              weights; adjacency, corridor length, circulation and unused area shape the search among feasible layouts.
            </p>
            <CodeBlock className="mt-4" title="cost function" code={costFunction} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-ink">Optimization strategy</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Four phases, in the order they are built. Only Phase A is in the MVP scope.</p>
            <ol className="mt-4 flex list-none flex-col gap-2 p-0">
              {phases.map((p) => (
                <li key={p.id} className="flex items-start gap-3 border border-line bg-bg p-3 rounded-md">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center border border-primary bg-highlight font-mono text-sm font-bold text-primary rounded-xs">
                    {p.id}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-ink">{p.title}</p>
                      {p.status === "mvp" ? (
                        <Badge tone="success" size="sm">
                          <CheckCircle2 className="h-3 w-3" /> MVP
                        </Badge>
                      ) : (
                        <Badge tone="warning" size="sm">
                          <Clock className="h-3 w-3" /> Planned / advanced
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs leading-5 text-muted">{p.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Section>

      <Section>
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-ink">Example input</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              An architect specifies a small community centre on a 30 m × 20 m plot with reception, two classrooms, an office,
              toilets, storage and circulation space.
            </p>
            <ul className="mt-4 flex list-none flex-col gap-1.5 p-0">
              {exampleRequirements.map((r, i) => (
                <li key={r} className="flex items-center gap-3 border border-line bg-surface px-3 py-2 text-sm text-ink rounded-sm">
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center bg-highlight font-mono text-[11px] font-semibold text-primary rounded-xs">
                    {i + 1}
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="border border-line bg-surface p-4 shadow-card rounded-md">
            <p className="text-sm font-semibold text-ink">Resulting candidate (Layout A)</p>
            <p className="text-xs text-muted">Sample project data — illustrative, not a measured result.</p>
            <div className="blueprint-grid mt-3 border border-line p-2 rounded-sm">
              <FloorPlan plot={communityCentrePlot} rooms={layouts[0].rooms} ariaLabel="Community Centre Layout A" />
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
