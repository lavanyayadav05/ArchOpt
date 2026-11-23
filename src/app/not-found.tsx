import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 text-center">
      <Logo />
      <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Error 404</p>
      <h1 className="mt-2 text-2xl font-bold text-ink">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        The page you requested does not exist in this workspace. Check the address or return to the dashboard.
      </p>
      <div className="mt-6 flex gap-2">
        <Link
          href="/dashboard"
          className="inline-flex h-9 items-center border border-primary bg-primary px-4 text-sm font-medium text-white rounded-sm hover:bg-primary-hover"
        >
          Go to dashboard
        </Link>
        <Link
          href="/"
          className="inline-flex h-9 items-center border border-line bg-surface px-4 text-sm font-medium text-ink rounded-sm hover:bg-highlight"
        >
          Landing page
        </Link>
      </div>
    </main>
  );
}
