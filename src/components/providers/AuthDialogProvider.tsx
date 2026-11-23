"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type AuthDialogKind = "sign-in" | "get-started" | null;

interface AuthDialogContextValue {
  open: AuthDialogKind;
  openSignIn: () => void;
  openGetStarted: () => void;
  close: () => void;
}

const AuthDialogContext = createContext<AuthDialogContextValue | null>(null);

export function AuthDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState<AuthDialogKind>(null);
  const openSignIn = useCallback(() => setOpen("sign-in"), []);
  const openGetStarted = useCallback(() => setOpen("get-started"), []);
  const close = useCallback(() => setOpen(null), []);
  const value = useMemo(
    () => ({ open, openSignIn, openGetStarted, close }),
    [open, openSignIn, openGetStarted, close],
  );
  return <AuthDialogContext.Provider value={value}>{children}</AuthDialogContext.Provider>;
}

export function useAuthDialog(): AuthDialogContextValue {
  const ctx = useContext(AuthDialogContext);
  if (!ctx) throw new Error("useAuthDialog must be used inside <AuthDialogProvider>");
  return ctx;
}
