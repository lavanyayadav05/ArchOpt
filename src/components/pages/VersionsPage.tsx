"use client";

import { useMemo, useState } from "react";
import { History, GitCompare, Plus, RotateCcw, Download, Trash2, ArrowLeftRight, Eye } from "lucide-react";
import { PageHeader } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { DropdownMenu, SelectMenu } from "@/components/ui/Dropdown";
import { Badge, Delta } from "@/components/ui/Badge";
import { KeyValue, SampleDataNote } from "@/components/ui/Misc";
import { FloorPlan } from "@/components/floorplan/FloorPlan";
import { useToast } from "@/components/providers/ToastProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { layoutVersions, getLayout, currentLayout, communityCentrePlot, currentUser } from "@/lib/mock";
import { validateRequired } from "@/lib/validation";
import { downloadJson, timeAgo } from "@/lib/download";
import { cn, uid } from "@/lib/utils";
import type { LayoutVersion, Room } from "@/lib/types";

function roomsFor(v: LayoutVersion | undefined): Room[] {
  if (!v) return currentLayout.rooms;
  return getLayout(v.layoutId)?.rooms ?? currentLayout.rooms;
}

function diffRooms(prev: Room[], next: Room[]) {
  const prevIds = new Set(prev.map((r) => r.id));
  const nextById = new Map(next.map((r) => [r.id, r]));
  const added = next.filter((r) => !prevIds.has(r.id)).map((r) => r.id);
  const removed = prev.filter((r) => !nextById.has(r.id)).map((r) => r.id);
  const modified = prev
    .filter((r) => {
      const n = nextById.get(r.id);
      return n && (n.x !== r.x || n.y !== r.y || n.width !== r.width || n.height !== r.height);
    })
    .map((r) => r.id);
  return { added, removed, modified };
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function VersionsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const me = user?.name ?? currentUser.name;

  const [versions, setVersions] = useState<LayoutVersion[]>(layoutVersions);
  const [selectedId, setSelectedId] = useState(layoutVersions[0].id);
  const [compareOpen, setCompareOpen] = useState(true);
  const [leftId, setLeftId] = useState(layoutVersions[1].id);
  const [rightId, setRightId] = useState(layoutVersions[0].id);
  const [newOpen, setNewOpen] = useState(false);
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const selected = versions.find((v) => v.id === selectedId) ?? versions[0];
  const left = versions.find((v) => v.id === leftId);
  const right = versions.find((v) => v.id === rightId);
  const leftRooms = roomsFor(left);
  const rightRooms = roomsFor(right);
  const diff = useMemo(() => diffRooms(leftRooms, rightRooms), [leftRooms, rightRooms]);
  const options = versions.map((v) => ({ value: v.id, label: `${v.label}${v.current ? " (Current)" : ""}` }));

  const restore = (id: string) => {
    setVersions((list) => list.map((v) => ({ ...v, current: v.id === id })));
    setSelectedId(id);
    setRightId(id);
    const v = versions.find((x) => x.id === id);
    toast({ kind: "success", title: `Restored ${v?.label ?? "version"}`, description: "This version is now current (local state only)." });
  };

  const remove = (id: string) => {
    const v = versions.find((x) => x.id === id);
    if (!v || v.current) return;
    setVersions((list) => list.filter((x) => x.id !== id));
    if (selectedId === id) setSelectedId(versions.find((x) => x.current)?.id ?? versions[0].id);
    if (leftId === id) setLeftId(versions.find((x) => x.id !== id)?.id ?? "");
    if (rightId === id) setRightId(versions.find((x) => x.current)?.id ?? "");
    toast({ kind: "info", title: `${v.label} deleted` });
  };

  const download = (v: LayoutVersion) => {
    downloadJson(`community-centre-layout-a-${v.label}.json`, { version: v.label, title: v.title, notes: v.notes, plot: communityCentrePlot, rooms: roomsFor(v) });
    toast({ kind: "success", title: `${v.label} downloaded` });
  };

  const createVersion = (title: string, notes: string) => {
    const last = versions[0];
    const [major, minor] = (last?.label.replace("v", "") ?? "2.3").split(".").map(Number);
    const label = `v${major}.${(minor ?? 0) + 1}`;
    const v: LayoutVersion = {
      id: uid("ver"),
      label,
      title,
      notes,
      author: me,
      at: new Date().toISOString(),
      layoutId: last?.layoutId ?? "lay-a",
      changes: [title],
      current: true,
    };
    setVersions((list) => [v, ...list.map((x) => ({ ...x, current: false }))]);
    setSelectedId(v.id);
    setLeftId(last?.id ?? "");
    setRightId(v.id);
    setNewOpen(false);
    toast({ kind: "success", title: `${label} created` });
  };

  return (
    <>
      <PageHeader title="Versions" description="Track, compare and restore different versions of your layouts." />

      <div className="mb-4 flex flex-wrap items-center gap-3 border border-line bg-surface px-4 py-3 shadow-card rounded-md">
        <span className="inline-flex h-9 w-9 items-center justify-center border border-line bg-highlight text-primary rounded-sm">
          <History className="h-4 w-4" />
        </span>
        <h2 className="text-base font-semibold text-ink">Community Centre – Layout A</h2>
        <Badge tone="info">{versions.length} versions</Badge>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" leftIcon={<GitCompare className="h-4 w-4" />} aria-pressed={compareOpen} onClick={() => setCompareOpen((o) => !o)}>
            Compare
          </Button>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setNewOpen(true)}>
            New Version
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[260px_1fr_280px]">
        {/* History */}
        <Card className="h-fit">
          <CardHeader title="Version History" />
          <ol className="relative m-0 ml-1.5 flex list-none flex-col gap-1 border-l border-line p-0 pl-4" aria-label="Version history">
            {versions.map((v) => {
              const active = v.id === selectedId;
              return (
                <li key={v.id} className="relative">
                  <span className={cn("absolute -left-[21px] top-3 h-2 w-2 border", active || v.current ? "border-primary bg-primary" : "border-line-strong bg-surface")} aria-hidden />
                  <div className={cn("flex items-start gap-2 border px-2.5 py-2 rounded-sm", active ? "border-primary bg-highlight/50" : "border-transparent hover:bg-bg")}>
                    <button type="button" onClick={() => setSelectedId(v.id)} aria-current={active ? "true" : undefined} className="min-w-0 flex-1 text-left">
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-ink">{v.label}</span>
                        {v.current ? (
                          <Badge tone="primary" size="sm">
                            Current
                          </Badge>
                        ) : null}
                      </span>
                      <span className="block truncate text-xs text-ink">{v.title}</span>
                      <span className="block text-[11px] text-muted">{timeAgo(v.at)}</span>
                    </button>
                    <DropdownMenu
                      trigger={({ ref, toggle, ...aria }) => (
                        <button ref={ref} type="button" onClick={toggle} aria-label={`Actions for ${v.label}`} className="inline-flex h-7 w-7 shrink-0 items-center justify-center text-muted rounded-xs hover:bg-highlight hover:text-ink" {...aria}>
                          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden>
                            <circle cx="8" cy="3" r="1.4" />
                            <circle cx="8" cy="8" r="1.4" />
                            <circle cx="8" cy="13" r="1.4" />
                          </svg>
                        </button>
                      )}
                      items={[
                        { id: "view", label: "View", icon: <Eye />, onSelect: () => { setSelectedId(v.id); setRightId(v.id); setCompareOpen(true); } },
                        { id: "restore", label: "Restore", icon: <RotateCcw />, disabled: Boolean(v.current), onSelect: () => setRestoreId(v.id) },
                        { id: "download", label: "Download", icon: <Download />, onSelect: () => download(v) },
                        { id: "delete", label: "Delete", icon: <Trash2 />, danger: true, separator: true, disabled: Boolean(v.current), onSelect: () => setDeleteId(v.id) },
                      ]}
                    />
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>

        {/* Comparison + summary */}
        <div className="flex min-w-0 flex-col gap-4">
          {compareOpen ? (
            <Card>
              <CardHeader
                title="Version Comparison"
                action={
                  <div className="flex flex-wrap items-center gap-2">
                    <SelectMenu size="sm" value={leftId} onChange={setLeftId} options={options} ariaLabel="Previous version" />
                    <ArrowLeftRight className="h-4 w-4 text-muted" aria-hidden />
                    <SelectMenu size="sm" value={rightId} onChange={setRightId} options={options} ariaLabel="Current version" />
                  </div>
                }
              />
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Badge className="mb-2">{left?.label ?? "—"}</Badge>
                  <div className="border border-line bg-bg p-2 rounded-sm">
                    <FloorPlan plot={communityCentrePlot} rooms={leftRooms} showLabels={false} showDimensions={false} diff={{ removed: diff.removed }} ariaLabel={`${left?.label ?? "previous"} layout`} />
                  </div>
                </div>
                <div>
                  <Badge tone="primary" className="mb-2">{right?.label ?? "—"}</Badge>
                  <div className="border border-primary bg-bg p-2 rounded-sm">
                    <FloorPlan plot={communityCentrePlot} rooms={rightRooms} showLabels={false} showDimensions={false} diff={{ added: diff.added, modified: diff.modified }} ariaLabel={`${right?.label ?? "current"} layout`} />
                  </div>
                </div>
              </div>
              <ul className="mt-3 flex list-none flex-wrap gap-x-5 gap-y-1.5 p-0 text-xs text-muted">
                {[
                  { label: "Added Area", color: "#d7f5e3", count: diff.added.length },
                  { label: "Removed Area", color: "#ffe0e6", count: diff.removed.length },
                  { label: "Modified Area", color: "#e4dcff", count: diff.modified.length },
                ].map((l) => (
                  <li key={l.label} className="flex items-center gap-1.5">
                    <span className="h-3 w-3 border border-ink/40" style={{ background: l.color }} aria-hidden />
                    {l.label} <span className="font-semibold text-ink">({l.count})</span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <Card>
            <CardHeader title="Change Summary" subtitle={`${selected.label} · ${selected.title}`} />
            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <ul className="m-0 list-disc pl-5 text-sm text-ink">
                {selected.changes.map((c) => (
                  <li key={c} className="py-0.5">
                    {c}
                  </li>
                ))}
              </ul>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: "86%", l: "Area Efficiency", d: <Delta value={5.2} /> },
                  { v: "1.26", l: "Circulation Ratio", d: <Delta value={-18} invert /> },
                  { v: "553 m²", l: "Usable Area", d: <Delta value={32} suffix=" m²" /> },
                ].map((m) => (
                  <div key={m.l} className="flex flex-col items-center gap-1 border border-line bg-bg px-3 py-2 text-center rounded-sm">
                    <span className="text-lg font-bold text-ink">{m.v}</span>
                    <span className="text-[11px] text-muted">{m.l}</span>
                    {m.d}
                  </div>
                ))}
              </div>
            </div>
            <SampleDataNote className="mt-3" />
          </Card>
        </div>

        {/* Details + actions */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="Version Details" />
            <KeyValue label="Version" value={selected.label} />
            <KeyValue label="Updated" value={formatDateTime(selected.at)} />
            <KeyValue label="By" value={selected.author} />
            <div className="pt-2 text-sm">
              <p className="text-muted">Notes</p>
              <p className="mt-0.5 text-ink">{selected.notes}</p>
            </div>
          </Card>
          <Card>
            <CardHeader title="Actions" />
            <div className="flex flex-col gap-2">
              <Button leftIcon={<RotateCcw className="h-4 w-4" />} disabled={Boolean(selected.current)} onClick={() => setRestoreId(selected.id)}>
                Restore this Version
              </Button>
              <Button variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={() => download(selected)}>
                Download Layout
              </Button>
              <Button variant="danger" leftIcon={<Trash2 className="h-4 w-4" />} disabled={Boolean(selected.current)} onClick={() => setDeleteId(selected.id)}>
                Delete Version
              </Button>
              {selected.current ? <p className="text-[11px] text-muted">The current version cannot be restored or deleted.</p> : null}
            </div>
          </Card>
        </div>
      </div>

      <NewVersionModal open={newOpen} onClose={() => setNewOpen(false)} onCreate={createVersion} />

      <ConfirmDialog
        open={Boolean(restoreId)}
        onClose={() => setRestoreId(null)}
        title="Restore version"
        message={`Make ${versions.find((v) => v.id === restoreId)?.label ?? "this version"} the current version? The present layout stays in history.`}
        confirmLabel="Restore"
        onConfirm={() => {
          if (restoreId) restore(restoreId);
          setRestoreId(null);
        }}
      />
      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        title="Delete version"
        message={`Permanently delete ${versions.find((v) => v.id === deleteId)?.label ?? "this version"}? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteId) remove(deleteId);
          setDeleteId(null);
        }}
      />
    </>
  );
}

function NewVersionModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (title: string, notes: string) => void }) {
  if (!open) return null;
  return <NewVersionForm onClose={onClose} onCreate={onCreate} />;
}

function NewVersionForm({ onClose, onCreate }: { onClose: () => void; onCreate: (title: string, notes: string) => void }) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [touched, setTouched] = useState(false);
  const error = touched ? validateRequired(title, "Title") : null;
  return (
    <Modal
      open
      onClose={onClose}
      title="New version"
      description="Snapshot the current layout with a short description of what changed."
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="new-version-form">
            Create version
          </Button>
        </>
      }
    >
      <form
        id="new-version-form"
        noValidate
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (validateRequired(title, "Title")) return;
          onCreate(title.trim(), notes.trim() || "No notes.");
        }}
      >
        <Input label="Title" placeholder="e.g. Widened main corridor" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => setTouched(true)} error={error} data-autofocus required />
        <Textarea label="Notes" placeholder="What changed and why?" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </form>
    </Modal>
  );
}
