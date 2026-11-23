import type { Layout, Room, AdjacencyEdge, Plot } from "@/lib/types";

/**
 * Sample layout data.
 *
 * All layouts, metrics and costs in this module are ILLUSTRATIVE sample
 * example values shown before you generate your own layouts. Layouts created
 * in the Space Planner and Optimization pages use the real engine in
 * src/lib/engine and carry measured metrics.
 */

export const SAMPLE_DATA_NOTICE =
  "Example project data.";

export const communityCentrePlot: Plot = { width: 30, height: 20 };

const r = (
  id: string,
  name: string,
  type: Room["type"],
  x: number,
  y: number,
  width: number,
  height: number,
  extra: Partial<Room> = {},
): Room => ({ id, name, type, x, y, width, height, ...extra });

/** Layout A — recommended arrangement for the Community Centre brief. */
export const layoutARooms: Room[] = [
  r("c1", "Classroom", "classroom", 0, 0, 10, 6, { requiredArea: 60, minWidth: 8, minHeight: 6, capacity: 30 }),
  r("c2", "Classroom", "classroom", 10, 0, 10, 6, { requiredArea: 60, minWidth: 8, minHeight: 6, capacity: 30 }),
  r("c3", "Classroom", "classroom", 20, 0, 10, 6, { requiredArea: 60, minWidth: 8, minHeight: 6, capacity: 30 }),
  r("h1", "Corridor", "circulation", 0, 6, 30, 3),
  r("o1", "Office", "office", 0, 9, 6, 4, { requiredArea: 24, minWidth: 4, minHeight: 4, capacity: 4 }),
  r("o2", "Office", "office", 0, 14, 6, 4, { requiredArea: 24, minWidth: 4, minHeight: 4, capacity: 4 }),
  r("h2", "Corridor", "circulation", 6, 9, 3, 11),
  r("h3", "Lobby", "circulation", 9, 9, 12, 5),
  r("rc", "Reception", "reception", 9, 14, 9, 6, { requiredArea: 36, minWidth: 6, minHeight: 4, capacity: 12 }),
  r("t1", "Toilets", "toilets", 24, 9, 6, 3, { requiredArea: 18, minWidth: 3, minHeight: 3 }),
  r("st", "Storage", "storage", 24, 14, 4, 3, { requiredArea: 12, minWidth: 3, minHeight: 3 }),
];

/** Layout B — compact: offices moved beside reception, shorter corridor. */
export const layoutBRooms: Room[] = [
  r("c1", "Classroom", "classroom", 0, 0, 10, 6, { capacity: 30 }),
  r("c2", "Classroom", "classroom", 10, 0, 10, 6, { capacity: 30 }),
  r("c3", "Classroom", "classroom", 20, 0, 10, 6, { capacity: 30 }),
  r("h1", "Corridor", "circulation", 0, 6, 30, 3),
  r("rc", "Reception", "reception", 0, 9, 9, 4, { capacity: 12 }),
  r("o1", "Office", "office", 0, 13, 6, 4, { capacity: 4 }),
  r("o2", "Office", "office", 6, 13, 6, 4, { capacity: 4 }),
  r("h2", "Corridor", "circulation", 12, 9, 3, 11),
  r("t1", "Toilets", "toilets", 15, 9, 6, 3),
  r("st", "Storage", "storage", 22, 9, 4, 3),
  r("h3", "Open area", "open", 15, 13, 15, 7),
];

/** Layout C — open plan: larger lobby, reception centred on entrance. */
export const layoutCRooms: Room[] = [
  r("c1", "Classroom", "classroom", 0, 0, 10, 6, { capacity: 30 }),
  r("c2", "Classroom", "classroom", 10, 0, 10, 6, { capacity: 30 }),
  r("c3", "Classroom", "classroom", 20, 0, 10, 6, { capacity: 30 }),
  r("h1", "Corridor", "circulation", 0, 6, 30, 3),
  r("o1", "Office", "office", 0, 9, 6, 4, { capacity: 4 }),
  r("o2", "Office", "office", 24, 9, 6, 4, { capacity: 4 }),
  r("h3", "Lobby", "circulation", 6, 9, 18, 7),
  r("rc", "Reception", "reception", 10, 16, 10, 4, { capacity: 12 }),
  r("t1", "Toilets", "toilets", 0, 14, 6, 3),
  r("st", "Storage", "storage", 24, 14, 4, 3),
];

/** Layout D — classrooms split across two sides of a central spine. */
export const layoutDRooms: Room[] = [
  r("c1", "Classroom", "classroom", 0, 0, 10, 6, { capacity: 30 }),
  r("c2", "Classroom", "classroom", 20, 0, 10, 6, { capacity: 30 }),
  r("rc", "Reception", "reception", 10, 0, 10, 4, { capacity: 12 }),
  r("h1", "Corridor", "circulation", 0, 6, 30, 3),
  r("c3", "Classroom", "classroom", 0, 9, 10, 6, { capacity: 30 }),
  r("o1", "Office", "office", 24, 9, 6, 4, { capacity: 4 }),
  r("o2", "Office", "office", 24, 13, 6, 4, { capacity: 4 }),
  r("h2", "Corridor", "circulation", 10, 9, 3, 11),
  r("t1", "Toilets", "toilets", 13, 9, 6, 3),
  r("st", "Storage", "storage", 19, 9, 4, 3),
  r("h3", "Open area", "open", 13, 13, 11, 7),
];

/** Pre-optimization layout for the "current vs optimized" comparison. */
export const currentLayoutRooms: Room[] = [
  r("c1", "Classroom", "classroom", 0, 0, 9, 6, { capacity: 30 }),
  r("c2", "Classroom", "classroom", 9, 0, 9, 6, { capacity: 30 }),
  r("c3", "Classroom", "classroom", 18, 0, 9, 6, { capacity: 30 }),
  r("h1", "Corridor", "circulation", 0, 6, 30, 4),
  r("o1", "Office", "office", 0, 10, 6, 4, { capacity: 4 }),
  r("o2", "Office", "office", 0, 15, 6, 4, { capacity: 4 }),
  r("h2", "Corridor", "circulation", 6, 10, 4, 10),
  r("rc", "Reception", "reception", 10, 14, 8, 6, { capacity: 12 }),
  r("t1", "Toilets", "toilets", 22, 10, 6, 3),
  r("st", "Storage", "storage", 22, 15, 4, 3),
];

export const communityCentreAdjacency: AdjacencyEdge[] = [
  { from: "rc", to: "entrance", weight: 5 },
  { from: "c1", to: "c2", weight: 4 },
  { from: "c2", to: "c3", weight: 4 },
  { from: "t1", to: "h1", weight: 4 },
  { from: "o1", to: "rc", weight: 3 },
  { from: "o2", to: "rc", weight: 2 },
  { from: "st", to: "rc", weight: 1 },
];

export const layouts: Layout[] = [
  {
    id: "lay-a",
    name: "Layout A",
    projectId: "prj-community-centre",
    recommended: true,
    tags: ["efficient"],
    rooms: layoutARooms,
    cost: 142.3,
    generatedAt: "2026-11-03T09:12:00Z",
    metrics: {
      areaEfficiency: 86,
      circulationRatio: 1.26,
      usableArea: 553,
      adjacencySatisfaction: 89,
      accessibility: 94,
      avgTravelTime: 12,
    },
  },
  {
    id: "lay-b",
    name: "Layout B",
    projectId: "prj-community-centre",
    tags: ["compact"],
    rooms: layoutBRooms,
    cost: 158.9,
    generatedAt: "2026-11-03T09:12:00Z",
    metrics: {
      areaEfficiency: 83,
      circulationRatio: 1.3,
      usableArea: 548,
      adjacencySatisfaction: 84,
      accessibility: 91,
      avgTravelTime: 13,
    },
  },
  {
    id: "lay-c",
    name: "Layout C",
    projectId: "prj-community-centre",
    tags: ["open-plan"],
    rooms: layoutCRooms,
    cost: 171.4,
    generatedAt: "2026-11-03T09:12:00Z",
    metrics: {
      areaEfficiency: 81,
      circulationRatio: 1.34,
      usableArea: 560,
      adjacencySatisfaction: 80,
      accessibility: 92,
      avgTravelTime: 14,
    },
  },
  {
    id: "lay-d",
    name: "Layout D",
    projectId: "prj-community-centre",
    tags: ["open-plan", "compact"],
    rooms: layoutDRooms,
    cost: 189.0,
    generatedAt: "2026-11-03T09:12:00Z",
    metrics: {
      areaEfficiency: 78,
      circulationRatio: 1.41,
      usableArea: 572,
      adjacencySatisfaction: 76,
      accessibility: 88,
      avgTravelTime: 15,
    },
  },
];

export const currentLayout: Layout = {
  id: "lay-current",
  name: "Current Layout",
  projectId: "prj-community-centre",
  tags: [],
  rooms: currentLayoutRooms,
  cost: 212.6,
  generatedAt: "2026-11-01T10:00:00Z",
  metrics: {
    areaEfficiency: 81,
    circulationRatio: 1.54,
    usableArea: 521,
    adjacencySatisfaction: 78,
    accessibility: 86,
    avgTravelTime: 16,
  },
};

export function getLayout(id: string): Layout | undefined {
  return layouts.find((l) => l.id === id);
}

/** Space distribution shares used in donut charts (sample values). */
export const spaceDistribution = [
  { key: "classroom", label: "Classrooms", value: 43 },
  { key: "reception", label: "Reception", value: 17 },
  { key: "office", label: "Office", value: 12 },
  { key: "toilets", label: "Toilets", value: 9 },
  { key: "storage", label: "Storage", value: 7 },
  { key: "circulation", label: "Circulation", value: 12 },
] as const;
