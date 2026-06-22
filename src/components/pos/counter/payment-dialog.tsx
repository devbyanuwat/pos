"use client";

import { useEffect, useState } from "react";
import { Banknote, QrCode, ReceiptText, ArrowLeft, Check } from "lucide-react";
import { Dialog, Button } from "@/components/ui";
import { Numpad, NumpadDisplay } from "@/components/ui";
import { QrCodeView } from "@/components/ui";
import { cn, formatTHB, formatNumber } from "@/lib/utils";

export type PaymentMethod = "cash" | "slip" | "counter";

type Mode = "choose" | "cash" | "slip" | "counter";

/** Quick cash denominations to speed up exact / rounded-up entry. */
const QUICK_CASH = [20, 50, 100, 500, 1000];

/**
 * Settle-the-bill modal. Lets the cashier pick a payment method, enter cash via
 * the on-screen Numpad (and see change), and confirm. All numeric entry goes
 * through Numpad/NumpadDisplay — the device keyboard never opens.
 */
export function PaymentDialog({
  open,
  total,
  shopName,
  onConfirm,
  onClose,
  commission,
  net,
  platformName,
}: {
  open: boolean;
  total: number;
  shopName: string;
  onConfirm: (payload: { method: PaymentMethod; cashReceived: number | null }) => void;
  onClose: () => void;
  /** Platform GP commission (delivery mode only). */
  commission?: number;
  /** Net-to-shop after commission (delivery mode only). */
  net?: number;
  /** Delivery platform name shown in the header (delivery mode only). */
  platformName?: string;
}) {
  const [mode, setMode] = useState<Mode>("choose");
  const [cash, setCash] = useState("");

  // Reset to the method chooser whenever the dialog (re)opens.
  useEffect(() => {
    if (open) {
      setMode("choose");
      setCash("");
    }
  }, [open]);

  const cashNum = cash.trim() === "" ? 0 : Number(cash);
  const validCash = Number.isFinite(cashNum) ? cashNum : 0;
  const change = Math.max(0, validCash - total);
  const enoughCash = validCash >= total;

  const isDelivery = commission != null && net != null;

  const title =
    mode === "cash"
      ? "รับเงินสด"
      : mode === "slip"
        ? "รับชำระผ่าน QR / สลิป"
        : mode === "counter"
          ? "ลงบิล (จ่ายที่เคาน์เตอร์)"
          : isDelivery
            ? `เก็บเงิน — ${platformName ?? "เดลิเวอรี"}`
            : "เลือกวิธีชำระเงิน";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={`ยอดที่ต้องชำระ ${formatTHB(total)}`}
      className="max-w-md"
    >
      {mode === "choose" && isDelivery && (
        <div className="mb-3 space-y-1.5 rounded-xl bg-slate-500/5 px-4 py-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">ยอดรวม ({platformName})</span>
            <span className="font-mono font-semibold text-slate-900 dark:text-slate-50">
              {formatTHB(total)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">ค่าคอม GP</span>
            <span className="font-mono font-medium text-rose-600 dark:text-rose-400">
              -{formatTHB(commission!)}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200/60 pt-1.5 dark:border-white/10">
            <span className="font-medium text-slate-700 dark:text-slate-200">สุทธิเข้าร้าน</span>
            <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
              {formatTHB(net!)}
            </span>
          </div>
        </div>
      )}

      {mode === "choose" && (
        <div className="grid gap-3">
          <MethodButton
            icon={Banknote}
            label="เงินสด"
            hint="รับเงิน แล้วทอนเงิน"
            onClick={() => setMode("cash")}
          />
          <MethodButton
            icon={QrCode}
            label="โอน / สลิป"
            hint="สแกน QR PromptPay"
            onClick={() => setMode("slip")}
          />
          <MethodButton
            icon={ReceiptText}
            label="ลงบิล (จ่ายที่เคาน์เตอร์ทีหลัง)"
            hint="เปิดบิลค้างไว้"
            onClick={() => setMode("counter")}
          />
        </div>
      )}

      {mode === "cash" && (
        <div className="space-y-4">
          <NumpadDisplay label="เงินสดรับมา" value={cash} suffix="บาท" active />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCash(String(total))}
              className="rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
            >
              พอดี {formatNumber(total)}
            </button>
            {QUICK_CASH.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setCash(String(amt))}
                className="rounded-xl border border-slate-300/60 bg-white/50 px-3 py-2 font-mono text-sm font-medium text-slate-700 transition-colors hover:bg-white/80 dark:border-white/12 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
              >
                {formatNumber(amt)}
              </button>
            ))}
          </div>

          <div
            className={cn(
              "flex items-center justify-between rounded-xl px-4 py-3 transition-colors",
              enoughCash
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-slate-500/5 text-slate-500 dark:text-slate-400",
            )}
          >
            <span className="text-base font-semibold">เงินทอน</span>
            <span className="font-mono text-3xl font-bold">{formatTHB(change)}</span>
          </div>

          <Numpad value={cash} onChange={setCash} />

          <div className="grid grid-cols-2 gap-3">
            <Button variant="ghost" size="lg" onClick={() => setMode("choose")}>
              <ArrowLeft className="h-5 w-5" />
              ย้อนกลับ
            </Button>
            <Button
              variant="primary"
              size="lg"
              disabled={!enoughCash}
              onClick={() => onConfirm({ method: "cash", cashReceived: validCash })}
            >
              <Check className="h-5 w-5" />
              ยืนยันรับเงิน
            </Button>
          </div>
        </div>
      )}

      {mode === "slip" && (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3">
            <QrCodeView value={`promptpay://${shopName}/${total}`} size={196} />
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              ให้ลูกค้าสแกนเพื่อชำระ{" "}
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-50">
                {formatTHB(total)}
              </span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="ghost" size="lg" onClick={() => setMode("choose")}>
              <ArrowLeft className="h-5 w-5" />
              ย้อนกลับ
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={() => onConfirm({ method: "slip", cashReceived: null })}
            >
              <Check className="h-5 w-5" />
              ได้รับเงินแล้ว
            </Button>
          </div>
        </div>
      )}

      {mode === "counter" && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl bg-amber-500/10 px-4 py-3 text-amber-700 dark:text-amber-300">
            <ReceiptText className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm">
              เปิดบิลค้างไว้ ลูกค้าจะมาชำระ{" "}
              <span className="font-mono font-semibold">{formatTHB(total)}</span> ที่เคาน์เตอร์ทีหลัง
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="ghost" size="lg" onClick={() => setMode("choose")}>
              <ArrowLeft className="h-5 w-5" />
              ย้อนกลับ
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={() => onConfirm({ method: "counter", cashReceived: null })}
            >
              <Check className="h-5 w-5" />
              ยืนยันลงบิล
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

function MethodButton({
  icon: Icon,
  label,
  hint,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="glass-subtle flex items-center gap-4 rounded-2xl px-4 py-4 text-left transition-all duration-150 hover:bg-white/70 hover:shadow-md active:scale-[0.99] dark:hover:bg-white/10"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </span>
      <span className="min-w-0">
        <span className="block text-base font-semibold text-slate-900 dark:text-slate-50">
          {label}
        </span>
        <span className="block text-sm text-slate-500 dark:text-slate-400">{hint}</span>
      </span>
    </button>
  );
}
