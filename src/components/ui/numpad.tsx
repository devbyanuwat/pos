"use client";

import * as React from "react";
import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Spread onto any numeric <input> that should NOT trigger the on-screen device
 * keyboard. All numeric entry on the counter POS routes through <Numpad /> +
 * <NumpadDisplay /> instead, so the OS keyboard never opens.
 */
export const suppressKeyboardProps = {
  readOnly: true,
  inputMode: "none",
} as const;

/** Append a digit to a numeric string, keeping leading zeros sane. */
function appendDigit(value: string, digit: string): string {
  // Replace a lone leading "0" so we never produce "05".
  if (value === "0") return digit;
  return value + digit;
}

/** Append a decimal point only when allowed and not already present. */
function appendDecimal(value: string): string {
  if (value.includes(".")) return value;
  // Start "0." when nothing has been typed yet.
  if (value === "") return "0.";
  return value + ".";
}

function backspace(value: string): string {
  return value.slice(0, -1);
}

export interface NumpadProps {
  value: string;
  onChange: (next: string) => void;
  onSubmit?: () => void;
  submitLabel?: string;
  allowDecimal?: boolean;
  className?: string;
}

const keyClass =
  "flex min-h-14 items-center justify-center rounded-xl border border-slate-300/60 bg-white/60 text-xl font-semibold text-slate-800 shadow-sm transition-all duration-150 select-none hover:bg-white/90 hover:shadow active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 dark:border-white/12 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10";

export function Numpad({
  value,
  onChange,
  onSubmit,
  submitLabel,
  allowDecimal = false,
  className,
}: NumpadProps) {
  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div className={cn("grid grid-cols-3 gap-2.5 sm:gap-3", className)}>
      {digits.map((digit) => (
        <button
          key={digit}
          type="button"
          aria-label={digit}
          className={keyClass}
          onClick={() => onChange(appendDigit(value, digit))}
        >
          {digit}
        </button>
      ))}

      {allowDecimal ? (
        <button
          type="button"
          aria-label="จุดทศนิยม"
          className={keyClass}
          onClick={() => onChange(appendDecimal(value))}
        >
          .
        </button>
      ) : (
        <span aria-hidden className="min-h-14" />
      )}

      <button
        type="button"
        aria-label="0"
        className={keyClass}
        onClick={() => onChange(appendDigit(value, "0"))}
      >
        0
      </button>

      <button
        type="button"
        aria-label="ลบ"
        className={cn(
          keyClass,
          "text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100",
        )}
        onClick={() => onChange(backspace(value))}
      >
        <Delete className="h-6 w-6" />
      </button>

      {onSubmit && (
        <button
          type="button"
          className="col-span-3 mt-1 flex min-h-14 items-center justify-center rounded-xl bg-primary text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-150 select-none hover:bg-indigo-500 hover:shadow-primary/30 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:pointer-events-none disabled:opacity-50"
          onClick={onSubmit}
        >
          {submitLabel ?? "ยืนยัน"}
        </button>
      )}
    </div>
  );
}

export interface NumpadDisplayProps {
  label?: string;
  value: string;
  placeholder?: string;
  suffix?: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * A read-only, tappable value box that never opens the OS keyboard
 * (role=button, inputMode none). Pair with <Numpad /> for all numeric entry.
 */
export function NumpadDisplay({
  label,
  value,
  placeholder = "0",
  suffix,
  active = false,
  onClick,
  className,
}: NumpadDisplayProps) {
  const hasValue = value !== "";
  const interactive = typeof onClick === "function";

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </span>
      )}
      <div
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        inputMode="none"
        aria-label={label}
        onClick={onClick}
        onKeyDown={
          interactive
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick?.();
                }
              }
            : undefined
        }
        className={cn(
          "glass-subtle flex min-h-14 w-full items-baseline justify-end gap-2 rounded-xl px-4 py-3 transition-all duration-200",
          interactive && "cursor-pointer hover:bg-white/70 dark:hover:bg-white/10",
          active
            ? "ring-2 ring-primary ring-offset-2 ring-offset-transparent"
            : "ring-1 ring-slate-300/50 dark:ring-white/10",
        )}
      >
        <span
          className={cn(
            "truncate font-mono text-2xl font-semibold tabular-nums",
            hasValue
              ? "text-slate-900 dark:text-slate-50"
              : "text-slate-400 dark:text-slate-500",
          )}
        >
          {hasValue ? value : placeholder}
        </span>
        {suffix && (
          <span className="shrink-0 text-sm font-medium text-slate-500 dark:text-slate-400">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
