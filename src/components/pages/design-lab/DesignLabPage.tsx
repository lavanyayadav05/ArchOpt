"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Camera,
  Sun,
  Image as ImageIcon,
  Lightbulb,
  Layers,
  Plus,
  Maximize2,
  Footprints,
  Check,
  X,
  RotateCw,
  Building2,
  Play,
} from "lucide-react";
import { PageHeader } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Toggle } from "@/components/ui/Checkbox";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { SelectMenu } from "@/components/ui/Dropdown";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { SampleDataNote, Skeleton } from "@/components/ui/Misc";
import { Table, Th, Td, Tr } from "@/components/ui/Table";
import { useToast } from "@/components/providers/ToastProvider";
import {
  materials,
  lightingSetups,
  designVariations,
  designLabStats,
  layouts,
  layoutARooms,
  communityCentrePlot,
  type DesignVariation,
} from "@/lib/mock";
import { validateRequired } from "@/lib/validation";
import { cn, uid } from "@/lib/utils";
import { MaterialSwatch } from "./MaterialSwatch";
import { Elevation } from "./Elevation";
import { Isometric } from "./Isometric";

type TabKey = "design-board" | "materials" | "3d" | "render" | "lighting" | "facade";

const TABS: { value: TabKey; label: string }[] = [
  { value: "design-board", label: "Design Board" },
  { value: "materials", label: "Materials" },
  { value: "3d", label: "3D Views" },
  { value: "render", label: "Render Studio" },
  { value: "lighting", label: "Lighting" },
  { value: "facade", label: "Facade" },
];

const isTab = (v: string | null): v is TabKey => TABS.some((t) => t.value === v);

const INTERIOR = new Set(["m-wood", "m-concrete", "m-glass"]);
const costTone: Record<string, BadgeTone> = { Low: "success", Medium: "info", High: "warning" };

interface RenderJob {
  id: string;
  name: string;
  lighting: string;
  resolution: string;
  status: "queued" | "rendering" | "done";
  progress: number;
}

const statTiles = [
  { icon: Box, value: designLabStats.variations, label: "Design Variations" },
  { icon: Layers, value: `${designLabStats.materials}+`, label: "Materials" },
  { icon: ImageIcon, value: designLabStats.renders, label: "Renders" },
  { icon: Lightbulb, value: designLabStats.lightingSetups, label: "Lighting Setups" },
];

export function DesignLabPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-[420px] w-full" />
        </div>
      }
    >
      <DesignLabInner />
    </Suspense>
  );
}

function DesignLabInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();
  const rawTab = params.get("tab");
  const tab: TabKey = isTab(rawTab) ? rawTab : "design-board";
  const setTab = (t: TabKey) => router.replace(t === "design-board" ? "/design-lab" : `/design-lab?tab=${t}`);

  /* ---------------- shared design state ---------------- */
  const [variations, setVariations] = useState<DesignVariation[]>(designVariations);
  const [variationId, setVariationId] = useState(designVariations[0].id);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>(designVariations[0].materialIds);
  const [lightingId, setLightingId] = useState("evening");
  const [defaultLighting, setDefaultLighting] = useState("evening");
  const [glazing, setGlazing] = useState(designVariations[0].glazing);
  const [slatSpacing, setSlatSpacing] = useState(10);
  const [canopyDepth, setCanopyDepth] = useState(40);
  const [sunAngle, setSunAngle] = useState(120);
  const [fullscreen, setFullscreen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [materialFilter, setMaterialFilter] = useState<"all" | "exterior" | "interior" | "low">("all");
  const [turn, setTurn] = useState(0);
  const [showCirc, setShowCirc] = useState(true);
  const [queue, setQueue] = useState<RenderJob[]>([
    { id: "r1", name: "Variation A — Evening", lighting: "Evening", resolution: "1920×1080", status: "done", progress: 100 },
    { id: "r2", name: "Variation B — Day", lighting: "Day", resolution: "1280×720", status: "queued", progress: 0 },
  ]);

  const lighting = lightingSetups.find((l) => l.id === lightingId) ?? lightingSetups[0];
  const facadeMaterial = materials.find((m) => m.id === selectedMaterials[0]);
  const accentMaterial = materials.find((m) => m.id === selectedMaterials[1] && m.pattern === "wood") ?? materials.find((m) => m.id === "m-wood");
  const elevationProps = {
    sky: lighting.sky,
    ambient: lighting.ambient,
    facade: facadeMaterial?.swatch ?? "#b5563b",
    accent: accentMaterial?.swatch,
    glazing,
    slatSpacing,
    canopyDepth,
    sunAngle,
    night: lighting.id === "night",
  };

  const selectVariation = (v: DesignVariation) => {
    setVariationId(v.id);
    setSelectedMaterials(v.materialIds);
    setGlazing(v.glazing);
  };

  const toggleMaterial = (id: string) =>
    setSelectedMaterials((list) => (list.includes(id) ? list.filter((m) => m !== id) : [...list, id]));

  const notConnected = (what: string) =>
    toast({ kind: "info", title: `${what} unavailable`, description: "Rendering previews are planned for a future version." });

  /* ---------------- render queue simulation ---------------- */
  const startRender = (id: string) => {
    setQueue((q) => q.map((j) => (j.id === id ? { ...j, status: "rendering", progress: 0 } : j)));
    const timer = window.setInterval(() => {
      setQueue((q) => {
        const job = q.find((j) => j.id === id);
        if (!job || job.status !== "rendering") {
          window.clearInterval(timer);
          return q;
        }
        const next = Math.min(100, job.progress + 20);
        if (next >= 100) {
          window.clearInterval(timer);
          return q.map((j) => (j.id === id ? { ...j, status: "done", progress: 100 } : j));
        }
        return q.map((j) => (j.id === id ? { ...j, progress: next } : j));
      });
    }, 500);
  };

  const filteredMaterials = materials.filter((m) => {
    if (materialFilter === "interior") return INTERIOR.has(m.id);
    if (materialFilter === "exterior") return true;
    if (materialFilter === "low") return m.cost === "Low";
    return true;
  });

  const quickTools = [
    { label: "3D Model", icon: Box, onClick: () => setTab("3d") },
    { label: "Materials", icon: Layers, onClick: () => setTab("materials") },
    { label: "Lighting", icon: Sun, onClick: () => setTab("lighting") },
    { label: "Render", icon: Camera, onClick: () => setTab("render") },
    { label: "Walkthrough", icon: Footprints, onClick: () => notConnected("Walkthrough") },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Design Lab"
        description="Visualize, style and present your architectural designs."
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setNewOpen(true)}>
            New Design
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {statTiles.map((t) => (
          <div key={t.label} className="flex items-center gap-3 border border-line bg-surface p-4 shadow-card rounded-md">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-line bg-highlight text-primary rounded-sm">
              <t.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xl font-bold leading-6 text-ink">{t.value}</p>
              <p className="text-xs text-muted">{t.label}</p>
            </div>
          </div>
        ))}
      </div>
      <SampleDataNote />

      <Tabs value={tab} onChange={setTab} items={TABS} variant="underline" ariaLabel="Design Lab sections" />

      {tab === "design-board" ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader title="Design Preview" subtitle={`${variations.find((v) => v.id === variationId)?.name ?? "Variation"} · ${lighting.name} lighting`} />
              <div className="relative border border-line rounded-sm">
                <Elevation {...elevationProps} />
                <div className="absolute bottom-3 left-3 flex gap-1.5">
                  <Button size="sm" variant="outline" leftIcon={<Box className="h-3.5 w-3.5" />} onClick={() => setTab("3d")}>
                    3D View
                  </Button>
                  <Button size="sm" variant="outline" leftIcon={<Play className="h-3.5 w-3.5" />} onClick={() => notConnected("Walkthrough")}>
                    Walkthrough
                  </Button>
                </div>
                <button
                  type="button"
                  aria-label="Open preview fullscreen"
                  onClick={() => setFullscreen(true)}
                  className="absolute right-3 bottom-3 inline-flex h-8 w-8 items-center justify-center border border-line bg-surface text-ink rounded-sm hover:bg-highlight"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
            </Card>

            <Card>
              <CardHeader title={`Design Variations (${variations.length})`} subtitle="Facade and material presets applied to Layout A." />
              <div className="grid gap-3 sm:grid-cols-3">
                {variations.map((v) => {
                  const active = v.id === variationId;
                  const mat = materials.find((m) => m.id === v.materialIds[0]);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => selectVariation(v)}
                      className={cn(
                        "relative border bg-surface p-2 text-left rounded-sm transition-colors hover:border-line-strong",
                        active ? "border-primary ring-1 ring-primary" : "border-line",
                      )}
                    >
                      {active ? (
                        <span className="absolute right-2 top-2 z-10 inline-flex h-5 w-5 items-center justify-center bg-primary text-white rounded-xs">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                      ) : null}
                      <div className="border border-line">
                        <Elevation {...elevationProps} facade={mat?.swatch ?? elevationProps.facade} glazing={v.glazing} compact />
                      </div>
                      <p className="mt-2 text-sm font-semibold text-ink">{v.name}</p>
                      <p className="text-xs text-muted">({v.subtitle})</p>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader
                title="Material Palette"
                action={
                  <button type="button" onClick={() => setTab("materials")} className="text-xs font-medium text-primary hover:underline">
                    View All →
                  </button>
                }
              />
              <div className="grid grid-cols-3 gap-2">
                {materials.map((m) => {
                  const active = selectedMaterials.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleMaterial(m.id)}
                      className={cn("border p-1 text-left rounded-sm hover:border-line-strong", active ? "border-primary ring-1 ring-primary" : "border-line")}
                    >
                      <MaterialSwatch material={m} className="h-14 w-full border border-line" />
                      <p className="mt-1 truncate text-[11px] font-medium text-ink">{m.name}</p>
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card>
              <CardHeader
                title="Lighting Setup"
                action={
                  <SelectMenu
                    size="sm"
                    value={lightingId}
                    onChange={setLightingId}
                    options={lightingSetups.map((l) => ({ value: l.id, label: l.recommended ? `${l.name} (Recommended)` : l.name }))}
                    ariaLabel="Lighting setup"
                  />
                }
              />
              <div className="grid grid-cols-4 gap-2">
                {lightingSetups.map((l) => {
                  const active = l.id === lightingId;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setLightingId(l.id)}
                      className={cn("border p-1 rounded-sm hover:border-line-strong", active ? "border-primary ring-1 ring-primary" : "border-line")}
                    >
                      <svg viewBox="0 0 60 40" className="h-10 w-full border border-line" aria-hidden>
                        <rect width="60" height="40" fill={l.sky} />
                        <rect y="30" width="60" height="10" fill={l.id === "night" ? "#2a3350" : "#dfe6f2"} />
                        <rect x="14" y="14" width="32" height="16" fill={l.id === "indoor" ? "#f0e3c7" : "#b5563b"} stroke="#101b3c" strokeWidth="0.8" />
                        <rect x="18" y="18" width="24" height="7" fill={l.id === "night" ? "#f8dd9c" : "#bcd6f3"} />
                        {l.id !== "night" && l.id !== "indoor" ? <circle cx="48" cy="8" r="3" fill={l.ambient} stroke="#f0c27a" strokeWidth="0.6" /> : null}
                      </svg>
                      <p className="mt-1 text-center text-[11px] font-medium text-ink">{l.name}</p>
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card>
              <CardHeader title="Quick Tools" />
              <div className="grid grid-cols-5 gap-2">
                {quickTools.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={t.onClick}
                    className="flex flex-col items-center gap-1.5 border border-line bg-surface px-1 py-3 text-ink rounded-sm hover:border-line-strong hover:bg-highlight"
                  >
                    <t.icon className="h-5 w-5 text-primary" />
                    <span className="text-[11px] font-medium">{t.label}</span>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {tab === "materials" ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader title="Material Library" subtitle="Flat material swatches for facade and interior studies." />
            <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Filter materials">
              {(
                [
                  ["all", "All"],
                  ["exterior", "Exterior"],
                  ["interior", "Interior"],
                  ["low", "Low cost"],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={materialFilter === k}
                  onClick={() => setMaterialFilter(k)}
                  className={cn(
                    "h-7 border px-2.5 text-xs font-medium rounded-xs",
                    materialFilter === k ? "border-primary bg-primary text-white" : "border-line bg-surface text-muted hover:bg-highlight hover:text-ink",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMaterials.map((m) => {
                const applied = selectedMaterials.includes(m.id);
                return (
                  <div key={m.id} className={cn("flex flex-col border p-2 rounded-sm", applied ? "border-primary" : "border-line")}>
                    <MaterialSwatch material={m} className="h-20 w-full border border-line" />
                    <div className="mt-2 flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-ink">{m.name}</p>
                        <p className="text-xs text-muted">{m.finish}</p>
                      </div>
                      <Badge tone={costTone[m.cost]} size="sm">
                        {m.cost} cost
                      </Badge>
                    </div>
                    <Button size="sm" variant={applied ? "secondary" : "outline"} className="mt-2" onClick={() => toggleMaterial(m.id)}>
                      {applied ? "Applied" : "Apply"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </Card>
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader title="Applied Materials" subtitle="Order sets facade (1st) and slat bay (wood) colours." />
              {selectedMaterials.length === 0 ? (
                <p className="text-sm text-muted">No materials applied. Choose from the library.</p>
              ) : (
                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                  {selectedMaterials.map((id, i) => {
                    const m = materials.find((x) => x.id === id);
                    if (!m) return null;
                    return (
                      <li key={id} className="flex items-center gap-3 border border-line p-2 rounded-sm">
                        <MaterialSwatch material={m} className="h-8 w-12 shrink-0 border border-line" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-ink">{m.name}</span>
                          <span className="text-xs text-muted">{i === 0 ? "Primary facade" : "Secondary"}</span>
                        </span>
                        <button
                          type="button"
                          aria-label={`Remove ${m.name}`}
                          onClick={() => toggleMaterial(id)}
                          className="inline-flex h-7 w-7 items-center justify-center text-muted rounded-xs hover:bg-danger-bg hover:text-danger"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
            <Card>
              <CardHeader title="Preview" />
              <div className="border border-line">
                <Elevation {...elevationProps} compact />
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {tab === "3d" ? (
        <Card>
          <CardHeader
            title="3D Views"
            subtitle="Isometric preview generated from layout geometry — not a photorealistic render."
            action={
              <div className="flex items-center gap-2">
                <Toggle checked={showCirc} onChange={setShowCirc} label="Circulation layer" />
                <Button size="sm" variant="outline" leftIcon={<RotateCw className="h-3.5 w-3.5" />} onClick={() => setTurn((t) => (t + 1) % 4)}>
                  Rotate 90°
                </Button>
              </div>
            }
          />
          <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="View angle">
            {["North-west", "North-east", "South-east", "South-west"].map((label, i) => (
              <button
                key={label}
                type="button"
                aria-pressed={turn === i}
                onClick={() => setTurn(i)}
                className={cn("h-7 border px-2.5 text-xs font-medium rounded-xs", turn === i ? "border-primary bg-primary text-white" : "border-line bg-surface text-muted hover:bg-highlight hover:text-ink")}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="blueprint-grid border border-line p-4 rounded-sm">
            <Isometric rooms={layoutARooms} plot={communityCentrePlot} turn={turn} showCirculation={showCirc} className="mx-auto max-h-[460px]" />
          </div>
          <p className="mt-2 text-xs text-muted">Walls extruded to 3 m; circulation drawn as a 0.3 m slab. Source: Community Centre · Layout A.</p>
        </Card>
      ) : null}

      {tab === "render" ? (
        <RenderStudio queue={queue} setQueue={setQueue} startRender={startRender} elevation={elevationProps} />
      ) : null}

      {tab === "lighting" ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {lightingSetups.map((l) => {
              const active = l.id === lightingId;
              return (
                <div key={l.id} className={cn("border bg-surface p-3 rounded-md", active ? "border-primary" : "border-line")}>
                  <div className="flex items-start justify-between gap-2">
                    <button type="button" onClick={() => setLightingId(l.id)} aria-pressed={active} className="text-left">
                      <p className="text-sm font-semibold text-ink">
                        {l.name}
                        {l.recommended ? <span className="ml-2 text-[11px] font-medium text-primary">Recommended</span> : null}
                      </p>
                      <p className="text-xs text-muted">{l.description}</p>
                    </button>
                    <span className="h-8 w-8 shrink-0 border border-line" style={{ background: l.sky }} aria-hidden />
                  </div>
                  <Toggle className="mt-3" checked={defaultLighting === l.id} onChange={(v) => setDefaultLighting(v ? l.id : "")} label="Use as default" />
                </div>
              );
            })}
          </div>
          <Card>
            <CardHeader title="Sun Study" subtitle="Drag the azimuth slider to move the shadow." />
            <div className="border border-line">
              <Elevation {...elevationProps} />
            </div>
            <label className="mt-3 block text-xs font-semibold text-ink" htmlFor="sun-angle">
              Sun azimuth: {sunAngle}°
            </label>
            <input id="sun-angle" type="range" min={0} max={180} value={sunAngle} onChange={(e) => setSunAngle(Number(e.target.value))} className="mt-1 w-full accent-primary" />
          </Card>
        </div>
      ) : null}

      {tab === "facade" ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader title="Facade Composer" subtitle="Parametric elevation driven by the controls on the right." />
            <div className="border border-line">
              <Elevation {...elevationProps} />
            </div>
          </Card>
          <Card>
            <CardHeader title="Parameters" />
            <div className="flex flex-col gap-4">
              <RangeField id="glazing" label={`Glazing: ${glazing}%`} min={10} max={100} value={glazing} onChange={setGlazing} />
              <RangeField id="slats" label={`Slat spacing: ${slatSpacing} px`} min={4} max={24} value={slatSpacing} onChange={setSlatSpacing} />
              <RangeField id="canopy" label={`Canopy depth: ${canopyDepth} px`} min={0} max={80} value={canopyDepth} onChange={setCanopyDepth} />
              <div>
                <p className="mb-1.5 text-xs font-semibold text-ink">Presets</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "Open & Green", g: 70, s: 8, c: 60 },
                    { label: "Compact", g: 35, s: 14, c: 20 },
                    { label: "Civic", g: 55, s: 10, c: 40 },
                  ].map((p) => (
                    <Button
                      key={p.label}
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setGlazing(p.g);
                        setSlatSpacing(p.s);
                        setCanopyDepth(p.c);
                      }}
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      <Modal open={fullscreen} onClose={() => setFullscreen(false)} title="Design Preview" size="xl">
        <div className="border border-line">
          <Elevation {...elevationProps} />
        </div>
      </Modal>

      <NewDesignModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreate={(v) => {
          setVariations((list) => [...list, v]);
          selectVariation(v);
          toast({ kind: "success", title: "Design created", description: `${v.name} added to the design board.` });
        }}
      />
    </div>
  );
}

function RangeField({ id, label, min, max, value, onChange }: { id: string; label: string; min: number; max: number; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-ink">
        {label}
      </label>
      <input id={id} type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 w-full accent-primary" />
    </div>
  );
}

function RenderStudio({
  queue,
  setQueue,
  startRender,
  elevation,
}: {
  queue: RenderJob[];
  setQueue: React.Dispatch<React.SetStateAction<RenderJob[]>>;
  startRender: (id: string) => void;
  elevation: React.ComponentProps<typeof Elevation>;
}) {
  const [resolution, setResolution] = useState("1920×1080");
  const [lightingId, setLightingId] = useState("evening");
  const statusTone: Record<RenderJob["status"], BadgeTone> = { queued: "neutral", rendering: "info", done: "success" };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <Card>
        <CardHeader title="Render Queue" subtitle="Simulated queue — real rendering is not part of this frontend build." />
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Lighting</Th>
              <Th>Resolution</Th>
              <Th>Status</Th>
              <Th align="right">Action</Th>
            </tr>
          </thead>
          <tbody>
            {queue.map((j) => (
              <Tr key={j.id}>
                <Td>{j.name}</Td>
                <Td>{j.lighting}</Td>
                <Td>{j.resolution}</Td>
                <Td>
                  <span className="flex items-center gap-2">
                    <Badge tone={statusTone[j.status]} size="sm">
                      {j.status}
                    </Badge>
                    {j.status === "rendering" ? <span className="text-xs text-muted">{j.progress}%</span> : null}
                  </span>
                </Td>
                <Td align="right">
                  {j.status === "queued" ? (
                    <Button size="sm" variant="outline" onClick={() => startRender(j.id)}>
                      Start
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => setQueue((q) => q.filter((x) => x.id !== j.id))}>
                      Remove
                    </Button>
                  )}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader title="Queue Render" />
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const l = lightingSetups.find((x) => x.id === lightingId)?.name ?? "Day";
              setQueue((q) => [...q, { id: uid("render"), name: `Variation — ${l}`, lighting: l, resolution, status: "queued", progress: 0 }]);
            }}
          >
            <Select label="Resolution" value={resolution} onChange={(e) => setResolution(e.target.value)} options={["1280×720", "1920×1080", "3840×2160"].map((v) => ({ value: v, label: v }))} />
            <Select label="Lighting" value={lightingId} onChange={(e) => setLightingId(e.target.value)} options={lightingSetups.map((l) => ({ value: l.id, label: l.name }))} />
            <Button type="submit" leftIcon={<Camera className="h-4 w-4" />}>
              Queue render
            </Button>
          </form>
        </Card>
        <Card>
          <CardHeader title="Current Scene" />
          <div className="border border-line">
            <Elevation {...elevation} compact />
          </div>
        </Card>
      </div>
    </div>
  );
}

function NewDesignModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (v: DesignVariation) => void }) {
  if (!open) return null;
  return <NewDesignForm onClose={onClose} onCreate={onCreate} />;
}

function NewDesignForm({ onClose, onCreate }: { onClose: () => void; onCreate: (v: DesignVariation) => void }) {
  const [name, setName] = useState("");
  const [layoutId, setLayoutId] = useState(layouts[0].id);
  const [preset, setPreset] = useState(designVariations[0].id);
  const [touched, setTouched] = useState(false);
  const error = touched ? validateRequired(name, "Design name") : null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (validateRequired(name, "Design name")) return;
    const base = designVariations.find((v) => v.id === preset) ?? designVariations[0];
    const layoutName = layouts.find((l) => l.id === layoutId)?.name ?? "Layout";
    onCreate({ id: uid("var"), name: name.trim(), subtitle: `${base.subtitle} · ${layoutName}`, materialIds: base.materialIds, glazing: base.glazing });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="New design"
      description="Create a variation from a base layout and a preset."
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="new-design-form" leftIcon={<Building2 className="h-4 w-4" />}>
            Create design
          </Button>
        </>
      }
    >
      <form id="new-design-form" className="flex flex-col gap-4" onSubmit={submit} noValidate>
        <Input label="Design name" placeholder="Variation D" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)} error={error} data-autofocus required />
        <Select label="Base layout" value={layoutId} onChange={(e) => setLayoutId(e.target.value)} options={layouts.map((l) => ({ value: l.id, label: `${l.name} — ${l.metrics.areaEfficiency}% efficiency` }))} />
        <Select label="Variation preset" value={preset} onChange={(e) => setPreset(e.target.value)} options={designVariations.map((v) => ({ value: v.id, label: `${v.name} (${v.subtitle})` }))} />
      </form>
    </Modal>
  );
}

