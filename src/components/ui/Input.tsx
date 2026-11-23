"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  className?: string;
}

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "className">,
    FieldProps {
  leftIcon?: React.ReactNode;
  rightSlot?: React.ReactNode;
  suffix?: string;
  inputClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, required, className, leftIcon, rightSlot, suffix, inputClassName, id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <label htmlFor={inputId} className="text-xs font-semibold text-ink">
          {label}
          {required ? <span className="text-danger"> *</span> : null}
        </label>
      ) : null}
      <div
        className={cn(
          "flex h-9 items-stretch border bg-surface rounded-sm transition-colors",
          "focus-within:border-primary focus-within:ring-1 focus-within:ring-primary",
          error ? "border-danger" : "border-line hover:border-line-strong",
        )}
      >
        {leftIcon ? (
          <span className="flex items-center pl-2.5 text-muted" aria-hidden>
            {leftIcon}
          </span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "min-w-0 flex-1 bg-transparent px-2.5 text-sm text-ink placeholder:text-muted/70 focus:outline-none",
            inputClassName,
          )}
          {...rest}
        />
        {suffix ? (
          <span className="flex items-center border-l border-line bg-bg px-2.5 text-xs text-muted">
            {suffix}
          </span>
        ) : null}
        {rightSlot ? <span className="flex items-center pr-1.5">{rightSlot}</span> : null}
      </div>
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "className">,
    FieldProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, required, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <label htmlFor={inputId} className="text-xs font-semibold text-ink">
          {label}
          {required ? <span className="text-danger"> *</span> : null}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        className={cn(
          "min-h-[84px] w-full border bg-surface px-2.5 py-2 text-sm text-ink rounded-sm placeholder:text-muted/70",
          "focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary",
          error ? "border-danger" : "border-line hover:border-line-strong",
        )}
        {...rest}
      />
      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
});

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "className">,
    FieldProps {
  options: { value: string; label: string }[];
}

/** Native select styled to match inputs; good keyboard support for free. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, required, className, id, options, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <label htmlFor={inputId} className="text-xs font-semibold text-ink">
          {label}
          {required ? <span className="text-danger"> *</span> : null}
        </label>
      ) : null}
      <div className="relative">
        <select
          ref={ref}
          id={inputId}
          className={cn(
            "h-9 w-full appearance-none border bg-surface pl-2.5 pr-8 text-sm text-ink rounded-sm",
            "focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary",
            error ? "border-danger" : "border-line hover:border-line-strong",
          )}
          {...rest}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        >
          <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
});
