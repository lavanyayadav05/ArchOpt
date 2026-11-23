"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Square, ArrowRight, Layers, Footprints, LayoutGrid, Clock, Target, TrendingUp, Check, Loader2, Download, History, Cpu, Save, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/AppShell";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Checkbox, RadioGroup } from "@/components/ui/Checkbox";
import { SelectMenu } from "@/components/ui/Dropdown";
import { Badge, Delta } from "@/components/ui/Badge";
import { ProgressBar, EmptyState } from "@/components/ui/Misc";
import { DonutChart } from "@/components/charts";
import { FloorPlan, zoneLabel } from "@/components/floorplan/FloorPlan";
import { useProjects } from "@/components/providers/ProjectsProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useAuthDialog } from "@/components/providers/AuthDialogProvider";
import { api, ApiError } from "@/lib/api";
import { costWeights } from "@/lib/mock";
import { baselineLayout, defaultAdjacency, generateLayoutsAsync, suggestProgram, type EngineWeights, type GenerateResult, type SearchMode, type SpaceRequest } from "@/lib/engine";
import { downloadJson } from "@/lib/download";
import { roomArea } from "@/lib/geometry";
import type { Layout, Plot, Room } from "@/lib/types";
import { cn } from "@/lib/utils";

type Effort = "quick" | "standard" | "thorough";

const stages = ["Requirements", "Graph model", "Candidate generation", "Constraint checking", "Optimization", "Evaluation"];
const effortIterations: Record<Effort, number> = { quick: 1200, standard: 2500, thorough: 5000 };
const adjustableWeights = costWeights.filter((w) => w.key !== "overlap");

interface RunResult {
  id: string;
  projectId: string;
  projectName: string;
  plot: Plot;
  program: SpaceRequest[];
  mode: SearchMode;
  layouts: Layout[];
  baseline: { rooms: Room[]; metrics: Layout["metrics"]; cost: number };
  elapsedMs: number;
  evaluated: number;
  ranAt: string;
}

const seconds = (minutes: number) => Math.max(1, Math.round(minutes * 60));

export function OptimizationPage() {
  const { projects } = useProjects();
  const { toast } = useToast();
  const { user } = useAuth();
  const { openSignIn } = useAuthDialog();
  const [saved, setSaved] = useState<Layout[]>([]);
  const [saving, setSaving] = useState(false);
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [goals, setGoals] = useState({ utilization: true, circulation: true, walking: false });
  const [weights, setWeights] = useState(() => Object.fromEntries(adjustableWeights.map((w) => [w.key, w.weight])) as Record<string, number>);
  const [algorithm, setAlgorithm] = useState<SearchMode>("annealing");
  const [effort, setEffort] = useState<Effort>("standard");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [history, setHistory] = useState<RunResult[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const runCount = useRef(0);

  // Abort any in-flight run if the page unmounts.
  useEffect(() => () => abortRef.current?.abort(), []);

  // Load layouts saved to the selected project (signed-in users only).
  useEffect(() => {
    if (!user || !projectId) return;
    let cancelled = false;
    api<{ layouts: Layout[] }>(`/api/projects/${projectId}/layouts`)
      .then((r) => !cancelled && setSaved(r.layouts))
      .catch(() => !cancelled && setSaved([]));
    return () => {
      cancelled = true;
    };
  }, [user, projectId]);

  const savedLayouts = user ? saved : [];
  const project = projects.find((p) => p.id === projectId);
  const projectName = project?.name ?? "Project";
  const result = history.find((h) => h.id === activeRunId) ?? null;
  const best = result?.layouts[candidateIndex] ?? null;

  const effectiveWeights = useMemo<Partial<EngineWeights>>(() => {
    const w = { ...weights } as Record<string, number>;
    if (goals.utilization) {
      w.unused = (w.unused ?? 1) * 2;
      w.corridor = (w.corridor ?? 2) * 1.5;
    }
    if (goals.circulation) w.circulation = (w.circulation ?? 3) * 1.5;
    if (goals.walking) w.circulation = (w.circulation ?? 3) * 2;
    return w;
  }, [weights, goals]);

  const stageIndex = Math.min(stages.length - 1, Math.floor((progress / 100) * stages.length));

  const run = async () => {
    if (running || !project) return;
    setRunning(true);
    setError(null);
    setProgress(0);
    const controller = new AbortController();
    abortRef.current = controller;
    const program = suggestProgram(project.plot);
    const adjacency = defaultAdjacency(program);
    runCount.current += 1;
    const seed = 3 + runCount.current * 5;
    const started = performance.now();
    // Progress is estimated while the server works: easing towards 90 % over the expected duration.
    const expectedMs = { quick: 1500, standard: 3000, thorough: 6000 }[effort];
    const tick = window.setInterval(() => setProgress((p) => Math.min(90, p + (90 - p) * (100 / expectedMs) * 0.9)), 100);
    try {
      const options = { plot: project.plot, spaces: program, adjacency, weights: effectiveWeights, mode: algorithm, iterations: effortIterations[effort], seed, projectId: project.id };
      type ServerRun = GenerateResult & { baseline: RunResult["baseline"] | null; elapsedMs: number };
      let res: GenerateResult;
      let base: RunResult["baseline"] | null = null;
      let serverMs: number | null = null;
      try {
        const r = await api<ServerRun>("/api/optimize", { method: "POST", json: { plot: project.plot, spaces: program, weights: effectiveWeights, mode: algorithm, iterations: effortIterations[effort], seed, projectId: project.id }, signal: controller.signal });
        res = r;
        base = r.baseline;
        serverMs = r.elapsedMs;
      } catch (e) {
        if (controller.signal.aborted) throw new DOMException("cancelled", "AbortError");
        if (e instanceof ApiError && e.status !== 0) {
          setError(e.message);
          toast({ kind: "error", title: "No layout generated", description: e.message });
          return;
        }
        // Server unreachable: run the same engine in the browser instead.
        res = await generateLayoutsAsync({ ...options, onProgress: setProgress }, controller.signal);
        const local = baselineLayout(options);
        base = local ? { rooms: local.rooms, metrics: local.evaluation.metrics, cost: local.evaluation.cost } : null;
      }
      if (res.error || res.layouts.length === 0) {
        setError(res.error ?? "No feasible layout was found.");
        toast({ kind: "error", title: "No layout generated", description: res.error });
        return;
      }
      setProgress(100);
      const entry: RunResult = {
        id: `run-${Date.now()}`,
        projectId: project.id,
        projectName: project.name,
        plot: project.plot,
        program,
        mode: algorithm,
        layouts: res.layouts,
        baseline: base ?? { rooms: [], metrics: res.layouts[0].metrics, cost: res.layouts[0].cost },
        elapsedMs: serverMs ?? Math.round(performance.now() - started),
        evaluated: res.evaluated,
        ranAt: new Date().toISOString(),
      };
      setHistory((h) => [entry, ...h].slice(0, 8));
      setActiveRunId(entry.id);
      setCandidateIndex(0);
      toast({ kind: "success", title: "Optimization complete", description: `${res.layouts.length} candidate layouts for ${project.name} in ${(entry.elapsedMs / 1000).toFixed(1)} s.` });
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) {
        toast({ kind: "error", title: "Optimization failed", description: e instanceof Error ? e.message : undefined });
      }
    } finally {
      window.clearInterval(tick);
      setRunning(false);
      abortRef.current = null;
    }
  };

  const saveToProject = async () => {
    if (!result) return;
    if (!user) {
      openSignIn();
      return;
    }
    setSaving(true);
    try {
      const r = await api<{ layouts: Layout[] }>(`/api/projects/${result.projectId}/layouts`, { method: "POST", json: { layouts: result.layouts } });
      setSaved(r.layouts);
      toast({ kind: "success", title: "Saved to your project", description: `${result.layouts.length} layouts stored in ${result.projectName}.` });
    } catch (e) {
      toast({ kind: "error", title: "Could not save layouts", description: e instanceof Error ? e.message : undefined });
    } finally {
      setSaving(false);
    }
  };

  const removeSaved = async (id: string) => {
    const before = saved;
    setSaved((l) => l.filter((x) => x.id !== id));
    try {
      await api(`/api/layouts/${id}`, { method: "DELETE" });
    } catch (e) {
      setSaved(before);
      toast({ kind: "error", title: "Could not delete the layout", description: e instanceof Error ? e.message : undefined });
    }
  };

  const cancel = () => {
    abortRef.current?.abort();
    toast({ kind: "info", title: "Optimization cancelled" });
  };

  const formula = adjustableWeights.map((w, i) => `w${i + 1}·${w.label.toLowerCase()}`).join(" + ");

  const distribution: { key: string; label: string; value: number }[] = [];
  if (best) {
    const map = new Map<string, number>();
    for (const r of best.rooms) {
      const key = r.type === "corridor" || r.type === "open" ? "circulation" : r.type;
      map.set(key, (map.get(key) ?? 0) + roomArea(r));
    }
    map.forEach((value, key) => distribution.push({ key, label: zoneLabel[key as Room["type"]] ?? key, value }));
  }

  const base = result?.baseline.metrics;
  const m = best?.metrics;
  const pct = (a: number, b: number) => (b === 0 ? 0 : Math.round(((a - b) / b) * 1000) / 10);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Optimization"
        description="Search for layouts that use space well, keep circulation short and satisfy adjacency preferences."
        actions={
          <>
            <SelectMenu
              ariaLabel="Select project"
              value={projectId}
              onChange={setProjectId}
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
              className="w-[220px]"
            />
            {running ? (
              <Button variant="danger" leftIcon={<Square className="h-4 w-4" />} onClick={cancel}>
                Cancel
              </Button>
            ) : (
              <Button leftIcon={<Play className="h-4 w-4" />} onClick={run}>
                Run Optimization
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[290px_minmax(0,1fr)]">
        {/* Settings */}
        <Card className="flex flex-col gap-4">
          <CardHeader title="Optimization Goals" className="mb-0" />
          <div className="flex flex-col gap-2">
            <Checkbox checked={goals.utilization} onChange={(v) => setGoals((g) => ({ ...g, utilization: v }))} label="Maximize space utilization" />
            <Checkbox checked={goals.circulation} onChange={(v) => setGoals((g) => ({ ...g, circulation: v }))} label="Improve circulation" />
            <Checkbox checked={goals.walking} onChange={(v) => setGoals((g) => ({ ...g, walking: v }))} label="Minimize walking distance" />
          </div>

          <div className="border-t border-line pt-4">
            <p className="text-xs font-semibold text-ink">Cost function</p>
            <p className="mt-1 text-[11px] leading-4 text-muted">Lower cost is better. Drag a weight to change how much each term matters.</p>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap border border-line bg-bg p-2 font-mono text-[11px] leading-4 text-ink rounded-xs">Cost = {formula}</pre>
            <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
              {adjustableWeights.map((w, i) => (
                <li key={w.key}>
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor={`weight-${w.key}`} className="text-ink">
                      <span className="font-mono text-muted">w{i + 1}</span> {w.label}
                    </label>
                    <span className="font-semibold text-primary">{weights[w.key]}</span>
                  </div>
                  <input
                    id={`weight-${w.key}`}
                    type="range"
                    min={0}
                    max={10}
                    step={1}
                    value={weights[w.key]}
                    onChange={(e) => setWeights((x) => ({ ...x, [w.key]: Number(e.target.value) }))}
                    className="mt-1 h-1 w-full cursor-pointer accent-primary"
                    title={w.description}
                  />
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-line pt-4">
            <p className="mb-2 text-xs font-semibold text-ink">Search method</p>
            <RadioGroup<SearchMode>
              name="algorithm"
              value={algorithm}
              onChange={setAlgorithm}
              options={[
                { value: "annealing", label: "Simulated annealing", description: "Accepts some worse moves early to escape local optima" },
                { value: "constraint", label: "Randomized constraint search", description: "Greedy hill-climbing from random starting layouts" },
              ]}
            />
          </div>

          <div className="border-t border-line pt-4">
            <p className="mb-2 text-xs font-semibold text-ink">Search effort</p>
            <RadioGroup<Effort>
              name="effort"
              value={effort}
              onChange={setEffort}
              options={[
                { value: "quick", label: "Quick", description: "About 1 second" },
                { value: "standard", label: "Standard", description: "About 2 seconds" },
                { value: "thorough", label: "Thorough", description: "About 4 seconds, more candidates explored" },
              ]}
            />
          </div>
        </Card>

        {/* Results */}
        <div className="flex min-w-0 flex-col gap-5">
          {running ? (
            <Card aria-live="polite" aria-busy>
              <CardHeader
                title={
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" /> Optimizing {projectName}
                  </span>
                }
                subtitle={`${algorithm === "annealing" ? "Simulated annealing" : "Randomized constraint search"} · ${project?.plot.width} m × ${project?.plot.height} m site`}
                action={
                  <Button variant="outline" size="sm" onClick={cancel} leftIcon={<Square className="h-3.5 w-3.5" />}>
                    Cancel
                  </Button>
                }
              />
              <ProgressBar value={progress} label="Optimization progress" />
              <ol className="mt-4 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-3 lg:grid-cols-6">
                {stages.map((s, i) => {
                  const state = i < stageIndex ? "done" : i === stageIndex ? "active" : "todo";
                  return (
                    <li
                      key={s}
                      aria-current={state === "active" ? "step" : undefined}
                      className={cn(
                        "flex items-center gap-2 border px-2 py-1.5 text-[11px] font-medium rounded-xs",
                        state === "done" && "border-success/40 bg-success-bg text-success",
                        state === "active" && "border-primary bg-highlight text-primary",
                        state === "todo" && "border-line bg-bg text-muted",
                      )}
                    >
                      {state === "done" ? <Check className="h-3.5 w-3.5" /> : <span className="font-mono">{i + 1}</span>}
                      {s}
                    </li>
                  );
                })}
              </ol>
            </Card>
          ) : null}

          {error && !running ? (
            <div role="alert" className="border border-danger/40 bg-danger-bg px-4 py-3 text-sm text-danger rounded-md">
              <p className="font-semibold">Could not generate a layout</p>
              <p className="mt-0.5">{error}</p>
            </div>
          ) : null}

          {result && best && m && base ? (
            <>
              <Card>
                <CardHeader
                  title="Optimization Results"
                  subtitle={`${result.projectName} · ${best.name} compared with an unoptimized packing of the same rooms`}
                  action={
                    <div className="flex gap-2">
                    <Button variant="outline" size="sm" leftIcon={<Save className="h-3.5 w-3.5" />} loading={saving} onClick={saveToProject}>
                      {user ? "Save to project" : "Sign in to save"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Download className="h-3.5 w-3.5" />}
                      onClick={() => {
                        downloadJson(`${result.projectName.toLowerCase().replace(/\s+/g, "-")}-${best.name.toLowerCase().replace(/\s+/g, "-")}.json`, { plot: result.plot, rooms: best.rooms, metrics: best.metrics, cost: best.cost });
                        toast({ kind: "success", title: "Layout exported", description: "The JSON file can be re-imported in the Space Planner." });
                      }}
                    >
                      Export JSON
                    </Button>
                    </div>
                  }
                />
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { icon: Layers, value: `${m.areaEfficiency}%`, label: "Area Efficiency", delta: <Delta value={m.areaEfficiency - base.areaEfficiency} suffix=" pts" /> },
                    { icon: Footprints, value: m.circulationRatio.toFixed(2), label: "Circulation Ratio", delta: <Delta value={pct(m.circulationRatio, base.circulationRatio)} invert /> },
                    { icon: LayoutGrid, value: `${m.usableArea} m²`, label: "Usable Area", delta: <Delta value={m.usableArea - base.usableArea} suffix=" m²" /> },
                    { icon: Clock, value: `${seconds(m.avgTravelTime)} s`, label: "Avg. Walk from Entrance", delta: <Delta value={pct(m.avgTravelTime, base.avgTravelTime)} invert /> },
                  ].map((t) => (
                    <div key={t.label} className="border border-line bg-surface p-3 rounded-sm">
                      <div className="flex items-start justify-between">
                        <t.icon className="h-5 w-5 text-primary" aria-hidden />
                        {t.delta}
                      </div>
                      <p className="mt-2 text-xl font-bold text-ink">{t.value}</p>
                      <p className="text-xs text-muted">{t.label}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
                  <span className="inline-flex items-center gap-1"><Cpu className="h-3 w-3" aria-hidden /> {result.evaluated.toLocaleString()} layouts evaluated in {(result.elapsedMs / 1000).toFixed(1)} s</span>
                  <span>Cost {best.cost.toFixed(1)} vs {result.baseline.cost.toFixed(1)} before</span>
                  <span>Adjacency satisfied {m.adjacencySatisfaction}%</span>
                  <span>Accessibility {m.accessibility}%</span>
                </p>
              </Card>

              <Card>
                <CardHeader title="Candidate layouts" subtitle="Ranked by cost. Select one to inspect it." />
                <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 xl:grid-cols-4">
                  {result.layouts.map((l, i) => (
                    <li key={l.id}>
                      <button
                        type="button"
                        aria-pressed={candidateIndex === i}
                        onClick={() => setCandidateIndex(i)}
                        className={cn(
                          "flex w-full flex-col gap-2 border p-2 text-left rounded-sm transition-colors",
                          candidateIndex === i ? "border-primary bg-highlight/50" : "border-line bg-surface hover:border-line-strong",
                        )}
                      >
                        <div className="border border-line bg-bg p-1">
                          <FloorPlan plot={result.plot} rooms={l.rooms} thumbnail ariaLabel={`${l.name} thumbnail`} />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-ink">{l.name}</span>
                          {i === 0 ? <Badge tone="success" size="sm">Best</Badge> : <span className="text-[11px] text-muted">cost {l.cost.toFixed(1)}</span>}
                        </div>
                        <p className="text-[11px] text-muted">
                          {l.metrics.areaEfficiency}% efficient · {l.metrics.adjacencySatisfaction}% adjacency
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              </Card>

              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_260px]">
                <Card className="flex flex-col">
                  <CardHeader title="Before" subtitle="Unoptimized packing" />
                  <div className="flex-1 border border-line bg-bg p-2 rounded-sm">
                    <FloorPlan plot={result.plot} rooms={result.baseline.rooms} showLabels={false} showDimensions={false} ariaLabel="Layout before optimization" />
                  </div>
                  <p className="mt-3 flex items-center justify-center gap-3 border-t border-line pt-3 text-xs text-muted">
                    <span>Efficiency: <strong className="text-ink">{base.areaEfficiency}%</strong></span>
                    <span className="h-3 w-px bg-line" aria-hidden />
                    <span>Circulation ratio: <strong className="text-ink">{base.circulationRatio.toFixed(2)}</strong></span>
                  </p>
                </Card>
                <div className="hidden items-center justify-center lg:flex" aria-hidden>
                  <ArrowRight className="h-6 w-6 text-primary" />
                </div>
                <Card selected className="flex flex-col">
                  <CardHeader title={`After · ${best.name}`} action={candidateIndex === 0 ? <Badge tone="success" size="sm">Recommended</Badge> : undefined} />
                  <div className="flex-1 border border-line bg-bg p-2 rounded-sm">
                    <FloorPlan plot={result.plot} rooms={best.rooms} showLabels={false} showDimensions={false} ariaLabel={`${best.name} after optimization`} />
                  </div>
                  <p className="mt-3 flex items-center justify-center gap-3 border-t border-line pt-3 text-xs text-muted">
                    <span>Efficiency: <strong className="text-ink">{m.areaEfficiency}%</strong></span>
                    <span className="h-3 w-px bg-line" aria-hidden />
                    <span>Circulation ratio: <strong className="text-ink">{m.circulationRatio.toFixed(2)}</strong></span>
                  </p>
                </Card>
                <Card className="lg:col-span-3 xl:col-span-1">
                  <CardHeader title="Space Allocation" />
                  <DonutChart data={distribution} centerLabel={`${best.rooms.reduce((s, r) => s + roomArea(r), 0)} m²`} centerSub="Total Area" size={130} ariaLabel={`Space allocation of ${best.name}`} />
                </Card>
              </div>

              <Card className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="flex items-center gap-2 md:w-[200px]">
                  <Target className="h-5 w-5 text-primary" aria-hidden />
                  <span className="text-sm font-semibold text-ink">Optimization Insights</span>
                </div>
                <ul className="m-0 grid flex-1 list-none gap-3 p-0 sm:grid-cols-3">
                  {[
                    { icon: TrendingUp, value: `${m.adjacencySatisfaction - base.adjacencySatisfaction >= 0 ? "+" : "−"}${Math.abs(m.adjacencySatisfaction - base.adjacencySatisfaction)} pts`, label: "Adjacency preferences met" },
                    { icon: Footprints, value: `${pct(m.avgTravelTime, base.avgTravelTime) <= 0 ? "−" : "+"}${Math.abs(pct(m.avgTravelTime, base.avgTravelTime))}%`, label: "Walking time from entrance" },
                    { icon: Layers, value: `${m.usableArea - base.usableArea >= 0 ? "+" : "−"}${Math.abs(m.usableArea - base.usableArea)} m²`, label: "Usable space" },
                  ].map((i, idx) => (
                    <li key={i.label} className={cn("flex items-center gap-3", idx > 0 && "sm:border-l sm:border-line sm:pl-3")}>
                      <i.icon className="h-5 w-5 text-primary" aria-hidden />
                      <div>
                        <p className="text-base font-bold text-ink">{i.value}</p>
                        <p className="text-xs text-muted">{i.label}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            </>
          ) : !running && !error ? (
            <EmptyState
              icon={<Layers />}
              title="No results yet"
              description="Choose a project and run the optimizer. It generates several candidate layouts and compares the best one with an unoptimized packing."
              action={<Button onClick={run} leftIcon={<Play className="h-4 w-4" />}>Run Optimization</Button>}
            />
          ) : null}

          {user ? (
            <Card>
              <CardHeader title="Saved layouts" subtitle={`Stored in your account for ${projectName}.`} />
              {savedLayouts.length === 0 ? (
                <EmptyState icon={<Save />} title="Nothing saved yet" description="Run the optimizer and choose Save to project to keep its layouts." />
              ) : (
                <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 xl:grid-cols-4">
                  {savedLayouts.map((l) => (
                    <li key={l.id} className="flex flex-col gap-2 border border-line bg-bg p-2 rounded-sm">
                      <div className="border border-line bg-surface p-1">
                        <FloorPlan plot={project?.plot ?? { width: 30, height: 20 }} rooms={l.rooms} thumbnail ariaLabel={`Saved ${l.name}`} />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate text-sm font-semibold text-ink">{l.name}</span>
                        <button type="button" onClick={() => removeSaved(l.id)} aria-label={`Delete saved ${l.name}`} className="inline-flex h-7 w-7 items-center justify-center text-muted rounded-xs hover:bg-danger-bg hover:text-danger">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-muted">{l.metrics.areaEfficiency}% efficient · {new Date(l.generatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ) : null}

          {/* Run history */}
          <Card>
            <CardHeader title="Run history" subtitle="Optimization runs from this session. Select one to review it." />
            {history.length === 0 ? (
              <EmptyState icon={<History />} title="No runs yet" description="Runs you start will be listed here." />
            ) : (
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {history.map((h) => (
                  <li key={h.id}>
                    <button
                      type="button"
                      aria-pressed={activeRunId === h.id}
                      onClick={() => { setActiveRunId(h.id); setCandidateIndex(0); }}
                      className={cn(
                        "flex w-full flex-wrap items-center justify-between gap-2 border px-3 py-2 text-left text-sm rounded-sm",
                        activeRunId === h.id ? "border-primary bg-highlight/50" : "border-line bg-bg hover:border-line-strong",
                      )}
                    >
                      <span className="min-w-0 truncate font-medium text-ink">{h.projectName}</span>
                      <span className="flex flex-wrap items-center gap-3 text-xs text-muted">
                        <span>{h.mode === "annealing" ? "Annealing" : "Constraint search"}</span>
                        <span>{h.layouts.length} candidates</span>
                        <span>best cost {h.layouts[0].cost.toFixed(1)}</span>
                        <span>{(h.elapsedMs / 1000).toFixed(1)} s</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
