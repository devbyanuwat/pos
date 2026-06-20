"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, Sparkles } from "lucide-react";
import {
  Dialog,
  Button,
  Badge,
  Numpad,
  NumpadDisplay,
} from "@/components/ui";
import type { Customer, Settings } from "@/lib/types";
import { pointsBahtValue } from "@/lib/selectors";
import { formatNumber, formatTHB } from "@/lib/utils";

type Mode = "add" | "subtract";

/**
 * Small dialog to manually adjust a member's points balance with +/- and a
 * numpad (so the device keyboard never opens). Calls `onApply(signedDelta)`.
 */
export function AdjustPointsDialog({
  open,
  customer,
  settings,
  onClose,
  onApply,
}: {
  open: boolean;
  customer: Customer | null;
  settings: Settings;
  onClose: () => void;
  onApply: (delta: number) => void;
}) {
  const [mode, setMode] = useState<Mode>("add");
  const [value, setValue] = useState("");

  useEffect(() => {
    if (!open) return;
    setMode("add");
    setValue("");
  }, [open, customer]);

  if (!customer) return null;

  const current = customer.points ?? 0;
  const amount = Math.max(0, Math.floor(Number(value) || 0));
  const signed = mode === "add" ? amount : -amount;
  const next = Math.max(0, current + signed);

  function apply() {
    if (amount <= 0) {
      onClose();
      return;
    }
    onApply(signed);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="ปรับคะแนนสมาชิก"
      description={customer.name}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button onClick={apply} disabled={amount <= 0}>
            <Sparkles className="h-4 w-4" />
            บันทึก
          </Button>
        </>
      }
    >
      <div className="grid gap-5">
        <div className="flex items-center justify-between rounded-2xl bg-slate-500/5 p-4 dark:bg-white/5">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">คะแนนปัจจุบัน</p>
            <p className="mt-0.5 font-mono text-xl font-semibold text-slate-900 dark:text-slate-50">
              {formatNumber(current)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 dark:text-slate-400">หลังปรับ</p>
            <p className="mt-0.5 font-mono text-xl font-semibold text-primary">
              {formatNumber(next)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={mode === "add" ? "success" : "outline"}
            onClick={() => setMode("add")}
          >
            <Plus className="h-4 w-4" />
            เพิ่มคะแนน
          </Button>
          <Button
            variant={mode === "subtract" ? "danger" : "outline"}
            onClick={() => setMode("subtract")}
          >
            <Minus className="h-4 w-4" />
            หักคะแนน
          </Button>
        </div>

        <div className="grid gap-3">
          <NumpadDisplay
            label="จำนวนคะแนน"
            value={value}
            placeholder="0"
            suffix="คะแนน"
            active
          />
          <Numpad value={value} onChange={setValue} onSubmit={apply} submitLabel="บันทึก" />
        </div>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          มูลค่าโดยประมาณ{" "}
          <Badge tone="primary" className="font-mono">
            {formatTHB(pointsBahtValue(amount, settings))}
          </Badge>
        </p>
      </div>
    </Dialog>
  );
}
