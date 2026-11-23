"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Keyboard, BookOpen, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { appNav, type NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface SidebarProps {
  /** Mobile drawer state. */
  open: boolean;
  onClose: () => void;
  onShortcuts: () => void;
}

function isActive(pathname: string, search: string, item: NavItem): boolean {
  const [path, query] = item.href.split("?");
  if (query) return pathname === path && search === query;
  if (item.children && item.href === pathname) return true;
  return pathname === path;
}

function groupActive(pathname: string, item: NavItem): boolean {
  if (!item.children) return false;
  return pathname.startsWith(item.href.split("?")[0]);
}

export function Sidebar({ open, onClose, onShortcuts }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  // Manual expand/collapse choices are scoped to the route they were made on,
  // so navigating to a new section always reveals its children.
  const [manual, setManual] = useState<{ path: string; map: Record<string, boolean> }>({ path: pathname, map: {} });
  const expanded = manual.path === pathname ? manual.map : {};
  const setExpanded = (href: string, value: boolean) =>
    setManual((m) => ({ path: pathname, map: { ...(m.path === pathname ? m.map : {}), [href]: value } }));

  const nav = (
    <nav
      aria-label="Primary"
      className="flex flex-1 flex-col gap-0.5 px-3"
      onClick={(e) => {
        // Close the mobile drawer when a navigation link is activated.
        if ((e.target as HTMLElement).closest("a")) onClose();
      }}
    >
      {appNav.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, search, item) && !item.children;
        const gActive = groupActive(pathname, item);
        const isOpen = expanded[item.href] ?? gActive;
        if (item.children) {
          return (
            <div key={item.href} className="flex flex-col">
              <div
                className={cn(
                  "flex items-stretch rounded-sm",
                  gActive ? "bg-primary text-white" : "text-ink hover:bg-highlight",
                )}
              >
                <Link
                  href={item.href}
                  className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2 text-sm font-medium"
                  aria-current={gActive && pathname === item.href ? "page" : undefined}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
                <button
                  type="button"
                  aria-label={`${isOpen ? "Collapse" : "Expand"} ${item.label}`}
                  aria-expanded={isOpen}
                  onClick={() => setExpanded(item.href, !isOpen)}
                  className="flex w-8 items-center justify-center"
                >
                  <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                </button>
              </div>
              {isOpen ? (
                <ul className="my-0.5 ml-4 flex list-none flex-col gap-0.5 border-l border-line pl-2">
                  {item.children.map((child) => {
                    const CIcon = child.icon;
                    const cActive = isActive(pathname, search, child);
                    return (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          aria-current={cActive ? "page" : undefined}
                          className={cn(
                            "flex items-center gap-2.5 px-2.5 py-1.5 text-[13px] rounded-sm",
                            cActive ? "bg-highlight font-semibold text-primary" : "text-muted hover:bg-highlight hover:text-ink",
                          )}
                        >
                          <CIcon className="h-4 w-4 shrink-0" />
                          {child.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          );
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-sm",
              active ? "bg-primary text-white" : "text-ink hover:bg-highlight",
            )}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const help = (
    <div className="m-3 border border-line bg-bg p-4 rounded-md">
      <span className="inline-flex h-9 w-9 items-center justify-center border border-line bg-surface text-primary rounded-sm">
        <Keyboard className="h-[18px] w-[18px]" aria-hidden />
      </span>
      <p className="mt-3 text-sm font-semibold text-ink">Work faster</p>
      <p className="mt-0.5 text-xs leading-4 text-muted">
        Press <kbd className="border border-line bg-surface px-1 text-[10px] rounded-xs">Ctrl</kbd> <kbd className="border border-line bg-surface px-1 text-[10px] rounded-xs">K</kbd> to jump anywhere, or <kbd className="border border-line bg-surface px-1 text-[10px] rounded-xs">?</kbd> for all shortcuts.
      </p>
      <Button size="sm" variant="outline" className="mt-3 w-full" leftIcon={<Keyboard className="h-3.5 w-3.5" />} onClick={() => { onClose(); onShortcuts(); }}>
        Shortcuts
      </Button>
      <Link href="/usability" onClick={onClose} className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
        <BookOpen className="h-3.5 w-3.5" aria-hidden /> Design &amp; usability notes
      </Link>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="scrollbar-thin fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col overflow-y-auto border-r border-line bg-surface lg:flex">
        <div className="flex h-16 items-center px-5">
          <Logo href="/dashboard" />
        </div>
        {nav}
        {help}
      </aside>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-ink/40" onClick={onClose} />
          <aside className="scrollbar-thin absolute inset-y-0 left-0 flex w-[260px] max-w-[85vw] flex-col overflow-y-auto border-r border-line bg-surface shadow-modal">
            <div className="flex h-16 items-center justify-between px-4">
              <Logo href="/dashboard" />
              <button type="button" onClick={onClose} aria-label="Close" className="p-1 text-muted hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
            {help}
          </aside>
        </div>
      ) : null}
    </>
  );
}
