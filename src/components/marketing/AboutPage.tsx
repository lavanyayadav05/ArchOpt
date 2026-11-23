import { CheckCircle2, XCircle, Target, Ruler, Code2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Table, Th, Td, Tr } from "@/components/ui/Table";
import { Section, SectionHeading } from "./Section";

const principles = [
  {
    icon: Target,
    title: "Purpose",
    text: "Make architectural space planning more systematic: turn a brief into structured requirements, search for feasible layouts and show the trade-offs between them.",
  },
  {
    icon: Code2,
    title: "Engineering approach",
    text: "A typed TypeScript engine for geometry, graphs, constraints and optimization, running in the browser behind a Next.js interface with accessible, responsive screens.",
  },
  {
    icon: Ruler,
    title: "Scope discipline",
    text: "Rectangular rooms on a rectangular plot, explicit adjacency weights and measurable circulation — not a CAD or BIM platform.",
  },
];

const core = [
  "Rectangular rooms and a rectangular plot",
  "Adjacency preferences as a weighted graph",
  "Constraint checks: overlap, plot boundary, minimum size and area",
  "Circulation graph with Dijkstra shortest paths",
  "Two search strategies: constraint search and simulated annealing",
  "Four ranked candidate layouts with measured metrics",
];

const next = [
  "Drag-and-resize room editing on the canvas",
  "Shared projects with a hosted back end",
  "Natural-language brief parser",
  "Daylight and acoustic scoring modules",
  "Parallel candidate evaluation in Web Workers",
  "Multi-storey layouts",
];

const roadmap = [
  { week: "1", milestone: "Define room, plot, constraint and layout data structures; build geometry primitives." },
  { week: "2", milestone: "Implement rectangle intersection, boundary validation and candidate generation." },
  { week: "3", milestone: "Add the adjacency graph and shortest-path circulation analysis." },
  { week: "4", milestone: "Implement the cost function and the search strategies." },
  { week: "5", milestone: "Create the Next.js editor and SVG floor-plan renderer." },
  { week: "6", milestone: "Generate and compare multiple layouts; add export and persistence." },
  { week: "7", milestone: "Usability pass: accessibility audit, keyboard support, dark theme and user testing." },
  { week: "8", milestone: "Benchmark performance, document results and prepare the submission." },
];

const does = [
  "Generates ranked candidate layouts for any site size and room program",
  "Checks overlaps, plot boundaries, minimum sizes and required areas live",
  "Finds shortest walking routes from the entrance with Dijkstra",
  "Compares optimized layouts with an unoptimized packing, with real metrics",
  "Imports and exports plans as JSON; keeps preferences on the device",
];

const limits = [
  "Rooms are rectangles; curved and angled walls are out of scope",
  "Layouts use a central-corridor structure rather than free-form packing",
  "Accounts and projects are stored in this browser only",
  "Metrics are planning aids, not building-code compliance checks",
];

export function AboutPage() {
  return (
    <>
      <Section>
        <SectionHeading
          as="h1"
          eyebrow="About"
          title="Architecture is the domain. Algorithms and usability are the product."
          description="ArchOpt is a software-focused project. The architectural scope is deliberately narrow so the computational and human-computer interaction work can go deep."
        />
        <ul className="grid list-none gap-4 p-0 md:grid-cols-3">
          {principles.map((p) => (
            <li key={p.title} className="border border-line bg-surface p-5 shadow-card rounded-md">
              <span className="inline-flex h-10 w-10 items-center justify-center border border-line bg-highlight text-primary rounded-sm">
                <p.icon className="h-5 w-5" aria-hidden />
              </span>
              <h2 className="mt-4 text-base font-semibold text-ink">{p.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{p.text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="surface">
        <h2 className="text-xl font-bold tracking-tight text-ink">Scope</h2>
        <p className="mb-5 mt-1 text-sm text-muted">The core is intentionally small and fully working; the next steps build on it.</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="border border-line bg-bg p-5 rounded-md">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-ink">What is built</h3>
              <Badge tone="success" size="sm">
                Working
              </Badge>
            </div>
            <ul className="mt-3 flex list-none flex-col gap-2 p-0">
              {core.map((m) => (
                <li key={m} className="flex items-start gap-2 text-sm text-ink">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                  {m}
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-line pt-3 font-mono text-xs text-muted">
              Requirements → graph model → candidates → constraints → optimization → metrics → SVG
            </p>
          </div>
          <div className="border border-dashed border-line-strong bg-bg p-5 rounded-md">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-ink">Future work</h3>
              <Badge tone="warning" size="sm">
                Next
              </Badge>
            </div>
            <ul className="mt-3 flex list-none flex-col gap-2 p-0">
              {next.map((m) => (
                <li key={m} className="flex items-start gap-2 text-sm text-ink">
                  <span className="mt-1.5 h-2 w-2 shrink-0 border border-warning bg-warning-bg" aria-hidden />
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section>
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-ink">Development roadmap</h2>
            <p className="mb-4 mt-1 text-sm text-muted">Milestones in build order.</p>
            <Table>
              <thead>
                <tr>
                  <Th className="w-16">Week</Th>
                  <Th>Milestone</Th>
                </tr>
              </thead>
              <tbody>
                {roadmap.map((r) => (
                  <Tr key={r.week}>
                    <Td className="font-mono font-semibold text-primary">{r.week}</Td>
                    <Td className="whitespace-normal">{r.milestone}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </div>
          <div className="h-fit border border-line bg-surface p-5 shadow-card rounded-md">
            <h2 className="text-base font-semibold text-ink">What it does — and its limits</h2>
            <p className="mt-1 text-xs text-muted">A plain summary of the current build.</p>
            <ul className="mt-4 flex list-none flex-col gap-2 p-0">
              {does.map((d) => (
                <li key={d} className="flex items-start gap-2 text-sm text-ink">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                  {d}
                </li>
              ))}
            </ul>
            <hr className="my-4 border-line" />
            <ul className="flex list-none flex-col gap-2 p-0">
              {limits.map((d) => (
                <li key={d} className="flex items-start gap-2 text-sm text-muted">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>
    </>
  );
}
