"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Tag,
  Upload,
  RefreshCw,
  ShieldCheck,
  ImageIcon,
  Info,
} from "lucide-react";
import {
  PageHeader,
  Button,
  Card,
  CardContent,
  Badge,
  toast,
} from "@/components/ui";
import { useHydrated } from "@/components/shop/use-hydrated";
import { useStore } from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";
import { getPriceForCustomer, bestDiscount } from "@/lib/selectors";
import { formatTHB } from "@/lib/utils";

export default function CheckoutPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const fileRef = useRef<HTMLInputElement>(null);

  const cart = useStore((s) => s.cart);
  const products = useStore((s) => s.products);
  const tiers = useStore((s) => s.tiers);
  const discounts = useStore((s) => s.discounts);
  const createOrder = useStore((s) => s.createOrder);
  const clearCart = useStore((s) => s.clearCart);
  const { customer } = useAuth();

  const [slip, setSlip] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const lines = useMemo(
    () =>
      cart
        .map((c) => {
          const product = products.find((p) => p.id === c.productId);
          if (!product) return null;
          const unitPrice = getPriceForCustomer(product, customer, tiers);
          return { product, qty: c.qty, unitPrice, lineTotal: unitPrice * c.qty };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null),
    [cart, products, customer, tiers],
  );

  const subtotal = lines.reduce((a, l) => a + l.lineTotal, 0);
  const discount = bestDiscount(subtotal, customer, discounts);
  const total = subtotal - discount.amount;

  // Empty cart -> back to shop (only after hydration so we don't bounce on first paint).
  useEffect(() => {
    if (hydrated && cart.length === 0 && !submitting) {
      router.replace("/shop");
    }
  }, [hydrated, cart.length, submitting, router]);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setSlip(reader.result as string);
    reader.onerror = () => toast.error("อ่านไฟล์ไม่สำเร็จ ลองใหม่อีกครั้ง");
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    if (lines.length === 0) return;
    setSubmitting(true);
    const order = createOrder({
      customerId: customer?.id ?? null,
      channel: "online",
      items: cart.map((c) => ({ productId: c.productId, qty: c.qty })),
      status: "pending_payment",
      paymentSlip: slip ?? undefined,
    });
    clearCart();
    toast.success("สั่งซื้อสำเร็จ ขอบคุณที่อุดหนุนค่ะ");
    router.push(`/account/orders/${order.id}`);
  };

  if (!hydrated || cart.length === 0) {
    return (
      <div>
        <PageHeader title="ชำระเงิน" />
        <Card strong>
          <CardContent className="py-10 text-center text-sm text-slate-400">
            กำลังโหลด...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/cart"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-primary dark:text-slate-400"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับไปที่ตะกร้า
      </Link>

      <PageHeader
        title="ชำระเงิน"
        description="ตรวจสอบรายการ แนบสลิปการโอน แล้วยืนยันคำสั่งซื้อ"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-6">
          <Card strong>
            <CardContent className="p-6">
              <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-50">
                รายการสินค้า
              </h2>
              <div className="flex flex-col divide-y divide-slate-200/60 dark:divide-white/10">
                {lines.map((l) => (
                  <div key={l.product.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-500/5">
                      <Image
                        src={l.product.image}
                        alt={l.product.name}
                        fill
                        unoptimized
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium text-slate-900 dark:text-slate-50">
                        {l.product.name}
                      </p>
                      <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                        {formatTHB(l.unitPrice)} x {l.qty}
                      </p>
                    </div>
                    <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-50">
                      {formatTHB(l.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card strong>
            <CardContent className="p-6">
              <div className="mb-1 flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  แนบสลิปการชำระเงิน
                </h2>
                <Badge tone="neutral">ไม่บังคับ</Badge>
              </div>
              <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                อัปโหลดภาพสลิปการโอนเงินเพื่อให้ร้านตรวจสอบได้รวดเร็วขึ้น
              </p>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={onPickFile}
                className="hidden"
              />

              {slip ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <div className="relative h-48 w-full overflow-hidden rounded-xl border border-slate-200/60 bg-slate-500/5 sm:w-48 dark:border-white/10">
                    <Image
                      src={slip}
                      alt="ตัวอย่างสลิปการชำระเงิน"
                      fill
                      unoptimized
                      sizes="192px"
                      className="object-contain"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="inline-flex items-center gap-1.5 text-sm text-emerald-500">
                      <ShieldCheck className="h-4 w-4" />
                      แนบสลิปแล้ว
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileRef.current?.click()}
                    >
                      <RefreshCw className="h-4 w-4" />
                      เลือกรูปใหม่
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300/70 bg-white/40 px-6 py-10 text-center transition-colors hover:border-primary/50 hover:bg-primary/5 dark:border-white/15 dark:bg-white/5"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Upload className="h-6 w-6" />
                  </span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    คลิกเพื่อเลือกรูปสลิป
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                    <ImageIcon className="h-3.5 w-3.5" />
                    รองรับไฟล์รูปภาพ
                  </span>
                </button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky lg:top-24 lg:h-fit">
          <Card strong>
            <CardContent className="flex flex-col gap-4 p-6">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                ยอดชำระ
              </h2>

              <div className="flex flex-col gap-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">
                    ยอดรวมสินค้า
                  </span>
                  <span className="font-mono text-slate-900 dark:text-slate-50">
                    {formatTHB(subtotal)}
                  </span>
                </div>
                {discount.amount > 0 && (
                  <div className="flex items-center justify-between text-emerald-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5" />
                      {discount.label ?? "ส่วนลดท้ายบิล"}
                    </span>
                    <span className="font-mono">-{formatTHB(discount.amount)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200/60 pt-4 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900 dark:text-slate-50">
                    ยอดชำระทั้งสิ้น
                  </span>
                  <span className="font-mono text-xl font-bold text-slate-900 dark:text-slate-50">
                    {formatTHB(total)}
                  </span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                loading={submitting}
                onClick={handleConfirm}
              >
                ยืนยันสั่งซื้อ
              </Button>

              <p className="flex items-start gap-2 rounded-xl bg-sky-500/10 p-3 text-xs leading-relaxed text-sky-700 dark:text-sky-300">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                หลังแนบสลิป ร้านจะตรวจสอบและอัปเดตสถานะให้
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
