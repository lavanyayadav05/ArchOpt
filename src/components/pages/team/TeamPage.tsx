"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  Layers,
  CheckSquare,
  BarChart3,
  UserPlus,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  MessageSquare,
  Upload,
  CheckCircle2,
  UserRound,
  Activity,
  Search,
  ArrowUpDown,
  CalendarDays,
  ListTodo,
  FolderPlus,
} from "lucide-react";
import { PageHeader } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { DropdownMenu, SelectMenu } from "@/components/ui/Dropdown";
import { Badge, Delta, type BadgeTone } from "@/components/ui/Badge";
import { Avatar, AvatarStack, ProgressBar, SampleDataNote, Skeleton, StatCard, EmptyState } from "@/components/ui/Misc";
import { Table, Th, Td, Tr } from "@/components/ui/Table";
import { DonutChart, BarChart, seriesBlues } from "@/components/charts";
import { FloorPlan } from "@/components/floorplan/FloorPlan";
import { useToast } from "@/components/providers/ToastProvider";
import { useProjects } from "@/components/providers/ProjectsProvider";
import { teamMembers, recentActivity, teamWorkload, layouts, communityCentrePlot } from "@/lib/mock";
import type { TeamMember, TeamRole, AccessRole, ActivityItem } from "@/lib/types";
import { validateEmail, validateRequired } from "@/lib/validation";
import { cn, uid, formatDate } from "@/lib/utils";

type TabKey = "overview" | "members" | "roles" | "assignment" | "activity";
const TABS: { value: TabKey; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "members", label: "Members" },
  { value: "roles", label: "Roles & Permissions" },
  { value: "assignment", label: "Project Assignment" },
  { value: "activity", label: "Activity" },
];
const isTab = (v: string | null): v is TabKey => TABS.some((t) => t.value === v);

const ROLES: TeamRole[] = ["Admin", "Designer", "Planner", "Analyst", "Visualizer"];
const ACCESS: AccessRole[] = ["Owner", "Editor", "Viewer"];
const roleTone: Record<TeamRole, BadgeTone> = { Admin: "info", Designer: "purple", Planner: "success", Analyst: "info", Visualizer: "purple" };
const roleColor: Record<TeamRole, string> = { Admin: seriesBlues[0], Designer: "#b4a6f2", Planner: "#9ad8b4", Analyst: seriesBlues[3], Visualizer: "#d9d2fb" };

const activityIcon: Record<ActivityItem["kind"], React.ComponentType<{ className?: string }>> = {
  edit: Pencil,
  comment: MessageSquare,
  upload: Upload,
  complete: CheckCircle2,
  join: UserRound,
  optimize: Activity,
};

const PERMISSIONS = ["View projects", "Edit layouts", "Run optimization", "Manage versions", "Invite members", "Billing"];
const defaultMatrix: Record<string, Record<TeamRole, boolean>> = {
  "View projects": { Admin: true, Designer: true, Planner: true, Analyst: true, Visualizer: true },
  "Edit layouts": { Admin: true, Designer: true, Planner: true, Analyst: false, Visualizer: false },
  "Run optimization": { Admin: true, Designer: false, Planner: true, Analyst: true, Visualizer: false },
  "Manage versions": { Admin: true, Designer: true, Planner: false, Analyst: false, Visualizer: false },
  "Invite members": { Admin: true, Designer: false, Planner: false, Analyst: false, Visualizer: false },
  Billing: { Admin: true, Designer: false, Planner: false, Analyst: false, Visualizer: false },
};

function timeAgo(iso: string): string {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${Math.max(1, m)} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function TeamPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      }
    >
      <TeamInner />
    </Suspense>
  );
}

function TeamInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();
  const { projects } = useProjects();
  const rawTab = params.get("tab");
  const tab: TabKey = isTab(rawTab) ? rawTab : "overview";
  const setTab = (t: TabKey) => router.replace(t === "overview" ? "/team" : `/team?tab=${t}`);

  const [members, setMembers] = useState<TeamMember[]>(teamMembers);
  const [tasksInProgress, setTasksInProgress] = useState(12);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [newTeamOpen, setNewTeamOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [meetOpen, setMeetOpen] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [matrix, setMatrix] = useState(defaultMatrix);
  const [assignments, setAssignments] = useState<Record<string, string[]>>(() => {
    const first = projects.slice(0, 5);
    const out: Record<string, string[]> = {};
    first.forEach((p, i) => {
      out[p.id] = teamMembers.slice(0, 2 + (i % 3)).map((m) => m.id);
    });
    return out;
  });
  const [memberQuery, setMemberQuery] = useState("");
  const [sort, setSort] = useState<{ key: keyof TeamMember; dir: "asc" | "desc" }>({ key: "name", dir: "asc" });
  const [activityKind, setActivityKind] = useState<"all" | ActivityItem["kind"]>("all");

  const activeProjects = useMemo(
    () => [
      { project: projects.find((p) => p.id === "prj-community-centre"), progress: 80, rooms: layouts[0].rooms },
      { project: projects.find((p) => p.id === "prj-library-extension"), progress: 60, rooms: layouts[1].rooms },
      { project: projects.find((p) => p.id === "prj-school-block"), progress: 75, rooms: layouts[2].rooms },
    ],
    [projects],
  );

  const rolesDistribution = useMemo(() => {
    const counts = new Map<TeamRole, number>();
    members.forEach((m) => counts.set(m.role, (counts.get(m.role) ?? 0) + 1));
    return ROLES.filter((r) => counts.has(r)).map((r) => ({ key: r, label: r, value: counts.get(r) ?? 0, color: roleColor[r] }));
  }, [members]);

  const updateMember = (id: string, patch: Partial<TeamMember>) => setMembers((list) => list.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const sortedMembers = useMemo(() => {
    const q = memberQuery.trim().toLowerCase();
    const filtered = members.filter((m) => !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.title.toLowerCase().includes(q));
    return [...filtered].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [members, memberQuery, sort]);

  const toggleSort = (key: keyof TeamMember) => setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  const memberMenu = (m: TeamMember) => (
    <DropdownMenu
      trigger={({ ref, toggle, ...aria }) => (
        <button ref={ref} type="button" onClick={toggle} aria-label={`Actions for ${m.name}`} className="inline-flex h-7 w-7 items-center justify-center text-muted rounded-xs hover:bg-highlight hover:text-ink" {...aria}>
          <MoreVertical className="h-4 w-4" />
        </button>
      )}
      items={[
        { id: "role", label: "Edit role", icon: <Pencil />, onSelect: () => setEditingRoleId(m.id) },
        { id: "remove", label: "Remove", icon: <Trash2 />, danger: true, separator: true, onSelect: () => setRemoveId(m.id), disabled: m.access === "Owner" },
      ]}
    />
  );

  const roleCell = (m: TeamMember) =>
    editingRoleId === m.id ? (
      <Select
        aria-label={`Role for ${m.name}`}
        value={m.role}
        autoFocus
        onChange={(e) => {
          updateMember(m.id, { role: e.target.value as TeamRole });
          setEditingRoleId(null);
          toast({ kind: "success", title: "Role updated", description: `${m.name} is now ${e.target.value}.` });
        }}
        onBlur={() => setEditingRoleId(null)}
        options={ROLES.map((r) => ({ value: r, label: r }))}
        className="w-32"
      />
    ) : (
      <Badge tone={roleTone[m.role]} size="sm">
        {m.role}
      </Badge>
    );

  const filteredActivity = recentActivity.filter((a) => activityKind === "all" || a.kind === activityKind);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Team"
        description="Manage your team, roles, projects and collaboration in one place."
        actions={
          <>
            <Button variant="outline" leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => setInviteOpen(true)}>
              Invite Member
            </Button>
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setNewTeamOpen(true)}>
              New Team
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard icon={<Users />} value={members.length} label="Team Members" />
        <StatCard icon={<Layers />} value={3} label="Active Projects" />
        <StatCard icon={<CheckSquare />} value={tasksInProgress} label="Tasks in Progress" />
        <StatCard icon={<BarChart3 />} value="87%" label="Team Productivity" delta={<Delta value={5} />} />
      </div>
      <SampleDataNote />

      <Tabs value={tab} onChange={setTab} items={TABS} variant="underline" ariaLabel="Team sections" />

      {tab === "overview" ? (
        <>
          <div className="grid gap-4 xl:grid-cols-3">
            <Card>
              <CardHeader
                title={`Team Members (${members.length})`}
                action={
                  <button type="button" onClick={() => setTab("members")} className="text-xs font-medium text-primary hover:underline">
                    View All →
                  </button>
                }
              />
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 border-b border-line py-2 last:border-b-0">
                    <Avatar name={m.name} online={m.online} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{m.name}</span>
                      <span className="block truncate text-xs text-muted">{m.title}</span>
                    </span>
                    {roleCell(m)}
                    {memberMenu(m)}
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <CardHeader title="Roles Distribution" />
              <DonutChart data={rolesDistribution} centerLabel={members.length} centerSub="Members" size={150} />
            </Card>

            <Card>
              <CardHeader
                title="Team Activity"
                action={
                  <button type="button" onClick={() => setTab("activity")} className="text-xs font-medium text-primary hover:underline">
                    View All →
                  </button>
                }
              />
              <ActivityTimeline items={recentActivity.slice(0, 4)} />
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <Card>
              <CardHeader
                title="Active Projects (3)"
                action={
                  <a href="/projects" className="text-xs font-medium text-primary hover:underline">
                    View All →
                  </a>
                }
              />
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {activeProjects.map((ap) => (
                  <li key={ap.project?.id ?? ap.progress} className="flex items-center gap-3">
                    <span className="w-16 shrink-0 border border-line bg-bg p-0.5">
                      <FloorPlan plot={communityCentrePlot} rooms={ap.rooms} thumbnail />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="mb-1 flex items-center justify-between gap-2 text-sm">
                        <span className="truncate font-medium text-ink">{ap.project?.name ?? "Project"}</span>
                        <span className="text-xs text-muted">{ap.progress}%</span>
                      </span>
                      <ProgressBar value={ap.progress} size="sm" label={`${ap.project?.name ?? "Project"} progress`} />
                    </span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <CardHeader title="Team Workload" subtitle="Open tasks per member" />
              <BarChart data={teamWorkload} yMax={10} emphasis={0} height={190} ariaLabel="Open tasks per team member" />
            </Card>

            <Card>
              <CardHeader title="Quick Actions" />
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Add Member", icon: UserPlus, onClick: () => setInviteOpen(true) },
                  { label: "Assign Project", icon: FolderPlus, onClick: () => setAssignOpen(true) },
                  { label: "Create Task", icon: ListTodo, onClick: () => setTaskOpen(true) },
                  { label: "Schedule Meet", icon: CalendarDays, onClick: () => setMeetOpen(true) },
                ].map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    onClick={a.onClick}
                    className="flex flex-col items-center gap-2 border border-line bg-surface px-2 py-4 text-ink rounded-sm hover:border-line-strong hover:bg-highlight"
                  >
                    <a.icon className="h-5 w-5 text-primary" />
                    <span className="text-xs font-medium">{a.label}</span>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </>
      ) : null}

      {tab === "members" ? (
        <Card>
          <CardHeader
            title="Members"
            action={<Input aria-label="Search members" placeholder="Search members…" leftIcon={<Search className="h-4 w-4" />} value={memberQuery} onChange={(e) => setMemberQuery(e.target.value)} className="w-56" />}
          />
          {sortedMembers.length === 0 ? (
            <EmptyState title="No members match" description="Try a different name, email or title." action={<Button size="sm" variant="outline" onClick={() => setMemberQuery("")}>Clear search</Button>} />
          ) : (
            <Table>
              <thead>
                <tr>
                  {(
                    [
                      ["name", "Name"],
                      ["email", "Email"],
                      ["title", "Title"],
                      ["role", "Role"],
                      ["access", "Access"],
                      ["tasks", "Tasks"],
                      ["online", "Status"],
                    ] as [keyof TeamMember, string][]
                  ).map(([key, label]) => (
                    <Th key={key} aria-sort={sort.key === key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
                      <button type="button" onClick={() => toggleSort(key)} className="inline-flex items-center gap-1 hover:text-ink">
                        {label}
                        <ArrowUpDown className={cn("h-3 w-3", sort.key === key ? "text-primary" : "text-line-strong")} />
                      </button>
                    </Th>
                  ))}
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {sortedMembers.map((m) => (
                  <Tr key={m.id}>
                    <Td>
                      <span className="flex items-center gap-2">
                        <Avatar name={m.name} size="sm" /> <span className="font-medium">{m.name}</span>
                      </span>
                    </Td>
                    <Td className="text-muted">{m.email}</Td>
                    <Td>{m.title}</Td>
                    <Td>{roleCell(m)}</Td>
                    <Td>
                      <Select aria-label={`Access for ${m.name}`} value={m.access} onChange={(e) => updateMember(m.id, { access: e.target.value as AccessRole })} options={ACCESS.map((a) => ({ value: a, label: a }))} className="w-28" />
                    </Td>
                    <Td align="center">{m.tasks}</Td>
                    <Td>
                      <Badge tone={m.online ? "success" : "neutral"} size="sm" dot>
                        {m.online ? "Online" : "Offline"}
                      </Badge>
                    </Td>
                    <Td align="right">{memberMenu(m)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      ) : null}

      {tab === "roles" ? (
        <Card>
          <CardHeader
            title="Roles & Permissions"
            subtitle="Permissions are stored in this session only."
            action={
              <Button size="sm" onClick={() => toast({ kind: "success", title: "Permissions saved", description: "Matrix stored for this session." })}>
                Save
              </Button>
            }
          />
          <Table>
            <thead>
              <tr>
                <Th>Permission</Th>
                {ROLES.map((r) => (
                  <Th key={r} align="center">
                    {r}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((p) => (
                <Tr key={p}>
                  <Td className="font-medium">{p}</Td>
                  {ROLES.map((r) => (
                    <Td key={r} align="center">
                      <span className="inline-flex justify-center">
                        <Checkbox
                          checked={matrix[p][r]}
                          onChange={(v) => setMatrix((mx) => ({ ...mx, [p]: { ...mx[p], [r]: v } }))}
                          disabled={r === "Admin" && p === "View projects"}
                        />
                        <span className="sr-only">
                          {p} for {r}
                        </span>
                      </span>
                    </Td>
                  ))}
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      ) : null}

      {tab === "assignment" ? (
        <Card>
          <CardHeader title="Project Assignment" subtitle="Tick members to assign them to a project." />
          <Table>
            <thead>
              <tr>
                <Th>Project</Th>
                {members.map((m) => (
                  <Th key={m.id} align="center">
                    {m.name.split(" ")[0]}
                  </Th>
                ))}
                <Th>Assigned</Th>
              </tr>
            </thead>
            <tbody>
              {projects.slice(0, 5).map((p) => {
                const assigned = assignments[p.id] ?? [];
                return (
                  <Tr key={p.id}>
                    <Td className="font-medium">{p.name}</Td>
                    {members.map((m) => (
                      <Td key={m.id} align="center">
                        <span className="inline-flex justify-center">
                          <Checkbox
                            checked={assigned.includes(m.id)}
                            onChange={(v) => setAssignments((a) => ({ ...a, [p.id]: v ? [...assigned, m.id] : assigned.filter((id) => id !== m.id) }))}
                          />
                          <span className="sr-only">
                            Assign {m.name} to {p.name}
                          </span>
                        </span>
                      </Td>
                    ))}
                    <Td>{assigned.length ? <AvatarStack names={assigned.map((id) => members.find((m) => m.id === id)?.name ?? "")} /> : <span className="text-xs text-muted">None</span>}</Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        </Card>
      ) : null}

      {tab === "activity" ? (
        <Card>
          <CardHeader
            title="Activity"
            action={
              <SelectMenu
                size="sm"
                value={activityKind}
                onChange={setActivityKind}
                prefix="Type:"
                options={[
                  { value: "all", label: "All" },
                  { value: "edit", label: "Edits" },
                  { value: "comment", label: "Comments" },
                  { value: "upload", label: "Uploads" },
                  { value: "complete", label: "Completions" },
                  { value: "join", label: "Joins" },
                  { value: "optimize", label: "Optimization" },
                ]}
                ariaLabel="Filter activity"
              />
            }
          />
          {filteredActivity.length === 0 ? <EmptyState title="No activity of this type" /> : <ActivityTimeline items={filteredActivity} detailed />}
        </Card>
      ) : null}

      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={(m) => {
          setMembers((list) => [...list, m]);
          toast({ kind: "success", title: "Invitation sent", description: `${m.name} added as ${m.role} (${m.access}).` });
        }}
      />
      <NameModal
        open={newTeamOpen}
        onClose={() => setNewTeamOpen(false)}
        title="New team"
        label="Team name"
        placeholder="Studio 4 — Civic"
        submitLabel="Create team"
        onSubmit={(name) => toast({ kind: "success", title: "Team created", description: `${name} is ready. Invite members to get started.` })}
      />
      <AssignModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        members={members}
        projects={projects.slice(0, 5).map((p) => ({ id: p.id, name: p.name }))}
        onAssign={(memberId, projectId) => {
          setAssignments((a) => ({ ...a, [projectId]: Array.from(new Set([...(a[projectId] ?? []), memberId])) }));
          toast({ kind: "success", title: "Project assigned", description: `${members.find((m) => m.id === memberId)?.name} assigned to ${projects.find((p) => p.id === projectId)?.name}.` });
        }}
      />
      <TaskModal
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        members={members}
        onCreate={(title, assigneeId) => {
          setTasksInProgress((n) => n + 1);
          updateMember(assigneeId, { tasks: (members.find((m) => m.id === assigneeId)?.tasks ?? 0) + 1 });
          toast({ kind: "success", title: "Task created", description: `“${title}” assigned to ${members.find((m) => m.id === assigneeId)?.name}.` });
        }}
      />
      <NameModal
        open={meetOpen}
        onClose={() => setMeetOpen(false)}
        title="Schedule meet"
        label="Meeting title"
        placeholder="Layout A review"
        submitLabel="Schedule"
        extra={<Input label="Date & time" type="datetime-local" />}
        onSubmit={(name) => toast({ kind: "info", title: "Meeting scheduled (demo)", description: `“${name}” — no calendar service is connected.` })}
      />
      <ConfirmDialog
        open={removeId !== null}
        onClose={() => setRemoveId(null)}
        title="Remove member"
        message={`Remove ${members.find((m) => m.id === removeId)?.name ?? "this member"} from the team? They will lose access to all projects.`}
        confirmLabel="Remove"
        destructive
        onConfirm={() => {
          setMembers((list) => list.filter((m) => m.id !== removeId));
          setRemoveId(null);
          toast({ kind: "info", title: "Member removed" });
        }}
      />
    </div>
  );
}

function ActivityTimeline({ items, detailed }: { items: ActivityItem[]; detailed?: boolean }) {
  return (
    <ol className="m-0 list-none p-0">
      {items.map((a, i) => {
        const Icon = activityIcon[a.kind];
        return (
          <li key={a.id} className="relative flex gap-3 pb-4 last:pb-0">
            {i < items.length - 1 ? <span className="absolute left-[13px] top-7 bottom-0 w-px bg-line" aria-hidden /> : null}
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center border border-line bg-highlight text-primary rounded-sm">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink">
                <span className="font-medium">{a.actor}</span> {a.action}
                {a.target ? <span className="text-muted"> · {a.target}</span> : null}
              </p>
              {detailed && a.detail ? <p className="text-xs text-muted">{a.detail}</p> : null}
              <p className="text-[11px] text-muted">{detailed ? `${formatDate(a.at)} · ` : ""}{timeAgo(a.at)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ---------------- modals ---------------- */

function InviteModal({ open, onClose, onInvite }: { open: boolean; onClose: () => void; onInvite: (m: TeamMember) => void }) {
  if (!open) return null;
  return <InviteForm onClose={onClose} onInvite={onInvite} />;
}

function InviteForm({ onClose, onInvite }: { onClose: () => void; onInvite: (m: TeamMember) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("Designer");
  const [access, setAccess] = useState<AccessRole>("Editor");
  const [touched, setTouched] = useState<{ name?: boolean; email?: boolean }>({});
  const nameError = touched.name ? validateRequired(name, "Name") : null;
  const emailError = touched.email ? validateEmail(email) : null;

  return (
    <Modal
      open
      onClose={onClose}
      title="Invite member"
      description="Invitations are stored locally — no email service is connected."
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="invite-form" leftIcon={<UserPlus className="h-4 w-4" />}>
            Send invite
          </Button>
        </>
      }
    >
      <form
        id="invite-form"
        className="flex flex-col gap-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setTouched({ name: true, email: true });
          if (validateRequired(name, "Name") || validateEmail(email)) return;
          onInvite({ id: uid("u"), name: name.trim(), email: email.trim(), title: "Pending invitation", role, access, online: false, tasks: 0 });
          onClose();
        }}
      >
        <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, name: true }))} error={nameError} data-autofocus required />
        <Input label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, email: true }))} error={emailError} required />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Role" value={role} onChange={(e) => setRole(e.target.value as TeamRole)} options={ROLES.map((r) => ({ value: r, label: r }))} />
          <Select label="Access" value={access} onChange={(e) => setAccess(e.target.value as AccessRole)} options={ACCESS.filter((a) => a !== "Owner").map((a) => ({ value: a, label: a }))} />
        </div>
      </form>
    </Modal>
  );
}

function NameModal({
  open,
  onClose,
  title,
  label,
  placeholder,
  submitLabel,
  onSubmit,
  extra,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  label: string;
  placeholder?: string;
  submitLabel: string;
  onSubmit: (name: string) => void;
  extra?: React.ReactNode;
}) {
  if (!open) return null;
  return <NameForm onClose={onClose} title={title} label={label} placeholder={placeholder} submitLabel={submitLabel} onSubmit={onSubmit} extra={extra} />;
}

function NameForm({ onClose, title, label, placeholder, submitLabel, onSubmit, extra }: Omit<React.ComponentProps<typeof NameModal>, "open">) {
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const error = touched ? validateRequired(name, label) : null;
  const id = `name-form-${title.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={id}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <form
        id={id}
        className="flex flex-col gap-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (validateRequired(name, label)) return;
          onSubmit(name.trim());
          onClose();
        }}
      >
        <Input label={label} placeholder={placeholder} value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)} error={error} data-autofocus required />
        {extra}
      </form>
    </Modal>
  );
}

function AssignModal({
  open,
  onClose,
  members,
  projects,
  onAssign,
}: {
  open: boolean;
  onClose: () => void;
  members: TeamMember[];
  projects: { id: string; name: string }[];
  onAssign: (memberId: string, projectId: string) => void;
}) {
  if (!open) return null;
  return <AssignForm onClose={onClose} members={members} projects={projects} onAssign={onAssign} />;
}

function AssignForm({ onClose, members, projects, onAssign }: Omit<React.ComponentProps<typeof AssignModal>, "open">) {
  const [memberId, setMemberId] = useState(members[0]?.id ?? "");
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  return (
    <Modal
      open
      onClose={onClose}
      title="Assign project"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onAssign(memberId, projectId);
              onClose();
            }}
          >
            Assign
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Select label="Team member" value={memberId} onChange={(e) => setMemberId(e.target.value)} options={members.map((m) => ({ value: m.id, label: m.name }))} data-autofocus />
        <Select label="Project" value={projectId} onChange={(e) => setProjectId(e.target.value)} options={projects.map((p) => ({ value: p.id, label: p.name }))} />
      </div>
    </Modal>
  );
}

function TaskModal({ open, onClose, members, onCreate }: { open: boolean; onClose: () => void; members: TeamMember[]; onCreate: (title: string, assigneeId: string) => void }) {
  if (!open) return null;
  return <TaskForm onClose={onClose} members={members} onCreate={onCreate} />;
}

function TaskForm({ onClose, members, onCreate }: Omit<React.ComponentProps<typeof TaskModal>, "open">) {
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState(members[0]?.id ?? "");
  const [due, setDue] = useState("");
  const [touched, setTouched] = useState(false);
  const error = touched ? validateRequired(title, "Task title") : null;
  return (
    <Modal
      open
      onClose={onClose}
      title="Create task"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="task-form">
            Create task
          </Button>
        </>
      }
    >
      <form
        id="task-form"
        className="flex flex-col gap-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (validateRequired(title, "Task title")) return;
          onCreate(title.trim(), assignee);
          onClose();
        }}
      >
        <Input label="Task title" placeholder="Review circulation on Layout B" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => setTouched(true)} error={error} data-autofocus required />
        <Select label="Assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)} options={members.map((m) => ({ value: m.id, label: m.name }))} />
        <Input label="Due date" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
      </form>
    </Modal>
  );
}
