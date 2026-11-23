import "server-only";
import { db } from "./db";
import { projects as sampleProjects } from "@/lib/mock/projects";
import type { Layout, Project } from "@/lib/types";

interface ProjectRow {
  id: string;
  name: string;
  type: Project["type"];
  status: Project["status"];
  plot_w: number;
  plot_h: number;
  spaces: number;
  description: string | null;
  layout_ids: string;
  progress: number;
  created_at: string;
  updated_at: string;
}

export function rowToProject(r: ProjectRow, owner: string): Project {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    status: r.status,
    plot: { width: r.plot_w, height: r.plot_h },
    spaces: r.spaces,
    updatedAt: r.updated_at,
    createdAt: r.created_at,
    owner,
    description: r.description ?? undefined,
    layoutIds: JSON.parse(r.layout_ids) as string[],
    progress: r.progress,
  };
}

export function listProjects(userId: string, owner: string): Project[] {
  const rows = db().prepare("SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC").all(userId) as unknown as ProjectRow[];
  return rows.map((r) => rowToProject(r, owner));
}

export function getProjectRow(userId: string, id: string): ProjectRow | undefined {
  return db().prepare("SELECT * FROM projects WHERE user_id = ? AND id = ?").get(userId, id) as unknown as ProjectRow | undefined;
}

export function insertProject(userId: string, p: Project): void {
  db()
    .prepare(
      `INSERT INTO projects (user_id, id, name, type, status, plot_w, plot_h, spaces, description, layout_ids, progress, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(userId, p.id, p.name, p.type, p.status, p.plot.width, p.plot.height, p.spaces, p.description ?? null, JSON.stringify(p.layoutIds), p.progress, p.createdAt, p.updatedAt);
}

/** New accounts start with the sample projects so the workspace is not empty. */
export function seedSampleProjects(userId: string): void {
  const tx = db().transaction(() => {
    for (const p of sampleProjects) insertProject(userId, p);
  });
  tx();
}

export function layoutFromRow(r: {
  id: string;
  project_id: string;
  name: string;
  recommended: number;
  tags: string;
  rooms: string;
  metrics: string;
  cost: number;
  created_at: string;
}): Layout {
  return {
    id: r.id,
    name: r.name,
    projectId: r.project_id,
    recommended: r.recommended === 1,
    tags: JSON.parse(r.tags),
    rooms: JSON.parse(r.rooms),
    metrics: JSON.parse(r.metrics),
    cost: r.cost,
    generatedAt: r.created_at,
  };
}
