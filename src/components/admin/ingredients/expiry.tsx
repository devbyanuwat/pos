"use client";

import type { Ingredient, Product } from "@/lib/types";
import type { Tone } from "@/lib/constants";
import { daysToExpiry, menuItemsUsingIngredient } from "@/lib/selectors";

/** Resolve an expiry-derived status (label + badge tone) for an ingredient lot. */
export function expiryStatus(
  ingredient: Ingredient,
  now: Date = new Date(),
): { label: string; tone: Tone; days: number } {
  const days = daysToExpiry(ingredient.expiryDate, now);
  if (days < 0) return { label: "หมดอายุแล้ว", tone: "danger", days };
  if (days <= 7) return { label: "ใกล้หมดอายุ", tone: "warning", days };
  return { label: "ปกติ", tone: "success", days };
}

/** Human-readable countdown for a days-to-expiry value. */
export function expiryCountdownLabel(days: number): string {
  if (days < 0) return "หมดอายุแล้ว";
  if (days === 0) return "หมดอายุวันนี้";
  if (days === 1) return "เหลือ 1 วัน";
  return `เหลือ ${days} วัน`;
}

/**
 * Small chips listing the menu items that consume a given ingredient. Renders a
 * muted hint when no recipe references it (so the alert row stays meaningful).
 */
export function AffectedMenuChips({
  products,
  ingredientId,
}: {
  products: Product[];
  ingredientId: string;
}) {
  const items = menuItemsUsingIngredient(products, ingredientId);
  if (items.length === 0) {
    return (
      <span className="text-xs text-slate-400 dark:text-slate-500">ไม่มีเมนูที่ใช้วัตถุดิบนี้</span>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((p) => (
        <span
          key={p.id}
          className="inline-flex items-center rounded-lg bg-slate-500/10 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300"
        >
          {p.name}
        </span>
      ))}
    </div>
  );
}
