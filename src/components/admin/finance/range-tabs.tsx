"use client";

import { Tabs } from "@/components/ui";
import type { RangePreset } from "@/lib/selectors";

/** Range presets exposed in the admin UI (excludes the internal "all"). */
export const RANGE_TABS: { value: RangePreset; label: string }[] = [
  { value: "today", label: "วันนี้" },
  { value: "7d", label: "7 วัน" },
  { value: "30d", label: "30 วัน" },
  { value: "month", label: "เดือนนี้" },
];

const LABELS: Record<RangePreset, string> = {
  today: "วันนี้",
  "7d": "7 วันล่าสุด",
  "30d": "30 วันล่าสุด",
  month: "เดือนนี้",
  all: "ทั้งหมด",
};

export function rangeLabel(preset: RangePreset): string {
  return LABELS[preset];
}

/** Shared date-range selector used across every admin analytics page. */
export function RangeTabs({
  value,
  onChange,
  className,
}: {
  value: RangePreset;
  onChange: (v: RangePreset) => void;
  className?: string;
}) {
  return (
    <Tabs
      tabs={RANGE_TABS}
      value={value}
      onChange={(v) => onChange(v as RangePreset)}
      className={className}
    />
  );
}
