"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Check, Coffee } from "lucide-react";
import { Dialog, Button } from "@/components/ui";
import { cn, formatTHB } from "@/lib/utils";
import type { Product, MenuOptionChoice } from "@/lib/types";

/** A fully resolved option selection ready to drop onto a cart line. */
export interface SelectedOption {
  label: string;
  priceDelta: number;
}

/**
 * Dialog that lets a customer pick one choice per option group on a product.
 * Live price = basePrice + sum(selected priceDelta). Defaults to the first
 * choice of every group so the picker is always valid and a tap-to-confirm
 * away. Products with no options should be added directly without this dialog.
 */
export function OptionPicker({
  open,
  onClose,
  product,
  basePrice,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  /** Price the customer pays for one unit before option deltas. */
  basePrice: number;
  onConfirm: (options: SelectedOption[], unitPrice: number) => void;
}) {
  const options = product?.options ?? [];

  // selected choice id per option group id
  const [selected, setSelected] = useState<Record<string, string>>({});

  // Reset to first choice of each group whenever the product changes.
  const defaults = useMemo(() => {
    const next: Record<string, string> = {};
    for (const group of options) {
      if (group.choices.length) next[group.id] = group.choices[0].id;
    }
    return next;
  }, [options]);

  // Derive the working selection: explicit picks override the computed defaults.
  const picks = useMemo(() => ({ ...defaults, ...selected }), [defaults, selected]);

  const chosen: MenuOptionChoice[] = useMemo(() => {
    const list: MenuOptionChoice[] = [];
    for (const group of options) {
      const id = picks[group.id];
      const choice = group.choices.find((c) => c.id === id);
      if (choice) list.push(choice);
    }
    return list;
  }, [options, picks]);

  const optionDelta = chosen.reduce((a, c) => a + c.priceDelta, 0);
  const unitPrice = basePrice + optionDelta;

  const handleConfirm = () => {
    if (!product) return;
    const payload: SelectedOption[] = chosen.map((c) => ({
      label: c.label,
      priceDelta: c.priceDelta,
    }));
    onConfirm(payload, unitPrice);
    setSelected({});
  };

  const handleClose = () => {
    setSelected({});
    onClose();
  };

  if (!product) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <Button variant="ghost" onClick={handleClose}>
            ยกเลิก
          </Button>
          <Button variant="primary" size="lg" onClick={handleConfirm}>
            เพิ่มลงตะกร้า · {formatTHB(unitPrice)}
          </Button>
        </div>
      }
    >
      <div className="mb-5 flex items-center gap-3.5">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-amber-500/10">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              unoptimized
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-amber-500">
              <Coffee className="h-7 w-7" />
            </span>
          )}
        </div>
        <div className="min-w-0">
          <h2 className="line-clamp-2 text-lg font-semibold leading-snug text-slate-900 dark:text-slate-50">
            {product.name}
          </h2>
          <p className="font-mono text-sm text-slate-500 dark:text-slate-400">
            เริ่มต้น {formatTHB(basePrice)}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {options.map((group) => (
          <div key={group.id}>
            <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              {group.name}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.choices.map((choice) => {
                const active = picks[group.id] === choice.id;
                return (
                  <button
                    key={choice.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      setSelected((prev) => ({ ...prev, [group.id]: choice.id }))
                    }
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all duration-150 active:scale-[0.97]",
                      active
                        ? "border-primary bg-primary/10 text-primary shadow-sm dark:bg-primary/15"
                        : "border-slate-300/70 bg-white/50 text-slate-600 hover:border-slate-400 hover:bg-white/80 dark:border-white/15 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10",
                    )}
                  >
                    {active && <Check className="h-3.5 w-3.5" />}
                    <span>{choice.label}</span>
                    {choice.priceDelta > 0 && (
                      <span className="font-mono text-xs opacity-80">
                        +{formatTHB(choice.priceDelta)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Dialog>
  );
}
