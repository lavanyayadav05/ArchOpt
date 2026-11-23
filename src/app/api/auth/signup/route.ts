import crypto from "node:crypto";
import { db } from "@/server/db";
import { hashPassword, startSession } from "@/server/auth";
import { seedSampleProjects } from "@/server/projects";
import { body, fail, isEmail, json, str } from "@/server/http";

export async function POST(req: Request) {
  const b = await body(req);
  const name = str(b?.name, 80);
  const email = isEmail(b?.email) ? b.email.toLowerCase() : null;
  const password = typeof b?.password === "string" ? b.password : "";
  const organization = b?.organization ? str(b.organization, 120) : null;
  if (!name) return fail("Please enter your name.");
  if (!email) return fail("Please enter a valid email address.");
  if (password.length < 8 || password.length > 200) return fail("Use a password of at least 8 characters.");

  if (db().prepare("SELECT 1 FROM users WHERE email = ?").get(email)) return fail("An account with this email already exists.", 409);

  const id = crypto.randomUUID();
  db()
    .prepare("INSERT INTO users (id, name, email, organization, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(id, name, email, organization, hashPassword(password), new Date().toISOString());
  seedSampleProjects(id);
  await startSession(id, true);
  return json({ user: { name, email, organization: organization ?? undefined } }, 201);
}
