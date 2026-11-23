import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";

const COOKIE = "archopt_session";
const DAY = 24 * 60 * 60;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  organization?: string;
}

/* ---- password hashing: scrypt with a per-user salt ---- */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return crypto.timingSafeEqual(expected, actual);
}

const sha = (v: string) => crypto.createHash("sha256").update(v).digest("hex");

/** Creates a session row and sets an HttpOnly cookie. `remember` keeps it for 30 days, otherwise for the browser session. */
export async function startSession(userId: string, remember: boolean): Promise<void> {
  const token = crypto.randomBytes(32).toString("hex");
  const maxAge = (remember ? 30 : 1) * DAY;
  db().prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)").run(sha(token), userId, Date.now() + maxAge * 1000);
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(remember ? { maxAge } : {}),
  });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) db().prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha(token));
  jar.delete(COOKIE);
}

export async function currentUser(): Promise<AuthUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const row = db()
    .prepare(
      `SELECT u.id, u.name, u.email, u.organization, s.expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?`,
    )
    .get(sha(token)) as { id: string; name: string; email: string; organization: string | null; expires_at: number } | undefined;
  if (!row) return null;
  if (row.expires_at < Date.now()) {
    db().prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha(token));
    return null;
  }
  return { id: row.id, name: row.name, email: row.email, organization: row.organization ?? undefined };
}
