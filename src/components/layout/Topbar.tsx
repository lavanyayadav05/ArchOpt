"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Search, Menu, LogOut, Settings, User, FolderOpen, Map, FileText, Check, Command } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Logo } from "@/components/brand/Logo";
import { Avatar } from "@/components/ui/Misc";
import { DropdownMenu } from "@/components/ui/Dropdown";
import { useProjects } from "@/components/providers/ProjectsProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { layouts, notifications as seedNotifications, currentUser } from "@/lib/mock";
import { appNav } from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface TopbarProps {
  onMenu: () => void;
  onPalette: () => void;
}

interface SearchHit {
  id: string;
  label: string;
  kind: "project" | "layout" | "page";
  href: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 60) return `${Math.max(1, m)}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function Topbar({ onMenu, onPalette }: TopbarProps) {
  const router = useRouter();
  const { projects } = useProjects();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeHit, setActiveHit] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState(seedNotifications);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayName = user?.name ?? currentUser.name;
  const unread = notifs.filter((n) => n.unread).length;

  const hits = useMemo<SearchHit[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const p = projects
      .filter((x) => x.name.toLowerCase().includes(q))
      .slice(0, 4)
      .map<SearchHit>((x) => ({ id: x.id, label: x.name, kind: "project", href: `/projects?q=${encodeURIComponent(x.name)}` }));
    const l = layouts
      .filter((x) => x.name.toLowerCase().includes(q))
      .slice(0, 3)
      .map<SearchHit>((x) => ({ id: x.id, label: `${x.name} · Community Centre`, kind: "layout", href: `/layouts?layout=${x.id}` }));
    const pages = appNav
      .flatMap((n) => [n, ...(n.children ?? [])])
      .filter((n) => n.label.toLowerCase().includes(q))
      .slice(0, 3)
      .map<SearchHit>((n) => ({ id: n.href, label: n.label, kind: "page", href: n.href }));
    return [...p, ...l, ...pages];
  }, [query, projects]);

  // Close popovers on outside click.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // "/" focuses search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const go = (hit: SearchHit) => {
    setSearchOpen(false);
    setQuery("");
    router.push(hit.href);
  };

  const kindIcon = { project: FolderOpen, layout: Map, page: FileText };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-surface px-4 lg:px-6">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Open navigation"
        className="inline-flex h-9 w-9 items-center justify-center border border-line text-ink rounded-sm hover:bg-highlight lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="lg:hidden">
        <Logo href="/dashboard" size="sm" />
      </div>

      {/* Search */}
      <div ref={searchRef} className="relative ml-auto w-full max-w-[380px]">
        <div
          className={cn(
            "flex h-9 items-center border bg-surface rounded-sm",
            searchOpen ? "border-primary ring-1 ring-primary" : "border-line hover:border-line-strong",
          )}
        >
          <Search className="ml-2.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-expanded={searchOpen && hits.length > 0}
            aria-controls="global-search-results"
            aria-autocomplete="list"
            aria-label="Search projects, layouts, spaces"
            placeholder="Search projects, layouts, spaces…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveHit(0);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveHit((i) => Math.min(hits.length - 1, i + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveHit((i) => Math.max(0, i - 1));
              } else if (e.key === "Enter" && hits[activeHit]) {
                e.preventDefault();
                go(hits[activeHit]);
              } else if (e.key === "Escape") {
                setSearchOpen(false);
                inputRef.current?.blur();
              }
            }}
            className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm text-ink placeholder:text-muted/70 focus:outline-none"
          />
          <kbd className="mr-2 hidden h-5 items-center border border-line bg-bg px-1.5 font-sans text-[10px] text-muted rounded-xs sm:inline-flex">
            /
          </kbd>
        </div>
        {searchOpen && query.trim() ? (
          <div
            id="global-search-results"
            role="listbox"
            className="absolute left-0 right-0 z-50 mt-1 border border-line bg-surface py-1 shadow-panel rounded-sm"
          >
            {hits.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted">No results for “{query}”.</p>
            ) : (
              hits.map((h, i) => {
                const Icon = kindIcon[h.kind];
                return (
                  <button
                    key={`${h.kind}-${h.id}`}
                    type="button"
                    role="option"
                    aria-selected={i === activeHit}
                    onMouseEnter={() => setActiveHit(i)}
                    onClick={() => go(h)}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm",
                      i === activeHit ? "bg-highlight text-ink" : "text-ink",
                    )}
                  >
                    <Icon className="h-4 w-4 text-muted" />
                    <span className="min-w-0 flex-1 truncate">{h.label}</span>
                    <span className="text-[11px] uppercase tracking-wide text-muted">{h.kind}</span>
                  </button>
                );
              })
            )}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onPalette}
        aria-label="Open command palette (Ctrl+K)"
        title="Command palette (Ctrl+K)"
        className="hidden h-9 items-center gap-1.5 border border-line px-2.5 text-xs font-medium text-muted rounded-sm hover:bg-highlight hover:text-ink md:inline-flex"
      >
        <Command className="h-3.5 w-3.5" aria-hidden /> K
      </button>
      <ThemeToggle />

      {/* Notifications */}
      <div ref={notifRef} className="relative">
        <button
          type="button"
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
          aria-expanded={notifOpen}
          aria-haspopup="dialog"
          onClick={() => setNotifOpen((o) => !o)}
          className={cn(
            "relative inline-flex h-9 w-9 items-center justify-center border text-ink rounded-sm hover:bg-highlight",
            notifOpen ? "border-primary" : "border-line",
          )}
        >
          <Bell className="h-[18px] w-[18px]" />
          {unread > 0 ? <span className="absolute right-1.5 top-1.5 h-2 w-2 bg-primary" aria-hidden /> : null}
        </button>
        {notifOpen ? (
          <div role="dialog" aria-label="Notifications" className="absolute right-0 z-50 mt-1 w-[340px] max-w-[calc(100vw-2rem)] border border-line bg-surface shadow-panel rounded-sm">
            <div className="flex items-center justify-between border-b border-line px-3 py-2">
              <p className="text-sm font-semibold text-ink">Notifications</p>
              <button
                type="button"
                onClick={() => setNotifs((n) => n.map((x) => ({ ...x, unread: false })))}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Check className="h-3.5 w-3.5" /> Mark all read
              </button>
            </div>
            <ul className="scrollbar-thin m-0 max-h-[320px] list-none overflow-y-auto p-0">
              {notifs.map((n) => (
                <li key={n.id} className={cn("border-b border-line px-3 py-2.5 last:border-b-0", n.unread && "bg-highlight/50")}>
                  <div className="flex items-start gap-2">
                    <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0", n.unread ? "bg-primary" : "bg-line-strong")} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink">{n.title}</p>
                      <p className="text-xs text-muted">{n.body}</p>
                    </div>
                    <span className="shrink-0 text-[11px] text-muted">{timeAgo(n.at)}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-line px-3 py-2 text-center">
              <Link href="/team?tab=activity" className="text-xs font-medium text-primary hover:underline" onClick={() => setNotifOpen(false)}>
                View all activity
              </Link>
            </div>
          </div>
        ) : null}
      </div>

      {/* User menu */}
      <DropdownMenu
        align="right"
        trigger={({ ref, toggle, ...aria }) => (
          <button
            ref={ref}
            type="button"
            onClick={toggle}
            aria-label={`Account menu for ${displayName}`}
            className="inline-flex h-9 items-center gap-2 border border-line pl-0.5 pr-2 text-ink rounded-sm hover:bg-highlight"
            {...aria}
          >
            <Avatar name={displayName} size="md" />
            <span className="hidden max-w-[120px] truncate text-sm font-medium md:inline">{displayName.split(" ")[0]}</span>
          </button>
        )}
        items={[
          { id: "profile", label: "Profile", icon: <User />, onSelect: () => router.push("/settings") },
          { id: "settings", label: "Settings", icon: <Settings />, onSelect: () => router.push("/settings") },
          {
            id: "signout",
            label: "Sign out",
            icon: <LogOut />,
            separator: true,
            onSelect: () => {
              signOut();
              toast({ kind: "info", title: "Signed out", description: "Your session on this device has been cleared." });
              router.push("/");
            },
          },
        ]}
      />
    </header>
  );
}
