"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Upload, Play, Zap, MousePointer2, Hand, Maximize2, CheckCircle2, AlertTriangle, Minus, Plus, Layers, Route, Grid2X2, FileJson } from "lucide-react";
import { PageHeader } from "@/components/layout/AppShell";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Tabs } from "@/components/ui/Tabs";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Misc";
import { Table, Th, Td, Tr } from "@/components/ui/Table";
import { DonutChart } from "@/components/charts";
import { FloorPlan, ZoneLegend, zoneLabel } from "@/components/floorplan/FloorPlan";
import { useToast } from "@/components/providers/ToastProvider";
import { layouts, layoutARooms, communityCentreAdjacency, communityCentrePlot } from "@/lib/mock";
import { checkConstraints, totalRoomArea, usableArea, areaEfficiency, roomArea } from "@/lib/geometry";
import { validatePositiveNumber } from "@/lib/validation";
import { DEFAULT_SPACE_SIZES, evaluate, feasibility, generateLayoutsAsync, walkingPaths, type SpaceRequest } from "@/lib/engine";
import type { Room, Plot, Layout } from "@/lib/types";
import { cn, formatArea } from "@/lib/utils";

type PlanTab = "layout" | "zoning" | "circulation";
type Tool = "select" | "pan";

const requiredSpaceDefaults: { key: SpaceRequest["type"]; label: string; count: number; checked: boolean }[] = [
  { key: "classroom", label: "Classrooms", count: 4, checked: true },
  { key: "reception", label: "Reception", count: 1, checked: true },
  { key: "office", label: "Office", count: 2, checked: true },
  { key: "toilets", label: "Toilets", count: 2, checked: true },
  { key: "storage", label: "Storage", count: 1, checked: true },
];

interface CandidateSet {
  plot: Plot;
  layouts: Layout[];
  generated: boolean;
}

const roomNameById: Record<string, string> = {
  rc: "Reception",
  entrance: "Entrance",
  c1: "Classroom 1",
  c2: "Classroom 2",
  c3: "Classroom 3",
  t1: "Toilets",
  h1: "Corridor",
  o1: "Office 1",
  o2: "Office 2",
  st: "Storage",
};

/** Deliberately invalid variant of Layout A used to demonstrate error states. */
const invalidExampleRooms: Room[] = layoutARooms.map((r) => {
  if (r.id === "c2") return { ...r, x: 8 }; // overlaps Classroom 1
  if (r.id === "o2") return { ...r, y: 17 }; // extends beyond the plot
  if (r.id === "st") return { ...r, width: 2 }; // below minimum width
  return r;
});

interface ImportedPlan {
  rooms: Room[];
  plot?: Plot;
}

function parseImportedPlan(text: string): ImportedPlan {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("The file is not valid JSON.");
  }
  if (!data || typeof data !== "object" || !Array.isArray((data as { rooms?: unknown }).rooms)) {
    throw new Error('Expected an object with a "rooms" array.');
  }
  const raw = (data as { rooms: unknown[]; plot?: unknown }).rooms;
  const rooms: Room[] = raw.map((r, i) => {
    const o = r as Record<string, unknown>;
    const nums = ["x", "y", "width", "height"] as const;
    for (const k of nums) {
      if (typeof o[k] !== "number" || !Number.isFinite(o[k] as number)) {
        throw new Error(`rooms[${i}].${k} must be a number.`);
      }
    }
    const type = typeof o.type === "string" && o.type in zoneLabel ? (o.type as Room["type"]) : "open";
    return {
      id: typeof o.id === "string" ? o.id : `room-${i}`,
      name: typeof o.name === "string" ? o.name : zoneLabel[type],
      type,
      x: o.x as number,
      y: o.y as number,
      width: o.width as number,
      height: o.height as number,
      requiredArea: typeof o.requiredArea === "number" ? o.requiredArea : undefined,
      minWidth: typeof o.minWidth === "number" ? o.minWidth : undefined,
      minHeight: typeof o.minHeight === "number" ? o.minHeight : undefined,
    };
  });
  const p = (data as { plot?: { width?: unknown; height?: unknown } }).plot;
  const plot = p && typeof p.width === "number" && typeof p.height === "number" ? { width: p.width, height: p.height } : undefined;
  return { rooms, plot };
}

export function SpacePlannerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [plot, setPlot] = useState<Plot>(communityCentrePlot);
  const [plotInput, setPlotInput] = useState({ w: String(communityCentrePlot.width), h: String(communityCentrePlot.height) });
  const [plotTouched, setPlotTouched] = useState(false);
  const [spaces, setSpaces] = useState(requiredSpaceDefaults);
  const [weights, setWeights] = useState(() => Object.fromEntries(communityCentreAdjacency.map((e, i) => [i, e.weight])) as Record<number, number>);
  const [layoutIndex, setLayoutIndex] = useState(0);
  const [candidateSet, setCandidateSet] = useState<CandidateSet>({ plot: communityCentrePlot, layouts: layouts.slice(0, 3), generated: false });
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>(layouts[0].rooms);
  const [generating, setGenerating] = useState(false);
  const [tab, setTab] = useState<PlanTab>("layout");
  const [tool, setTool] = useState<Tool>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importName, setImportName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const plotErrors = {
    w: validatePositiveNumber(plotInput.w, "Width", 500),
    h: validatePositiveNumber(plotInput.h, "Height", 500),
  };

  const violations = useMemo(() => checkConstraints(rooms, plot), [rooms, plot]);
  const invalidIds = useMemo(() => Array.from(new Set(violations.flatMap((v) => v.roomIds))), [violations]);
  const builtUp = totalRoomArea(rooms);
  const usable = usableArea(rooms);
  const efficiency = areaEfficiency(rooms);
  const classrooms = rooms.filter((r) => r.type === "classroom").length;
  const selectedRoom = rooms.find((r) => r.id === selectedId) ?? null;

  const distribution = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rooms) {
      const key = r.type === "corridor" || r.type === "open" ? "circulation" : r.type;
      map.set(key, (map.get(key) ?? 0) + roomArea(r));
    }
    return Array.from(map.entries()).map(([key, value]) => ({ key, label: zoneLabel[key as Room["type"]] ?? key, value }));
  }, [rooms]);

  // Shortest walking routes from the entrance (Dijkstra on the circulation graph).
  const circulation = useMemo(() => walkingPaths(rooms, plot).filter((c) => c.room.type !== "reception"), [rooms, plot]);
  const evaluation = useMemo(() => evaluate(rooms, plot, communityCentreAdjacency), [rooms, plot]);
  const [pathTarget, setPathTarget] = useState<string | null>(null);
  const activePath = circulation.find((c) => c.room.id === pathTarget) ?? circulation[0];

  const applyPlot = () => {
    setPlotTouched(true);
    if (plotErrors.w || plotErrors.h) return;
    setPlot({ width: Number(plotInput.w), height: Number(plotInput.h) });
  };

  const request = useMemo<SpaceRequest[]>(
    () => spaces.filter((x) => x.checked).map((x) => ({ type: x.key, count: x.count, ...DEFAULT_SPACE_SIZES[x.key] })),
    [spaces],
  );
  const requiredTotal = request.reduce((sum, x) => sum + x.area * x.count, 0);

  const generate = async () => {
    setPlotTouched(true);
    if (plotErrors.w || plotErrors.h) return;
    const target: Plot = { width: Number(plotInput.w), height: Number(plotInput.h) };
    const check = feasibility(target, request);
    if (!check.ok) {
      setGenerateError(check.message ?? "These spaces do not fit on the site.");
      toast({ kind: "error", title: "Cannot generate a layout", description: check.message });
      return;
    }
    setGenerateError(null);
    setGenerating(true);
    try {
      const edges = communityCentreAdjacency.map((e, i) => ({ ...e, weight: weights[i] }));
      const res = await generateLayoutsAsync({ plot: target, spaces: request, adjacency: edges, mode: "annealing", iterations: 1800, seed: Date.now() % 997, projectId: "planner" });
      if (res.error || res.layouts.length === 0) {
        setGenerateError(res.error ?? "No feasible layout was found.");
        toast({ kind: "error", title: "No layout found", description: res.error });
        return;
      }
      setCandidateSet({ plot: target, layouts: res.layouts, generated: true });
      setPlot(target);
      setLayoutIndex(0);
      setRooms(res.layouts[0].rooms);
      setImportName(null);
      setSelectedId(null);
      toast({ kind: "success", title: "Layouts generated", description: `${res.layouts.length} candidates ranked by cost. ${res.layouts[0].name} is recommended.` });
    } finally {
      setGenerating(false);
    }
  };

  const selectLayout = (i: number) => {
    const l = candidateSet.layouts[i] ?? candidateSet.layouts[0];
    setLayoutIndex(i);
    setRooms(l.rooms);
    setPlot(candidateSet.plot);
    setPlotInput({ w: String(candidateSet.plot.width), h: String(candidateSet.plot.height) });
    setSelectedId(null);
  };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseImportedPlan(String(reader.result ?? ""));
        setRooms(parsed.rooms);
        if (parsed.plot) {
          setPlot(parsed.plot);
          setPlotInput({ w: String(parsed.plot.width), h: String(parsed.plot.height) });
        }
        setImportError(null);
        setImportName(file.name);
        setImportOpen(false);
        setSelectedId(null);
        toast({ kind: "success", title: "Plan imported", description: `${parsed.rooms.length} rooms loaded from ${file.name}.` });
      } catch (err) {
        setImportError(err instanceof Error ? err.message : "Could not read the file.");
      }
    };
    reader.onerror = () => setImportError("Could not read the file.");
    reader.readAsText(file);
  };

  const planToolbar = (
    <div className="flex border border-line rounded-sm" role="group" aria-label="Canvas tools">
      <button
        type="button"
        aria-label="Select tool"
        aria-pressed={tool === "select"}
        onClick={() => setTool("select")}
        className={cn("inline-flex h-8 w-9 items-center justify-center", tool === "select" ? "bg-highlight text-primary" : "text-muted hover:text-ink")}
      >
        <MousePointer2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Pan tool"
        aria-pressed={tool === "pan"}
        onClick={() => setTool("pan")}
        className={cn("inline-flex h-8 w-9 items-center justify-center border-l border-line", tool === "pan" ? "bg-highlight text-primary" : "text-muted hover:text-ink")}
      >
        <Hand className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Open plan in fullscreen"
        onClick={() => setFullscreen(true)}
        className="inline-flex h-8 w-9 items-center justify-center border-l border-line text-muted hover:text-ink"
      >
        <Maximize2 className="h-4 w-4" />
      </button>
    </div>
  );

  const plan = (large = false) => (
    <div className={cn("relative border border-line bg-bg p-3 rounded-sm", tool === "pan" && "cursor-grab")}>
      {generating ? (
        <div className="absolute inset-3 z-10 flex flex-col gap-2 bg-surface/80 p-3" aria-live="polite" aria-busy>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="flex-1" />
          <p className="text-center text-xs text-muted">Generating candidate layout…</p>
        </div>
      ) : null}
      <FloorPlan
        plot={plot}
        rooms={rooms}
        showLabels={tab !== "zoning"}
        showDimensions
        selectedId={selectedId}
        onSelect={tab === "layout" ? setSelectedId : undefined}
        invalidIds={invalidIds}
        path={tab === "circulation" ? activePath?.path : undefined}
        className={cn("mx-auto", large ? "max-h-[70vh]" : "max-h-[460px]")}
        ariaLabel="Community Centre floor plan"
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Space Planner"
        description="Create, edit and optimize architectural layouts with smart tools."
        actions={
          <>
            <Button variant="outline" leftIcon={<Upload className="h-4 w-4" />} onClick={() => setImportOpen(true)}>
              Import Plan
            </Button>
            <Button leftIcon={<Play className="h-4 w-4" />} onClick={() => router.push("/optimization")}>
              Run Optimization
            </Button>
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[250px_minmax(0,1fr)_330px]">
        {/* Planning settings */}
        <Card className="flex flex-col gap-4 xl:order-1">
          <CardHeader title="Planning Settings" className="mb-0" />
          <fieldset className="flex flex-col gap-2">
            <legend className="text-xs font-semibold text-ink">Site Size (m)</legend>
            <div className="flex items-start gap-2">
              <Input
                aria-label="Site width in metres"
                type="number"
                min={1}
                max={500}
                value={plotInput.w}
                onChange={(e) => setPlotInput((p) => ({ ...p, w: e.target.value }))}
                onBlur={applyPlot}
                error={plotTouched ? plotErrors.w : null}
                className="flex-1"
              />
              <span className="pt-2 text-sm text-muted">×</span>
              <Input
                aria-label="Site height in metres"
                type="number"
                min={1}
                max={500}
                value={plotInput.h}
                onChange={(e) => setPlotInput((p) => ({ ...p, h: e.target.value }))}
                onBlur={applyPlot}
                error={plotTouched ? plotErrors.h : null}
                className="flex-1"
              />
            </div>
          </fieldset>
          <Input label="Built-up Area" value={String(builtUp)} readOnly suffix="m²" hint="Auto-computed from the current rooms." />

          <div>
            <p className="mb-2 text-xs font-semibold text-ink">Required Spaces</p>
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {spaces.map((s, i) => (
                <li key={s.key} className="flex items-center justify-between gap-2">
                  <Checkbox
                    checked={s.checked}
                    onChange={(v) => setSpaces((list) => list.map((x, j) => (j === i ? { ...x, checked: v } : x)))}
                    label={`${s.label} (${s.count})`}
                  />
                  <span className="inline-flex border border-line rounded-xs" role="group" aria-label={`${s.label} count`}>
                    <button
                      type="button"
                      aria-label={`Decrease ${s.label}`}
                      disabled={s.count <= 1}
                      onClick={() => setSpaces((list) => list.map((x, j) => (j === i ? { ...x, count: Math.max(1, x.count - 1) } : x)))}
                      className="inline-flex h-6 w-6 items-center justify-center text-muted hover:bg-highlight hover:text-ink disabled:opacity-40"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Increase ${s.label}`}
                      disabled={s.count >= 12}
                      onClick={() => setSpaces((list) => list.map((x, j) => (j === i ? { ...x, count: Math.min(12, x.count + 1) } : x)))}
                      className="inline-flex h-6 w-6 items-center justify-center border-l border-line text-muted hover:bg-highlight hover:text-ink disabled:opacity-40"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-ink">Adjacency Preferences</p>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {communityCentreAdjacency.map((e, i) => (
                <li key={`${e.from}-${e.to}`} className="border border-line bg-bg px-2 py-1.5 rounded-xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink">
                      {roomNameById[e.from] ?? e.from} <span className="text-muted">↔</span> {roomNameById[e.to] ?? e.to}
                    </span>
                    <span className="font-semibold text-primary">w={weights[i]}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={weights[i]}
                    aria-label={`Weight for ${roomNameById[e.from] ?? e.from} to ${roomNameById[e.to] ?? e.to}`}
                    onChange={(ev) => setWeights((w) => ({ ...w, [i]: Number(ev.target.value) }))}
                    className="mt-1 h-1 w-full cursor-pointer accent-primary"
                  />
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between border border-line bg-bg px-2 py-1.5 text-xs rounded-xs">
            <span className="text-muted">Required area</span>
            <span className="font-semibold text-ink">{formatArea(requiredTotal)}</span>
          </div>
          <Button className="w-full" leftIcon={<Zap className="h-4 w-4" />} onClick={generate} loading={generating}>
            Generate Layouts
          </Button>
          {generateError ? (
            <p role="alert" className="flex items-start gap-2 border border-danger/40 bg-danger-bg px-2 py-1.5 text-[11px] leading-4 text-danger rounded-xs">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {generateError}
            </p>
          ) : (
            <p className="text-[11px] leading-4 text-muted">
              Generates four ranked candidates for the site size, selected spaces and adjacency weights above.
            </p>
          )}
        </Card>

        {/* Canvas */}
        <div className="flex min-w-0 flex-col gap-4 xl:order-2">
          <Card>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <Tabs
                ariaLabel="Plan view"
                value={tab}
                onChange={setTab}
                items={[
                  { value: "layout", label: "Layout", icon: <Grid2X2 className="h-4 w-4" /> },
                  { value: "zoning", label: "Zoning", icon: <Layers className="h-4 w-4" /> },
                  { value: "circulation", label: "Circulation", icon: <Route className="h-4 w-4" /> },
                ]}
              />
              <div className="flex items-center gap-2">
                {importName ? <Badge tone="info" size="sm">Imported: {importName}</Badge> : <Badge tone="neutral" size="sm">{candidateSet.layouts[layoutIndex]?.name}</Badge>}
                {planToolbar}
              </div>
            </div>
            {plan()}

            {tab === "layout" && selectedRoom ? (
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 border border-line bg-bg px-3 py-2 text-xs rounded-sm">
                <span className="font-semibold text-ink">{selectedRoom.name}</span>
                <span className="text-muted">Type: <span className="text-ink">{zoneLabel[selectedRoom.type]}</span></span>
                <span className="text-muted">Area: <span className="text-ink">{formatArea(roomArea(selectedRoom))}</span></span>
                <span className="text-muted">Size: <span className="text-ink">{selectedRoom.width} m × {selectedRoom.height} m</span></span>
                <span className="text-muted">Position: <span className="text-ink">({selectedRoom.x}, {selectedRoom.y})</span></span>
                <Link href="/workspace" className="ml-auto font-medium text-primary hover:underline">Edit in Workspace →</Link>
              </div>
            ) : null}

            {tab === "zoning" ? (
              <div className="mt-3 flex flex-col gap-3">
                <ZoneLegend />
                <Table>
                  <thead>
                    <tr>
                      <Th>Zone</Th>
                      <Th align="right">Rooms</Th>
                      <Th align="right">Area</Th>
                      <Th align="right">Share</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {distribution.map((d) => (
                      <Tr key={d.key}>
                        <Td>{d.label}</Td>
                        <Td align="right">{rooms.filter((r) => (r.type === "corridor" || r.type === "open" ? "circulation" : r.type) === d.key).length}</Td>
                        <Td align="right">{formatArea(d.value)}</Td>
                        <Td align="right">{builtUp ? Math.round((d.value / builtUp) * 100) : 0}%</Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : null}

            {tab === "circulation" ? (
              <div className="mt-3 flex flex-col gap-2">
                <p className="text-xs text-muted">
                  Shortest walking distance from the entrance to each space, found with Dijkstra on the circulation graph (entrance, corridor junctions and room doors). Select a space to draw its route.
                </p>
                <ul className="m-0 grid list-none gap-1.5 p-0 sm:grid-cols-2">
                  {circulation.map((c) => (
                    <li key={c.room.id}>
                      <button
                        type="button"
                        aria-pressed={activePath?.room.id === c.room.id}
                        onClick={() => setPathTarget(c.room.id)}
                        className={cn(
                          "flex w-full items-center justify-between border px-2.5 py-1.5 text-xs rounded-xs",
                          activePath?.room.id === c.room.id ? "border-primary bg-highlight text-ink" : "border-line bg-surface text-ink hover:bg-highlight",
                        )}
                      >
                        <span>{c.room.name} <span className="text-muted">({roomArea(c.room)} m²)</span></span>
                        <span className="font-semibold text-primary">{c.distance} m</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Card>

          {/* Constraint check */}
          <Card>
            <CardHeader
              title="Constraint Check"
              subtitle="Live checks: overlaps, plot boundary, minimum dimensions and required area."
              action={
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setRooms(invalidExampleRooms); setSelectedId(null); }}>
                    Try an invalid example
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => selectLayout(layoutIndex)}>
                    Reset
                  </Button>
                </div>
              }
            />
            {violations.length === 0 ? (
              <div role="status" className="flex items-center gap-2 border border-success/40 bg-success-bg px-3 py-2 text-sm text-success rounded-sm">
                <CheckCircle2 className="h-4 w-4" /> All constraints satisfied — {rooms.length} rooms inside a {plot.width} m × {plot.height} m plot.
              </div>
            ) : (
              <ul role="alert" className="m-0 flex list-none flex-col gap-1.5 p-0">
                {violations.map((v, i) => (
                  <li key={i} className="flex items-start gap-2 border border-danger/40 bg-danger-bg px-3 py-2 text-sm text-danger rounded-sm">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      <span className="mr-2 font-mono text-[11px] uppercase">{v.code}</span>
                      {v.message}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Right column */}
        <div className="flex min-w-0 flex-col gap-5 xl:order-3">
          <Card>
            <CardHeader title="Space Distribution" />
            <DonutChart data={distribution} centerLabel={`${usable} m²`} centerSub="Usable Area" size={140} ariaLabel="Space distribution of the current plan" />
          </Card>
          <Card>
            <CardHeader title="Key Metrics" />
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: `${efficiency}%`, label: "Area Efficiency" },
                { value: evaluation.metrics.circulationRatio.toFixed(2), label: "Circulation Ratio" },
                { value: classrooms, label: "No. of Classrooms" },
              ].map((m) => (
                <div key={m.label} className="flex flex-col items-center border border-line bg-bg px-1 py-3 text-center rounded-sm">
                  <span className="text-lg font-bold text-ink">{m.value}</span>
                  <span className="text-[11px] leading-3 text-muted">{m.label}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-4 text-muted">
              Circulation ratio is the average walking distance divided by the straight-line distance from the entrance. Closer to 1.0 is better.
            </p>
          </Card>
          <Card>
            <CardHeader title="Layout Comparison" subtitle={candidateSet.generated ? "Generated for your inputs" : "Sample layouts · press Generate for your own"} />
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {candidateSet.layouts.map((l, i) => (
                <li key={l.id}>
                  <button
                    type="button"
                    aria-pressed={layoutIndex === i && !importName}
                    onClick={() => { setImportName(null); selectLayout(i); }}
                    className={cn(
                      "flex w-full items-center gap-3 border p-2 text-left rounded-sm",
                      layoutIndex === i && !importName ? "border-primary bg-highlight/50" : "border-line bg-surface hover:border-line-strong",
                    )}
                  >
                    <div className="w-[84px] shrink-0 border border-line bg-bg p-1">
                      <FloorPlan plot={candidateSet.plot} rooms={l.rooms} thumbnail />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">
                        {l.name} {candidateSet.generated && i === 0 ? <span className="font-normal text-success">Recommended</span> : null}
                      </p>
                      <p className="text-xs text-muted">
                        <span className="font-semibold text-ink">{l.metrics.areaEfficiency}%</span> Efficiency · {l.metrics.adjacencySatisfaction}% Adjacency
                      </p>
                    </div>
                    {layoutIndex === i && !importName ? <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" /> : null}
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {/* Fullscreen plan */}
      <Modal open={fullscreen} onClose={() => setFullscreen(false)} title={`${importName ?? candidateSet.layouts[layoutIndex]?.name} — ${plot.width} m × ${plot.height} m`} size="xl">
        {plan(true)}
        <ZoneLegend className="mt-3" />
      </Modal>

      {/* Import */}
      <Modal
        open={importOpen}
        onClose={() => { setImportOpen(false); setImportError(null); }}
        title="Import Plan"
        description="Load a JSON plan exported from ArchOpt or written by hand. Files are parsed in the browser; nothing is uploaded."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => { setRooms(layoutARooms); setPlot(communityCentrePlot); setPlotInput({ w: "30", h: "20" }); setImportName(null); setImportOpen(false); toast({ kind: "info", title: "Sample plan loaded" }); }}>
              Load sample
            </Button>
            <Button leftIcon={<Upload className="h-4 w-4" />} onClick={() => fileRef.current?.click()}>
              Choose file
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <label
            htmlFor="plan-file"
            className="flex cursor-pointer flex-col items-center justify-center border border-dashed border-line-strong bg-bg px-4 py-8 text-center rounded-sm hover:bg-highlight/50"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}
          >
            <FileJson className="mb-2 h-6 w-6 text-muted" aria-hidden />
            <span className="text-sm font-medium text-ink">Drop a .json file here or click to browse</span>
            <span className="mt-1 text-xs text-muted">Expected shape: {"{ plot?: { width, height }, rooms: [{ id, name, type, x, y, width, height }] }"}</span>
            <input id="plan-file" ref={fileRef} type="file" accept=".json,application/json" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
          {importError ? (
            <p role="alert" className="flex items-start gap-2 border border-danger/40 bg-danger-bg px-3 py-2 text-sm text-danger rounded-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {importError}
            </p>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
