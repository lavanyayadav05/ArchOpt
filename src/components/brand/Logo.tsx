import Link from "next/link";
import { cn } from "@/lib/utils";

/** ArchOpt mark: a blue "A" built from two angled blocks, matching the reference. */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <path d="M14.5 3h3.4L29 29h-6.2l-2.4-6.1H11.5L9.1 29H3z" fill="#1649d8" />
      <path d="M16.2 10.3 13 18.6h6.4z" fill="#ffffff" />
      <path d="M3 29 14.5 3h1.7L7.1 29z" fill="#3769e8" />
    </svg>
  );
}

export function Logo({
  href = "/",
  size = "md",
  className,
}: {
  href?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const mark = { sm: 24, md: 28, lg: 34 }[size];
  const text = { sm: "text-base", md: "text-lg", lg: "text-2xl" }[size];
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2 rounded-xs", className)} aria-label="ArchOpt home">
      <LogoMark size={mark} />
      <span className={cn("font-bold tracking-tight text-ink", text)}>ArchOpt</span>
    </Link>
  );
}
