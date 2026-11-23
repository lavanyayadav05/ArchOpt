"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { CornerDownLeft, FolderOpen, Keyboard, Moon, Search, Sun, Compass, Zap } from "lucide-react";
import { appNav, marketingNav } from "@/lib/navigation";
import { useProjects } from "@/components/providers/ProjectsProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/utils";

interface Command {
  id: string;
  label: string;
  group: "Go to" | "Projects" | "Actions" | "Learn";
  hint?: string;
  icon: React.ReactNode;
  run: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onShowShortcuts: () => void;
}

/** Ctrl/⌘ + K quick switcher: jump to any page or project, or run an action, without leaving the keyboard. */
export function CommandPalette({ open, onClose, onShowShortcuts }: CommandPaletteProps) {
  const router = useRouter();
  const { projects } = useProjects();
  const { resolved, toggle } = useTheme();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  const commands = useMemo<Command[]>(() => {
    const go = (href: string) => () => router.push(href);
    const pages = appNav.flatMap((n) => [n, ...(n.children ?? [])]).map<Command>((n) => ({ id: `page-${n.href}`, label: n.label, group: "Go to", icon: <n.icon className="h-4 w-4" />, run: go(n.href) }));
    const learn = marketingNav.map<Command>((n) => ({ id: `site-${n.href}`, label: `${n.label} (website)`, group: "Learn", icon: <Compass className="h-4 w-4" />, run: go(n.href) }));
    learn.push({ id: "site-usability", label: "Usability & design (website)", group: "Learn", icon: <Compass className="h-4 w-4" />, run: go("/usability") });
    const proj = projects.map<Command>((p) => ({ id: `proj-${p.id}`, label: p.name, group: "Projects", icon: <FolderOpen className="h-4 w-4" />, run: go(`/projects?q=${encodeURIComponent(p.name)}`) }));
    const actions: Command[] = [
      { id: "act-generate", label: "Generate a layout", group: "Actions", hint: "Space Planner", icon: <Zap className="h-4 w-4" />, run: go("/space-planner") },
      { id: "act-optimize", label: "Run optimization", group: "Actions", hint: "Optimization", icon: <Zap className="h-4 w-4" />, run: go("/optimization") },
      { id: "act-theme", label: resolved === "dark" ? "Switch to light theme" : "Switch to dark theme", group: "Actions", icon: resolved === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />, run: toggle },
      { id: "act-keys", label: "Show keyboard shortcuts", group: "Actions", hint: "?", icon: <Keyboard className="h-4 w-4" />, run: onShowShortcuts },
    ];
    return [...actions, ...pages, ...proj, ...learn];
  }, [projects, resolved, toggle, router, onShowShortcuts]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? commands.filter((c) => c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q)) : commands.slice(0, 9);
  }, [commands, query]);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => {
      window.clearTimeout(t);
      restoreRef.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const close = () => {
    setQuery("");
    setActive(0);
    onClose();
  };
  const choose = (c: Command | undefined) => {
    if (!c) return;
    close();
    c.run();
  };
  const current = Math.min(active, Math.max(0, results.length - 1));

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Command palette">
      <button type="button" aria-label="Close command palette" className="absolute inset-0 cursor-default bg-ink/50 backdrop-blur-[1px]" onClick={close} tabIndex={-1} />
      <div className="relative w-full max-w-[560px] border border-line bg-surface shadow-modal rounded-md animate-pop">
        <div className="flex items-center gap-2 border-b border-line px-3">
          <Search className="h-4 w-4 text-muted" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive(Math.min(results.length - 1, current + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive(Math.max(0, current - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                choose(results[current]);
              } else if (e.key === "Escape") {
                e.preventDefault();
                close();
              }
            }}
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={results[current] ? `palette-${results[current].id}` : undefined}
            aria-label="Search pages, projects and actions"
            placeholder="Type a command or search…"
            className="h-12 flex-1 bg-transparent text-sm text-ink placeholder:text-muted/70 focus:outline-none"
          />
          <kbd className="border border-line bg-bg px-1.5 py-0.5 text-[10px] text-muted rounded-xs">Esc</kbd>
        </div>
        <ul id="palette-list" role="listbox" className="scrollbar-thin m-0 max-h-[340px] list-none overflow-y-auto p-1">
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted">Nothing matches “{query}”. Try a page name such as “optimization”.</li>
          ) : (
            results.map((c, i) => (
              <li key={c.id} role="presentation">
                {i === 0 || results[i - 1].group !== c.group ? <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{c.group}</p> : null}
                <button
                  id={`palette-${c.id}`}
                  type="button"
                  role="option"
                  aria-selected={i === current}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(c)}
                  className={cn("flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-ink rounded-sm", i === current && "bg-highlight")}
                >
                  <span className="text-muted">{c.icon}</span>
                  <span className="min-w-0 flex-1 truncate">{c.label}</span>
                  {c.hint ? <span className="text-[11px] text-muted">{c.hint}</span> : null}
                  {i === current ? <CornerDownLeft className="h-3.5 w-3.5 text-muted" aria-hidden /> : null}
                </button>
              </li>
            ))
          )}
        </ul>
        <p className="border-t border-line px-3 py-2 text-[11px] text-muted">↑ ↓ to move · Enter to select · Esc to close</p>
      </div>
    </div>,
    document.body,
  );
}
