"use client";

import { useEffect, useState } from "react";
import { Dialog, Button, Input, Select, Switch, Label } from "@/components/ui";
import type { SalesChannel } from "@/lib/types";
import type { NewSalesChannel } from "@/lib/store";

const COLOR_OPTIONS: { value: string; label: string }[] = [
  { value: "slate", label: "Slate" },
  { value: "sky", label: "Sky" },
  { value: "amber", label: "Amber" },
  { value: "emerald", label: "Emerald" },
  { value: "teal", label: "Teal" },
  { value: "pink", label: "Pink" },
  { value: "violet", label: "Violet" },
  { value: "rose", label: "Rose" },
];

interface FormState {
  name: string;
  commission: string;
  color: string;
  active: boolean;
}

function emptyForm(): FormState {
  return { name: "", commission: "30", color: "emerald", active: true };
}

function toForm(c: SalesChannel): FormState {
  return {
    name: c.name,
    commission: String(c.commission),
    color: c.color,
    active: c.active,
  };
}

export function ChannelFormDialog({
  open,
  onClose,
  onSubmit,
  channel,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: NewSalesChannel) => void;
  channel?: SalesChannel | null;
}) {
  const isEdit = !!channel;
  const [form, setForm] = useState<FormState>(emptyForm());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(channel ? toForm(channel) : emptyForm());
  }, [open, channel]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit() {
    if (!form.name.trim()) return setError("กรุณากรอกชื่อแพลตฟอร์ม");
    const commission = Number(form.commission);
    if (isNaN(commission) || commission < 0 || commission > 100) {
      return setError("GP% ต้องอยู่ระหว่าง 0 ถึง 100");
    }
    setError(null);
    onSubmit({
      name: form.name.trim(),
      commission,
      color: form.color,
      active: form.active,
    });
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? "แก้ไขแพลตฟอร์ม" : "เพิ่มแพลตฟอร์มใหม่"}
      description={
        isEdit
          ? "แก้ไขข้อมูลช่องทางเดลิเวอรี"
          : "เพิ่มช่องทางเดลิเวอรีใหม่และกำหนด GP ที่แพลตฟอร์มหัก"
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button onClick={submit}>{isEdit ? "บันทึกการแก้ไข" : "เพิ่มแพลตฟอร์ม"}</Button>
        </>
      }
    >
      <div className="grid gap-4">
        <div>
          <Label htmlFor="ch-name">ชื่อแพลตฟอร์ม</Label>
          <Input
            id="ch-name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="เช่น GrabFood, LINE MAN"
          />
        </div>

        <div>
          <Label htmlFor="ch-commission">GP / ค่าคอมมิชชัน (%)</Label>
          <Input
            id="ch-commission"
            type="number"
            min={0}
            max={100}
            inputMode="numeric"
            value={form.commission}
            onChange={(e) => set("commission", e.target.value)}
            placeholder="30"
            className="font-mono"
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            เปอร์เซ็นต์ที่แพลตฟอร์มหักจากยอดขายแต่ละออเดอร์
          </p>
        </div>

        <div>
          <Label htmlFor="ch-color">สีป้ายกำกับ</Label>
          <Select
            id="ch-color"
            value={form.color}
            onChange={(e) => set("color", e.target.value)}
          >
            {COLOR_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-200/60 px-3.5 py-2.5 dark:border-white/10">
          <span className="text-sm text-slate-700 dark:text-slate-200">เปิดใช้งานแพลตฟอร์ม</span>
          <Switch checked={form.active} onChange={(v) => set("active", v)} />
        </div>

        {error && (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>
        )}
      </div>
    </Dialog>
  );
}
