"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Settings as SettingsIcon,
  Building2,
  Users,
  Link2,
  Bell,
  Palette,
  Pencil,
  Sun,
  Moon,
  Monitor,
  Database,
  Lock,
  CloudUpload,
  ChevronRight,
  Check,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Toggle, RadioGroup } from "@/components/ui/Checkbox";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Avatar, ProgressBar, Skeleton } from "@/components/ui/Misc";
import { Table, Th, Td, Tr } from "@/components/ui/Table";
import { useToast } from "@/components/providers/ToastProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme, type ThemeChoice } from "@/components/providers/ThemeProvider";
import { currentUser } from "@/lib/mock";
import { validateEmail, validateRequired, validatePassword, validatePositiveNumber } from "@/lib/validation";
import { cn } from "@/lib/utils";

type TabKey = "general" | "workspace" | "team" | "integrations" | "notifications" | "appearance";
const TABS: { value: TabKey; label: string; icon: React.ReactNode }[] = [
  { value: "general", label: "General", icon: <SettingsIcon className="h-4 w-4" /> },
  { value: "workspace", label: "Workspace", icon: <Building2 className="h-4 w-4" /> },
  { value: "team", label: "Team & Access", icon: <Users className="h-4 w-4" /> },
  { value: "integrations", label: "Data & Export", icon: <Link2 className="h-4 w-4" /> },
  { value: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
  { value: "appearance", label: "Appearance", icon: <Palette className="h-4 w-4" /> },
];
const isTab = (v: string | null): v is TabKey => TABS.some((t) => t.value === v);

const ACCENTS = [
  { id: "blue", hex: "#1649d8", hover: "#1240bf" },
  { id: "violet", hex: "#7c3aed", hover: "#6d28d9" },
  { id: "pink", hex: "#db2777", hover: "#be185d" },
  { id: "orange", hex: "#ea580c", hover: "#c2410c" },
  { id: "green", hex: "#16a34a", hover: "#15803d" },
  { id: "teal", hex: "#0d9488", hover: "#0f766e" },
];

const NOTIFICATION_ROWS = [
  { key: "optimization", label: "Optimization completed" },
  { key: "comments", label: "Comments on my layouts" },
  { key: "mentions", label: "Mentions" },
  { key: "digest", label: "Weekly digest" },
] as const;

interface SettingsState {
  unit: "metric" | "imperial";
  defaultView: "2d" | "3d";
  autoSave: boolean;
  gridSize: "0.5" | "1.0" | "2.0";
  snapToGrid: boolean;
  showMeasurements: boolean;
  accent: string;
  density: "comfortable" | "compact";
  fontSize: "14" | "15" | "16";
  workspaceName: string;
  plotWidth: string;
  plotHeight: string;
  corridorWidth: string;
  turningArea: string;
  candidateCount: number;
  timeBudget: string;
  defaultRole: "Editor" | "Viewer";
  linkSharing: boolean;
  domains: string[];
  notifications: Record<(typeof NOTIFICATION_ROWS)[number]["key"], { email: boolean; inApp: boolean }>;
}

const DEFAULTS: SettingsState = {
  unit: "metric",
  defaultView: "2d",
  autoSave: true,
  gridSize: "1.0",
  snapToGrid: true,
  showMeasurements: true,
  accent: "blue",
  density: "comfortable",
  fontSize: "14",
  workspaceName: "IGDTUW Studio 4",
  plotWidth: "30",
  plotHeight: "20",
  corridorWidth: "1.8",
  turningArea: "2.25",
  candidateCount: 4,
  timeBudget: "60",
  defaultRole: "Editor",
  linkSharing: false,
  domains: ["igdtuw.ac.in"],
  notifications: {
    optimization: { email: true, inApp: true },
    comments: { email: false, inApp: true },
    mentions: { email: true, inApp: true },
    digest: { email: true, inApp: false },
  },
};

const STORAGE_KEY = "archopt.settings";

function readSaved(): SettingsState {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<SettingsState>) };
  } catch {
    return DEFAULTS;
  }
}

export function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-[420px] w-full" />
        </div>
      }
    >
      <SettingsInner />
    </Suspense>
  );
}

function SettingsInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const rawTab = params.get("tab");
  const tab: TabKey = isTab(rawTab) ? rawTab : "general";
  const setTab = (t: TabKey) => router.replace(t === "general" ? "/settings" : `/settings?tab=${t}`);

  const [saved, setSaved] = useState<SettingsState>(readSaved);
  const [draft, setDraft] = useState<SettingsState>(saved);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const patch = (p: Partial<SettingsState>) => setDraft((d) => ({ ...d, ...p }));

  const [profile, setProfile] = useState(() => ({
    name: user?.name ?? currentUser.name,
    email: user?.email ?? currentUser.email,
    organization: user?.organization ?? "IGDTUW",
  }));
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [domainInput, setDomainInput] = useState("");
  const { choice: themeChoice, setChoice: setThemeChoice } = useTheme();

  // Apply the saved accent colour to the document (DOM side effect only).
  useEffect(() => {
    const a = ACCENTS.find((x) => x.id === saved.accent) ?? ACCENTS[0];
    const root = document.documentElement;
    root.style.setProperty("--color-primary", a.hex);
    root.style.setProperty("--color-primary-hover", a.hover);
  }, [saved.accent]);

  const save = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      /* storage unavailable */
    }
    setSaved(draft);
    toast({ kind: "success", title: "Settings saved", description: "Stored in this browser." });
  };
  const discard = () => setDraft(saved);

  const selectAccent = (id: string) => {
    const a = ACCENTS.find((x) => x.id === id) ?? ACCENTS[0];
    document.documentElement.style.setProperty("--color-primary", a.hex);
    document.documentElement.style.setProperty("--color-primary-hover", a.hover);
    patch({ accent: id });
  };

  const addDomain = () => {
    const d = domainInput.trim().toLowerCase();
    if (!d || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(d)) {
      toast({ kind: "error", title: "Invalid domain", description: "Enter a domain like studio.com." });
      return;
    }
    if (!draft.domains.includes(d)) patch({ domains: [...draft.domains, d] });
    setDomainInput("");
  };

  const appearanceCard = (full?: boolean) => (
    <Card>
      <CardHeader title="Appearance" subtitle="Choose your theme and interface style." />
      <div className={cn("grid gap-2", full ? "grid-cols-3 max-w-md" : "grid-cols-3")}>
        {([
          { id: "light", label: "Light", icon: Sun },
          { id: "dark", label: "Dark", icon: Moon },
          { id: "system", label: "System", icon: Monitor },
        ] as { id: ThemeChoice; label: string; icon: typeof Sun }[]).map((t) => {
          const active = themeChoice === t.id;
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={active}
              onClick={() => setThemeChoice(t.id)}
              className={cn(
                "relative flex flex-col items-center gap-2 border px-2 py-4 rounded-sm",
                active ? "border-primary bg-highlight/50" : "border-line bg-surface hover:border-line-strong",
              )}
            >
              {active ? (
                <span className="absolute right-1.5 top-1.5 inline-flex h-4 w-4 items-center justify-center bg-primary text-white rounded-xs">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              ) : null}
              <t.icon className="h-5 w-5 text-ink" />
              <span className="text-sm font-medium text-ink">{t.label}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted">The theme applies immediately and is remembered on this device. System follows your operating system.</p>
      <p className="mt-4 mb-2 text-xs font-semibold text-ink">Accent Colour</p>
      <div className="flex gap-2" role="group" aria-label="Accent colour">
        {ACCENTS.map((a) => {
          const active = draft.accent === a.id;
          return (
            <button
              key={a.id}
              type="button"
              aria-label={`${a.id} accent`}
              aria-pressed={active}
              onClick={() => selectAccent(a.id)}
              className={cn("h-8 w-8 border-2 rounded-xs", active ? "border-ink" : "border-transparent hover:border-line-strong")}
              style={{ background: a.hex }}
            />
          );
        })}
      </div>
    </Card>
  );

  return (
    <div className="flex flex-col gap-5 pb-16">
      <PageHeader title="Settings" description="Manage your account, workspace, preferences and project settings." />
      <Tabs value={tab} onChange={setTab} items={TABS} variant="segmented" ariaLabel="Settings sections" className="w-fit max-w-full" />

      {tab === "general" ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader title="Account Profile" action={<Button size="sm" variant="outline" leftIcon={<Pencil className="h-3.5 w-3.5" />} onClick={() => setProfileOpen(true)}>Edit Profile</Button>} />
              <div className="flex items-center gap-4">
                <Avatar name={profile.name} size="lg" />
                <div>
                  <p className="text-base font-semibold text-ink">{profile.name}</p>
                  <p className="text-sm text-muted">{profile.email}</p>
                  <p className="text-xs text-muted">{profile.organization}</p>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Preferences" />
              <div className="flex flex-col divide-y divide-line">
                <SettingRow label="Default Unit">
                  <Select aria-label="Default unit" value={draft.unit} onChange={(e) => patch({ unit: e.target.value as SettingsState["unit"] })} options={[{ value: "metric", label: "Metric (m, m²)" }, { value: "imperial", label: "Imperial (ft, ft²)" }]} className="w-48" />
                </SettingRow>
                <SettingRow label="Default View">
                  <Select aria-label="Default view" value={draft.defaultView} onChange={(e) => patch({ defaultView: e.target.value as SettingsState["defaultView"] })} options={[{ value: "2d", label: "2D Layout" }, { value: "3d", label: "3D Preview" }]} className="w-48" />
                </SettingRow>
                <SettingRow label="Auto-Save" description="Automatically save your work while designing">
                  <Toggle checked={draft.autoSave} onChange={(v) => patch({ autoSave: v })} label="Auto-save" />
                </SettingRow>
              </div>
            </Card>

            <Card>
              <CardHeader title="Project Settings" />
              <div className="flex flex-col divide-y divide-line">
                <SettingRow label="Default Grid Size">
                  <Select aria-label="Default grid size" value={draft.gridSize} onChange={(e) => patch({ gridSize: e.target.value as SettingsState["gridSize"] })} options={[{ value: "0.5", label: "0.5 m" }, { value: "1.0", label: "1.0 m" }, { value: "2.0", label: "2.0 m" }]} className="w-48" />
                </SettingRow>
                <SettingRow label="Snap to Grid" description="Align elements to the grid for accurate layouts">
                  <Toggle checked={draft.snapToGrid} onChange={(v) => patch({ snapToGrid: v })} label="Snap to grid" />
                </SettingRow>
                <SettingRow label="Show Measurements" description="Display area and dimension labels on layouts">
                  <Toggle checked={draft.showMeasurements} onChange={(v) => patch({ showMeasurements: v })} label="Show measurements" />
                </SettingRow>
              </div>
            </Card>

            <Card className="border-danger/40">
              <CardHeader title="Danger Zone" subtitle="Irreversible actions for this workspace." />
              <Button variant="danger" onClick={() => setDeleteOpen(true)}>
                Delete workspace
              </Button>
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            {appearanceCard()}
            <Card>
              <CardHeader title="Data & Access" />
              <ul className="m-0 flex list-none flex-col divide-y divide-line p-0">
                <li className="py-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center border border-line bg-highlight text-primary rounded-sm">
                      <Database className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink">Manage Storage</span>
                      <span className="text-xs text-muted">3.2 GB of 10 GB used</span>
                    </span>
                  </div>
                  <ProgressBar value={32} size="sm" className="mt-2" label="Storage used" />
                </li>
                <li>
                  <button type="button" onClick={() => setPasswordOpen(true)} className="flex w-full items-center gap-3 py-3 text-left hover:bg-bg">
                    <span className="inline-flex h-9 w-9 items-center justify-center border border-line bg-highlight text-primary rounded-sm">
                      <Lock className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink">Security & Login</span>
                      <span className="text-xs text-muted">Change password, enable 2FA</span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted" />
                  </button>
                </li>
                <li>
                  <Link href="/workspace/versions" className="flex w-full items-center gap-3 py-3 hover:bg-bg">
                    <span className="inline-flex h-9 w-9 items-center justify-center border border-line bg-highlight text-primary rounded-sm">
                      <CloudUpload className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink">Backup & Restore</span>
                      <span className="text-xs text-muted">Restore previous versions of your projects</span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted" />
                  </Link>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      ) : null}

      {tab === "workspace" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader title="Workspace" />
            <div className="flex flex-col gap-4">
              <Input label="Workspace name" value={draft.workspaceName} onChange={(e) => patch({ workspaceName: e.target.value })} error={validateRequired(draft.workspaceName, "Workspace name")} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Default plot width" suffix="m" inputMode="decimal" value={draft.plotWidth} onChange={(e) => patch({ plotWidth: e.target.value })} error={validatePositiveNumber(draft.plotWidth, "Plot width", 500)} />
                <Input label="Default plot height" suffix="m" inputMode="decimal" value={draft.plotHeight} onChange={(e) => patch({ plotHeight: e.target.value })} error={validatePositiveNumber(draft.plotHeight, "Plot height", 500)} />
              </div>
            </div>
          </Card>
          <Card>
            <CardHeader title="Accessibility Constraints" subtitle="Defaults applied to new projects; layouts are checked against them." />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Corridor width" suffix="m" inputMode="decimal" value={draft.corridorWidth} onChange={(e) => patch({ corridorWidth: e.target.value })} error={validatePositiveNumber(draft.corridorWidth, "Corridor width", 10)} hint="Minimum clear width" />
              <Input label="Turning area" suffix="m²" inputMode="decimal" value={draft.turningArea} onChange={(e) => patch({ turningArea: e.target.value })} error={validatePositiveNumber(draft.turningArea, "Turning area", 50)} hint="e.g. 1.5 m × 1.5 m" />
            </div>
          </Card>
          <Card className="xl:col-span-2">
            <CardHeader title="Optimization Defaults" />
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="candidate-count" className="block text-xs font-semibold text-ink">
                  Candidate layouts per run: {draft.candidateCount}
                </label>
                <input id="candidate-count" type="range" min={3} max={5} value={draft.candidateCount} onChange={(e) => patch({ candidateCount: Number(e.target.value) })} className="mt-2 w-full accent-primary" />
                <p className="mt-1 text-xs text-muted">The MVP generates 3–5 feasible alternatives for comparison.</p>
              </div>
              <Input label="Time budget" suffix="s" inputMode="numeric" value={draft.timeBudget} onChange={(e) => patch({ timeBudget: e.target.value })} error={validatePositiveNumber(draft.timeBudget, "Time budget", 3600)} hint="Upper bound for a single optimization job" />
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "team" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader title="Team & Access" />
            <div className="flex flex-col divide-y divide-line">
              <SettingRow label="Default role for invitees">
                <Select aria-label="Default role" value={draft.defaultRole} onChange={(e) => patch({ defaultRole: e.target.value as SettingsState["defaultRole"] })} options={[{ value: "Editor", label: "Editor" }, { value: "Viewer", label: "Viewer" }]} className="w-40" />
              </SettingRow>
              <SettingRow label="Allow link sharing" description="Anyone with a link can view shared layouts">
                <Toggle checked={draft.linkSharing} onChange={(v) => patch({ linkSharing: v })} label="Allow link sharing" />
              </SettingRow>
            </div>
          </Card>
          <Card>
            <CardHeader title="Domain Allow-list" subtitle="Only emails from these domains can be invited." />
            <div className="flex gap-2">
              <Input aria-label="Domain" placeholder="studio.com" value={domainInput} onChange={(e) => setDomainInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addDomain(); } }} className="flex-1" />
              <Button variant="outline" onClick={addDomain}>
                Add
              </Button>
            </div>
            <ul className="mt-3 flex list-none flex-wrap gap-2 p-0">
              {draft.domains.map((d) => (
                <li key={d} className="inline-flex h-7 items-center gap-1.5 border border-line bg-bg pl-2 pr-1 text-xs text-ink rounded-xs">
                  {d}
                  <button type="button" aria-label={`Remove ${d}`} onClick={() => patch({ domains: draft.domains.filter((x) => x !== d) })} className="inline-flex h-5 w-5 items-center justify-center text-muted rounded-xs hover:bg-danger-bg hover:text-danger">
                    <X className="h-3 w-3" />
                  </button>
                </li>
              ))}
              {draft.domains.length === 0 ? <li className="text-xs text-muted">No domains — anyone can be invited.</li> : null}
            </ul>
          </Card>
        </div>
      ) : null}

      {tab === "integrations" ? (
        <div className="grid gap-4 xl:grid-cols-3">
          <Card>
            <CardHeader title="Optimization engine" subtitle="Runs locally in your browser." action={<Badge tone="success" size="sm">Ready</Badge>} />
            <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm">
              <li className="flex items-center justify-between border-b border-line py-2"><span className="text-ink">Language</span><span className="text-xs text-muted">TypeScript</span></li>
              <li className="flex items-center justify-between border-b border-line py-2"><span className="text-ink">Search strategies</span><span className="text-xs text-muted">Constraint search, simulated annealing</span></li>
              <li className="flex items-center justify-between py-2"><span className="text-ink">Reproducibility</span><span className="text-xs text-muted">Seeded, so equal inputs give equal results</span></li>
            </ul>
          </Card>
          <Card>
            <CardHeader title="Data storage" subtitle="Where your work is kept." action={<Badge tone="info" size="sm">This device</Badge>} />
            <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm">
              <li className="flex items-center justify-between border-b border-line py-2"><span className="text-ink">Preferences &amp; session</span><span className="text-xs text-muted">Browser storage</span></li>
              <li className="flex items-center justify-between border-b border-line py-2"><span className="text-ink">Layouts</span><span className="text-xs text-muted">Export as JSON, re-import any time</span></li>
              <li className="flex items-center justify-between py-2"><span className="text-ink">Privacy</span><span className="text-xs text-muted">Nothing leaves your browser</span></li>
            </ul>
          </Card>
          <Card>
            <CardHeader title="Export Targets" />
            <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm">
              {[
                { name: "SVG floor plans", status: "Available", tone: "success" as const },
                { name: "JSON layouts", status: "Available", tone: "success" as const },
                { name: "PDF reports", status: "Via browser print", tone: "info" as const },
              ].map((e) => (
                <li key={e.name} className="flex items-center justify-between border-b border-line py-2 last:border-b-0">
                  <span className="text-ink">{e.name}</span>
                  <Badge tone={e.tone} size="sm">{e.status}</Badge>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      ) : null}

      {tab === "notifications" ? (
        <Card>
          <CardHeader title="Notifications" subtitle="Choose where each type of notification is delivered." />
          <Table>
            <thead>
              <tr>
                <Th>Event</Th>
                <Th align="center">Email</Th>
                <Th align="center">In-app</Th>
              </tr>
            </thead>
            <tbody>
              {NOTIFICATION_ROWS.map((row) => (
                <Tr key={row.key}>
                  <Td className="font-medium">{row.label}</Td>
                  <Td align="center">
                    <span className="inline-flex"><Toggle checked={draft.notifications[row.key].email} onChange={(v) => patch({ notifications: { ...draft.notifications, [row.key]: { ...draft.notifications[row.key], email: v } } })} label={`${row.label} by email`} /></span>
                  </Td>
                  <Td align="center">
                    <span className="inline-flex"><Toggle checked={draft.notifications[row.key].inApp} onChange={(v) => patch({ notifications: { ...draft.notifications, [row.key]: { ...draft.notifications[row.key], inApp: v } } })} label={`${row.label} in app`} /></span>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      ) : null}

      {tab === "appearance" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {appearanceCard(true)}
          <Card>
            <CardHeader title="Density & Text" />
            <p className="mb-2 text-xs font-semibold text-ink">Density</p>
            <RadioGroup
              name="density"
              value={draft.density}
              onChange={(v) => patch({ density: v })}
              inline
              options={[
                { value: "comfortable", label: "Comfortable", description: "Default spacing" },
                { value: "compact", label: "Compact", description: "Tighter rows and panels" },
              ]}
            />
            <Select label="Font size" value={draft.fontSize} onChange={(e) => patch({ fontSize: e.target.value as SettingsState["fontSize"] })} options={[{ value: "14", label: "14 px (default)" }, { value: "15", label: "15 px" }, { value: "16", label: "16 px" }]} className="mt-4 w-48" />
          </Card>
        </div>
      ) : null}

      {/* Sticky save bar */}
      {dirty ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface px-4 py-3 shadow-panel lg:left-[232px]">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3">
            <p className="text-sm text-ink">You have unsaved changes.</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={discard}>
                Discard
              </Button>
              <Button onClick={save}>Save changes</Button>
            </div>
          </div>
        </div>
      ) : null}

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} profile={profile} onSave={(p) => { setProfile(p); toast({ kind: "success", title: "Profile updated" }); }} />
      <PasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} onSave={() => toast({ kind: "success", title: "Password updated", description: "Your password has been changed on this device." })} />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete workspace"
        message="This would permanently remove all projects, layouts and versions in this workspace."
        confirmLabel="Delete workspace"
        destructive
        onConfirm={() => {
          setDeleteOpen(false);
          toast({ kind: "info", title: "Workspace kept", description: "The sample workspace cannot be deleted." });
        }}
      />
    </div>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        {description ? <p className="text-xs text-muted">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

/* ---------------- modals ---------------- */

interface Profile {
  name: string;
  email: string;
  organization: string;
}

function ProfileModal({ open, onClose, profile, onSave }: { open: boolean; onClose: () => void; profile: Profile; onSave: (p: Profile) => void }) {
  if (!open) return null;
  return <ProfileForm onClose={onClose} profile={profile} onSave={onSave} />;
}

function ProfileForm({ onClose, profile, onSave }: { onClose: () => void; profile: Profile; onSave: (p: Profile) => void }) {
  const [draft, setDraft] = useState(profile);
  const [touched, setTouched] = useState(false);
  const errors = { name: validateRequired(draft.name, "Name"), email: validateEmail(draft.email) };
  return (
    <Modal
      open
      onClose={onClose}
      title="Edit profile"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="profile-form">
            Save profile
          </Button>
        </>
      }
    >
      <form
        id="profile-form"
        className="flex flex-col gap-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (errors.name || errors.email) return;
          onSave({ ...draft, name: draft.name.trim(), email: draft.email.trim() });
          onClose();
        }}
      >
        <Input label="Full name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} error={touched ? errors.name : null} data-autofocus required />
        <Input label="Email address" type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} error={touched ? errors.email : null} required />
        <Input label="Organization" value={draft.organization} onChange={(e) => setDraft({ ...draft, organization: e.target.value })} />
      </form>
    </Modal>
  );
}

function PasswordModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: () => void }) {
  if (!open) return null;
  return <PasswordForm onClose={onClose} onSave={onSave} />;
}

function PasswordForm({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [twoFactor, setTwoFactor] = useState(false);
  const [touched, setTouched] = useState(false);
  const errors = {
    current: validateRequired(current, "Current password"),
    next: validatePassword(next, { strong: true }),
    confirm: !confirm ? "Please confirm the new password." : confirm !== next ? "Passwords do not match." : null,
  };
  return (
    <Modal
      open
      onClose={onClose}
      title="Security & Login"
      description="Change your password or enable two-factor authentication."
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="password-form">
            Update
          </Button>
        </>
      }
    >
      <form
        id="password-form"
        className="flex flex-col gap-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (errors.current || errors.next || errors.confirm) return;
          onSave();
          onClose();
        }}
      >
        <Input label="Current password" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} error={touched ? errors.current : null} data-autofocus required />
        <Input label="New password" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} error={touched ? errors.next : null} hint="8+ characters, one uppercase letter and one number" required />
        <Input label="Confirm new password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={touched ? errors.confirm : null} required />
        <Toggle checked={twoFactor} onChange={setTwoFactor} label="Enable two-factor authentication" description="Adds a one-time code from an authenticator app when you sign in" />
      </form>
    </Modal>
  );
}
