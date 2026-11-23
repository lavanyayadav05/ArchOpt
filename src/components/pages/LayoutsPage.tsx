"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, Layers, BarChart3, Footprints, Clock, LayoutGrid, List, Eye, EyeOff, Check } from "lucide-react";
import { PageHeader } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { SelectMenu } from "@/components/ui/Dropdown";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Checkbox } from "@/components/ui/Checkbox";
import { Table, Th, Td, Tr } from "@/components/ui/Table";
import { StatCard, SampleDataNote, Skeleton, KeyValue, EmptyState } from "@/components/ui/Misc";
import { DonutChart } from "@/components/charts";
import { FloorPlan, zoneLabel } from "@/components/floorplan/FloorPlan";
import { useProjects } from "@/components/providers/ProjectsProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { layouts, communityCentrePlot } from "@/lib/mock";
import { roomArea } from "@/lib/geometry";
import { formatArea } from "@/lib/utils";
import type { Layout, LayoutTag, Room } from "@/lib/types";
import { cn } from "@/lib/utils";

type Filter = "all" | LayoutTag;

const filterItems: { value: Filter; label: string }[] = [
  { value: "all", label: "All Layouts" },
  { value: "efficient", label: "Efficient" },
  { value: "compact", label: "Compact" },
  { value: "open-plan", label: "Open Plan" },
];

interface MetricRow {
  key: string;
  label: string;
  get: (l: Layout) => number;
  format: (v: number) => string;
  best: "max" | "min";
}

const metricRows: MetricRow[] = [
  { key: "eff", label: "Area Efficiency", get: (l) => l.metrics.areaEfficiency, format: (v) => `${v}%`, best: "max" },
  { key: "circ", label: "Circulation Ratio", get: (l) => l.metrics.circulationRatio, format: (v) => v.toFixed(2), best: "min" },
  { key: "usable", label: "Usable Area (m²)", get: (l) => l.metrics.usableArea, format: (v) => `${v}`, best: "max" },
  { key: "adj", label: "Adjacency Satisfaction", get: (l) => l.metrics.adjacencySatisfaction, format: (v) => `${v}%`, best: "max" },
  { key: "acc", label: "Accessibility", get: (l) => l.metrics.accessibility, format: (v) => `${v}%`, best: "max" },
  { key: "cost", label: "Cost", get: (l) => l.cost, format: (v) => v.toFixed(1), best: "min" },
];

function distributionFor(rooms: Room[]) {
  const totals = new Map<string, number>();
  for (const r of rooms) {
    const key = r.type === "corridor" || r.type === "open" ? "circulation" : r.type;
    totals.set(key, (totals.get(key) ?? 0) + roomArea(r));
  }
  return Array.from(totals.entries()).map(([key, value]) => ({
    key,
    label: zoneLabel[key as Room["type"]] ?? key,
    value,
  }));
}

function LayoutsInner() {
  const params = useSearchParams();
  const { projects } = useProjects();
  const { toast } = useToast();
  const initial = params.get("layout");
  const [selectedId, setSelectedId] = useState<string>(
    () => layouts.find((l) => l.id === initial)?.id ?? layouts.find((l) => l.recommended)?.id ?? layouts[0].id,
  );
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [generating, setGenerating] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [included, setIncluded] = useState<string[]>(layouts.map((l) => l.id));

  const visible = useMemo(() => layouts.filter((l) => filter === "all" || l.tags.includes(filter)), [filter]);
  const selected = layouts.find((l) => l.id === selectedId) ?? layouts[0];
  const details = layouts.find((l) => l.id === detailsId);
  const comparison = layouts.filter((l) => included.includes(l.id));
  const distribution = useMemo(() => distributionFor(selected.rooms), [selected]);

  const generate = () => {
    setGenerating(true);
    window.setTimeout(() => {
      setGenerating(false);
      toast({ kind: "success", title: "4 candidate layouts generated (sample data)", description: "Generation is simulated in this frontend build." });
    }, 1500);
  };

  const bestFor = (row: MetricRow) => {
    const values = comparison.map(row.get);
    return row.best === "max" ? Math.max(...values) : Math.min(...values);
  };

  const projectOptions = projects.map((p) => ({ value: p.id, label: p.name }));

  return (
    <>
      <PageHeader
        title="Layouts"
        description="Explore, compare and choose the best layout design."
        actions={
          <>
            {projectOptions.length > 0 ? (
              <SelectMenu value={projectId} onChange={setProjectId} options={projectOptions} ariaLabel="Project" className="min-w-[200px]" />
            ) : null}
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={generate} loading={generating}>
              Generate Layouts
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Layers />} value={layouts.length} label="Layout Options" />
        <StatCard icon={<BarChart3 />} value="86%" label="Best Efficiency" />
        <StatCard icon={<Footprints />} value="1.26" label="Circulation Ratio" />
        <StatCard icon={<Clock />} value="12 min" label="Generation Time" />
      </div>
      <SampleDataNote className="mt-2" />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={filter} onChange={setFilter} items={filterItems} ariaLabel="Filter layouts" />
        <div className="flex border border-line bg-surface p-0.5 rounded-sm" role="group" aria-label="View mode">
          <button
            type="button"
            aria-pressed={view === "grid"}
            aria-label="Grid view"
            onClick={() => setView("grid")}
            className={cn("inline-flex h-7 w-8 items-center justify-center rounded-xs", view === "grid" ? "bg-highlight text-primary" : "text-muted hover:text-ink")}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-pressed={view === "list"}
            aria-label="List view"
            onClick={() => setView("list")}
            className={cn("inline-flex h-7 w-8 items-center justify-center rounded-xs", view === "list" ? "bg-highlight text-primary" : "text-muted hover:text-ink")}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Cards / list */}
      <div className="mt-4">
        {generating ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Card key={i}>
                <Skeleton className="aspect-[3/2] w-full" />
                <Skeleton className="mt-3 h-4 w-2/3" />
                <Skeleton className="mt-2 h-3 w-1/2" />
              </Card>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState title="No layouts match this filter" description="Try a different category or generate new candidates." action={<Button variant="outline" size="sm" onClick={() => setFilter("all")}>Show all layouts</Button>} />
        ) : view === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {visible.map((l) => {
              const isSelected = l.id === selectedId;
              const previewing = previewId === l.id;
              return (
                <Card key={l.id} interactive selected={isSelected} className="relative flex flex-col">
                  {isSelected ? (
                    <span className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center bg-primary text-white rounded-xs" aria-label="Selected">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setSelectedId(l.id)}
                    aria-pressed={isSelected}
                    aria-label={`Select ${l.name}`}
                    className="border border-line bg-bg p-2 rounded-sm"
                  >
                    <FloorPlan plot={communityCentrePlot} rooms={l.rooms} thumbnail={!previewing} showLabels={previewing} showDimensions={false} ariaLabel={`${l.name} thumbnail`} />
                  </button>
                  <div className="mt-3">
                    <p className="text-sm font-semibold text-ink">
                      {l.name}
                      {l.recommended ? <span className="font-medium text-primary"> (Recommended)</span> : null}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {l.metrics.areaEfficiency}% Efficiency <span className="mx-1 text-line-strong">|</span> {formatArea(l.metrics.usableArea)}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {l.tags.map((t) => (
                        <Badge key={t} size="sm">
                          {filterItems.find((f) => f.value === t)?.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Button variant={isSelected ? "secondary" : "outline"} size="sm" className="flex-1" onClick={() => setDetailsId(l.id)}>
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      aria-label={previewing ? `Hide labels for ${l.name}` : `Preview ${l.name}`}
                      aria-pressed={previewing}
                      onClick={() => setPreviewId(previewing ? null : l.id)}
                    >
                      {previewing ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Layout</Th>
                <Th>Tags</Th>
                <Th align="right">Area Efficiency</Th>
                <Th align="right">Circulation Ratio</Th>
                <Th align="right">Usable Area</Th>
                <Th align="right">Adjacency</Th>
                <Th align="right">Accessibility</Th>
                <Th align="right">Cost</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((l) => (
                <Tr key={l.id} className={cn(l.id === selectedId && "bg-highlight/50")}>
                  <Td>
                    <button type="button" onClick={() => setSelectedId(l.id)} className="font-medium text-ink hover:text-primary">
                      {l.name}
                      {l.recommended ? <span className="text-primary"> (Recommended)</span> : null}
                    </button>
                  </Td>
                  <Td>
                    <span className="flex gap-1">
                      {l.tags.map((t) => (
                        <Badge key={t} size="sm">
                          {filterItems.find((f) => f.value === t)?.label}
                        </Badge>
                      ))}
                    </span>
                  </Td>
                  <Td align="right">{l.metrics.areaEfficiency}%</Td>
                  <Td align="right">{l.metrics.circulationRatio.toFixed(2)}</Td>
                  <Td align="right">{formatArea(l.metrics.usableArea)}</Td>
                  <Td align="right">{l.metrics.adjacencySatisfaction}%</Td>
                  <Td align="right">{l.metrics.accessibility}%</Td>
                  <Td align="right">{l.cost.toFixed(1)}</Td>
                  <Td align="right">
                    <Button variant="outline" size="sm" onClick={() => setDetailsId(l.id)}>
                      Details
                    </Button>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {/* Comparison + distribution */}
      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader
            title="Layout Comparison"
            subtitle="Best value per metric is highlighted."
            action={
              <div className="flex flex-wrap gap-3">
                {layouts.map((l) => (
                  <Checkbox
                    key={l.id}
                    checked={included.includes(l.id)}
                    onChange={(v) =>
                      setIncluded((list) => (v ? [...list, l.id] : list.length > 1 ? list.filter((x) => x !== l.id) : list))
                    }
                    label={<span className="text-xs">{l.name}</span>}
                  />
                ))}
              </div>
            }
          />
          <Table>
            <thead>
              <tr>
                <Th>Metric</Th>
                {comparison.map((l) => (
                  <Th key={l.id} align="right">
                    {l.name}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metricRows.map((row) => {
                const best = bestFor(row);
                return (
                  <Tr key={row.key}>
                    <Td className="text-muted">{row.label}</Td>
                    {comparison.map((l) => (
                      <Td key={l.id} align="right" highlight={row.get(l) === best}>
                        {row.format(row.get(l))}
                      </Td>
                    ))}
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        </Card>
        <Card>
          <CardHeader title={`Space Distribution (${selected.name})`} subtitle="Computed from room areas, including circulation." />
          <DonutChart data={distribution} centerLabel={`${distribution.reduce((s, d) => s + d.value, 0)} m²`} centerSub="Total Area" ariaLabel={`Space distribution for ${selected.name}`} />
        </Card>
      </div>

      {/* Details modal */}
      <Modal
        open={Boolean(details)}
        onClose={() => setDetailsId(null)}
        title={details ? `${details.name}${details.recommended ? " (Recommended)" : ""}` : ""}
        description="Community Centre · 30 m × 20 m plot"
        size="lg"
        footer={
          details ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedId(details.id);
                  setDetailsId(null);
                  toast({ kind: "success", title: `${details.name} selected as baseline` });
                }}
              >
                Select as baseline
              </Button>
              <Link href="/workspace" className="inline-flex">
                <Button>Open in Editor</Button>
              </Link>
            </>
          ) : null
        }
      >
        {details ? (
          <div className="grid gap-4 md:grid-cols-[1fr_240px]">
            <div className="border border-line bg-bg p-3 rounded-sm">
              <FloorPlan plot={communityCentrePlot} rooms={details.rooms} ariaLabel={`${details.name} floor plan`} />
            </div>
            <div>
              <KeyValue label="Area efficiency" value={`${details.metrics.areaEfficiency}%`} />
              <KeyValue label="Circulation ratio" value={details.metrics.circulationRatio.toFixed(2)} />
              <KeyValue label="Usable area" value={formatArea(details.metrics.usableArea)} />
              <KeyValue label="Adjacency satisfaction" value={`${details.metrics.adjacencySatisfaction}%`} />
              <KeyValue label="Accessibility" value={`${details.metrics.accessibility}%`} />
              <KeyValue label="Avg. travel time" value={`${details.metrics.avgTravelTime} min`} />
              <KeyValue label="Cost" value={details.cost.toFixed(1)} />
              <SampleDataNote className="mt-3" />
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}

export function LayoutsPage() {
  return (
    <Suspense fallback={<PageHeader title="Layouts" description="Explore, compare and choose the best layout design." />}>
      <LayoutsInner />
    </Suspense>
  );
}
