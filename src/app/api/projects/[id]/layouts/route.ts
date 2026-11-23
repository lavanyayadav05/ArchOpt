import crypto from "node:crypto";
import { db } from "@/server/db";
import { getProjectRow, layoutFromRow } from "@/server/projects";
import { body, fail, json, requireUser, str } from "@/server/http";

export const dynamic = "force-dynamic";

const rowsFor = (userId: string, projectId: string) =>
  db().prepare("SELECT * FROM layouts WHERE user_id = ? AND project_id = ? ORDER BY created_at DESC, cost ASC").all(userId, projectId) as unknown as Parameters<typeof layoutFromRow>[0][];

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;
  if (!getProjectRow(auth.user.id, id)) return fail("Project not found.", 404);
  return json({ layouts: rowsFor(auth.user.id, id).map(layoutFromRow) });
}

/** Saves up to 8 layouts to a project. Room geometry is re-checked so only well-formed plans are stored. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;
  if (!getProjectRow(auth.user.id, id)) return fail("Project not found.", 404);
  const b = await body<{ layouts?: unknown }>(req);
  const list = Array.isArray(b?.layouts) ? b.layouts.slice(0, 8) : [];
  if (list.length === 0) return fail("There are no layouts to save.");

  const now = new Date().toISOString();
  const insert = db().prepare(
    "INSERT INTO layouts (id, user_id, project_id, name, recommended, tags, rooms, metrics, cost, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  );
  const tx = db().transaction(() => {
    for (const raw of list as Record<string, unknown>[]) {
      const name = str(raw.name, 80);
      const rooms = raw.rooms;
      const wellFormed =
        Array.isArray(rooms) &&
        rooms.length > 0 &&
        rooms.length <= 200 &&
        rooms.every((r) => r && typeof r === "object" && ["x", "y", "width", "height"].every((k) => Number.isFinite((r as Record<string, unknown>)[k])));
      if (!name || !wellFormed || typeof raw.metrics !== "object" || !raw.metrics || typeof raw.cost !== "number") throw new Error("invalid");
      insert.run(crypto.randomUUID(), auth.user.id, id, name, raw.recommended ? 1 : 0, JSON.stringify(Array.isArray(raw.tags) ? raw.tags : []), JSON.stringify(rooms), JSON.stringify(raw.metrics), raw.cost, now);
    }
    db().prepare("UPDATE projects SET updated_at = ? WHERE user_id = ? AND id = ?").run(now, auth.user.id, id);
  });
  try {
    tx();
  } catch {
    return fail("One of the layouts is not valid, so nothing was saved.");
  }
  return json({ layouts: rowsFor(auth.user.id, id).map(layoutFromRow) }, 201);
}
