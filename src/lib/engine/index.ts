/**
 * ArchOpt layout engine (TypeScript, runs entirely in the browser).
 *
 * Pipeline:
 *   1. Requirements  -> a list of rectangular rooms with target areas and minimum sizes
 *   2. Graph model   -> weighted adjacency edges + a circulation graph (entrance, corridor, rooms)
 *   3. Generation    -> rooms are packed into two bands on either side of a central corridor
 *   4. Constraints   -> minimum width / depth and required-area checks on every candidate
 *   5. Optimization  -> randomized constraint search or simulated annealing over the packing
 *   6. Evaluation    -> weighted cost function and layout metrics, Dijkstra for walking distance
 *
 * All random choices come from a seeded PRNG, so the same inputs and seed always
 * produce the same candidates.
 */

import type { AdjacencyEdge, Layout, LayoutMetrics, LayoutTag, Plot, Room, SpaceType } from "@/lib/types";
import { areaEfficiency, roomArea, roomsTouch, usableArea } from "@/lib/geometry";

/* ------------------------------------------------------------------ */
/* Public types                                                        */
/* ------------------------------------------------------------------ */

export interface SpaceRequest {
  type: Exclude<SpaceType, "circulation" | "corridor" | "entrance" | "open">;
  count: number;
  /** Target area of one room in m². */
  area: number;
  minWidth: number;
  minHeight: number;
  capacity?: number;
}

export interface EngineWeights {
  boundary: number;
  adjacency: number;
  corridor: number;
  circulation: number;
  unused: number;
}

export type SearchMode = "constraint" | "annealing";

export interface GenerateOptions {
  plot: Plot;
  spaces: SpaceRequest[];
  adjacency: AdjacencyEdge[];
  weights?: Partial<EngineWeights>;
  mode?: SearchMode;
  candidates?: number;
  iterations?: number;
  seed?: number;
  projectId?: string;
  /** Called between candidates so a UI can show progress (0–100). */
  onProgress?: (percent: number) => void;
}

export const DEFAULT_WEIGHTS: EngineWeights = { boundary: 10, adjacency: 4, corridor: 2, circulation: 3, unused: 1 };

export const DEFAULT_SPACE_SIZES: Record<SpaceRequest["type"], Omit<SpaceRequest, "type" | "count">> = {
  classroom: { area: 60, minWidth: 8, minHeight: 6, capacity: 30 },
  office: { area: 24, minWidth: 4, minHeight: 4, capacity: 4 },
  reception: { area: 36, minWidth: 6, minHeight: 4, capacity: 12 },
  toilets: { area: 18, minWidth: 3, minHeight: 3 },
  storage: { area: 12, minWidth: 3, minHeight: 3 },
};

export interface WalkingPath {
  room: Room;
  /** Shortest walking distance from the entrance in metres. */
  distance: number;
  path: { x: number; y: number }[];
}

/* ------------------------------------------------------------------ */
/* Seeded random numbers                                               */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ */
/* Requirements -> room list                                           */
/* ------------------------------------------------------------------ */

interface RoomSpec {
  id: string;
  name: string;
  type: SpaceRequest["type"];
  area: number;
  minWidth: number;
  minHeight: number;
  capacity?: number;
}

const idPrefix: Record<SpaceRequest["type"], string> = { classroom: "c", office: "o", reception: "rc", toilets: "t", storage: "st" };
const typeName: Record<SpaceRequest["type"], string> = {
  classroom: "Classroom",
  office: "Office",
  reception: "Reception",
  toilets: "Toilets",
  storage: "Storage",
};

export function expandSpaces(spaces: SpaceRequest[]): RoomSpec[] {
  const out: RoomSpec[] = [];
  for (const s of spaces) {
    for (let i = 1; i <= s.count; i += 1) {
      const single = s.type === "reception" || s.type === "storage";
      const id = single && i === 1 ? idPrefix[s.type] : `${idPrefix[s.type]}${i}`;
      const name = s.count > 1 ? `${typeName[s.type]} ${i}` : typeName[s.type];
      out.push({ id, name, type: s.type, area: s.area, minWidth: s.minWidth, minHeight: s.minHeight, capacity: s.capacity });
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Packing: a candidate is an ordering of rooms in two bands           */
/* ------------------------------------------------------------------ */

interface Genome {
  top: string[];
  bottom: string[];
  corridor: number;
  topDepth: number;
}

const CORRIDOR_CHOICES = [2.4, 3, 3.6];
const GRID = 0.5;
const snap = (v: number) => Math.round(v / GRID) * GRID;

function packBand(ids: string[], specs: Map<string, RoomSpec>, plot: Plot, y: number, depth: number, bandKey: string): Room[] {
  const rooms: Room[] = [];
  if (ids.length === 0 || depth <= 0) return rooms;
  const wanted = ids.map((id) => {
    const s = specs.get(id)!;
    return Math.max(s.minWidth, s.area / depth);
  });
  const total = wanted.reduce((a, b) => a + b, 0);
  const squeeze = total > plot.width ? plot.width / total : 1;
  let x = 0;
  ids.forEach((id, i) => {
    const s = specs.get(id)!;
    const last = i === ids.length - 1;
    let w = snap(wanted[i] * squeeze);
    if (last && plot.width - x - w < 3) w = plot.width - x; // absorb a thin leftover
    w = Math.min(w, plot.width - x);
    rooms.push({
      id,
      name: s.name,
      type: s.type,
      x,
      y,
      width: w,
      height: depth,
      requiredArea: s.area,
      minWidth: s.minWidth,
      minHeight: s.minHeight,
      capacity: s.capacity,
    });
    x += w;
  });
  const leftover = plot.width - x;
  if (leftover >= 3) {
    rooms.push({ id: `op-${bandKey}`, name: "Open area", type: "open", x, y, width: leftover, height: depth });
  }
  return rooms;
}

export function buildRooms(g: Genome, specs: Map<string, RoomSpec>, plot: Plot): Room[] {
  const bottomDepth = plot.height - g.topDepth - g.corridor;
  const rooms = [
    ...packBand(g.top, specs, plot, 0, g.topDepth, "top"),
    { id: "h1", name: "Corridor", type: "circulation" as const, x: 0, y: g.topDepth, width: plot.width, height: g.corridor },
    ...packBand(g.bottom, specs, plot, g.topDepth + g.corridor, bottomDepth, "bot"),
  ];
  return rooms;
}

/* ------------------------------------------------------------------ */
/* Walking distance: Dijkstra on the circulation graph                 */
/* ------------------------------------------------------------------ */

interface GraphNode {
  id: string;
  x: number;
  y: number;
}

/** Entrance point: bottom edge of the reception, else bottom centre of the plot. */
export function entrancePoint(rooms: Room[], plot: Plot): { x: number; y: number } {
  const rc = rooms.find((r) => r.type === "reception");
  if (rc && Math.abs(rc.y + rc.height - plot.height) < 0.01) return { x: rc.x + rc.width / 2, y: plot.height };
  if (rc && rc.y < 0.01) return { x: rc.x + rc.width / 2, y: 0 };
  return { x: plot.width / 2, y: plot.height };
}

/**
 * Builds a small graph (entrance, corridor junctions, room centres) and runs
 * Dijkstra from the entrance. Returns the shortest walking route to each room.
 */
export function walkingPaths(rooms: Room[], plot: Plot): WalkingPath[] {
  const corridor = rooms
    .filter((r) => r.type === "circulation" || r.type === "corridor")
    .sort((a, b) => b.width * b.height - a.width * a.height)[0];
  const targets = rooms.filter((r) => r.type === "classroom" || r.type === "office" || r.type === "toilets" || r.type === "storage" || r.type === "reception");
  if (!corridor) return [];

  const horizontal = corridor.width >= corridor.height;
  const spineY = corridor.y + corridor.height / 2;
  const spineX = corridor.x + corridor.width / 2;
  const entrance = entrancePoint(rooms, plot);

  const nodes: GraphNode[] = [{ id: "entrance", ...entrance }];
  const edges = new Map<string, { to: string; w: number }[]>();
  const link = (a: string, b: string, w: number) => {
    edges.set(a, [...(edges.get(a) ?? []), { to: b, w }]);
    edges.set(b, [...(edges.get(b) ?? []), { to: a, w }]);
  };
  const dist = (a: GraphNode, b: GraphNode) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

  const junction = (id: string, x: number, y: number): GraphNode => {
    const n = { id, x, y };
    nodes.push(n);
    return n;
  };

  const entranceJ = horizontal ? junction("j-entrance", entrance.x, spineY) : junction("j-entrance", spineX, entrance.y);
  link("entrance", entranceJ.id, dist(nodes[0], entranceJ));

  const junctions: GraphNode[] = [entranceJ];
  for (const t of targets) {
    const c = { x: t.x + t.width / 2, y: t.y + t.height / 2 };
    const jn = horizontal ? junction(`j-${t.id}`, c.x, spineY) : junction(`j-${t.id}`, spineX, c.y);
    junctions.push(jn);
    const room = junction(`room-${t.id}`, c.x, c.y);
    link(jn.id, room.id, dist(jn, room));
  }
  // chain junctions along the spine in order
  const ordered = [...junctions].sort((a, b) => (horizontal ? a.x - b.x : a.y - b.y));
  for (let i = 0; i < ordered.length - 1; i += 1) link(ordered[i].id, ordered[i + 1].id, dist(ordered[i], ordered[i + 1]));

  // Dijkstra (graph is tiny, so a linear scan for the minimum is fine)
  const best = new Map<string, number>(nodes.map((n) => [n.id, Infinity]));
  const prev = new Map<string, string>();
  best.set("entrance", 0);
  const open = new Set(nodes.map((n) => n.id));
  while (open.size > 0) {
    let u: string | null = null;
    for (const id of open) if (u === null || best.get(id)! < best.get(u)!) u = id;
    if (u === null || best.get(u) === Infinity) break;
    open.delete(u);
    for (const e of edges.get(u) ?? []) {
      const alt = best.get(u)! + e.w;
      if (alt < best.get(e.to)!) {
        best.set(e.to, alt);
        prev.set(e.to, u);
      }
    }
  }

  const byId = new Map(nodes.map((n) => [n.id, n]));
  return targets.map((t) => {
    const key = `room-${t.id}`;
    const route: { x: number; y: number }[] = [];
    let cur: string | undefined = key;
    while (cur) {
      const n = byId.get(cur)!;
      route.unshift({ x: n.x, y: n.y });
      cur = prev.get(cur);
    }
    return { room: t, distance: Math.round((best.get(key) ?? 0) * 10) / 10, path: route };
  });
}

/* ------------------------------------------------------------------ */
/* Evaluation                                                          */
/* ------------------------------------------------------------------ */

export interface Evaluation {
  cost: number;
  terms: EngineWeights;
  metrics: LayoutMetrics;
  violations: number;
}

function touchesEntrance(room: Room, plot: Plot): boolean {
  return Math.abs(room.y + room.height - plot.height) < 0.01;
}

export function adjacencyScore(rooms: Room[], edges: AdjacencyEdge[], plot: Plot): number {
  const byId = new Map(rooms.map((r) => [r.id, r]));
  let total = 0;
  let ok = 0;
  for (const e of edges) {
    const a = e.from === "entrance" ? null : byId.get(e.from);
    const b = e.to === "entrance" ? null : byId.get(e.to);
    const other = e.from === "entrance" ? b : e.to === "entrance" ? a : null;
    if (e.from === "entrance" || e.to === "entrance") {
      if (!other) continue;
      total += e.weight;
      if (touchesEntrance(other, plot)) ok += e.weight;
      continue;
    }
    if (!a || !b) continue;
    total += e.weight;
    if (roomsTouch(a, b)) ok += e.weight;
  }
  return total === 0 ? 100 : Math.round((ok / total) * 100);
}

export function evaluate(rooms: Room[], plot: Plot, edges: AdjacencyEdge[], weights: EngineWeights = DEFAULT_WEIGHTS): Evaluation {
  const plotArea = plot.width * plot.height;

  // constraint shortfalls (normalised)
  let shortfall = 0;
  let violations = 0;
  for (const r of rooms) {
    if (r.minWidth && r.width + 1e-6 < r.minWidth) {
      shortfall += (r.minWidth - r.width) / r.minWidth;
      violations += 1;
    }
    if (r.minHeight && r.height + 1e-6 < r.minHeight) {
      shortfall += (r.minHeight - r.height) / r.minHeight;
      violations += 1;
    }
    if (r.requiredArea && roomArea(r) + 1e-6 < r.requiredArea) {
      shortfall += (r.requiredArea - roomArea(r)) / r.requiredArea;
      violations += 1;
    }
  }

  const adjacency = adjacencyScore(rooms, edges, plot);
  const corridorArea = rooms.filter((r) => r.type === "circulation" || r.type === "corridor").reduce((s, r) => s + roomArea(r), 0);
  const openArea = rooms.filter((r) => r.type === "open").reduce((s, r) => s + roomArea(r), 0);
  const paths = walkingPaths(rooms, plot);
  const avgDistance = paths.length ? paths.reduce((s, p) => s + p.distance, 0) / paths.length : 0;
  const straight = paths.length
    ? paths.reduce((s, p) => {
        const e = p.path[0];
        const c = p.path[p.path.length - 1];
        return s + Math.max(1, Math.hypot(c.x - e.x, c.y - e.y));
      }, 0) / paths.length
    : 1;

  const terms: EngineWeights = {
    boundary: shortfall * 10,
    adjacency: (100 - adjacency) / 10,
    corridor: Math.max(0, corridorArea / plotArea - 0.12) * 40,
    circulation: avgDistance / (plot.width + plot.height) * 10,
    unused: (openArea / plotArea) * 10,
  };
  const cost =
    weights.boundary * terms.boundary +
    weights.adjacency * terms.adjacency +
    weights.corridor * terms.corridor +
    weights.circulation * terms.circulation +
    weights.unused * terms.unused;

  const corridorWidth = rooms.find((r) => r.type === "circulation" || r.type === "corridor");
  const minCorridor = corridorWidth ? Math.min(corridorWidth.width, corridorWidth.height) : 0;
  const accessibility = Math.max(0, Math.min(100, (minCorridor >= 1.8 ? 100 : 60) - violations * 3));

  const metrics: LayoutMetrics = {
    areaEfficiency: areaEfficiency(rooms),
    circulationRatio: Math.round((avgDistance / straight) * 100) / 100,
    usableArea: Math.round(usableArea(rooms)),
    adjacencySatisfaction: adjacency,
    accessibility: Math.round(accessibility),
    avgTravelTime: Math.max(0.01, Math.round((avgDistance / 1.2 / 60) * 100) / 100),
  };
  return { cost: Math.round(cost * 100) / 100, terms, metrics, violations };
}

/* ------------------------------------------------------------------ */
/* Search                                                              */
/* ------------------------------------------------------------------ */

function initialGenome(specs: RoomSpec[], plot: Plot, rand: () => number): Genome {
  const ids = specs.map((s) => s.id);
  // Receptions go to the bottom band so the entrance sits on the plot boundary.
  const bottom: string[] = specs.filter((s) => s.type === "reception").map((s) => s.id);
  const rest = ids.filter((id) => !bottom.includes(id)).sort(() => rand() - 0.5);
  const top: string[] = [];
  for (const id of rest) (top.length <= bottom.length ? top : bottom).push(id);
  const corridor = CORRIDOR_CHOICES[Math.floor(rand() * CORRIDOR_CHOICES.length)];
  const area = (list: string[]) => list.reduce((s, id) => s + specs.find((x) => x.id === id)!.area, 0);
  const free = plot.height - corridor;
  const share = area(top) / Math.max(1, area(top) + area(bottom));
  return { top, bottom, corridor, topDepth: snap(Math.min(free - 3, Math.max(3, free * share))) };
}

function neighbour(g: Genome, specs: Map<string, RoomSpec>, plot: Plot, rand: () => number): Genome {
  const next: Genome = { top: [...g.top], bottom: [...g.bottom], corridor: g.corridor, topDepth: g.topDepth };
  const move = rand();
  const band = (rand() < 0.5 ? next.top : next.bottom);
  if (move < 0.45 && band.length > 1) {
    const i = Math.floor(rand() * band.length);
    const j = Math.floor(rand() * band.length);
    [band[i], band[j]] = [band[j], band[i]];
  } else if (move < 0.7 && next.top.length > 0 && next.bottom.length > 0) {
    // swap one room between the two bands
    const i = Math.floor(rand() * next.top.length);
    const j = Math.floor(rand() * next.bottom.length);
    const a = next.top[i];
    const b = next.bottom[j];
    if (specs.get(b)?.type !== "reception") {
      next.top[i] = b;
      next.bottom[j] = a;
    }
  } else if (move < 0.85) {
    const free = plot.height - next.corridor;
    next.topDepth = snap(Math.min(free - 3, Math.max(3, next.topDepth + (rand() < 0.5 ? -GRID : GRID) * (1 + Math.floor(rand() * 3)))));
  } else if (move < 0.92) {
    next.corridor = CORRIDOR_CHOICES[Math.floor(rand() * CORRIDOR_CHOICES.length)];
    const free = plot.height - next.corridor;
    next.topDepth = snap(Math.min(free - 3, Math.max(3, next.topDepth)));
  } else if (next.top.length > 0) {
    // move a non-reception room across the bands
    const i = Math.floor(rand() * next.top.length);
    next.bottom.push(next.top.splice(i, 1)[0]);
  } else if (next.bottom.length > 0) {
    const movable = next.bottom.filter((id) => specs.get(id)?.type !== "reception");
    if (movable.length) {
      const id = movable[Math.floor(rand() * movable.length)];
      next.bottom.splice(next.bottom.indexOf(id), 1);
      next.top.push(id);
    }
  }
  return next;
}

function signature(rooms: Room[]): string {
  return rooms.map((r) => `${r.id}:${r.x}:${r.y}:${r.width}:${r.height}`).sort().join("|");
}

function searchOne(opts: Required<Pick<GenerateOptions, "plot" | "adjacency">> & { specs: RoomSpec[]; weights: EngineWeights; mode: SearchMode; iterations: number; rand: () => number }) {
  const { plot, adjacency, specs, weights, mode, iterations, rand } = opts;
  const byId = new Map(specs.map((s) => [s.id, s]));
  const score = (g: Genome) => evaluate(buildRooms(g, byId, plot), plot, adjacency, weights).cost;

  let current = initialGenome(specs, plot, rand);
  let currentCost = score(current);
  let best = current;
  let bestCost = currentCost;

  for (let i = 0; i < iterations; i += 1) {
    const cand = neighbour(current, byId, plot, rand);
    const c = score(cand);
    let accept = c <= currentCost;
    if (!accept && mode === "annealing") {
      const temperature = Math.max(0.01, 2 * (1 - i / iterations));
      accept = rand() < Math.exp((currentCost - c) / temperature);
    }
    if (accept) {
      current = cand;
      currentCost = c;
      if (c < bestCost) {
        best = cand;
        bestCost = c;
      }
    }
  }
  return { genome: best, byId };
}

export interface GenerateResult {
  layouts: Layout[];
  /** Human-readable reason when no layout can be produced. */
  error?: string;
  evaluated: number;
}

/** Quick feasibility check so the UI can explain why a program cannot fit. */
export function feasibility(plot: Plot, spaces: SpaceRequest[]): { ok: boolean; message?: string; required: number } {
  const required = spaces.reduce((s, x) => s + x.area * x.count, 0);
  const available = plot.width * plot.height * 0.82; // corridor and walls take roughly 18 %
  if (spaces.every((s) => s.count === 0)) return { ok: false, required, message: "Select at least one space to generate a layout." };
  if (plot.width < 12 || plot.height < 10) return { ok: false, required, message: "The site is too small for a corridor with rooms on both sides. Use at least 12 m × 10 m." };
  if (required > available) {
    return {
      ok: false,
      required,
      message: `The selected spaces need about ${Math.round(required)} m², but only about ${Math.round(available)} m² of the ${plot.width} m × ${plot.height} m site is available after circulation. Remove a space or enlarge the site.`,
    };
  }
  return { ok: true, required };
}

function* generationSteps(options: GenerateOptions): Generator<number, GenerateResult, void> {
  const { plot, spaces, adjacency, mode = "annealing", candidates = 4, iterations = 2500, seed = 7, projectId = "generated" } = options;
  const weights: EngineWeights = { ...DEFAULT_WEIGHTS, ...options.weights };
  const check = feasibility(plot, spaces);
  if (!check.ok) return { layouts: [], error: check.message, evaluated: 0 };

  const specs = expandSpaces(spaces.filter((s) => s.count > 0));
  const seen = new Set<string>();
  const found: { rooms: Room[]; evaluation: Evaluation }[] = [];
  let evaluated = 0;
  const attempts = candidates * 3;

  for (let a = 0; a < attempts && found.length < candidates + 2; a += 1) {
    const rand = mulberry32(seed * 1000 + a * 37 + 11);
    const { genome, byId } = searchOne({ plot, adjacency, specs, weights, mode, iterations, rand });
    evaluated += iterations;
    const rooms = buildRooms(genome, byId, plot);
    const sig = signature(rooms);
    yield Math.min(99, Math.round(((a + 1) / attempts) * 100));
    if (seen.has(sig)) continue;
    seen.add(sig);
    found.push({ rooms, evaluation: evaluate(rooms, plot, adjacency, weights) });
  }

  found.sort((x, y) => x.evaluation.cost - y.evaluation.cost);
  const top = found.slice(0, candidates);
  if (top.length === 0) return { layouts: [], error: "No feasible layout was found. Try a larger site or fewer spaces.", evaluated };

  const bestEfficiency = Math.max(...top.map((t) => t.evaluation.metrics.areaEfficiency));
  const bestTravel = Math.min(...top.map((t) => t.evaluation.metrics.avgTravelTime));
  const openCount = (t: { rooms: Room[] }) => t.rooms.filter((r) => r.type === "open").length;
  const bestOpen = Math.max(...top.map(openCount));
  const now = new Date().toISOString();

  const layouts = top.map<Layout>((t, i) => {
    const tags: LayoutTag[] = [];
    if (t.evaluation.metrics.areaEfficiency === bestEfficiency) tags.push("efficient");
    if (t.evaluation.metrics.avgTravelTime === bestTravel) tags.push("compact");
    if (bestOpen > 0 && openCount(t) === bestOpen) tags.push("open-plan");
    return {
      id: `gen-${seed}-${i}`,
      name: `Layout ${String.fromCharCode(65 + i)}`,
      projectId,
      recommended: i === 0,
      tags: tags.length ? tags : ["efficient"],
      rooms: t.rooms,
      metrics: t.evaluation.metrics,
      cost: t.evaluation.cost,
      generatedAt: now,
    };
  });
  return { layouts, evaluated };
}

/** Synchronous generation (used in tests and small programs). */
export function generateLayouts(options: GenerateOptions): GenerateResult {
  const it = generationSteps(options);
  let step = it.next();
  while (!step.done) step = it.next();
  options.onProgress?.(100);
  return step.value;
}

/** Generation that yields to the browser between attempts so the UI stays responsive and can be cancelled. */
export async function generateLayoutsAsync(options: GenerateOptions, signal?: AbortSignal): Promise<GenerateResult> {
  const it = generationSteps(options);
  let step = it.next();
  while (!step.done) {
    if (signal?.aborted) throw new DOMException("Generation cancelled", "AbortError");
    options.onProgress?.(step.value);
    await new Promise((resolve) => setTimeout(resolve, 0));
    step = it.next();
  }
  if (signal?.aborted) throw new DOMException("Generation cancelled", "AbortError");
  options.onProgress?.(100);
  return step.value;
}

/**
 * An unoptimized packing of the same program (random order, no search).
 * Used as the "before" layout when showing what optimization achieved.
 */
export function baselineLayout(options: GenerateOptions): { rooms: Room[]; evaluation: Evaluation } | null {
  const { plot, spaces, adjacency } = options;
  if (!feasibility(plot, spaces).ok) return null;
  const weights: EngineWeights = { ...DEFAULT_WEIGHTS, ...options.weights };
  const specs = expandSpaces(spaces.filter((s) => s.count > 0));
  const byId = new Map(specs.map((s) => [s.id, s]));
  const rand = mulberry32((options.seed ?? 7) * 7919 + 3);
  const genome = initialGenome(specs, plot, rand);
  // A plain, unsearched arrangement: even split of depth, default corridor.
  genome.corridor = 3;
  genome.topDepth = snap((plot.height - genome.corridor) / 2);
  const rooms = buildRooms(genome, byId, plot);
  return { rooms, evaluation: evaluate(rooms, plot, adjacency, weights) };
}

/** Reads a room program back out of an existing layout (counts, average areas and minimum sizes per type). */
export function programFromRooms(rooms: Room[]): SpaceRequest[] {
  const types: SpaceRequest["type"][] = ["classroom", "reception", "office", "toilets", "storage"];
  const out: SpaceRequest[] = [];
  for (const type of types) {
    const group = rooms.filter((r) => r.type === type);
    if (group.length === 0) continue;
    const d = DEFAULT_SPACE_SIZES[type];
    const avg = group.reduce((sum, r) => sum + (r.requiredArea ?? roomArea(r)), 0) / group.length;
    out.push({
      type,
      count: group.length,
      area: Math.round(avg),
      minWidth: group[0].minWidth ?? d.minWidth,
      minHeight: group[0].minHeight ?? d.minHeight,
      capacity: group[0].capacity ?? d.capacity,
    });
  }
  return out;
}

/** Suggests a room program that fills roughly 55 % of a plot, for projects that only store a plot size. */
export function suggestProgram(plot: Plot): SpaceRequest[] {
  const target = plot.width * plot.height * 0.55;
  const n = (share: number, area: number) => Math.max(1, Math.round((share * target) / area));
  const d = DEFAULT_SPACE_SIZES;
  return [
    { type: "classroom", count: n(0.58, d.classroom.area), ...d.classroom },
    { type: "reception", count: 1, ...d.reception },
    { type: "office", count: n(0.15, d.office.area), ...d.office },
    { type: "toilets", count: n(0.1, d.toilets.area), ...d.toilets },
    { type: "storage", count: 1, ...d.storage },
  ];
}

/** Adjacency preferences used when a project does not define its own. */
export function defaultAdjacency(spaces: SpaceRequest[]): AdjacencyEdge[] {
  const has = (t: SpaceRequest["type"]) => spaces.some((s) => s.type === t && s.count > 0);
  const edges: AdjacencyEdge[] = [];
  if (has("reception")) edges.push({ from: "rc", to: "entrance", weight: 5 });
  const classrooms = spaces.find((s) => s.type === "classroom")?.count ?? 0;
  for (let i = 1; i < classrooms; i += 1) edges.push({ from: `c${i}`, to: `c${i + 1}`, weight: 4 });
  const offices = spaces.find((s) => s.type === "office")?.count ?? 0;
  if (has("reception")) for (let i = 1; i <= offices; i += 1) edges.push({ from: `o${i}`, to: "rc", weight: Math.max(1, 4 - i) });
  if (has("toilets")) edges.push({ from: "t1", to: "c1", weight: 3 });
  if (has("storage") && has("reception")) edges.push({ from: "st", to: "rc", weight: 1 });
  return edges;
}
