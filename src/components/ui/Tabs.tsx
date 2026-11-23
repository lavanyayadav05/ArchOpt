"use client";

import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

export interface TabItem<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  disabled?: boolean;
}

export interface TabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  items: TabItem<T>[];
  /** "segmented": boxed group (filters). "underline": page-level tabs. */
  variant?: "segmented" | "underline";
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
}

/**
 * Accessible tab list with roving focus (Arrow keys, Home, End).
 * Panels are the caller's responsibility; use `aria-controls` ids if needed.
 */
export function Tabs<T extends string>({
  value,
  onChange,
  items,
  variant = "segmented",
  size = "md",
  className,
  ariaLabel,
}: TabsProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const enabled = items.filter((i) => !i.disabled);
      const idx = enabled.findIndex((i) => i.value === value);
      let next = idx;
      if (e.key === "ArrowRight") next = (idx + 1) % enabled.length;
      else if (e.key === "ArrowLeft") next = (idx - 1 + enabled.length) % enabled.length;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = enabled.length - 1;
      else return;
      e.preventDefault();
      const target = enabled[next];
      onChange(target.value);
      const btn = listRef.current?.querySelector<HTMLButtonElement>(`[data-value="${target.value}"]`);
      btn?.focus();
    },
    [items, value, onChange],
  );

  const isSeg = variant === "segmented";

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={cn(
        "flex max-w-full overflow-x-auto scrollbar-thin",
        isSeg ? "border border-line bg-surface p-0.5 rounded-sm" : "border-b border-line gap-1",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            type="button"
            data-value={item.value}
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            disabled={item.disabled}
            onClick={() => onChange(item.value)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap font-medium transition-colors disabled:opacity-50",
              size === "sm" ? "h-7 px-2.5 text-xs" : "h-8 px-3 text-sm",
              isSeg
                ? cn("rounded-xs", active ? "bg-primary text-white" : "text-muted hover:bg-highlight hover:text-ink")
                : cn(
                    "-mb-px border-b-2",
                    active ? "border-primary text-primary" : "border-transparent text-muted hover:text-ink",
                  ),
            )}
          >
            {item.icon}
            {item.label}
            {typeof item.count === "number" ? (
              <span
                className={cn(
                  "ml-0.5 min-w-[18px] px-1 text-center text-[10px] font-semibold leading-4 rounded-xs",
                  active && isSeg ? "bg-white/20 text-white" : "bg-highlight text-primary",
                )}
              >
                {item.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
