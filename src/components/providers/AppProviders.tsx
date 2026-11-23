"use client";

import { ThemeProvider } from "./ThemeProvider";
import { ToastProvider } from "./ToastProvider";
import { AuthProvider } from "./AuthProvider";
import { AuthDialogProvider } from "./AuthDialogProvider";
import { ProjectsProvider } from "./ProjectsProvider";
import { AuthDialogs } from "@/components/auth/AuthDialogs";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
    <ToastProvider>
      <AuthProvider>
        <AuthDialogProvider>
          <ProjectsProvider>
            {children}
            <AuthDialogs />
          </ProjectsProvider>
        </AuthDialogProvider>
      </AuthProvider>
    </ToastProvider>
    </ThemeProvider>
  );
}
