"use client";

import type * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { formatTHB, formatNumber, cn } from "@/lib/utils";

/** Shared brand chart colors. Keep in sync with the contract palette. */
export const CHART_COLORS = {
  revenue: "#4f46e5",
  profit: "#10b981",
  expense: "#ef4444",
  secondary: "#0ea5e9",
  accent: "#f59e0b",
} as const;

/** Donut/pie palette for categorical breakdowns. */
export const PIE_COLORS = ["#4f46e5", "#0ea5e9", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];

/** Compact axis tick: 12,500 -> 12.5k, 1,200,000 -> 1.2M. */
export function compactNumber(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${Math.round(value / 1_000)}k`;
  return formatNumber(value);
}

/** A titled glass card wrapping a fixed-height chart. */
export function ChartCard({
  title,
  description,
  children,
  className,
  action,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription className="mt-1">{description}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

type TooltipEntry = {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
};

/**
 * Recharts tooltip rendering values as Thai Baht inside a glass panel.
 * Pass `currencyKeys` to limit which series get the currency format;
 * everything else is shown as a plain number.
 */
export function CurrencyTooltip({
  active,
  payload,
  label,
  currencyKeys,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: React.ReactNode;
  currencyKeys?: string[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="glass-strong rounded-xl px-3 py-2 text-xs shadow-xl">
      {label != null && (
        <p className="mb-1 font-medium text-slate-700 dark:text-slate-200">{label}</p>
      )}
      <div className="flex flex-col gap-1">
        {payload.map((entry, i) => {
          const key = String(entry.dataKey ?? "");
          const isCurrency = !currencyKeys || currencyKeys.includes(key);
          const num = typeof entry.value === "number" ? entry.value : Number(entry.value ?? 0);
          return (
            <div key={i} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: entry.color }}
                />
                {entry.name}
              </span>
              <span className="font-mono font-medium text-slate-900 dark:text-slate-50">
                {isCurrency ? formatTHB(num) : formatNumber(num)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
