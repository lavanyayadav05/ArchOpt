import type { TrendPoint } from "@/lib/types";

/** Weekly area-efficiency trend (sample values, Jan–Feb 2026). */
export const efficiencyTrend: TrendPoint[] = [
  { label: "Jan 5", value: 75 },
  { label: "Jan 8", value: 76 },
  { label: "Jan 12", value: 76 },
  { label: "Jan 15", value: 79 },
  { label: "Jan 19", value: 78.5 },
  { label: "Jan 22", value: 78 },
  { label: "Jan 26", value: 80 },
  { label: "Jan 29", value: 82 },
  { label: "Feb 2", value: 83 },
  { label: "Feb 5", value: 85 },
  { label: "Feb 7", value: 84.5 },
  { label: "Feb 9", value: 86 },
];

export const circulationTrend: TrendPoint[] = [
  { label: "Jan 5", value: 1.62 },
  { label: "Jan 12", value: 1.55 },
  { label: "Jan 19", value: 1.48 },
  { label: "Jan 26", value: 1.4 },
  { label: "Feb 2", value: 1.33 },
  { label: "Feb 9", value: 1.26 },
];

export const layoutEfficiencyComparison: TrendPoint[] = [
  { label: "Layout A", value: 86 },
  { label: "Layout B", value: 83 },
  { label: "Layout C", value: 81 },
  { label: "Layout D", value: 78 },
];

export const teamWorkload: TrendPoint[] = [
  { label: "L", value: 8 },
  { label: "N", value: 6 },
  { label: "S", value: 5 },
  { label: "R", value: 7 },
  { label: "A", value: 6 },
];

export const generationTimes: TrendPoint[] = [
  { label: "Run 1", value: 18 },
  { label: "Run 2", value: 16 },
  { label: "Run 3", value: 15 },
  { label: "Run 4", value: 13 },
  { label: "Run 5", value: 12 },
];

export const projectPerformance = [
  {
    project: "Community Centre",
    projectId: "prj-community-centre",
    layout: "Layout A",
    areaEfficiency: 86,
    circulationRatio: 1.26,
    usableArea: 553,
    status: "completed" as const,
  },
  {
    project: "Library Extension",
    projectId: "prj-library-extension",
    layout: "Layout B",
    areaEfficiency: 83,
    circulationRatio: 1.3,
    usableArea: 548,
    status: "in-progress" as const,
  },
  {
    project: "School Block",
    projectId: "prj-school-block",
    layout: "Layout C",
    areaEfficiency: 81,
    circulationRatio: 1.34,
    usableArea: 560,
    status: "optimizing" as const,
  },
  {
    project: "Admin Building",
    projectId: "prj-admin-building",
    layout: "Layout A",
    areaEfficiency: 84,
    circulationRatio: 1.29,
    usableArea: 412,
    status: "completed" as const,
  },
  {
    project: "Research Lab",
    projectId: "prj-research-lab",
    layout: "Layout D",
    areaEfficiency: 79,
    circulationRatio: 1.38,
    usableArea: 356,
    status: "in-progress" as const,
  },
];

/** Cost-function weights from the proposal (configurable in the UI). */
export const costWeights = [
  { key: "overlap", label: "Overlap", weight: 10, description: "Penalises rooms that intersect." },
  { key: "boundary", label: "Boundary violations", weight: 10, description: "Rooms outside the plot." },
  { key: "adjacency", label: "Bad adjacency", weight: 4, description: "Unsatisfied weighted relationships." },
  { key: "corridor", label: "Excess corridor", weight: 2, description: "Circulation area beyond the minimum." },
  { key: "circulation", label: "Poor circulation", weight: 3, description: "Long shortest paths from the entrance." },
  { key: "unused", label: "Unused area", weight: 1, description: "Plot area not assigned to any space." },
];
