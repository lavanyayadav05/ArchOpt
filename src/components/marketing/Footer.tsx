import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { marketingNav } from "@/lib/navigation";

const platformLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Space Planner", href: "/space-planner" },
  { label: "Layouts", href: "/layouts" },
  { label: "Analytics", href: "/analytics" },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-10 md:grid-cols-[1.6fr_1fr_1fr] lg:px-6">
        <div className="border border-line bg-bg p-5 rounded-md">
          <Logo />
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted">
            ArchOpt converts an architectural brief into structured spatial requirements and searches for
            feasible, circulation-aware floor-plan layouts. Designed around usability, accessibility
            and clear feedback.
          </p>
        </div>
        <nav aria-label="Product" className="border border-line p-5 rounded-md">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Product</h2>
          <ul className="mt-3 flex list-none flex-col gap-2 p-0">
            {marketingNav.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-sm text-ink hover:text-primary">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Platform" className="border border-line p-5 rounded-md">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Platform</h2>
          <ul className="mt-3 flex list-none flex-col gap-2 p-0">
            {platformLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-sm text-ink hover:text-primary">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-2 px-4 py-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <p>© 2026 ArtCohort. All rights reserved.</p>
          <p>Built with Next.js, React and TypeScript.</p>
        </div>
      </div>
    </footer>
  );
}
