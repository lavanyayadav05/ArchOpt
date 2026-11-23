"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

/**
 * Frontend-only authentication state.
 *
 * Talks to the /api/auth routes. The server checks credentials, stores a hashed
 * password and keeps the session in an HttpOnly cookie, so no token is ever
 * readable from JavaScript.
 */

export interface SessionUser {
  name: string;
  email: string;
  organization?: string;
}

interface AuthContextValue {
  user: SessionUser | null;
  /** False during server render / hydration, true once client storage is read. */
  ready: boolean;
  signIn: (input: { email: string; password: string; remember: boolean }) => Promise<void>;
  signUp: (input: { name: string; email: string; password: string; organization?: string }) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  // Ask the server who is signed in (the session lives in an HttpOnly cookie).
  useEffect(() => {
    let cancelled = false;
    api<{ user: SessionUser | null }>("/api/auth/me")
      .then((r) => !cancelled && setUser(r.user))
      .catch(() => !cancelled && setUser(null))
      .finally(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback<AuthContextValue["signIn"]>(async ({ email, password, remember }) => {
    const r = await api<{ user: SessionUser }>("/api/auth/signin", { method: "POST", json: { email, password, remember } });
    setUser(r.user);
  }, []);

  const signUp = useCallback<AuthContextValue["signUp"]>(async ({ name, email, password, organization }) => {
    const r = await api<{ user: SessionUser }>("/api/auth/signup", { method: "POST", json: { name, email, password, organization } });
    setUser(r.user);
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    api("/api/auth/signout", { method: "POST" }).catch(() => undefined);
  }, []);

  const value = useMemo(() => ({ user, ready, signIn, signUp, signOut }), [user, ready, signIn, signUp, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
