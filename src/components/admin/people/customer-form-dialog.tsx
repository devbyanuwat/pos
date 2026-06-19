"use client";

import { useEffect, useState } from "react";
import { Dialog, Button, Input, Textarea, Label, Select } from "@/components/ui";
import type { PricingTier } from "@/lib/types";
import type { NewCustomer } from "@/lib/store";

interface FormState {
  name: string;
  email: string;
  phone: string;
  tierId: string;
  note: string;
}

const emptyForm = (tierId: string): FormState => ({
  name: "",
  email: "",
  phone: "",
  tierId,
  note: "",
});

/** Create-customer dialog. Tier defaults to the first (retail) tier. */
export function CustomerFormDialog({
  open,
  onClose,
  onSubmit,
  tiers,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: NewCustomer) => void;
  tiers: PricingTier[];
}) {
  const [form, setForm] = useState<FormState>(emptyForm(tiers[0]?.id ?? ""));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(emptyForm(tiers[0]?.id ?? ""));
  }, [open, tiers]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function submit() {
    if (!form.name.trim()) return setError("กรุณากรอกชื่อลูกค้า");
    if (!form.email.trim()) return setError("กรุณากรอกอีเมล");

    onSubmit({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      tierId: form.tierId,
      note: form.note.trim() || undefined,
    });
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="เพิ่มลูกค้า"
      description="กรอกข้อมูลลูกค้าใหม่และเลือกระดับราคา"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button onClick={submit}>เพิ่มลูกค้า</Button>
        </>
      }
    >
      <div className="grid gap-4">
        <div>
          <Label htmlFor="cf-name">ชื่อลูกค้า</Label>
          <Input
            id="cf-name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="เช่น บริษัท ออฟฟิศ ซัพพลาย จำกัด"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="cf-email">อีเมล</Label>
            <Input
              id="cf-email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="name@example.com"
            />
          </div>
          <div>
            <Label htmlFor="cf-phone">เบอร์โทร</Label>
            <Input
              id="cf-phone"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="08x-xxx-xxxx"
              className="font-mono"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="cf-tier">ระดับราคา</Label>
          <Select id="cf-tier" value={form.tierId} onChange={(e) => set("tierId", e.target.value)}>
            {tiers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="cf-note">หมายเหตุ</Label>
          <Textarea
            id="cf-note"
            value={form.note}
            onChange={(e) => set("note", e.target.value)}
            placeholder="บันทึกเพิ่มเติม (ไม่บังคับ)"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>
        )}
      </div>
    </Dialog>
  );
}
