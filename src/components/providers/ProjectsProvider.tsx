"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Project, ProjectStatus } from "@/lib/types";
import { projects as seedProjects } from "@/lib/mock";
import { api } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import { useToast } from "./ToastProvider";

/**
 * Project store. Signed in: projects are loaded from, and saved to, the server
 * (/api/projects) with optimistic updates that roll back if a request fails.
 * Signed out: the sample projects are shown read-write in memory only.
 */

export interface NewProjectInput {
  name: string;
  type: Project["type"];
  plotWidth: number;
  plotHeight: number;
  spaces: number;
  description?: string;
}

interface ProjectsContextValue {
  projects: Project[];
  createProject: (input: NewProjectInput) => Project;
  updateProject: (id: string, patch: Partial<Project>) => void;
  setStatus: (id: string, status: ProjectStatus) => void;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => Project | undefined;
}

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const { toast } = useToast();
  const userKey = user?.email ?? null;
  // Projects are tagged with the account they belong to, so switching accounts never shows another user's list.
  const [store, setStore] = useState<{ key: string | null; list: Project[] }>({ key: null, list: seedProjects });
  const projects = store.key === userKey ? store.list : seedProjects;
  const setProjects = useCallback(
    (next: Project[] | ((list: Project[]) => Project[])) =>
      setStore((s) => {
        const current = s.key === userKey ? s.list : seedProjects;
        return { key: userKey, list: typeof next === "function" ? next(current) : next };
      }),
    [userKey],
  );

  // Load this user's projects when they sign in; fall back to samples when signed out.
  useEffect(() => {
    if (!ready || !userKey) return;
    let cancelled = false;
    api<{ projects: Project[] }>("/api/projects")
      .then((r) => !cancelled && setStore({ key: userKey, list: r.projects }))
      .catch(() => !cancelled && toast({ kind: "error", title: "Could not load your projects", description: "Showing sample projects instead." }));
    return () => {
      cancelled = true;
    };
  }, [ready, userKey, toast]);

  /** Runs a server write; on failure restores the previous list and tells the user. */
  const persist = useCallback(
    (request: () => Promise<unknown>, rollback: Project[], message: string) => {
      if (!userKey) return;
      request().catch((e: Error) => {
        setProjects(rollback);
        toast({ kind: "error", title: message, description: e.message });
      });
    },
    [userKey, toast, setProjects],
  );
  const newId = () => `prj-${crypto.randomUUID().slice(0, 8)}`;

  const createProject = useCallback((input: NewProjectInput): Project => {
    const now = new Date().toISOString();
    const project: Project = {
      id: newId(),
      name: input.name.trim(),
      type: input.type,
      status: "draft",
      plot: { width: input.plotWidth, height: input.plotHeight },
      spaces: input.spaces,
      updatedAt: now,
      createdAt: now,
      owner: user?.name ?? "You",
      description: input.description?.trim() || undefined,
      layoutIds: [],
      progress: 0,
    };
    const before = projects;
    setProjects((list) => [project, ...list]);
    persist(
      () => api("/api/projects", { method: "POST", json: { id: project.id, name: project.name, type: project.type, plotWidth: input.plotWidth, plotHeight: input.plotHeight, spaces: input.spaces, description: project.description } }),
      before,
      "Project was not saved",
    );
    return project;
  }, [projects, persist, user?.name, setProjects]);

  const updateProject = useCallback(
    (id: string, patch: Partial<Project>) => {
      const before = projects;
      setProjects((list) => list.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p)));
      const { name, status, type, progress, description } = patch;
      persist(() => api(`/api/projects/${id}`, { method: "PATCH", json: { name, status, type, progress, description } }), before, "Change was not saved");
    },
    [projects, persist, setProjects],
  );

  const setStatus = useCallback(
    (id: string, status: ProjectStatus) => updateProject(id, { status }),
    [updateProject],
  );

  const deleteProject = useCallback(
    (id: string) => {
      const before = projects;
      setProjects((list) => list.filter((p) => p.id !== id));
      persist(() => api(`/api/projects/${id}`, { method: "DELETE" }), before, "Project was not deleted");
    },
    [projects, persist, setProjects],
  );

  const duplicateProject = useCallback(
    (id: string) => {
      const src = projects.find((p) => p.id === id);
      if (!src) return undefined;
      const now = new Date().toISOString();
      const copy: Project = { ...src, id: newId(), name: `${src.name} (copy)`, status: "draft", createdAt: now, updatedAt: now, progress: 0, layoutIds: [] };
      const before = projects;
      setProjects((list) => [copy, ...list]);
      persist(
        () => api("/api/projects", { method: "POST", json: { id: copy.id, name: copy.name, type: copy.type, plotWidth: copy.plot.width, plotHeight: copy.plot.height, spaces: copy.spaces, description: copy.description } }),
        before,
        "Copy was not saved",
      );
      return copy;
    },
    [projects, persist, setProjects],
  );

  const value = useMemo(
    () => ({ projects, createProject, updateProject, setStatus, deleteProject, duplicateProject }),
    [projects, createProject, updateProject, setStatus, deleteProject, duplicateProject],
  );

  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>;
}

export function useProjects(): ProjectsContextValue {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error("useProjects must be used inside <ProjectsProvider>");
  return ctx;
}
