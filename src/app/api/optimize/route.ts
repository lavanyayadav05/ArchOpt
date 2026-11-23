import { baselineLayout, defaultAdjacency, generateLayouts, suggestProgram, type SpaceRequest } from "@/lib/engine";
import { body, fail, json, num } from "@/server/http";

export const dynamic = "force-dynamic";

const TYPES = ["classroom", "office", "reception", "toilets", "storage"];

/**
 * Runs the layout engine on the server. Inputs are bounded so a single request cannot
 * tie the server up: site up to 200 m, up to 60 rooms, at most 8000 search steps per attempt.
 */
export async function POST(req: Request) {
  const b = await body(req);
  const plotIn = (b?.plot ?? {}) as Record<string, unknown>;
  const width = num(plotIn.width, 5, 200);
  const height = num(plotIn.height, 5, 200);
  if (width === null || height === null) return fail("Site width and height must be between 5 m and 200 m.");
  const plot = { width, height };

  let spaces: SpaceRequest[];
  if (Array.isArray(b?.spaces)) {
    spaces = [];
    for (const s of b.spaces as Record<string, unknown>[]) {
      const count = num(s.count, 0, 30);
      const area = num(s.area, 2, 500);
      const minWidth = num(s.minWidth, 1, 100);
      const minHeight = num(s.minHeight, 1, 100);
      if (typeof s.type !== "string" || !TYPES.includes(s.type) || count === null || area === null || minWidth === null || minHeight === null) {
        return fail("One of the spaces has invalid values.");
      }
      spaces.push({ type: s.type as SpaceRequest["type"], count: Math.round(count), area, minWidth, minHeight, capacity: typeof s.capacity === "number" ? s.capacity : undefined });
    }
    if (spaces.reduce((n, s) => n + s.count, 0) > 60) return fail("Use at most 60 rooms.");
  } else {
    spaces = suggestProgram(plot);
  }

  const mode = b?.mode === "constraint" ? "constraint" : "annealing";
  const iterations = Math.round(num(b?.iterations, 200, 8000) ?? 2500);
  const seed = Math.round(num(b?.seed, 1, 100000) ?? 7);
  const weights: Record<string, number> = {};
  for (const k of ["boundary", "adjacency", "corridor", "circulation", "unused"]) {
    const v = num((b?.weights as Record<string, unknown> | undefined)?.[k], 0, 50);
    if (v !== null) weights[k] = v;
  }
  const adjacency = defaultAdjacency(spaces);
  const options = { plot, spaces, adjacency, weights, mode, iterations, seed, projectId: typeof b?.projectId === "string" ? b.projectId : "generated" } as const;

  const started = Date.now();
  const result = generateLayouts(options);
  if (result.error) return fail(result.error, 422);
  const base = baselineLayout(options);
  return json({
    layouts: result.layouts,
    baseline: base ? { rooms: base.rooms, metrics: base.evaluation.metrics, cost: base.evaluation.cost } : null,
    program: spaces,
    evaluated: result.evaluated,
    elapsedMs: Date.now() - started,
  });
}
