"use client";

import { useEffect, useState } from "react";
import { Dialog, Button } from "@/components/ui";
import { Numpad, NumpadDisplay } from "@/components/ui";

/**
 * A small modal wrapping <Numpad> + <NumpadDisplay> for a single numeric value.
 * Used for editing a line quantity and the bill discount so the device keyboard
 * never opens. Opens seeded with `initial`, returns the typed number on submit.
 */
export function NumpadDialog({
  open,
  title,
  label,
  suffix,
  initial,
  allowDecimal = false,
  submitLabel = "ยืนยัน",
  hint,
  onSubmit,
  onClose,
}: {
  open: boolean;
  title: React.ReactNode;
  label?: string;
  suffix?: string;
  /** Seed value shown when the dialog opens (e.g. current qty / discount). */
  initial?: string;
  allowDecimal?: boolean;
  submitLabel?: string;
  hint?: React.ReactNode;
  onSubmit: (value: number) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initial ?? "");

  // Re-seed each time it opens.
  useEffect(() => {
    if (open) setValue(initial ?? "");
  }, [open, initial]);

  function submit() {
    const n = value.trim() === "" ? 0 : Number(value);
    onSubmit(Number.isFinite(n) ? n : 0);
  }

  return (
    <Dialog open={open} onClose={onClose} title={title} className="max-w-sm">
      <div className="space-y-4">
        <NumpadDisplay label={label} value={value} suffix={suffix} active />
        {hint && <div className="text-center text-xs text-slate-500 dark:text-slate-400">{hint}</div>}
        <Numpad
          value={value}
          onChange={setValue}
          onSubmit={submit}
          submitLabel={submitLabel}
          allowDecimal={allowDecimal}
        />
        <Button variant="ghost" size="lg" className="w-full" onClick={onClose}>
          ยกเลิก
        </Button>
      </div>
    </Dialog>
  );
}
