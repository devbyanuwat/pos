"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Lock, RotateCcw, Save, Store } from "lucide-react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Label,
  EmptyState,
  toast,
} from "@/components/ui";
import { formatTHB } from "@/lib/utils";

export default function SettingsPage() {
  const { role } = useAuth();

  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const resetDemo = useStore((s) => s.resetDemo);

  const [form, setForm] = useState({
    shopName: settings.shopName,
    startingCash: String(settings.startingCash),
    lowStockThreshold: String(settings.lowStockThreshold),
  });

  // Keep the form in sync if settings change underneath (e.g. after reset).
  useEffect(() => {
    setForm({
      shopName: settings.shopName,
      startingCash: String(settings.startingCash),
      lowStockThreshold: String(settings.lowStockThreshold),
    });
  }, [settings]);

  if (role !== "owner") {
    return (
      <EmptyState
        icon={Lock}
        title="เฉพาะเจ้าของร้าน"
        description="คุณไม่มีสิทธิ์เข้าถึงหน้านี้"
      />
    );
  }

  function save() {
    if (!form.shopName.trim()) {
      toast.error("กรุณากรอกชื่อร้าน");
      return;
    }
    updateSettings({
      shopName: form.shopName.trim(),
      startingCash: Math.max(0, Math.round(Number(form.startingCash) || 0)),
      lowStockThreshold: Math.max(0, Math.round(Number(form.lowStockThreshold) || 0)),
    });
    toast.success("บันทึกการตั้งค่าแล้ว");
  }

  function handleReset() {
    const ok = window.confirm(
      "ยืนยันรีเซ็ตข้อมูลเดโม? ข้อมูลทั้งหมด (สินค้า ลูกค้า ออเดอร์ ผู้ใช้ และอื่น ๆ) จะถูกแทนที่ด้วยข้อมูลตั้งต้น และไม่สามารถกู้คืนได้",
    );
    if (!ok) return;
    resetDemo();
    toast.success("รีเซ็ตข้อมูลเดโมเรียบร้อยแล้ว");
  }

  return (
    <div>
      <PageHeader title="ตั้งค่า" description="กำหนดค่าพื้นฐานของร้านและจัดการข้อมูลเดโม" />

      <div className="grid gap-4">
        <Card strong>
          <CardHeader>
            <CardTitle>ข้อมูลร้าน</CardTitle>
            <CardDescription>ตั้งค่าทั่วไปที่ใช้ทั้งระบบ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="st-shop">ชื่อร้าน</Label>
                <Input
                  id="st-shop"
                  value={form.shopName}
                  onChange={(e) => setForm((f) => ({ ...f, shopName: e.target.value }))}
                  placeholder="ชื่อร้านของคุณ"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="st-cash">เงินสดตั้งต้น (บาท)</Label>
                  <Input
                    id="st-cash"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={form.startingCash}
                    onChange={(e) => setForm((f) => ({ ...f, startingCash: e.target.value }))}
                    placeholder="0"
                    className="font-mono"
                  />
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    ใช้คำนวณยอดเงินสดคงเหลือ ปัจจุบัน{" "}
                    <span className="font-mono">{formatTHB(settings.startingCash)}</span>
                  </p>
                </div>
                <div>
                  <Label htmlFor="st-low">จุดแจ้งเตือนสต๊อกต่ำ (เริ่มต้น)</Label>
                  <Input
                    id="st-low"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={form.lowStockThreshold}
                    onChange={(e) => setForm((f) => ({ ...f, lowStockThreshold: e.target.value }))}
                    placeholder="0"
                    className="font-mono"
                  />
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    ค่าเริ่มต้นสำหรับสินค้าใหม่
                  </p>
                </div>
              </div>
              <div>
                <Button onClick={save}>
                  <Save className="h-4 w-4" />
                  บันทึกการตั้งค่า
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card strong className="border border-red-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              รีเซ็ตข้อมูลเดโม
            </CardTitle>
            <CardDescription>
              คืนค่าข้อมูลทั้งหมดกลับเป็นชุดตั้งต้น เหมาะสำหรับเริ่มสาธิตใหม่
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 rounded-xl bg-red-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                  <Store className="h-5 w-5" />
                </span>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  การกระทำนี้จะลบข้อมูลที่บันทึกไว้ทั้งหมด แล้วโหลดสินค้า ลูกค้า ออเดอร์ และผู้ใช้
                  ชุดตั้งต้นกลับมา ไม่สามารถกู้คืนได้
                </p>
              </div>
              <div className="shrink-0">
                <Button variant="danger" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4" />
                  รีเซ็ตข้อมูลเดโม
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
