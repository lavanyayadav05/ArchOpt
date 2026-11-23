import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
  interactive?: boolean;
  selected?: boolean;
}

/** Rectangular panel: white fill, 1px border, 4px radius, subtle shadow. */
export function Card({ className, padded = true, interactive, selected, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "bg-surface border border-line rounded-md shadow-card",
        padded && "p-4",
        interactive && "transition-colors hover:border-line-strong hover:shadow-panel",
        selected && "border-primary ring-1 ring-primary",
        className,
      )}
      {...rest}
    />
  );
}

export interface CardHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  as?: "h2" | "h3";
}

export function CardHeader({ title, subtitle, action, className, as: Tag = "h3" }: CardHeaderProps) {
  return (
    <div className={cn("mb-3 flex items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <Tag className="text-[15px] font-semibold leading-5 text-ink">{title}</Tag>
        {subtitle ? <p className="mt-0.5 text-xs text-muted">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function CardDivider({ className }: { className?: string }) {
  return <hr className={cn("border-line", className)} />;
}
