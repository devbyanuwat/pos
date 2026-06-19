"use client";

import { useEffect, useState } from "react";
import { Dialog, Button, Input, Label, Select } from "@/components/ui";
import type { Role } from "@/lib/types";
import type { NewUser } from "@/lib/store";
import { ROLE_LABELS } from "@/lib/constants";

interface FormState {
  name: string;
  email: string;
  password: string;
  role: Role;
}

const emptyForm = (): FormState => ({
  name: "",
  email: "",
  password: "",
  role: "staff",
});

/** Staff roles that can be created here. Customer accounts are created from a customer profile. */
const ASSIGNABLE_ROLES: Role[] = ["staff", "manager", "owner"];

/** Create-user dialog for staff / manager / owner accounts. */
export function UserFormDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: NewUser) => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(emptyForm());
  }, [open]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function submit() {
    if (!form.name.trim()) return setError("กรุณากรอกชื่อผู้ใช้");
    if (!form.email.trim()) return setError("กรุณากรอกอีเมล");
    if (!form.password.trim()) return setError("กรุณากรอกรหัสผ่าน");

    onSubmit({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password.trim(),
      role: form.role,
      active: true,
    });
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="เพิ่มผู้ใช้"
      description="สร้างบัญชีพนักงานพร้อมกำหนดบทบาทการเข้าถึง"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button onClick={submit}>เพิ่มผู้ใช้</Button>
        </>
      }
    >
      <div className="grid gap-4">
        <div>
          <Label htmlFor="uf-name">ชื่อผู้ใช้</Label>
          <Input
            id="uf-name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="เช่น พนักงานขาย A"
          />
        </div>
        <div>
          <Label htmlFor="uf-email">อีเมล</Label>
          <Input
            id="uf-email"
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="name@example.com"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="uf-password">รหัสผ่าน</Label>
            <Input
              id="uf-password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="ตั้งรหัสผ่าน"
            />
          </div>
          <div>
            <Label htmlFor="uf-role">บทบาท</Label>
            <Select
              id="uf-role"
              value={form.role}
              onChange={(e) => set("role", e.target.value as Role)}
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {error && (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>
        )}
      </div>
    </Dialog>
  );
}
