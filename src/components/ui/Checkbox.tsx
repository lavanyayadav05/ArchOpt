"use client";

import { useId } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  error?: string | null;
}

/** Square 16px checkbox with a visible border and a filled checked state. */
export function Checkbox({ checked, onChange, label, description, disabled, className, id, name, error }: CheckboxProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label
        htmlFor={inputId}
        className={cn("inline-flex cursor-pointer items-start gap-2.5", disabled && "cursor-not-allowed opacity-60")}
      >
        <span className="relative mt-0.5 inline-flex h-4 w-4 shrink-0">
          <input
            id={inputId}
            name={name}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={(e) => onChange(e.target.checked)}
            className="peer absolute inset-0 h-4 w-4 cursor-pointer opacity-0 disabled:cursor-not-allowed"
            aria-invalid={error ? true : undefined}
          />
          <span
            aria-hidden
            className={cn(
              "flex h-4 w-4 items-center justify-center border rounded-xs transition-colors",
              "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-primary",
              checked ? "border-primary bg-primary text-white" : "border-line-strong bg-surface",
              error && !checked && "border-danger",
            )}
          >
            {checked ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
          </span>
        </span>
        {label ? (
          <span className="text-sm leading-5 text-ink">
            {label}
            {description ? <span className="block text-xs text-muted">{description}</span> : null}
          </span>
        ) : null}
      </label>
      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

/** Rectangular switch (no pill): a 36×20 track with a square knob. */
export function Toggle({ checked, onChange, label, description, disabled, className }: ToggleProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      {label ? (
        <span className="min-w-0">
          <span className="block text-sm font-medium text-ink">{label}</span>
          {description ? <span className="block text-xs text-muted">{description}</span> : null}
        </span>
      ) : null}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center border rounded-sm transition-colors",
          checked ? "border-primary bg-primary" : "border-line-strong bg-line",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute top-0.5 h-3.5 w-3.5 bg-white rounded-xs shadow-card transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}

export interface RadioOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

export function RadioGroup<T extends string>({
  value,
  onChange,
  options,
  name,
  className,
  inline,
}: {
  value: T;
  onChange: (v: T) => void;
  options: RadioOption<T>[];
  name: string;
  className?: string;
  inline?: boolean;
}) {
  return (
    <div role="radiogroup" className={cn(inline ? "flex flex-wrap gap-4" : "flex flex-col gap-2", className)}>
      {options.map((o) => (
        <label key={o.value} className="inline-flex cursor-pointer items-start gap-2.5">
          <span className="relative mt-0.5 inline-flex h-4 w-4">
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="peer absolute inset-0 h-4 w-4 cursor-pointer opacity-0"
            />
            <span
              aria-hidden
              className={cn(
                "flex h-4 w-4 items-center justify-center border rounded-xs",
                "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-primary",
                value === o.value ? "border-primary bg-primary" : "border-line-strong bg-surface",
              )}
            >
              {value === o.value ? <span className="h-1.5 w-1.5 bg-white" /> : null}
            </span>
          </span>
          <span className="text-sm text-ink">
            {o.label}
            {o.description ? <span className="block text-xs text-muted">{o.description}</span> : null}
          </span>
        </label>
      ))}
    </div>
  );
}
