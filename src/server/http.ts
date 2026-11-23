import "server-only";
import { NextResponse } from "next/server";
import { currentUser, type AuthUser } from "./auth";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

/** Parses a JSON body; returns null if it is missing or malformed. */
export async function body<T = Record<string, unknown>>(req: Request): Promise<T | null> {
  try {
    const v = await req.json();
    return v && typeof v === "object" ? (v as T) : null;
  } catch {
    return null;
  }
}

/** Returns the signed-in user or a ready-made 401 response. */
export async function requireUser(): Promise<{ user: AuthUser } | { response: NextResponse }> {
  const user = await currentUser();
  if (!user) return { response: fail("Please sign in to continue.", 401) };
  return { user };
}

export const isEmail = (v: unknown): v is string => typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= 254;
export const str = (v: unknown, max = 200): string | null => (typeof v === "string" && v.trim().length > 0 && v.length <= max ? v.trim() : null);
export const num = (v: unknown, min: number, max: number): number | null => (typeof v === "number" && Number.isFinite(v) && v >= min && v <= max ? v : null);
