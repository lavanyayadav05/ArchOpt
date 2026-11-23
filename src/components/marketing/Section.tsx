import { cn } from "@/lib/utils";

export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1200px] px-4 lg:px-6", className)}>{children}</div>;
}

export function Section({
  className,
  children,
  id,
  tone = "default",
}: {
  className?: string;
  children: React.ReactNode;
  id?: string;
  tone?: "default" | "surface";
}) {
  return (
    <section
      id={id}
      className={cn("border-b border-line py-14 lg:py-18", tone === "surface" ? "bg-surface" : "bg-bg", className)}
    >
      <Container>{children}</Container>
    </section>
  );
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted", className)}>
      <span className="h-4 w-1 bg-primary" aria-hidden />
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  as: Tag = "h2",
  className,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  as?: "h1" | "h2";
  className?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("mb-8 max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? <Eyebrow className={cn(align === "center" && "justify-center")}>{eyebrow}</Eyebrow> : null}
      <Tag
        className={cn(
          "mt-3 font-bold tracking-tight text-ink",
          Tag === "h1" ? "text-3xl leading-tight sm:text-4xl lg:text-[44px] lg:leading-[1.1]" : "text-2xl leading-tight sm:text-3xl",
        )}
      >
        {title}
      </Tag>
      {description ? <p className="mt-3 text-base leading-7 text-muted">{description}</p> : null}
    </div>
  );
}

/** Mono code block used for the cost function and data model. */
export function CodeBlock({ code, title, className }: { code: string; title?: string; className?: string }) {
  return (
    <div className={cn("overflow-hidden border border-line bg-surface rounded-md", className)}>
      {title ? (
        <div className="border-b border-line bg-bg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
          {title}
        </div>
      ) : null}
      <pre className="scrollbar-thin overflow-x-auto p-4 font-mono text-[12.5px] leading-6 text-ink">
        <code>{code}</code>
      </pre>
    </div>
  );
}
