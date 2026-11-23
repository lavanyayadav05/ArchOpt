import { insertProject, listProjects } from "@/server/projects";
import { body, fail, json, num, requireUser, str } from "@/server/http";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic";

const TYPES = ["education", "civic", "office", "research"];

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  return json({ projects: listProjects(auth.user.id, auth.user.name) });
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const b = await body(req);
  const name = str(b?.name, 120);
  const id = typeof b?.id === "string" && /^prj-[a-z0-9-]{4,40}$/.test(b.id) ? b.id : null;
  const type = typeof b?.type === "string" && TYPES.includes(b.type) ? (b.type as Project["type"]) : null;
  const w = num(b?.plotWidth, 1, 500);
  const h = num(b?.plotHeight, 1, 500);
  const spaces = num(b?.spaces, 0, 200);
  if (!name) return fail("Give the project a name.");
  if (!id || !type || w === null || h === null || spaces === null) return fail("The project details are not valid.");

  const now = new Date().toISOString();
  const project: Project = {
    id,
    name,
    type,
    status: "draft",
    plot: { width: w, height: h },
    spaces: Math.round(spaces),
    updatedAt: now,
    createdAt: now,
    owner: auth.user.name,
    description: b?.description ? str(b.description, 600) ?? undefined : undefined,
    layoutIds: [],
    progress: 0,
  };
  try {
    insertProject(auth.user.id, project);
  } catch {
    return fail("A project with this id already exists.", 409);
  }
  return json({ project }, 201);
}
