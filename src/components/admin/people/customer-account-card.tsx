"use client";

import { useState } from "react";
import { KeyRound, ShieldCheck, UserPlus } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Button,
  Input,
  Label,
  toast,
} from "@/components/ui";
import type { Customer, User } from "@/lib/types";
import type { NewUser } from "@/lib/store";
import { ROLE_LABELS } from "@/lib/constants";

/**
 * Login-account section for a customer. Shows the linked user if one exists,
 * otherwise a small form to create a customer-role account bound to this profile.
 */
export function CustomerAccountCard({
  customer,
  account,
  onCreate,
}: {
  customer: Customer;
  account: User | null;
  onCreate: (data: NewUser) => void;
}) {
  const [email, setEmail] = useState(customer.email);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!email.trim()) return setError("กรุณากรอกอีเมล");
    if (!password.trim()) return setError("กรุณากรอกรหัสผ่าน");
    setError(null);
    onCreate({
      name: customer.name,
      email: email.trim(),
      password: password.trim(),
      role: "customer",
      customerId: customer.id,
      active: true,
    });
    setPassword("");
    toast.success("สร้างบัญชีเข้าระบบให้ลูกค้าแล้ว");
  }

  return (
    <Card strong>
      <CardHeader>
        <CardTitle>บัญชีเข้าระบบ</CardTitle>
        <CardDescription>ให้ลูกค้าล็อกอินเข้าหน้าร้านเพื่อสั่งซื้อด้วยราคาของตนเอง</CardDescription>
      </CardHeader>
      <CardContent>
        {account ? (
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200/60 p-4 dark:border-white/10">
            <div className="flex items-center gap-2 text-emerald-500">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-sm font-medium">มีบัญชีเข้าระบบแล้ว</span>
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <p className="text-slate-500 dark:text-slate-400">อีเมล</p>
                <p className="font-mono text-slate-900 dark:text-slate-50">{account.email}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">บทบาท</p>
                <Badge tone="primary">{ROLE_LABELS[account.role]}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <KeyRound className="h-3.5 w-3.5" />
              สถานะบัญชี: {account.active ? "ใช้งานได้" : "ถูกระงับ"}
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="ca-email">อีเมลเข้าระบบ</Label>
                <Input
                  id="ca-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>
              <div>
                <Label htmlFor="ca-password">รหัสผ่าน</Label>
                <Input
                  id="ca-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="ตั้งรหัสผ่าน"
                />
              </div>
            </div>
            {error && (
              <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>
            )}
            <div>
              <Button onClick={submit}>
                <UserPlus className="h-4 w-4" />
                สร้างบัญชีเข้าระบบ
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
