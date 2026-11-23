import { db } from "@/server/db";
import { fail, json, requireUser } from "@/server/http";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const changes = db().prepare("DELETE FROM layouts WHERE id = ? AND user_id = ?").run(id, auth.user.id).changes;
  return changes ? json({ ok: true }) : fail("Layout not found.", 404);
}
