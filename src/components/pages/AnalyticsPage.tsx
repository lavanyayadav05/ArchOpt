"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, Download, Layers, Footprints, LayoutGrid, Clock, TrendingUp, ArrowRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { PageHeader } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { SelectMenu } from "@/components/ui/Dropdown";
import { StatusBadge, Delta } from "@/components/ui/Badge";
import { Table, Th, Td, Tr } from "@/components/ui/Table";
import { StatCard, SampleDataNote } from "@/components/ui/Misc";
import { LineChart, BarChart, DonutChart } from "@/components/charts";
import { useToast } from "@/components/providers/ToastProvider";
import {
  efficiencyTrend,
  circulationTrend,
  layoutEfficiencyComparison,
  generationTimes,
  spaceDistribution,
  projectPerformance,
} from "@/lib/mock";
import { downloadText, toCsv } from "@/lib/download";
import { formatArea } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Range = "jan-feb" | "30d" | "90d" | "year";

const rangeOptions: { value: Range; label: string }[] = [
  { value: "jan-feb", label: "Jan 1 – Feb 9, 2026" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "year", label: "This year" },
];

/** Slice the sample trend to suggest a narrower/wider window. */
function sliceByRange<T>(data: T[], range: Range): T[] {
  switch (range) {
    case "30d":
      return data.slice(-Math.max(3, Math.ceil(data.length / 2)));
    case "90d":
      return data.slice(-Math.max(3, Math.ceil((data.length * 3) / 4)));
    default:
      return data;
  }
}

type PerfRow = (typeof projectPerformance)[number];
type SortKey = keyof Pick<PerfRow, "project" | "layout" | "areaEfficiency" | "circulationRatio" | "usableArea" | "status">;

const columns: { key: SortKey; label: string; align?: "right" }[] = [
  { key: "project", label: "Project" },
  { key: "layout", label: "Layout" },
  { key: "areaEfficiency", label: "Area Efficiency", align: "right" },
  { key: "circulationRatio", label: "Circulation Ratio", align: "right" },
  { key: "usableArea", label: "Usable Area", align: "right" },
  { key: "status", label: "Status" },
];

export function AnalyticsPage() {
  const { toast } = useToast();
  const [range, setRange] = useState<Range>("jan-feb");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "areaEfficiency", dir: "desc" });

  const trend = useMemo(() => sliceByRange(efficiencyTrend, range), [range]);
  const circ = useMemo(() => sliceByRange(circulationTrend, range), [range]);

  const rows = useMemo(() => {
    const list = [...projectPerformance];
    list.sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [sort]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "project" || key === "layout" || key === "status" ? "asc" : "desc" }));

  const exportReport = () => {
    const csv = toCsv(
      projectPerformance.map((p) => ({
        Project: p.project,
        Layout: p.layout,
        "Area Efficiency (%)": p.areaEfficiency,
        "Circulation Ratio": p.circulationRatio,
        "Usable Area (m2)": p.usableArea,
        Status: p.status,
      })),
    );
    downloadText("archopt-analytics-report.csv", `# ArchOpt analytics — sample project data (illustrative)\n${csv}`, "text/csv;charset=utf-8");
    toast({ kind: "success", title: "Report exported", description: "archopt-analytics-report.csv downloaded." });
  };

  const SortIcon = ({ col }: { col: SortKey }) =>
    sort.key !== col ? <ArrowUpDown className="h-3 w-3 opacity-60" /> : sort.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Track performance, compare layouts and gain design insights."
        actions={
          <>
            <SelectMenu value={range} onChange={setRange} options={rangeOptions} icon={<Calendar />} ariaLabel="Date range" className="min-w-[220px]" />
            <Button leftIcon={<Download className="h-4 w-4" />} onClick={exportReport}>
              Export Report
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Layers />} value="86%" label="Avg. Area Efficiency" delta={<Delta value={5.2} />} />
        <StatCard icon={<Footprints />} value="1.26" label="Avg. Circulation Ratio" delta={<Delta value={-18} invert />} />
        <StatCard icon={<LayoutGrid />} value="553 m²" label="Avg. Usable Area" delta={<Delta value={32} suffix=" m²" />} />
        <StatCard icon={<Clock />} value="12 min" label="Avg. Generation Time" delta={<Delta value={-24} invert />} />
      </div>
      <SampleDataNote className="mt-2" />

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_1fr_1fr]">
        <Card>
          <CardHeader title="Area Efficiency Trend" subtitle="Usable area ÷ total built area, by run" />
          <LineChart data={trend} yMin={70} yMax={95} ariaLabel="Area efficiency trend" />
        </Card>
        <Card>
          <CardHeader title="Space Utilization" subtitle="Share of built area by space type" />
          <DonutChart data={[...spaceDistribution]} centerLabel="553 m²" centerSub="Total Area" ariaLabel="Space utilization" />
        </Card>
        <Card>
          <CardHeader title="Layout Comparison" subtitle="Area efficiency per candidate" />
          <BarChart data={layoutEfficiencyComparison} yMin={60} yMax={100} formatY={(v) => `${v}%`} emphasis={0} ariaLabel="Layout efficiency comparison" />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader title="Key Insights" subtitle="Community Centre — Layout A vs baseline" />
          <ul className="m-0 flex list-none flex-col divide-y divide-line p-0">
            {[
              { icon: <TrendingUp />, value: "+5.2%", label: "Improved area efficiency" },
              { icon: <Layers />, value: "+32 m²", label: "More usable space" },
              { icon: <Footprints />, value: "−18%", label: "Reduced circulation" },
            ].map((i) => (
              <li key={i.label} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center border border-line bg-highlight text-primary rounded-sm [&>svg]:h-4 [&>svg]:w-4">
                  {i.icon}
                </span>
                <div>
                  <p className="text-base font-bold leading-5 text-ink">{i.value}</p>
                  <p className="text-xs text-muted">{i.label}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader
            title="Project Performance"
            subtitle="Click a column header to sort"
            action={
              <Link href="/projects" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          <Table>
            <thead>
              <tr>
                {columns.map((c) => (
                  <Th key={c.key} align={c.align} aria-sort={sort.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key)}
                      className={cn("inline-flex items-center gap-1 hover:text-ink", sort.key === c.key && "text-ink")}
                    >
                      {c.label}
                      <SortIcon col={c.key} />
                    </button>
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <Tr key={r.projectId}>
                  <Td className="font-medium">{r.project}</Td>
                  <Td>{r.layout}</Td>
                  <Td align="right" highlight>
                    {r.areaEfficiency}%
                  </Td>
                  <Td align="right">{r.circulationRatio.toFixed(2)}</Td>
                  <Td align="right">{formatArea(r.usableArea)}</Td>
                  <Td>
                    <StatusBadge status={r.status} size="sm" />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Circulation Ratio Trend" subtitle="Corridor length ÷ ideal path length (lower is better)" />
          <LineChart data={circ} yMin={1.2} yMax={1.7} formatY={(v) => v.toFixed(2)} area={false} ariaLabel="Circulation ratio trend" />
        </Card>
        <Card>
          <CardHeader title="Generation Time per Run" subtitle="Minutes to produce four candidates" />
          <BarChart data={generationTimes} yMax={20} formatY={(v) => `${v} min`} emphasis={null} ariaLabel="Generation time per run" />
        </Card>
      </div>
    </>
  );
}
