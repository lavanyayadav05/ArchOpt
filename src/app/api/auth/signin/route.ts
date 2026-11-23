import { db } from "@/server/db";
import { startSession, verifyPassword } from "@/server/auth";
import { body, fail, json } from "@/server/http";

export async function POST(req: Request) {
  const b = await body(req);
  const email = typeof b?.email === "string" ? b.email.trim().toLowerCase() : "";
  const password = typeof b?.password === "string" ? b.password : "";
  const row = db().prepare("SELECT * FROM users WHERE email = ?").get(email) as
    | { id: string; name: string; email: string; organization: string | null; password_hash: string }
    | undefined;
  // Same message for unknown email and wrong password so accounts cannot be probed.
  if (!row || !verifyPassword(password, row.password_hash)) return fail("Incorrect email or password.", 401);
  await startSession(row.id, b?.remember !== false);
  return json({ user: { name: row.name, email: row.email, organization: row.organization ?? undefined } });
}
