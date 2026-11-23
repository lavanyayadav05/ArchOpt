"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutGrid,
  Play,
  ArrowRight,
  Settings2,
  Route,
  Layers,
  Box,
  BarChart3,
  Share2,
  Footprints,
  Accessibility,
  Network,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar, SampleDataNote } from "@/components/ui/Misc";
import { FloorPlan, ZoneLegend } from "@/components/floorplan/FloorPlan";
import { layoutARooms, communityCentrePlot, layouts, SAMPLE_DATA_NOTICE } from "@/lib/mock";
import { useAuthDialog } from "@/components/providers/AuthDialogProvider";
import { Section, Container, Eyebrow, SectionHeading } from "./Section";
import { PipelineStrip, ArchitectureStrip, LinkArrow } from "./Pipeline";

const featureCards = [
  { icon: LayoutGrid, title: "Space Planning", text: "Convert briefs to structured spatial layouts" },
  { icon: Settings2, title: "Optimization Engine", text: "Cost-based search with configurable goals and weights" },
  { icon: Route, title: "Circulation Analysis", text: "Evaluate movement efficiency and path connectivity" },
  { icon: Layers, title: "Layout Intelligence", text: "Generate, compare and select the best design alternatives" },
];

const strip = [
  { icon: Box, label: "Spatial Constraints" },
  { icon: BarChart3, label: "Area Efficiency" },
  { icon: Share2, label: "Adjacency Graph" },
];

const sampleResults = [
  { icon: Maximize2, label: "Area efficiency", value: 87, note: "usable area / total built area" },
  { icon: Footprints, label: "Circulation", value: 92, note: "shortest-path score from the entrance" },
  { icon: Network, label: "Adjacency satisfaction", value: 89, note: "weighted relationships satisfied" },
  { icon: Accessibility, label: "Accessibility", value: 94, note: "corridor widths and accessible routes" },
];

const demoSteps = [
  { title: "Define the brief", text: "A 30 m × 20 m plot with reception, classrooms, office, toilets, storage and circulation." },
  { title: "Model relationships", text: "Reception near the entrance, classrooms adjacent, toilets off common circulation, office near reception." },
  { title: "Generate and check", text: "Candidate rectangles are placed and tested for overlaps, boundary violations and minimum dimensions." },
  { title: "Compare alternatives", text: "Several feasible layouts are scored and shown side by side with their metrics." },
];

export function LandingPage() {
  const { openSignIn, openGetStarted } = useAuthDialog();
  const [demoOpen, setDemoOpen] = useState(false);
  const layoutA = layouts[0];

  return (
    <>
      {/* Hero */}
      <section className="border-b border-line bg-bg">
        <Container className="grid items-center gap-10 py-12 lg:grid-cols-[1fr_1.05fr] lg:py-16">
          <div>
            <Eyebrow>Intelligent Spatial Design Platform</Eyebrow>
            <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl lg:text-[46px] lg:leading-[1.08]">
              Intelligent Architectural Space &amp; Circulation Optimizer
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-7 text-muted">
              Transform architectural requirements into optimized, spatially efficient and circulation-aware floor plans.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center gap-2.5 border border-primary bg-primary px-5 text-sm font-semibold text-white shadow-card rounded-sm hover:bg-primary-hover"
              >
                <LayoutGrid className="h-[18px] w-[18px]" />
                Explore Workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Button variant="outline" size="lg" className="h-12 px-5 font-semibold" leftIcon={<Play className="h-4 w-4 fill-current" />} onClick={() => setDemoOpen(true)}>
                View Platform Demo
              </Button>
            </div>
            <p className="mt-6 text-xs text-muted">
              Runs in your browser · Seeded, repeatable optimization · Next.js + TypeScript
            </p>
          </div>

          <div className="border border-line bg-surface p-3 shadow-card rounded-md sm:p-4">
            <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
              <div>
                <p className="text-sm font-semibold text-ink">Community Centre — Layout A</p>
                <p className="text-xs text-muted">30 m × 20 m plot · 6 required spaces · recommended candidate</p>
              </div>
              <SampleDataNote text="Example project" />
            </div>
            <div className="blueprint-grid mt-3 border border-line p-2 rounded-sm">
              <FloorPlan plot={communityCentrePlot} rooms={layoutARooms} ariaLabel="Community Centre sample floor plan, Layout A" />
            </div>
            <ZoneLegend className="mt-3" />
            <dl className="mt-3 grid grid-cols-2 gap-px border border-line bg-line rounded-sm sm:grid-cols-4">
              {[
                ["Area efficiency", `${layoutA.metrics.areaEfficiency}%`],
                ["Circulation ratio", layoutA.metrics.circulationRatio.toFixed(2)],
                ["Usable area", `${layoutA.metrics.usableArea} m²`],
                ["Adjacency", `${layoutA.metrics.adjacencySatisfaction}%`],
              ].map(([k, v]) => (
                <div key={k} className="bg-surface px-3 py-2">
                  <dt className="text-[11px] text-muted">{k}</dt>
                  <dd className="text-base font-bold text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </section>

      {/* Feature cards + strip */}
      <section className="border-b border-line bg-bg">
        <Container className="py-10">
          <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
            {featureCards.map((f) => (
              <li key={f.title} className="flex items-start gap-3 border border-line bg-surface p-4 shadow-card rounded-md">
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center border border-line bg-highlight text-primary rounded-sm">
                  <f.icon className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-ink">{f.title}</h2>
                  <p className="mt-1 text-sm leading-5 text-muted">{f.text}</p>
                </div>
              </li>
            ))}
          </ul>
          <ul className="mt-5 grid list-none divide-y divide-line border border-line bg-surface p-0 rounded-md sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {strip.map((s) => (
              <li key={s.label} className="flex items-center justify-center gap-3 px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-ink">
                <s.icon className="h-5 w-5 text-muted" aria-hidden />
                {s.label}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* How it works */}
      <Section tone="surface">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="How it works"
            title="A seven-stage pipeline from brief to candidate layouts"
            description="Requirements become a weighted graph, the engine generates and checks candidates, and the interface shows alternatives side by side for comparison."
            className="mb-0"
          />
          <LinkArrow href="/workflow">Explore the workflow</LinkArrow>
        </div>
        <PipelineStrip className="mt-8" />
      </Section>

      {/* Architecture */}
      <Section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Architecture"
            title="A clear separation between interface and engine"
            description="A typed TypeScript engine does the geometry, graph search and scoring; React and SVG present the results, so each layer can be tested and understood on its own."
            className="mb-0"
          />
          <LinkArrow href="/technology">See the technology stack</LinkArrow>
        </div>
        <ArchitectureStrip compact className="mt-8" />
      </Section>

      {/* Sample results */}
      <Section tone="surface">
        <SectionHeading
          eyebrow="Sample results"
          title="Metrics the designer sees for every candidate"
          description="Each layout is evaluated on four axes so trade-offs between alternatives are visible at a glance."
        />
        <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {sampleResults.map((r) => (
            <li key={r.label} className="border border-line bg-bg p-4 rounded-md">
              <div className="flex items-center justify-between">
                <span className="inline-flex h-9 w-9 items-center justify-center border border-line bg-surface text-primary rounded-sm">
                  <r.icon className="h-[18px] w-[18px]" />
                </span>
                <span className="text-2xl font-bold tracking-tight text-ink">{r.value}%</span>
              </div>
              <p className="mt-3 text-sm font-semibold text-ink">{r.label}</p>
              <p className="text-xs text-muted">{r.note}</p>
              <ProgressBar value={r.value} className="mt-3" label={`${r.label} ${r.value}%`} />
            </li>
          ))}
        </ul>
        <SampleDataNote className="mt-4" text="Example values for the sample project. Generate your own layouts in the Space Planner to see measured results." />
      </Section>

      {/* CTA */}
      <section className="bg-bg">
        <Container className="py-14">
          <div className="flex flex-col items-start justify-between gap-6 border border-line bg-highlight p-6 rounded-md md:flex-row md:items-center md:p-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-ink">Start from a brief, end with comparable layouts.</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
                Create a workspace, define a plot and its spaces, and explore the sample Community Centre project in the Space Planner.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />} onClick={openGetStarted}>
                Get Started
              </Button>
              <Button size="lg" variant="outline" onClick={openSignIn}>
                Sign In
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Demo modal */}
      <Modal
        open={demoOpen}
        onClose={() => setDemoOpen(false)}
        title="Platform demo — Community Centre"
        description="How a brief becomes a set of comparable floor-plan candidates."
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setDemoOpen(false)}>
              Close
            </Button>
            <Link
              href="/space-planner"
              className="inline-flex h-9 items-center gap-2 border border-primary bg-primary px-3.5 text-sm font-medium text-white rounded-sm hover:bg-primary-hover"
            >
              Open Space Planner
              <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        }
      >
        <div className="grid gap-5 md:grid-cols-[1.1fr_1fr]">
          <div className="blueprint-grid border border-line p-2 rounded-sm">
            <FloorPlan plot={communityCentrePlot} rooms={layoutARooms} ariaLabel="Demo floor plan" />
          </div>
          <ol className="m-0 flex list-none flex-col gap-3 p-0">
            {demoSteps.map((s, i) => (
              <li key={s.title} className="flex gap-3">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center border border-primary bg-highlight font-mono text-xs font-semibold text-primary rounded-xs">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{s.title}</p>
                  <p className="text-xs leading-5 text-muted">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <p className="mt-4 text-xs text-muted">{SAMPLE_DATA_NOTICE} Open the Space Planner to generate layouts for your own site.</p>
      </Modal>
    </>
  );
}
