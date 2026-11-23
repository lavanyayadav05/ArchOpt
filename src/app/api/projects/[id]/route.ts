import { db } from "@/server/db";
import { getProjectRow, rowToProject } from "@/server/projects";
import { body, fail, json, num, requireUser, str } from "@/server/http";

const STATUSES = ["draft", "in-progress", "optimizing", "completed", "archived"];
const TYPES = ["education", "civic", "office", "research"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const row = getProjectRow(auth.user.id, id);
  if (!row) return fail("Project not found.", 404);
  const b = (await body(req)) ?? {};

  const name = "name" in b ? str(b.name, 120) : row.name;
  const status = "status" in b ? (typeof b.status === "string" && STATUSES.includes(b.status) ? b.status : null) : row.status;
  const type = "type" in b ? (typeof b.type === "string" && TYPES.includes(b.type) ? b.type : null) : row.type;
  const progress = "progress" in b ? num(b.progress, 0, 100) : row.progress;
  const description = "description" in b ? (b.description ? str(b.description, 600) : null) : row.description;
  if (!name || !status || !type || progress === null) return fail("The changes are not valid.");

  db()
    .prepare("UPDATE projects SET name = ?, status = ?, type = ?, progress = ?, description = ?, updated_at = ? WHERE user_id = ? AND id = ?")
    .run(name, status, type, Math.round(progress), description, new Date().toISOString(), auth.user.id, id);
  return json({ project: rowToProject(getProjectRow(auth.user.id, id)!, auth.user.name) });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const tx = db().transaction(() => {
    db().prepare("DELETE FROM layouts WHERE user_id = ? AND project_id = ?").run(auth.user.id, id);
    return db().prepare("DELETE FROM projects WHERE user_id = ? AND id = ?").run(auth.user.id, id).changes;
  });
  if (tx() === 0) return fail("Project not found.", 404);
  return json({ ok: true });
}
