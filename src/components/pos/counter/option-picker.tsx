"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Coffee, Plus } from "lucide-react";
import { Dialog, Button } from "@/components/ui";
import { cn, formatTHB } from "@/lib/utils";
import type { OrderItemOption } from "@/lib/store";
import type { Product, MenuOptionChoice } from "@/lib/types";

/** Map of optionGroupId -> chosen choiceId. */
type Selection = Record<string, string>;

/**
 * Modal that lets the cashier pick one choice per option group for a drink and
 * confirm. Computes the live unit price (basePrice + chosen deltas) and hands
 * the chosen choices back to the page to append as a sale line.
 */
export function OptionPicker({
  product,
  basePrice,
  onConfirm,
  onClose,
}: {
  product: Product | null;
  /** Price for the current customer BEFORE option deltas. */
  basePrice: number;
  onConfirm: (options: OrderItemOption[]) => void;
  onClose: () => void;
}) {
  const groups = product?.options ?? [];

  // Default every group to its first choice so a confirm is always valid.
  const [selection, setSelection] = useState<Selection>({});
  useEffect(() => {
    if (!product) return;
    const init: Selection = {};
    for (const g of product.options ?? []) {
      if (g.choices[0]) init[g.id] = g.choices[0].id;
    }
    setSelection(init);
  }, [product]);

  const chosen = useMemo<OrderItemOption[]>(() => {
    const out: OrderItemOption[] = [];
    for (const g of groups) {
      const choice = g.choices.find((c) => c.id === selection[g.id]);
      if (choice) out.push({ label: choice.label, priceDelta: choice.priceDelta });
    }
    return out;
  }, [groups, selection]);

  const delta = chosen.reduce((a, o) => a + o.priceDelta, 0);
  const unitPrice = basePrice + delta;

  function confirm() {
    onConfirm(chosen);
  }

  return (
    <Dialog
      open={!!product}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <Coffee className="h-5 w-5 text-primary" />
          {product?.name ?? "เลือกตัวเลือก"}
        </span>
      }
      description="เลือกตัวเลือกแล้วเพิ่มลงบิล"
      footer={
        <>
          <Button variant="ghost" size="lg" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button variant="primary" size="lg" onClick={confirm}>
            <Plus className="h-5 w-5" />
            เพิ่มลงบิล · {formatTHB(unitPrice)}
          </Button>
        </>
      }
    >
      {product && (
        <div className="space-y-5">
          {groups.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              เมนูนี้ไม่มีตัวเลือกเพิ่มเติม กด &quot;เพิ่มลงบิล&quot; ได้เลย
            </p>
          ) : (
            groups.map((group) => (
              <div key={group.id} className="space-y-2.5">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {group.name}
                </p>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {group.choices.map((choice) => (
                    <ChoiceChip
                      key={choice.id}
                      choice={choice}
                      active={selection[group.id] === choice.id}
                      onSelect={() =>
                        setSelection((prev) => ({ ...prev, [group.id]: choice.id }))
                      }
                    />
                  ))}
                </div>
              </div>
            ))
          )}

          <div className="flex items-center justify-between rounded-xl bg-slate-500/5 px-4 py-3">
            <span className="text-sm text-slate-500 dark:text-slate-400">ราคาต่อแก้ว</span>
            <span className="font-mono text-xl font-bold text-primary">{formatTHB(unitPrice)}</span>
          </div>
        </div>
      )}
    </Dialog>
  );
}

function ChoiceChip({
  choice,
  active,
  onSelect,
}: {
  choice: MenuOptionChoice;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex min-h-12 flex-col items-center justify-center rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-150 active:scale-[0.98]",
        active
          ? "border-primary bg-primary/10 text-primary shadow-sm shadow-primary/10 dark:bg-primary/15"
          : "border-slate-300/60 bg-white/50 text-slate-700 hover:border-primary/40 hover:bg-white/80 dark:border-white/12 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10",
      )}
    >
      {active && (
        <Check className="absolute right-1.5 top-1.5 h-3.5 w-3.5 text-primary" aria-hidden />
      )}
      <span>{choice.label}</span>
      {choice.priceDelta !== 0 && (
        <span className="mt-0.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
          {choice.priceDelta > 0 ? "+" : ""}
          {formatTHB(choice.priceDelta)}
        </span>
      )}
    </button>
  );
}
