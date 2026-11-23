"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onSelect?: () => void;
  danger?: boolean;
  disabled?: boolean;
  /** Draw a divider above this item. */
  separator?: boolean;
}

export interface DropdownMenuProps {
  trigger: (props: {
    ref: React.RefObject<HTMLButtonElement | null>;
    open: boolean;
    toggle: () => void;
    "aria-haspopup": "menu";
    "aria-expanded": boolean;
    "aria-controls": string;
  }) => React.ReactNode;
  items: MenuItem[];
  align?: "left" | "right";
  className?: string;
}

function useClickOutside(refs: React.RefObject<HTMLElement | null>[], onOutside: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: MouseEvent) => {
      if (refs.every((r) => r.current && !r.current.contains(e.target as Node))) onOutside();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [refs, onOutside, active]);
}

/** Action menu ("..." buttons, user menu). Keyboard: arrows, Enter, Escape. */
export function DropdownMenu({ trigger, items, align = "right", className }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => {
    setActiveIndex(items.findIndex((i) => !i.disabled));
    setOpen((o) => !o);
  }, [items]);
  useClickOutside([triggerRef, menuRef], close, open);

  // Move focus into the menu when it opens (DOM side effect only).
  useEffect(() => {
    if (!open) return;
    const first = menuRef.current?.querySelector<HTMLButtonElement>("[role=menuitem]:not([disabled])");
    first?.focus();
  }, [open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const enabled = items.map((it, i) => ({ it, i })).filter(({ it }) => !it.disabled);
    const pos = enabled.findIndex(({ i }) => i === activeIndex);
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      triggerRef.current?.focus();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const nextPos = e.key === "ArrowDown" ? (pos + 1) % enabled.length : (pos - 1 + enabled.length) % enabled.length;
      const next = enabled[nextPos].i;
      setActiveIndex(next);
      menuRef.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]")[next]?.focus();
    } else if (e.key === "Tab") {
      close();
    }
  };

  return (
    <div className={cn("relative inline-block", className)}>
      {trigger({
        ref: triggerRef,
        open,
        toggle,
        "aria-haspopup": "menu",
        "aria-expanded": open,
        "aria-controls": id,
      })}
      {open ? (
        <div
          ref={menuRef}
          id={id}
          role="menu"
          onKeyDown={onKeyDown}
          className={cn(
            "absolute z-50 mt-1 min-w-[180px] border border-line bg-surface py-1 shadow-panel rounded-sm",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {items.map((item, i) => (
            <div key={item.id}>
              {item.separator ? <hr className="my-1 border-line" /> : null}
              <button
                type="button"
                role="menuitem"
                disabled={item.disabled}
                tabIndex={i === activeIndex ? 0 : -1}
                onClick={() => {
                  close();
                  item.onSelect?.();
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm disabled:opacity-50",
                  item.danger ? "text-danger hover:bg-danger-bg" : "text-ink hover:bg-highlight",
                  "focus:bg-highlight focus:outline-none",
                )}
              >
                {item.icon ? <span className="text-muted [&>svg]:h-4 [&>svg]:w-4">{item.icon}</span> : null}
                {item.label}
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

export interface SelectMenuProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: SelectOption<T>[];
  label?: string;
  /** Text shown before the selected label, e.g. "Sort:" */
  prefix?: string;
  className?: string;
  size?: "sm" | "md";
  icon?: React.ReactNode;
  ariaLabel?: string;
}

/** Custom select used for filters and sorting (listbox semantics). */
export function SelectMenu<T extends string>({
  value,
  onChange,
  options,
  prefix,
  className,
  size = "md",
  icon,
  ariaLabel,
}: SelectMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const close = useCallback(() => setOpen(false), []);
  useClickOutside([btnRef, listRef], close, open);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLButtonElement>("[aria-selected=true]");
    el?.focus();
  }, [open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const idx = options.findIndex((o) => o.value === value);
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      btnRef.current?.focus();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = e.key === "ArrowDown" ? (idx + 1) % options.length : (idx - 1 + options.length) % options.length;
      onChange(options[next].value);
      listRef.current?.querySelectorAll<HTMLButtonElement>("[role=option]")[next]?.focus();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      close();
      btnRef.current?.focus();
    } else if (e.key === "Tab") {
      close();
    }
  };

  return (
    <div className={cn("relative inline-block", className)}>
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          "inline-flex w-full items-center justify-between gap-2 border border-line bg-surface text-ink rounded-sm hover:border-line-strong",
          size === "sm" ? "h-8 px-2.5 text-xs" : "h-9 px-3 text-sm",
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {icon ? <span className="text-muted [&>svg]:h-4 [&>svg]:w-4">{icon}</span> : null}
          <span className="truncate">
            {prefix ? <span className="text-muted">{prefix} </span> : null}
            {selected?.label}
          </span>
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div
          ref={listRef}
          id={id}
          role="listbox"
          onKeyDown={onKeyDown}
          className="absolute left-0 z-50 mt-1 min-w-full border border-line bg-surface py-1 shadow-panel rounded-sm"
        >
          {options.map((o) => {
            const active = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={active}
                tabIndex={active ? 0 : -1}
                onClick={() => {
                  onChange(o.value);
                  close();
                  btnRef.current?.focus();
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-3 whitespace-nowrap px-3 py-1.5 text-left text-sm hover:bg-highlight focus:bg-highlight focus:outline-none",
                  active ? "text-primary" : "text-ink",
                )}
              >
                {o.label}
                {active ? <Check className="h-3.5 w-3.5" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
