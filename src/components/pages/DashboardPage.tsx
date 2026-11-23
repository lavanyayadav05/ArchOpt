"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Layers,
  LayoutGrid,
  BarChart3,
  Activity,
  ArrowRight,
  Plus,
  FileText,
  Play,
  GitCompare,
  Zap,
  Calendar,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Delta } from "@/components/ui/Badge";
import { StatCard, ProgressBar, SampleDataNote, EmptyState } from "@/components/ui/Misc";
import { LineChart, DonutChart } from "@/components/charts";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { NewProjectModal } from "@/components/projects/NewProjectModal";
import { useProjects } from "@/components/providers/ProjectsProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { currentUser, efficiencyTrend, spaceDistribution, optimizationJobs } from "@/lib/mock";
import type { ProjectStatus } from "@/lib/types";
import { cn, formatEta } from "@/lib/utils";

type RecentFilter = "all" | "in-progress" | "completed" | "archived";

function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** Simple line-art building used as the dashboard illustration (no photo). */
function BuildingSketch() {
  return (
    <svg viewBox="0 0 260 110" className="h-[96px] w-auto text-line-strong" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.25">
      <path d="M20 96h220" />
      <path d="M40 96V46l60-20 40 14v56" />
      <path d="M100 26v70" />
      <path d="M140 40l60-18 40 14v60" />
      <path d="M200 22v74" />
      {[52, 64, 76].map((y) => (
        <g key={y}>
          <path d={`M48 ${y}h44`} />
          <path d={`M108 ${y}h24`} />
          <path d={`M148 ${y - 8}h44`} />
          <path d={`M208 ${y - 8}h24`} />
        </g>
      ))}
      <path d="M24 96l10-6h8" />
      <path d="M8 96h12" />
      <path d="M160 96v-18h16v18" stroke="#1649d8" />
    </svg>
  );
}

const jobTones = ["success", "primary", "purple"] as const;

export function DashboardPage() {
  const router = useRouter();
  const { projects, setStatus } = useProjects();
  const { user } = useAuth();
  const { toast } = useToast();
  const [filter, setFilter] = useState<RecentFilter>("all");
  const [timelineView, setTimelineView] = useState<"week" | "month">("week");
  const [newOpen, setNewOpen] = useState(false);
  const [jobs, setJobs] = useState(optimizationJobs);
  const [hour, setHour] = useState<number | null>(null);

  // Clock-dependent greeting: resolve on the client after hydration.
  useEffect(() => {
    const tick = () => setHour(new Date().getHours());
    const id = window.setTimeout(tick, 0);
    const interval = window.setInterval(tick, 60_000);
    return () => {
      window.clearTimeout(id);
      window.clearInterval(interval);
    };
  }, []);

  // Simulated job progress (sample data only).
  useEffect(() => {
    const id = window.setInterval(() => {
      setJobs((list) =>
        list.map((j) =>
          j.progress >= 100
            ? j
            : { ...j, progress: Math.min(100, j.progress + 0.35), etaSeconds: Math.max(0, j.etaSeconds - 1) },
        ),
      );
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const firstName = (user?.name ?? currentUser.name).split(" ")[0];
  const greeting = hour === null ? "Welcome back" : greetingFor(hour);

  const recent = useMemo(() => {
    const list = projects.filter((p) => (filter === "all" ? p.status !== "archived" : p.status === filter));
    return list.slice(0, 3);
  }, [projects, filter]);

  const activeProjects = useMemo(
    () => projects.filter((p) => p.status === "in-progress" || p.status === "optimizing" || p.status === "completed").slice(0, 3),
    [projects],
  );

  const runningJobs = jobs.filter((j) => j.progress < 100).length;

  const menuFor = (id: string) => [
    { id: "open", label: "Open in Workspace", onSelect: () => router.push("/workspace") },
    { id: "optimize", label: "Run optimization", onSelect: () => router.push("/optimization") },
    {
      id: "archive",
      label: "Archive",
      separator: true,
      onSelect: () => {
        setStatus(id, "archived" as ProjectStatus);
        toast({ kind: "info", title: "Project archived" });
      },
    },
  ];

  // Timeline: current week Mon–Sun.
  const week = useMemo(() => {
    const now = hour === null ? new Date(2026, 10, 5) : new Date();
    const day = (now.getDay() + 6) % 7; // Monday = 0
    const monday = new Date(now);
    monday.setDate(now.getDate() - day);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return { label: d.toLocaleDateString("en-GB", { weekday: "short" }), date: d.getDate(), today: i === day };
    });
  }, [hour]);

  const timelineBars = [
    { name: activeProjects[0]?.name ?? "Community Centre", start: 1, end: 3, tone: "bg-success-bg text-success border-[#bbf7d0]" },
    { name: activeProjects[1]?.name ?? "Library Extension", start: 2, end: 5, tone: "bg-highlight text-primary border-[#c9d9ff]" },
    { name: activeProjects[2]?.name ?? "School Block", start: 3, end: 7, tone: "bg-[#ede9fe] text-[#6d28d9] border-[#ddd6fe]" },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Greeting */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink md:text-[28px] md:leading-9">
            {greeting}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted">Design, optimize and evaluate architectural spaces with intelligent tools.</p>
        </div>
        <div className="hidden md:block">
          <BuildingSketch />
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Layers />} value={projects.length} label="Total Projects" delta={<Delta value={33} />} />
        <StatCard icon={<LayoutGrid />} value={28} label="Layouts Generated" delta={<Delta value={47} />} />
        <StatCard icon={<BarChart3 />} value="86%" label="Avg. Area Efficiency" delta={<Delta value={5.2} />} />
        <StatCard icon={<Activity />} value={runningJobs} label="Running Jobs" />
      </div>
      <SampleDataNote />

      {/* Main grid */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <Card>
              <CardHeader title="Performance Overview" subtitle="Area efficiency across projects" />
              <LineChart data={efficiencyTrend} yMin={70} yMax={95} yTicks={6} height={230} ariaLabel="Area efficiency trend, January to February" />
            </Card>
            <Card>
              <CardHeader title="Space Utilization" subtitle="Community Centre · Layout A" />
              <DonutChart
                data={spaceDistribution.map((s) => ({ key: s.key, label: s.label, value: s.value }))}
                centerLabel="553 m²"
                centerSub="Built Area"
                size={150}
                ariaLabel="Space utilization by type"
              />
            </Card>
          </div>

          <Card>
            <CardHeader
              title="Recent Projects"
              action={
                <div className="flex items-center gap-3">
                  <Tabs
                    size="sm"
                    ariaLabel="Filter recent projects"
                    value={filter}
                    onChange={setFilter}
                    items={[
                      { value: "all", label: "All" },
                      { value: "in-progress", label: "In Progress" },
                      { value: "completed", label: "Completed" },
                      { value: "archived", label: "Archived" },
                    ]}
                  />
                  <Link href="/projects" className="hidden items-center gap-1 text-xs font-medium text-primary hover:underline sm:inline-flex">
                    View All <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              }
            />
            {recent.length === 0 ? (
              <EmptyState title="No projects in this view" description="Create a project or change the filter." action={<Button size="sm" onClick={() => setNewOpen(true)}>New Project</Button>} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recent.map((p, i) => (
                  <ProjectCard key={p.id} project={p} index={i} menu={menuFor(p.id)} />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right column */}
        <div className="flex min-w-0 flex-col gap-5">
          <Card>
            <CardHeader
              title={`Active Optimizations (${runningJobs})`}
              action={
                <Link href="/optimization" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                  View All <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {jobs.map((job, i) => {
                const tone = jobTones[i % jobTones.length];
                const pct = Math.round(job.progress);
                return (
                  <li key={job.id} className="flex items-center gap-3">
                    <span
                      className={cn(
                        "inline-flex h-11 w-12 shrink-0 items-center justify-center border text-sm font-bold rounded-sm",
                        tone === "success" && "border-[#bbf7d0] bg-success-bg text-success",
                        tone === "primary" && "border-[#c9d9ff] bg-highlight text-primary",
                        tone === "purple" && "border-[#ddd6fe] bg-[#ede9fe] text-[#6d28d9]",
                      )}
                    >
                      {pct}%
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-semibold text-ink">
                          {job.projectName} <span className="font-normal text-muted">— {job.stage}</span>
                        </p>
                        <span className="shrink-0 text-[11px] text-muted">{pct >= 100 ? "Done" : `${formatEta(job.etaSeconds)} left`}</span>
                      </div>
                      <ProgressBar value={job.progress} tone={tone} className="mt-1.5" label={`${job.projectName} progress`} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card>
            <CardHeader
              title={
                <span className="inline-flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" /> Project Timeline
                </span>
              }
              action={
                <Tabs
                  size="sm"
                  ariaLabel="Timeline range"
                  value={timelineView}
                  onChange={setTimelineView}
                  items={[
                    { value: "week", label: "Week" },
                    { value: "month", label: "Month" },
                  ]}
                />
              }
            />
            {timelineView === "week" ? (
              <div className="overflow-hidden">
                <div className="grid grid-cols-7 border-b border-line pb-2">
                  {week.map((d) => (
                    <div key={d.label} className={cn("flex flex-col items-center py-1 text-center", d.today && "border border-primary bg-highlight rounded-xs")}>
                      <span className="text-[11px] text-muted">{d.label}</span>
                      <span className={cn("text-sm font-semibold", d.today ? "text-primary" : "text-ink")}>{d.date}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-7 gap-y-1.5">
                  {timelineBars.map((bar) => (
                    <div
                      key={bar.name}
                      className={cn("truncate border px-2 py-1 text-[11px] font-medium rounded-xs", bar.tone)}
                      style={{ gridColumn: `${bar.start} / ${bar.end + 1}` }}
                      title={bar.name}
                    >
                      {bar.name}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <ul className="m-0 flex list-none flex-col p-0">
                {["Week 1", "Week 2", "Week 3", "Week 4"].map((w, i) => (
                  <li key={w} className="flex items-center justify-between border-b border-line py-2 text-sm last:border-b-0">
                    <span className="text-muted">{w}</span>
                    <span className="font-medium text-ink">{[2, 3, 1, 2][i]} milestones · {activeProjects[i % Math.max(1, activeProjects.length)]?.name ?? "—"}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* Quick actions */}
      <Card className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex items-center gap-3 lg:w-[220px]">
          <span className="inline-flex h-10 w-10 items-center justify-center border border-line bg-highlight text-primary rounded-sm">
            <Zap className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">Quick Actions</p>
            <p className="text-xs text-muted">Common tasks to get started</p>
          </div>
        </div>
        <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <button
            type="button"
            onClick={() => setNewOpen(true)}
            className="flex items-center gap-3 border border-primary bg-primary px-3 py-2.5 text-left text-white rounded-sm hover:bg-primary-hover"
          >
            <Plus className="h-5 w-5 shrink-0" />
            <span>
              <span className="block text-sm font-semibold">New Project</span>
              <span className="block text-xs opacity-80">Create a new architectural project</span>
            </span>
          </button>
          {[
            { href: "/space-planner", icon: FileText, title: "Open Space Planner", sub: "Design or edit floor plans" },
            { href: "/optimization", icon: Play, title: "Run Optimization", sub: "Generate optimized layouts" },
            { href: "/layouts", icon: GitCompare, title: "Compare Layouts", sub: "Evaluate and select the best design" },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="flex items-center gap-3 border border-line bg-surface px-3 py-2.5 text-left rounded-sm hover:border-line-strong hover:bg-highlight"
            >
              <a.icon className="h-5 w-5 shrink-0 text-primary" />
              <span>
                <span className="block text-sm font-semibold text-ink">{a.title}</span>
                <span className="block text-xs text-muted">{a.sub}</span>
              </span>
            </Link>
          ))}
        </div>
      </Card>

      <NewProjectModal open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  );
}
