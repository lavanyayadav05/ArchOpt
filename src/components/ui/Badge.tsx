import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/lib/types";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger" | "purple" | "primary";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-bg text-muted border-line",
  info: "bg-info-bg text-primary border-primary/30",
  success: "bg-success-bg text-success border-success/40",
  warning: "bg-warning-bg text-warning border-warning/40",
  danger: "bg-danger-bg text-danger border-danger/40",
  purple: "bg-[#ede9fe] text-[#6d28d9] border-[#ddd6fe]",
  primary: "bg-primary text-white border-primary",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  dot?: boolean;
  size?: "sm" | "md";
}

/** Rectangular status label (2px radius, 1px border). */
export function Badge({ tone = "neutral", dot, size = "md", className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap border font-medium rounded-xs",
        size === "sm" ? "h-5 px-1.5 text-[11px]" : "h-6 px-2 text-xs",
        tones[tone],
        className,
      )}
      {...rest}
    >
      {dot ? <span className="h-1.5 w-1.5 bg-current" aria-hidden /> : null}
      {children}
    </span>
  );
}

export const statusTone: Record<ProjectStatus, BadgeTone> = {
  draft: "info",
  "in-progress": "primary",
  optimizing: "purple",
  completed: "success",
  archived: "neutral",
};

export const statusLabel: Record<ProjectStatus, string> = {
  draft: "Draft",
  "in-progress": "In Progress",
  optimizing: "Optimizing",
  completed: "Completed",
  archived: "Archived",
};

export function StatusBadge({ status, size }: { status: ProjectStatus; size?: "sm" | "md" }) {
  return (
    <Badge tone={statusTone[status]} size={size}>
      {statusLabel[status]}
    </Badge>
  );
}

/** Small "+5.2%"-style delta chip. */
export function Delta({ value, suffix = "%", invert, className }: { value: number; suffix?: string; invert?: boolean; className?: string }) {
  const positive = invert ? value < 0 : value > 0;
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-0.5 border px-1.5 text-[11px] font-semibold rounded-xs",
        value === 0
          ? "border-line bg-bg text-muted"
          : positive
            ? "border-success/40 bg-success-bg text-success"
            : "border-danger/40 bg-danger-bg text-danger",
        className,
      )}
    >
      <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" aria-hidden>
        {value >= 0 ? (
          <path d="M5 1l4 5H1z" fill="currentColor" />
        ) : (
          <path d="M5 9L1 4h8z" fill="currentColor" />
        )}
      </svg>
      {sign}
      {Math.abs(value)}
      {suffix}
    </span>
  );
}
