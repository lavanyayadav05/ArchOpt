"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Save,
  Download,
  ArrowLeft,
  Pencil,
  Undo2,
  Redo2,
  Maximize2,
  Play,
  MousePointer2,
  SquarePlus,
  Minus,
  DoorOpen,
  AppWindow,
  Route,
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import { PageHeader } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { DropdownMenu } from "@/components/ui/Dropdown";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, KeyValue } from "@/components/ui/Misc";
import { FloorPlan, ZoneLegend, zoneLabel } from "@/components/floorplan/FloorPlan";
import { useToast } from "@/components/providers/ToastProvider";
import { layouts, layoutARooms, communityCentrePlot } from "@/lib/mock";
import { checkConstraints, areaEfficiency, totalRoomArea, usableArea, roomArea } from "@/lib/geometry";
import { validatePositiveNumber, validateRequired } from "@/lib/validation";
import { downloadJson, downloadSvgElement } from "@/lib/download";
import { cn, uid } from "@/lib/utils";
import { defaultAdjacency, generateLayoutsAsync, programFromRooms } from "@/lib/engine";
import type { Layout, Room, SpaceType } from "@/lib/types";

const STORAGE_KEY = "archopt.workspace.layout";

interface History {
  past: Room[][];
  present: Room[];
  future: Room[][];
}

interface Saved {
  name: string;
  rooms: Room[];
}

function isRoomArray(v: unknown): v is Room[] {
  return (
    Array.isArray(v) &&
    v.every((r) => r && typeof r === "object" && typeof (r as Room).id === "string" && ["x", "y", "width", "height"].every((k) => typeof (r as Record<string, unknown>)[k] === "number"))
  );
}

function readSaved(): Saved | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Saved>;
    if (!isRoomArray(parsed.rooms)) return null;
    return { name: typeof parsed.name === "string" ? parsed.name : "Layout A", rooms: parsed.rooms };
  } catch {
    return null;
  }
}

type ToolId = "select" | "add-room" | "wall" | "door" | "window" | "circulation" | "zone";

const tools: { id: ToolId; label: string; icon: React.ReactNode; available: boolean }[] = [
  { id: "select", label: "Select", icon: <MousePointer2 />, available: true },
  { id: "add-room", label: "Add Room", icon: <SquarePlus />, available: true },
  { id: "wall", label: "Wall", icon: <Minus />, available: false },
  { id: "door", label: "Door", icon: <DoorOpen />, available: false },
  { id: "window", label: "Window", icon: <AppWindow />, available: false },
  { id: "circulation", label: "Circulation", icon: <Route />, available: false },
  { id: "zone", label: "Zone", icon: <Layers />, available: false },
];

const typeOptions = (Object.keys(zoneLabel) as SpaceType[]).map((t) => ({ value: t, label: zoneLabel[t] }));

export function WorkspaceEditorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const plot = communityCentrePlot;

  const [saved] = useState<Saved | null>(() => readSaved());
  const [layoutName, setLayoutName] = useState(saved?.name ?? "Layout A");
  const [history, setHistory] = useState<History>(() => ({ past: [], present: saved?.rooms ?? layoutARooms, future: [] }));
  const rooms = history.present;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<ToolId>("select");
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState(layoutName);
  const [fullscreen, setFullscreen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [variation, setVariation] = useState<string>(layouts[0].id);
  const [minAreaConstraint, setMinAreaConstraint] = useState(true);
  const [naturalLight, setNaturalLight] = useState(false);
  const svgWrapRef = useRef<HTMLDivElement>(null);
  const [generated, setGenerated] = useState<Layout[]>([]);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [generating, setGenerating] = useState(false);
  const variations = useMemo(() => [...layouts.slice(0, 3), ...generated], [generated]);

  const commit = useCallback((next: Room[]) => {
    setHistory((h) => ({ past: [...h.past, h.present].slice(-50), present: next, future: [] }));
  }, []);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.past.length === 0) return h;
      const prev = h.past[h.past.length - 1];
      return { past: h.past.slice(0, -1), present: prev, future: [h.present, ...h.future] };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((h) => {
      if (h.future.length === 0) return h;
      const [next, ...rest] = h.future;
      return { past: [...h.past, h.present], present: next, future: rest };
    });
  }, []);

  // Keyboard shortcuts for undo/redo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  const violations = useMemo(() => checkConstraints(rooms, plot), [rooms, plot]);
  const invalidIds = useMemo(() => Array.from(new Set(violations.flatMap((v) => v.roomIds))), [violations]);
  const selected = rooms.find((r) => r.id === selectedId) ?? null;

  const updateRoom = (id: string, patch: Partial<Room>) => {
    commit(rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const save = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: layoutName, rooms }));
      toast({ kind: "success", title: "Layout saved locally", description: "Stored in this browser. Use Export to keep a copy as a file." });
    } catch {
      toast({ kind: "error", title: "Could not save", description: "Browser storage is unavailable." });
    }
  };

  const exportSvg = () => {
    const svg = svgWrapRef.current?.querySelector("svg");
    if (!svg) return;
    downloadSvgElement(`${layoutName.replace(/\s+/g, "-").toLowerCase()}.svg`, svg);
    toast({ kind: "success", title: "SVG exported" });
  };

  const exportJson = () => {
    downloadJson(`${layoutName.replace(/\s+/g, "-").toLowerCase()}.json`, { name: layoutName, plot, rooms });
    toast({ kind: "success", title: "JSON exported" });
  };

  const pickTool = (id: ToolId) => {
    const t = tools.find((x) => x.id === id);
    if (!t) return;
    if (!t.available) {
      toast({ kind: "info", title: `${t.label} tool is coming soon`, description: "This version edits rectangular rooms. Use Add Room and the property panel to change the plan." });
      return;
    }
    setTool(id);
    if (id === "add-room") setAddOpen(true);
  };

  const generateMore = async () => {
    const program = programFromRooms(rooms);
    setGenerating(true);
    try {
      const res = await generateLayoutsAsync({ plot, spaces: program, adjacency: defaultAdjacency(program), mode: "annealing", iterations: 1500, candidates: 3, seed: (Date.now() % 997) + 1, projectId: "editor" });
      if (res.error || res.layouts.length === 0) {
        toast({ kind: "error", title: "Could not generate layouts", description: res.error });
        return;
      }
      const fresh = res.layouts.map((l, i) => ({ ...l, id: `${l.id}-${Date.now()}-${i}`, name: `Variation ${generatedCount + i + 1}` }));
      setGenerated((g) => [...g, ...fresh].slice(-6));
      setGeneratedCount((n) => n + fresh.length);
      toast({ kind: "success", title: "New variations ready", description: `${fresh.length} layouts added for the current room program.` });
    } finally {
      setGenerating(false);
    }
  };

  const loadVariation = (id: string) => {
    const l = variations.find((x) => x.id === id);
    if (!l) return;
    setVariation(id);
    setSelectedId(null);
    commit(l.rooms);
    setLayoutName(l.name);
    setDraftName(l.name);
  };

  const commitRename = () => {
    const name = draftName.trim();
    if (name) setLayoutName(name);
    else setDraftName(layoutName);
    setRenaming(false);
  };

  const planEl = (
    <FloorPlan plot={plot} rooms={rooms} selectedId={selectedId} onSelect={setSelectedId} invalidIds={invalidIds} ariaLabel={`${layoutName} floor plan editor`} />
  );

  return (
    <>
      <PageHeader
        title="Workspace"
        description="Design, edit and optimize architectural layouts in a single workspace."
        actions={
          <>
            <Button variant="outline" leftIcon={<Save className="h-4 w-4" />} onClick={save}>
              Save
            </Button>
            <DropdownMenu
              trigger={({ ref, toggle, ...aria }) => (
                <Button ref={ref} onClick={toggle} leftIcon={<Download className="h-4 w-4" />} rightIcon={<ChevronDown className="h-3.5 w-3.5" />} {...aria}>
                  Export
                </Button>
              )}
              items={[
                { id: "svg", label: "Export SVG", onSelect: exportSvg },
                { id: "json", label: "Export JSON", onSelect: exportJson },
              ]}
            />
          </>
        }
      />

      {/* Breadcrumb / toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2 border border-line bg-surface px-3 py-2 shadow-card rounded-md">
        <Link href="/projects" aria-label="Back to projects" className="inline-flex h-8 w-8 items-center justify-center text-muted rounded-xs hover:bg-highlight hover:text-ink">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
          <span className="text-ink">Community Centre</span>
          <span className="text-muted">/</span>
          {renaming ? (
            <Input
              aria-label="Layout name"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") {
                  setDraftName(layoutName);
                  setRenaming(false);
                }
              }}
              autoFocus
              className="w-40"
              inputClassName="h-7"
            />
          ) : (
            <span className="font-semibold text-ink">{layoutName}</span>
          )}
          {!renaming ? (
            <button type="button" aria-label="Rename layout" onClick={() => setRenaming(true)} className="ml-1 inline-flex h-7 w-7 items-center justify-center text-muted rounded-xs hover:bg-highlight hover:text-ink">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Undo (Ctrl+Z)" onClick={undo} disabled={history.past.length === 0}>
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Redo (Shift+Ctrl+Z)" onClick={redo} disabled={history.future.length === 0}>
            <Redo2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Fullscreen" onClick={() => setFullscreen(true)}>
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button size="sm" leftIcon={<Play className="h-3.5 w-3.5" />} onClick={() => router.push("/optimization")}>
            Run Optimization
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[200px_1fr_300px]">
        {/* Tools */}
        <Card className="h-fit">
          <CardHeader title="Tools" />
          <ul className="m-0 flex list-none flex-col gap-1 p-0" role="group" aria-label="Editor tools">
            {tools.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  aria-pressed={tool === t.id}
                  onClick={() => pickTool(t.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 border px-2.5 py-2 text-sm rounded-sm transition-colors [&>svg]:h-4 [&>svg]:w-4",
                    tool === t.id ? "border-primary bg-highlight font-medium text-primary" : "border-transparent text-ink hover:bg-highlight",
                    !t.available && "text-muted",
                  )}
                >
                  {t.icon}
                  <span className="flex-1 text-left">{t.label}</span>
                  {!t.available ? <Badge size="sm">Soon</Badge> : null}
                </button>
              </li>
            ))}
          </ul>
          <hr className="my-3 border-line" />
          <p className="mb-2 text-xs font-semibold text-muted">Zones</p>
          <ZoneLegend className="flex-col gap-y-1" />
        </Card>

        {/* Canvas */}
        <Card className="flex min-w-0 flex-col">
          <div ref={svgWrapRef} className="blueprint-grid border border-line p-3 rounded-sm">
            {planEl}
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
            <div
              className={cn(
                "flex flex-col gap-1.5 border px-3 py-2 text-sm rounded-sm",
                violations.length === 0 ? "border-success/40 bg-success-bg/60 text-success" : "border-danger/40 bg-danger-bg/50 text-danger",
              )}
              role="status"
            >
              {violations.length === 0 ? (
                <span className="inline-flex items-center gap-2 font-medium">
                  <CheckCircle2 className="h-4 w-4" /> All constraints satisfied
                </span>
              ) : (
                <>
                  <span className="inline-flex items-center gap-2 font-medium">
                    <AlertTriangle className="h-4 w-4" /> {violations.length} constraint violation{violations.length > 1 ? "s" : ""}
                  </span>
                  <ul className="m-0 list-disc pl-6 text-xs">
                    {violations.map((v, i) => (
                      <li key={`${v.code}-${i}`}>{v.message}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
            <dl className="grid grid-cols-3 gap-2 text-center">
              {[
                { k: "Area efficiency", v: `${areaEfficiency(rooms)}%` },
                { k: "Total area", v: `${totalRoomArea(rooms)} m²` },
                { k: "Usable area", v: `${usableArea(rooms)} m²` },
              ].map((m) => (
                <div key={m.k} className="border border-line bg-bg px-2 py-1.5 rounded-sm">
                  <dt className="text-[10px] uppercase tracking-wide text-muted">{m.k}</dt>
                  <dd className="text-sm font-bold text-ink">{m.v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <p className="mt-2 text-[11px] text-muted">
            Checks cover overlaps, plot boundaries, minimum dimensions and required areas, and update as you edit. Run the optimizer to search for better arrangements.
          </p>
        </Card>

        {/* Properties */}
        <Card className="h-fit">
          <CardHeader title="Properties" />
          {selected ? (
            <div className="flex flex-col gap-3">
              <div className="border border-line bg-highlight px-3 py-2 text-sm font-medium text-ink rounded-sm">Selected: {selected.name}</div>
              <Input
                label="Name"
                value={selected.name}
                onChange={(e) => updateRoom(selected.id, { name: e.target.value })}
              />
              <Input
                label="Area"
                type="number"
                min={1}
                step={1}
                suffix="m²"
                value={roomArea(selected)}
                onChange={(e) => {
                  const area = Number(e.target.value);
                  if (!Number.isFinite(area) || area <= 0) return;
                  const height = Math.max(selected.minHeight ?? 1, Math.round((area / selected.width) * 10) / 10);
                  updateRoom(selected.id, { height });
                }}
                hint="Editing the area adjusts the room depth."
              />
              <Select
                label="Type"
                options={typeOptions}
                value={selected.type}
                onChange={(e) => updateRoom(selected.id, { type: e.target.value as SpaceType })}
              />
              <Input
                label="Capacity"
                type="number"
                min={0}
                suffix="people"
                value={selected.capacity ?? 0}
                onChange={(e) => updateRoom(selected.id, { capacity: Math.max(0, Number(e.target.value) || 0) })}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Width"
                  type="number"
                  min={1}
                  step={0.5}
                  suffix="m"
                  value={selected.width}
                  onChange={(e) => {
                    const w = Number(e.target.value);
                    if (Number.isFinite(w) && w > 0) updateRoom(selected.id, { width: w });
                  }}
                />
                <Input
                  label="Depth"
                  type="number"
                  min={1}
                  step={0.5}
                  suffix="m"
                  value={selected.height}
                  onChange={(e) => {
                    const h = Number(e.target.value);
                    if (Number.isFinite(h) && h > 0) updateRoom(selected.id, { height: h });
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="X"
                  type="number"
                  min={0}
                  step={0.5}
                  suffix="m"
                  value={selected.x}
                  onChange={(e) => updateRoom(selected.id, { x: Number(e.target.value) || 0 })}
                />
                <Input
                  label="Y"
                  type="number"
                  min={0}
                  step={0.5}
                  suffix="m"
                  value={selected.y}
                  onChange={(e) => updateRoom(selected.id, { y: Number(e.target.value) || 0 })}
                />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-ink">Constraints</p>
                <div className="flex flex-col gap-2">
                  <Checkbox checked={minAreaConstraint} onChange={setMinAreaConstraint} label="Min. Area (≥ 50 m²)" />
                  <Checkbox checked={naturalLight} onChange={setNaturalLight} label="Natural Light" description="UI only — daylight scoring is planned." />
                </div>
              </div>
              <Button variant="danger" size="sm" leftIcon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => setDeleteOpen(true)}>
                Delete room
              </Button>
            </div>
          ) : (
            <EmptyState icon={<MousePointer2 />} title="Select a room on the plan" description="Click or focus a room and press Enter to edit its properties." />
          )}
        </Card>
      </div>

      {/* Variations */}
      <Card className="mt-4">
        <div className="grid gap-4 md:grid-cols-[200px_1fr]">
          <div>
            <h3 className="text-[15px] font-semibold text-ink">Layout Variations</h3>
            <p className="mt-0.5 text-xs text-muted">Alternatives for this room program. Press Generate More to search for new ones.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {variations.map((l) => {
              const active = variation === l.id;
              return (
                <button
                  key={l.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => loadVariation(l.id)}
                  className={cn("flex items-center gap-3 border p-2 text-left rounded-sm transition-colors", active ? "border-primary bg-highlight/40" : "border-line bg-surface hover:border-line-strong")}
                >
                  <span className="w-24 shrink-0 border border-line bg-bg p-1">
                    <FloorPlan plot={plot} rooms={l.rooms} thumbnail showDimensions={false} showLabels={false} ariaLabel={`${l.name} thumbnail`} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-ink">{l.name}</span>
                    <span className="block text-xs text-muted">{l.metrics.areaEfficiency}% Efficiency</span>
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={generateMore}
              disabled={generating}
              className="flex min-h-[72px] items-center justify-center gap-2 border border-dashed border-line-strong bg-bg text-sm font-medium text-primary rounded-sm hover:bg-highlight"
            >
              <Plus className="h-4 w-4" /> {generating ? "Generating…" : "Generate More"}
            </button>
          </div>
        </div>
      </Card>

      {/* Fullscreen */}
      <Modal open={fullscreen} onClose={() => setFullscreen(false)} title={`${layoutName} — full view`} size="xl">
        <div className="blueprint-grid border border-line p-4 rounded-sm">{planEl}</div>
      </Modal>

      <AddRoomModal
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          setTool("select");
        }}
        onAdd={(room) => {
          commit([...rooms, room]);
          setSelectedId(room.id);
          setAddOpen(false);
          setTool("select");
          toast({ kind: "success", title: `${room.name} added` });
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete room"
        message={selected ? `Remove "${selected.name}" from the layout? You can undo this action.` : ""}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (selected) {
            commit(rooms.filter((r) => r.id !== selected.id));
            setSelectedId(null);
            toast({ kind: "info", title: "Room deleted", description: "Press Ctrl+Z to undo." });
          }
          setDeleteOpen(false);
        }}
      />
    </>
  );
}

function AddRoomModal({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (room: Room) => void }) {
  if (!open) return null;
  return <AddRoomForm onClose={onClose} onAdd={onAdd} />;
}

function AddRoomForm({ onClose, onAdd }: { onClose: () => void; onAdd: (room: Room) => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<SpaceType>("office");
  const [width, setWidth] = useState("6");
  const [height, setHeight] = useState("4");
  const [x, setX] = useState("0");
  const [y, setY] = useState("0");
  const [touched, setTouched] = useState(false);

  const errors = {
    name: validateRequired(name, "Name"),
    width: validatePositiveNumber(width, "Width", 60),
    height: validatePositiveNumber(height, "Depth", 60),
    x: x.trim() === "" || Number(x) < 0 ? "X must be 0 or more." : null,
    y: y.trim() === "" || Number(y) < 0 ? "Y must be 0 or more." : null,
  };
  const invalid = Object.values(errors).some(Boolean);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (invalid) return;
    onAdd({ id: uid("room"), name: name.trim(), type, x: Number(x), y: Number(y), width: Number(width), height: Number(height) });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Add room"
      description="Rooms are rectangles positioned in metres from the top-left corner of the plot."
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="add-room-form">
            Add room
          </Button>
        </>
      }
    >
      <form id="add-room-form" onSubmit={submit} noValidate className="flex flex-col gap-3">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} error={touched ? errors.name : null} data-autofocus required />
        <Select label="Type" options={typeOptions} value={type} onChange={(e) => setType(e.target.value as SpaceType)} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Width" type="number" min={1} step={0.5} suffix="m" value={width} onChange={(e) => setWidth(e.target.value)} error={touched ? errors.width : null} required />
          <Input label="Depth" type="number" min={1} step={0.5} suffix="m" value={height} onChange={(e) => setHeight(e.target.value)} error={touched ? errors.height : null} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="X" type="number" min={0} step={0.5} suffix="m" value={x} onChange={(e) => setX(e.target.value)} error={touched ? errors.x : null} />
          <Input label="Y" type="number" min={0} step={0.5} suffix="m" value={y} onChange={(e) => setY(e.target.value)} error={touched ? errors.y : null} />
        </div>
        <KeyValue label="Area" value={`${(Number(width) || 0) * (Number(height) || 0)} m²`} />
      </form>
    </Modal>
  );
}
