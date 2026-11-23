"use client";

import { cn, initials } from "@/lib/utils";
import { Inbox, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./Button";

/* ------------------------------------------------------------------ */
/* Progress                                                            */
/* ------------------------------------------------------------------ */

export function ProgressBar({
  value,
  tone = "primary",
  className,
  label,
  size = "md",
}: {
  value: number;
  tone?: "primary" | "success" | "purple" | "warning";
  className?: string;
  label?: string;
  size?: "sm" | "md";
}) {
  const toneClass = {
    primary: "bg-primary",
    success: "bg-success",
    purple: "bg-[#7c3aed]",
    warning: "bg-warning",
  }[tone];
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(v)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("w-full overflow-hidden bg-line rounded-xs", size === "sm" ? "h-1.5" : "h-2", className)}
    >
      <div className={cn("h-full transition-[width] duration-500", toneClass)} style={{ width: `${v}%` }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Avatar                                                              */
/* ------------------------------------------------------------------ */

const avatarPalette = [
  "bg-[#dbe6ff] text-[#1649d8]",
  "bg-[#ede9fe] text-[#6d28d9]",
  "bg-[#dcfce7] text-[#15803d]",
  "bg-[#fee2e2] text-[#b91c1c]",
  "bg-[#fef3c7] text-[#b45309]",
  "bg-[#cffafe] text-[#0e7490]",
];

export function Avatar({
  name,
  size = "md",
  online,
  className,
}: {
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
  online?: boolean;
  className?: string;
}) {
  const palette = avatarPalette[name.charCodeAt(0) % avatarPalette.length];
  const dims = { xs: "h-6 w-6 text-[10px]", sm: "h-7 w-7 text-[11px]", md: "h-8 w-8 text-xs", lg: "h-10 w-10 text-sm" }[size];
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <span
        aria-hidden
        className={cn("inline-flex items-center justify-center border border-white font-semibold rounded-sm", dims, palette)}
      >
        {initials(name)}
      </span>
      <span className="sr-only">{name}</span>
      {online !== undefined ? (
        <span
          aria-label={online ? "Online" : "Offline"}
          className={cn(
            "absolute -right-0.5 -bottom-0.5 h-2 w-2 border border-white",
            online ? "bg-success" : "bg-line-strong",
          )}
        />
      ) : null}
    </span>
  );
}

export function AvatarStack({ names, max = 3 }: { names: string[]; max?: number }) {
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((n, i) => (
        <Avatar key={n} name={n} size="sm" className={cn(i > 0 && "-ml-1.5")} />
      ))}
      {rest > 0 ? (
        <span className="-ml-1.5 inline-flex h-7 min-w-7 items-center justify-center border border-white bg-highlight px-1 text-[11px] font-semibold text-primary rounded-sm">
          +{rest}
        </span>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty / error / loading states                                      */
/* ------------------------------------------------------------------ */

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center border border-dashed border-line bg-bg px-6 py-10 text-center rounded-md", className)}>
      <span className="mb-3 inline-flex h-10 w-10 items-center justify-center border border-line bg-surface text-muted rounded-sm [&>svg]:h-5 [&>svg]:w-5">
        {icon ?? <Inbox />}
      </span>
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-xs text-muted">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div role="alert" className={cn("flex flex-col items-center justify-center border border-danger/40 bg-danger-bg/40 px-6 py-8 text-center rounded-md", className)}>
      <span className="mb-3 inline-flex h-10 w-10 items-center justify-center border border-danger/40 bg-surface text-danger rounded-sm">
        <AlertTriangle className="h-5 w-5" />
      </span>
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-xs text-muted">{description}</p> : null}
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse bg-line/70 rounded-xs", className)} />;
}

/* ------------------------------------------------------------------ */
/* Stat card (KPI tile)                                                */
/* ------------------------------------------------------------------ */

export function StatCard({
  icon,
  value,
  label,
  delta,
  className,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  delta?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 border border-line bg-surface p-4 shadow-card rounded-md", className)}>
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-line bg-highlight text-primary rounded-sm [&>svg]:h-5 [&>svg]:w-5">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold leading-6 tracking-tight text-ink">{value}</span>
          {delta}
        </div>
        <p className="truncate text-xs text-muted">{label}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sample-data notice                                                  */
/* ------------------------------------------------------------------ */

export function SampleDataNote({ className, text }: { className?: string; text?: string }) {
  return (
    <p className={cn("inline-flex items-center gap-1.5 border border-line bg-bg px-2 py-1 text-[11px] text-muted rounded-xs", className)}>
      <span className="h-1.5 w-1.5 bg-warning" aria-hidden />
      {text ?? "Example data for demonstration."}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Key/value row                                                        */
/* ------------------------------------------------------------------ */

export function KeyValue({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between gap-3 border-b border-line py-2 text-sm last:border-b-0", className)}>
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium text-ink">{value}</span>
    </div>
  );
}
