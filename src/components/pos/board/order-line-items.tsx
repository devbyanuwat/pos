"use client";

import { formatTHB, formatNumber } from "@/lib/utils";
import type { OrderItem } from "@/lib/types";

/**
 * Compact line-item list for the order board. Each row shows qty x name, the
 * chosen option labels (size / sweetness / temp) as quiet chips, and an optional
 * line total. Used inside the detail sheet and the barista queue checklist.
 */
export function OrderLineItems({
  items,
  showPrice = true,
}: {
  items: OrderItem[];
  showPrice?: boolean;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((it, idx) => (
        <li
          key={`${it.productId}-${idx}`}
          className="flex items-start gap-3 rounded-xl bg-slate-500/5 px-3 py-2.5 transition-colors hover:bg-slate-500/10"
        >
          <span className="mt-0.5 flex h-7 min-w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 px-1.5 font-mono text-sm font-semibold text-primary">
            {formatNumber(it.qty)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
              {it.name}
            </p>
            {it.options && it.options.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {it.options.map((opt, i) => (
                  <span
                    key={i}
                    className="rounded-md bg-slate-500/10 px-1.5 py-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400"
                  >
                    {opt}
                  </span>
                ))}
              </div>
            )}
          </div>
          {showPrice && (
            <span className="shrink-0 font-mono text-sm font-medium text-slate-700 dark:text-slate-200">
              {formatTHB(it.unitPrice * it.qty)}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
