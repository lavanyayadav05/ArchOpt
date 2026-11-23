import { Cpu, MonitorSmartphone, PenTool, Database, Accessibility, Palette, CheckCircle2, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Table, Th, Td, Tr } from "@/components/ui/Table";
import { Section, SectionHeading, CodeBlock } from "./Section";
import { ArchitectureStrip } from "./Pipeline";

const responsibilities = [
  { layer: "Interface", tech: "React 19 + Tailwind CSS 4", purpose: "Responsive screens, design tokens, light and dark themes, keyboard shortcuts", icon: Palette },
  { layer: "Application", tech: "Next.js 16 (App Router) + TypeScript", purpose: "Routing, typed domain model, validation and state", icon: MonitorSmartphone },
  { layer: "Optimization engine", tech: "TypeScript, runs in the browser", purpose: "Geometry, graph search, constraint checks, annealing and metrics", icon: Cpu },
  { layer: "Visualization", tech: "SVG", purpose: "Floor plans, charts, circulation paths and version diffs", icon: PenTool },
  { layer: "Persistence", tech: "Browser storage + JSON export", purpose: "Preferences, session and saved layouts stay on the device", icon: Database },
  { layer: "Accessibility", tech: "WAI-ARIA, semantic HTML", purpose: "Focus management, labelled controls, live regions, skip link, contrast-checked colours", icon: Accessibility },
] as const;

const engineModules = [
  { name: "Computational geometry", text: "Rectangle intersection, boundary checks, shared-edge detection and geometric validity." },
  { name: "Graph algorithms", text: "A weighted adjacency graph for relationships and a circulation graph searched with Dijkstra for walking distance." },
  { name: "Constraint checking", text: "Overlap, plot-boundary, minimum-dimension and required-area validation on every candidate." },
  { name: "Search", text: "Randomized constraint search and simulated annealing over room order, band depth and corridor width." },
  { name: "Cost function", text: "Weighted sum of constraint shortfall, bad adjacency, excess corridor, walking distance and unused area." },
];

const roomType = `export interface Room {
  id: string;
  name: string;
  type: SpaceType;
  x: number; y: number;          // metres from the top-left of the plot
  width: number; height: number;
  requiredArea?: number;
  minWidth?: number;
  minHeight?: number;
}`;

const costCode = `cost = w1 * constraintShortfall
     + w2 * (100 - adjacencySatisfaction)
     + w3 * excessCorridorArea
     + w4 * averageWalkingDistance
     + w5 * unusedArea`;

export function TechnologyPage() {
  return (
    <>
      <Section>
        <SectionHeading
          as="h1"
          eyebrow="Technology"
          title="A typed web stack with the optimizer built in"
          description="The optimization engine is a separate TypeScript module with no dependency on the interface, so it can be tested, benchmarked and explained on its own."
        />
        <div className="border border-line bg-surface p-4 shadow-card rounded-md lg:p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted">System architecture</p>
          <ArchitectureStrip />
          <p className="mt-4 text-xs text-muted">
            Everything runs in the browser: the interface passes a structured brief to the engine, which returns ranked layouts with metrics, and SVG
            components draw them. Seeded random numbers make every run repeatable.
          </p>
        </div>
      </Section>

      <Section tone="surface">
        <h2 className="text-xl font-bold tracking-tight text-ink">Responsibilities by layer</h2>
        <p className="mb-4 mt-1 text-sm text-muted">What each part of the stack is responsible for.</p>
        <Table>
          <thead>
            <tr>
              <Th>Layer</Th>
              <Th>Technology</Th>
              <Th>Purpose</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {responsibilities.map((r) => (
              <Tr key={r.layer}>
                <Td className="font-medium">
                  <span className="inline-flex items-center gap-2">
                    <r.icon className="h-4 w-4 text-primary" aria-hidden />
                    {r.layer}
                  </span>
                </Td>
                <Td>{r.tech}</Td>
                <Td className="whitespace-normal text-muted">{r.purpose}</Td>
                <Td>
                  <Badge tone="success" size="sm">
                    <CheckCircle2 className="h-3 w-3" /> Built
                  </Badge>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Section>

      <Section>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-ink">The engine: where the technical depth lives</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              The engine owns the data structures, algorithms and scoring. Each module has a single, testable purpose.
            </p>
            <ul className="mt-4 flex list-none flex-col gap-2 p-0">
              {engineModules.map((m) => (
                <li key={m.name} className="flex items-start justify-between gap-3 border border-line bg-surface p-3 rounded-md">
                  <div>
                    <p className="text-sm font-semibold text-ink">{m.name}</p>
                    <p className="mt-0.5 text-xs leading-5 text-muted">{m.text}</p>
                  </div>
                  <Badge tone="success" size="sm">
                    Built
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-ink">Data model</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Each room stores its name, type, position, size and optional requirements. Relationships live in the weighted adjacency graph rather than on
              the room itself.
            </p>
            <CodeBlock className="mt-4" title="src/lib/types.ts" code={roomType} />
            <CodeBlock className="mt-4" title="Cost function" code={costCode} />
            <div className="mt-4 border border-line bg-surface p-4 rounded-md">
              <p className="text-sm font-semibold text-ink">Visualization</p>
              <p className="mt-1 text-xs leading-5 text-muted">
                Floor plans are rendered as SVG in the browser: rooms are rectangles in metres scaled through a viewBox, so the same component serves
                thumbnails, the editor canvas and version diffs without a drawing library.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="surface">
        <div className="border border-line bg-bg p-5 rounded-md">
          <h2 className="text-lg font-bold tracking-tight text-ink">How a layout is generated</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Rooms are packed into two bands on either side of a central corridor. The search changes the order of rooms, which band each belongs to, the depth of the
            bands and the corridor width, scoring every arrangement with the cost function.
          </p>
          <ol className="mt-4 flex list-none flex-col gap-1 p-0 sm:flex-row sm:items-center sm:gap-0">
            {["Brief", "Room list", "Pack bands", "Check constraints", "Score", "Ranked layouts"].map((step, i, all) => (
              <li key={step} className="flex items-center sm:flex-1">
                <span className="w-full border border-line bg-surface px-3 py-2 text-center text-xs font-semibold text-ink rounded-sm">{step}</span>
                {i < all.length - 1 ? <ArrowRight className="mx-1 hidden h-4 w-4 shrink-0 text-line-strong sm:block" aria-hidden /> : null}
              </li>
            ))}
          </ol>
        </div>
      </Section>
    </>
  );
}
