/**
 * Domain types shared across the ArchOpt frontend.
 * These mirror the data model described in the project proposal:
 * a rectangular plot, rectangular rooms with required areas and minimum
 * dimensions, weighted adjacency relationships and evaluated candidate layouts.
 */

export type SpaceType =
  | "classroom"
  | "office"
  | "reception"
  | "toilets"
  | "storage"
  | "circulation"
  | "corridor"
  | "entrance"
  | "open";

export interface Room {
  id: string;
  name: string;
  type: SpaceType;
  /** Position and size in metres, origin at the top-left of the plot. */
  x: number;
  y: number;
  width: number;
  height: number;
  requiredArea?: number;
  minWidth?: number;
  minHeight?: number;
  capacity?: number;
}

export interface Plot {
  width: number;
  height: number;
}

export interface AdjacencyEdge {
  from: string; // room id
  to: string; // room id
  /** 1 (nice to have) – 5 (must be adjacent) */
  weight: number;
}

export interface LayoutMetrics {
  areaEfficiency: number; // %
  circulationRatio: number; // corridor length / ideal path length
  usableArea: number; // m²
  adjacencySatisfaction: number; // %
  accessibility: number; // %
  avgTravelTime: number; // minutes (illustrative)
}

export type LayoutTag = "efficient" | "compact" | "open-plan";

export interface Layout {
  id: string;
  name: string;
  projectId: string;
  recommended?: boolean;
  tags: LayoutTag[];
  rooms: Room[];
  metrics: LayoutMetrics;
  cost: number;
  generatedAt: string;
}

export type ProjectStatus =
  | "draft"
  | "in-progress"
  | "optimizing"
  | "completed"
  | "archived";

export type ProjectType = "education" | "civic" | "office" | "research";

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  status: ProjectStatus;
  plot: Plot;
  spaces: number;
  updatedAt: string;
  createdAt: string;
  owner: string;
  description?: string;
  layoutIds: string[];
  progress: number; // 0-100
}

export interface OptimizationJob {
  id: string;
  projectId: string;
  projectName: string;
  stage: string;
  progress: number; // 0-100
  etaSeconds: number;
  status: "queued" | "running" | "completed" | "failed";
}

export type TeamRole = "Admin" | "Designer" | "Planner" | "Analyst" | "Visualizer";
export type AccessRole = "Owner" | "Editor" | "Viewer";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  title: string;
  role: TeamRole;
  access: AccessRole;
  online: boolean;
  tasks: number;
}

export interface ActivityItem {
  id: string;
  actor: string;
  action: string;
  target?: string;
  detail?: string;
  at: string; // ISO date
  kind: "edit" | "comment" | "upload" | "complete" | "join" | "optimize";
}

export interface Comment {
  id: string;
  author: string;
  body: string;
  at: string;
}

export interface LayoutVersion {
  id: string;
  label: string; // v2.3
  title: string;
  notes: string;
  author: string;
  at: string;
  layoutId: string;
  changes: string[];
  current?: boolean;
}

export interface TrendPoint {
  label: string;
  value: number;
}
