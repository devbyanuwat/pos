"use client";

import { Plus, Trash2, ListPlus, SlidersHorizontal } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { cn, formatTHB, genId } from "@/lib/utils";

/** Draft choice held while editing (priceDelta as string for the input). */
export interface DraftChoice {
  id: string;
  label: string;
  priceDelta: string;
}

/** Draft option group held while editing. */
export interface DraftOption {
  id: string;
  name: string;
  choices: DraftChoice[];
}

export function newDraftChoice(): DraftChoice {
  return { id: genId("choice"), label: "", priceDelta: "0" };
}

export function newDraftOption(): DraftOption {
  return { id: genId("opt"), name: "", choices: [newDraftChoice()] };
}

/**
 * Editor for a product's customizable option groups (size, sweetness, hot/iced...).
 * Fully controlled: the parent owns the `DraftOption[]` and persists on save.
 */
export function OptionsEditor({
  value,
  onChange,
}: {
  value: DraftOption[];
  onChange: (next: DraftOption[]) => void;
}) {
  const patchOption = (id: string, patch: Partial<DraftOption>) =>
    onChange(value.map((o) => (o.id === id ? { ...o, ...patch } : o)));

  const removeOption = (id: string) => onChange(value.filter((o) => o.id !== id));

  const addOption = () => onChange([...value, newDraftOption()]);

  const addChoice = (optId: string) =>
    onChange(
      value.map((o) =>
        o.id === optId ? { ...o, choices: [...o.choices, newDraftChoice()] } : o,
      ),
    );

  const patchChoice = (optId: string, choiceId: string, patch: Partial<DraftChoice>) =>
    onChange(
      value.map((o) =>
        o.id === optId
          ? {
              ...o,
              choices: o.choices.map((c) => (c.id === choiceId ? { ...c, ...patch } : c)),
            }
          : o,
      ),
    );

  const removeChoice = (optId: string, choiceId: string) =>
    onChange(
      value.map((o) =>
        o.id === optId ? { ...o, choices: o.choices.filter((c) => c.id !== choiceId) } : o,
      ),
    );

  return (
    <div className="space-y-3">
      {value.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300/70 bg-white/40 px-4 py-6 text-center dark:border-white/15 dark:bg-white/5">
          <SlidersHorizontal className="h-5 w-5 text-slate-400" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            ยังไม่มีตัวเลือก เช่น ขนาด ความหวาน หรืออุณหภูมิ
          </p>
        </div>
      ) : (
        value.map((opt, oi) => (
          <div
            key={opt.id}
            className="rounded-xl border border-slate-200/70 bg-white/50 p-3.5 dark:border-white/10 dark:bg-white/5"
          >
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label htmlFor={`opt-name-${opt.id}`}>ชื่อกลุ่มตัวเลือก {oi + 1}</Label>
                <Input
                  id={`opt-name-${opt.id}`}
                  value={opt.name}
                  onChange={(e) => patchOption(opt.id, { name: e.target.value })}
                  placeholder="เช่น ขนาด, ความหวาน"
                />
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => removeOption(opt.id)}
                aria-label={`ลบกลุ่มตัวเลือก ${opt.name || oi + 1}`}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>

            <div className="mt-3 space-y-2">
              {opt.choices.map((choice) => {
                const delta = Number(choice.priceDelta) || 0;
                return (
                  <div key={choice.id} className="flex items-center gap-2">
                    <Input
                      value={choice.label}
                      onChange={(e) => patchChoice(opt.id, choice.id, { label: e.target.value })}
                      placeholder="ชื่อตัวเลือก เช่น L"
                      className="flex-1"
                      aria-label="ชื่อตัวเลือก"
                    />
                    <div className="relative w-28 shrink-0">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                        +/-
                      </span>
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={choice.priceDelta}
                        onChange={(e) =>
                          patchChoice(opt.id, choice.id, { priceDelta: e.target.value })
                        }
                        placeholder="0"
                        className="pl-9 text-right font-mono"
                        aria-label="ราคาบวกเพิ่ม (บาท)"
                      />
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeChoice(opt.id, choice.id)}
                      disabled={opt.choices.length <= 1}
                      aria-label={`ลบตัวเลือก ${choice.label || ""}`}
                    >
                      <Trash2 className="h-4 w-4 text-slate-400" />
                    </Button>
                  </div>
                );
              })}
            </div>

            <div className="mt-2 flex items-center justify-between">
              <span
                className={cn(
                  "text-xs text-slate-400",
                  opt.choices.some((c) => (Number(c.priceDelta) || 0) !== 0) && "text-slate-500",
                )}
              >
                บวกเพิ่มสูงสุด{" "}
                <span className="font-mono">
                  {formatTHB(
                    Math.max(0, ...opt.choices.map((c) => Number(c.priceDelta) || 0)),
                  )}
                </span>
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => addChoice(opt.id)}
              >
                <ListPlus className="h-4 w-4" /> เพิ่มตัวเลือกย่อย
              </Button>
            </div>
          </div>
        ))
      )}

      <Button type="button" variant="outline" size="sm" onClick={addOption} className="w-full">
        <Plus className="h-4 w-4" /> เพิ่มกลุ่มตัวเลือก
      </Button>
    </div>
  );
}
