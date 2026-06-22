"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Lock, Printer, RotateCcw, Save, Store } from "lucide-react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";
import { sendPrint, PRINTER_DEFAULTS } from "@/lib/print";
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
import { cn, formatTHB } from "@/lib/utils";

export default function SettingsPage() {
  const { role } = useAuth();

  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const resetDemo = useStore((s) => s.resetDemo);

  const [form, setForm] = useState({
    shopName: settings.shopName,
    startingCash: String(settings.startingCash),
    lowStockThreshold: String(settings.lowStockThreshold),
    promptpayId: settings.promptpayId ?? "",
  });

  const [printer, setPrinter] = useState({
    host: settings.printerHost ?? PRINTER_DEFAULTS.host,
    port: String(settings.printerPort ?? PRINTER_DEFAULTS.port),
    codepage: String(settings.printerCodepage ?? PRINTER_DEFAULTS.codepage),
    width: String(settings.printerWidth ?? PRINTER_DEFAULTS.width),
    mode: settings.printMode ?? "local",
  });
  const [testing, setTesting] = useState(false);

  // Keep the form in sync if settings change underneath (e.g. after reset).
  useEffect(() => {
    setForm({
      shopName: settings.shopName,
      startingCash: String(settings.startingCash),
      lowStockThreshold: String(settings.lowStockThreshold),
      promptpayId: settings.promptpayId ?? "",
    });
    setPrinter({
      host: settings.printerHost ?? PRINTER_DEFAULTS.host,
      port: String(settings.printerPort ?? PRINTER_DEFAULTS.port),
      codepage: String(settings.printerCodepage ?? PRINTER_DEFAULTS.codepage),
      width: String(settings.printerWidth ?? PRINTER_DEFAULTS.width),
      mode: settings.printMode ?? "local",
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
      promptpayId: form.promptpayId.trim() || undefined,
    });
    toast.success("บันทึกการตั้งค่าแล้ว");
  }

  // Build a printer config from the current (possibly unsaved) form so the
  // owner can test connectivity before committing.
  function currentPrinter() {
    return {
      host: printer.host.trim() || PRINTER_DEFAULTS.host,
      port: Number(printer.port) || PRINTER_DEFAULTS.port,
      codepage: Number(printer.codepage) || PRINTER_DEFAULTS.codepage,
      width: Number(printer.width) || PRINTER_DEFAULTS.width,
    };
  }

  function savePrinter() {
    const cfg = currentPrinter();
    updateSettings({
      printerHost: cfg.host,
      printerPort: cfg.port,
      printerCodepage: cfg.codepage,
      printerWidth: cfg.width,
      printMode: printer.mode === "cloud" ? "cloud" : "local",
    });
    toast.success("บันทึกเครื่องพิมพ์แล้ว");
  }

  async function testPrint() {
    setTesting(true);
    const res = await sendPrint({
      printer: currentPrinter(),
      mode: printer.mode === "cloud" ? "cloud" : "local",
      job: { type: "test" },
    });
    setTesting(false);
    if (res.ok) {
      toast.success(
        printer.mode === "cloud"
          ? "ส่งเข้าคิวแล้ว - agent จะพิมพ์ให้"
          : "ส่งทดสอบพิมพ์แล้ว - ดูกระดาษที่เครื่องพิมพ์",
      );
    } else {
      toast.error(`พิมพ์ไม่สำเร็จ: ${res.error ?? "ไม่ทราบสาเหตุ"}`);
    }
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
              <div>
                <Label htmlFor="st-promptpay">พร้อมเพย์ (สำหรับ QR รับเงิน)</Label>
                <Input
                  id="st-promptpay"
                  value={form.promptpayId}
                  onChange={(e) => setForm((f) => ({ ...f, promptpayId: e.target.value }))}
                  placeholder="เบอร์มือถือ / เลขบัตรประชาชน / เลข e-Wallet"
                  className="font-mono"
                  inputMode="numeric"
                />
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  ใช้สร้าง QR PromptPay ให้ลูกค้าสแกนจ่ายที่เคาน์เตอร์และตอนสั่งผ่าน QR โต๊ะ
                </p>
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

        <Card strong>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              เครื่องพิมพ์ใบเสร็จ
            </CardTitle>
            <CardDescription>
              เครื่องพิมพ์ความร้อนแบบ LAN (พอร์ต 9100) ในวงเดียวกับเครื่องที่รันระบบ
              ใช้พิมพ์ใบเสร็จและ QR โต๊ะ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <Label>โหมดพิมพ์</Label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {(["local", "cloud"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPrinter((p) => ({ ...p, mode: m }))}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                        printer.mode === m
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-slate-300/60 text-slate-600 hover:bg-white/60 dark:border-white/12 dark:text-slate-300 dark:hover:bg-white/5",
                      )}
                    >
                      {m === "local" ? "ในร้าน (LAN)" : "ผ่าน agent (cloud)"}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  ในร้าน = เปิดแอปจากเครื่องในวง LAN เดียวกับพิมพ์ · cloud = host บน Vercel
                  แล้วมี agent ในร้านดึงงานไปพิมพ์
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="pr-host">IP เครื่องพิมพ์</Label>
                  <Input
                    id="pr-host"
                    value={printer.host}
                    onChange={(e) => setPrinter((p) => ({ ...p, host: e.target.value }))}
                    placeholder={PRINTER_DEFAULTS.host}
                    className="font-mono"
                    inputMode="decimal"
                  />
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    ตั้ง IP คงที่ (DHCP reservation) กันเลขเด้ง
                  </p>
                </div>
                <div>
                  <Label htmlFor="pr-port">พอร์ต</Label>
                  <Input
                    id="pr-port"
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={printer.port}
                    onChange={(e) => setPrinter((p) => ({ ...p, port: e.target.value }))}
                    placeholder={String(PRINTER_DEFAULTS.port)}
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="pr-width">ความกว้างกระดาษ (ตัวอักษร)</Label>
                  <Input
                    id="pr-width"
                    type="number"
                    min={16}
                    inputMode="numeric"
                    value={printer.width}
                    onChange={(e) => setPrinter((p) => ({ ...p, width: e.target.value }))}
                    placeholder={String(PRINTER_DEFAULTS.width)}
                    className="font-mono"
                  />
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    กระดาษ 58mm = 32 · 80mm = 48
                  </p>
                </div>
                <div>
                  <Label htmlFor="pr-cp">โค้ดเพจภาษาไทย</Label>
                  <Input
                    id="pr-cp"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={printer.codepage}
                    onChange={(e) => setPrinter((p) => ({ ...p, codepage: e.target.value }))}
                    placeholder={String(PRINTER_DEFAULTS.codepage)}
                    className="font-mono"
                  />
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    ถ้าภาษาไทยเพี้ยน ลองปรับเลขนี้ (เช่น 20, 21, 255) แล้วกดทดสอบ
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={savePrinter}>
                  <Save className="h-4 w-4" />
                  บันทึกเครื่องพิมพ์
                </Button>
                <Button variant="outline" onClick={testPrint} disabled={testing}>
                  <Printer className="h-4 w-4" />
                  {testing ? "กำลังส่ง..." : "ทดสอบพิมพ์"}
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
