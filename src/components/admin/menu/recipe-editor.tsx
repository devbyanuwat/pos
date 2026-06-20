"use client";

import { Plus, Trash2, FlaskConical } from "lucide-react";
import { Button, Input, Select } from "@/components/ui";
import type { Ingredient } from "@/lib/types";
import { genId } from "@/lib/utils";

/** Draft recipe line held while editing (qty as string for the input). */
export interface DraftRecipeLine {
  /** Local key only; not persisted. */
  key: string;
  ingredientId: string;
  qty: string;
}

export function newDraftRecipeLine(ingredientId = ""): DraftRecipeLine {
  return { key: genId("rcp"), ingredientId, qty: "" };
}

/**
 * Editor for a product's recipe (bill of materials). Each line links an
 * ingredient to a quantity consumed per unit. Fully controlled by the parent.
 */
export function RecipeEditor({
  value,
  ingredients,
  onChange,
}: {
  value: DraftRecipeLine[];
  ingredients: Ingredient[];
  onChange: (next: DraftRecipeLine[]) => void;
}) {
  const unitFor = (id: string) => ingredients.find((i) => i.id === id)?.unit ?? "";

  const patchLine = (key: string, patch: Partial<DraftRecipeLine>) =>
    onChange(value.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const removeLine = (key: string) => onChange(value.filter((l) => l.key !== key));

  const addLine = () => onChange([...value, newDraftRecipeLine(ingredients[0]?.id ?? "")]);

  if (ingredients.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300/70 bg-white/40 px-4 py-6 text-center dark:border-white/15 dark:bg-white/5">
        <FlaskConical className="h-5 w-5 text-slate-400" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          ยังไม่มีวัตถุดิบในระบบ เพิ่มวัตถุดิบที่หน้า &quot;วัตถุดิบ&quot; ก่อน
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {value.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300/70 bg-white/40 px-4 py-6 text-center dark:border-white/15 dark:bg-white/5">
          <FlaskConical className="h-5 w-5 text-slate-400" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            ยังไม่มีสูตร เพิ่มวัตถุดิบที่ใช้ต่อ 1 แก้ว
          </p>
        </div>
      ) : (
        value.map((line) => (
          <div key={line.key} className="flex items-center gap-2">
            <div className="flex-1">
              <Select
                value={line.ingredientId}
                onChange={(e) => patchLine(line.key, { ingredientId: e.target.value })}
                aria-label="เลือกวัตถุดิบ"
              >
                {ingredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {ing.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="relative w-32 shrink-0">
              <Input
                type="number"
                min={0}
                inputMode="decimal"
                value={line.qty}
                onChange={(e) => patchLine(line.key, { qty: e.target.value })}
                placeholder="ปริมาณ"
                className="pr-12 text-right font-mono"
                aria-label="ปริมาณที่ใช้"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                {unitFor(line.ingredientId)}
              </span>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => removeLine(line.key)}
              aria-label="ลบวัตถุดิบในสูตร"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ))
      )}

      <Button type="button" variant="outline" size="sm" onClick={addLine} className="w-full">
        <Plus className="h-4 w-4" /> เพิ่มวัตถุดิบ
      </Button>
    </div>
  );
}
