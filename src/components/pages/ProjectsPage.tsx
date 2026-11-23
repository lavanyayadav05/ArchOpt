"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Layers,
  CheckCircle2,
  Activity,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  FolderOpen,
} from "lucide-react";
import { PageHeader } from "@/components/layout/AppShell";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SelectMenu, DropdownMenu, type MenuItem } from "@/components/ui/Dropdown";
import { StatusBadge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/Misc";
import { Table, Th, Td, Tr } from "@/components/ui/Table";
import { ProjectCard, ProjectThumbnail } from "@/components/projects/ProjectCard";
import { NewProjectModal } from "@/components/projects/NewProjectModal";
import { useProjects } from "@/components/providers/ProjectsProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { projectTypeLabel, projectStatusLabel, recentActivity } from "@/lib/mock";
import type { Project } from "@/lib/types";
import { cn, formatDate, timeAgo } from "@/lib/utils";

type TypeFilter = "all" | Project["type"];
type StatusFilter = "all" | Project["status"];
type SortKey = "recent" | "name" | "progress";

const PAGE_SIZE = 6;

export function ProjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { projects, setStatus, deleteProject, duplicateProject } = useProjects();
  const { toast } = useToast();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [type, setType] = useState<TypeFilter>("all");
  const [status, setStatus_] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [newOpen, setNewOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = projects.filter(
      (p) =>
        (!q || p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)) &&
        (type === "all" || p.type === type) &&
        (status === "all" || p.status === status),
    );
    const sorted = [...list];
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "progress") sorted.sort((a, b) => b.progress - a.progress);
    else sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return sorted;
  }, [projects, query, type, status, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const resetPage = () => setPage(1);
  const clearFilters = () => {
    setQuery("");
    setType("all");
    setStatus_("all");
    setSort("recent");
    setPage(1);
  };

  const menuFor = (p: Project): MenuItem[] => [
    { id: "open", label: "Open in Workspace", onSelect: () => router.push("/workspace") },
    {
      id: "duplicate",
      label: "Duplicate",
      onSelect: () => {
        duplicateProject(p.id);
        toast({ kind: "success", title: "Project duplicated", description: `${p.name} (copy) added as a draft.` });
      },
    },
    {
      id: "complete",
      label: "Mark completed",
      disabled: p.status === "completed",
      onSelect: () => {
        setStatus(p.id, "completed");
        toast({ kind: "success", title: "Marked as completed", description: p.name });
      },
    },
    {
      id: "archive",
      label: p.status === "archived" ? "Unarchive" : "Archive",
      onSelect: () => {
        setStatus(p.id, p.status === "archived" ? "draft" : "archived");
        toast({ kind: "info", title: p.status === "archived" ? "Project restored" : "Project archived", description: p.name });
      },
    },
    { id: "delete", label: "Delete", danger: true, separator: true, onSelect: () => setPendingDelete(p) },
  ];

  const counts = {
    total: projects.length,
    completed: projects.filter((p) => p.status === "completed").length,
    inProgress: projects.filter((p) => p.status === "in-progress" || p.status === "optimizing").length,
  };

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Projects"
        description="Manage, edit and optimize your architectural projects."
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setNewOpen(true)}>
            New Project
          </Button>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-4">
          {/* Toolbar */}
          <Card padded={false} className="flex flex-wrap items-center gap-2 p-3">
            <Input
              aria-label="Search projects"
              placeholder="Search projects…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                resetPage();
              }}
              leftIcon={<Search className="h-4 w-4" />}
              className="w-full sm:w-[240px]"
            />
            <SelectMenu
              ariaLabel="Filter by type"
              value={type}
              onChange={(v) => {
                setType(v);
                resetPage();
              }}
              options={[{ value: "all", label: "All Types" }, ...Object.entries(projectTypeLabel).map(([value, label]) => ({ value: value as TypeFilter, label }))]}
            />
            <SelectMenu
              ariaLabel="Filter by status"
              value={status}
              onChange={(v) => {
                setStatus_(v);
                resetPage();
              }}
              options={[{ value: "all", label: "All Status" }, ...Object.entries(projectStatusLabel).map(([value, label]) => ({ value: value as StatusFilter, label }))]}
            />
            <SelectMenu
              ariaLabel="Sort projects"
              prefix="Sort:"
              value={sort}
              onChange={setSort}
              options={[
                { value: "recent", label: "Recent" },
                { value: "name", label: "Name" },
                { value: "progress", label: "Progress" },
              ]}
            />
            <div className="ml-auto flex border border-line rounded-sm" role="group" aria-label="View mode">
              <button
                type="button"
                aria-label="Grid view"
                aria-pressed={view === "grid"}
                onClick={() => setView("grid")}
                className={cn("inline-flex h-8 w-9 items-center justify-center", view === "grid" ? "bg-highlight text-primary" : "text-muted hover:text-ink")}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="List view"
                aria-pressed={view === "list"}
                onClick={() => setView("list")}
                className={cn("inline-flex h-8 w-9 items-center justify-center border-l border-line", view === "list" ? "bg-highlight text-primary" : "text-muted hover:text-ink")}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </Card>

          {/* Results */}
          {filtered.length === 0 ? (
            <EmptyState
              icon={<FolderOpen />}
              title="No projects match these filters"
              description="Try a different search term or clear the filters to see all projects."
              action={
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : view === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((p, i) => (
                <ProjectCard key={p.id} project={p} index={i} menu={menuFor(p)} />
              ))}
            </div>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Project</Th>
                  <Th>Type</Th>
                  <Th>Plot</Th>
                  <Th align="right">Spaces</Th>
                  <Th>Status</Th>
                  <Th>Updated</Th>
                  <Th align="right">
                    <span className="sr-only">Actions</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p, i) => (
                  <Tr key={p.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <ProjectThumbnail project={p} index={i} className="h-10 w-14 p-1" />
                        <span className="font-medium">{p.name}</span>
                      </div>
                    </Td>
                    <Td>{projectTypeLabel[p.type]}</Td>
                    <Td>
                      {p.plot.width} m × {p.plot.height} m
                    </Td>
                    <Td align="right">{p.spaces}</Td>
                    <Td>
                      <StatusBadge status={p.status} size="sm" />
                    </Td>
                    <Td>{formatDate(p.updatedAt)}</Td>
                    <Td align="right">
                      <DropdownMenu
                        trigger={({ ref, toggle, ...aria }) => (
                          <button
                            ref={ref}
                            type="button"
                            onClick={toggle}
                            aria-label={`Actions for ${p.name}`}
                            className="inline-flex h-7 w-7 items-center justify-center border border-line text-muted rounded-xs hover:bg-highlight hover:text-ink"
                            {...aria}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        )}
                        items={menuFor(p)}
                      />
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}

          {/* Pagination */}
          {filtered.length > 0 ? (
            <nav aria-label="Pagination" className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(filtered.length, currentPage * PAGE_SIZE)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                  className="inline-flex h-8 w-8 items-center justify-center border border-line bg-surface text-ink rounded-sm hover:bg-highlight disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {pages.map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-label={`Page ${n}`}
                    aria-current={n === currentPage ? "page" : undefined}
                    onClick={() => setPage(n)}
                    className={cn(
                      "inline-flex h-8 min-w-8 items-center justify-center border px-2 text-sm rounded-sm",
                      n === currentPage ? "border-primary bg-primary text-white" : "border-line bg-surface text-ink hover:bg-highlight",
                    )}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  aria-label="Next page"
                  disabled={currentPage === pageCount}
                  onClick={() => setPage(currentPage + 1)}
                  className="inline-flex h-8 w-8 items-center justify-center border border-line bg-surface text-ink rounded-sm hover:bg-highlight disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </nav>
          ) : null}
        </div>

        {/* Right column */}
        <div className="flex min-w-0 flex-col gap-5">
          <Card>
            <CardHeader title="Project Overview" />
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Layers, value: counts.total, label: "Total Projects", tone: "text-primary" },
                { icon: CheckCircle2, value: counts.completed, label: "Completed", tone: "text-success" },
                { icon: Activity, value: counts.inProgress, label: "In Progress", tone: "text-primary" },
              ].map((t) => (
                <div key={t.label} className="flex flex-col items-center border border-line bg-bg px-2 py-3 text-center rounded-sm">
                  <t.icon className={cn("h-5 w-5", t.tone)} aria-hidden />
                  <span className="mt-1 text-xl font-bold text-ink">{t.value}</span>
                  <span className="text-[11px] text-muted">{t.label}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Recent Activity"
              action={
                <Link href="/team?tab=activity" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                  View All <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
            <ol className="relative m-0 list-none p-0">
              {recentActivity.slice(0, 5).map((a, i, arr) => (
                <li key={a.id} className="relative flex gap-3 pb-4 last:pb-0">
                  {i < arr.length - 1 ? <span className="absolute left-[5px] top-3 h-full w-px bg-line" aria-hidden /> : null}
                  <span
                    className={cn(
                      "relative mt-1.5 h-[11px] w-[11px] shrink-0 border-2 border-surface",
                      a.kind === "complete" ? "bg-success" : a.kind === "optimize" ? "bg-[#7c3aed]" : "bg-primary",
                    )}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-ink">
                        {a.target ? `${a.target} ` : ""}
                        <span className="font-normal">{a.action}</span>
                      </p>
                      <span className="shrink-0 text-[11px] text-muted">{timeAgo(a.at)}</span>
                    </div>
                    <p className="text-xs text-muted">{a.detail ?? `by ${a.actor}`}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>

      <NewProjectModal open={newOpen} onClose={() => setNewOpen(false)} />
      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title="Delete project?"
        destructive
        confirmLabel="Delete"
        message={
          <>
            <strong className="text-ink">{pendingDelete?.name}</strong> and its generated layouts will be removed from this session. This cannot be undone.
          </>
        }
        onConfirm={() => {
          if (pendingDelete) {
            deleteProject(pendingDelete.id);
            toast({ kind: "info", title: "Project deleted", description: pendingDelete.name });
          }
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
