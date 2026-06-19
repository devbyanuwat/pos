"use client";

import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Receipt,
  Tag,
  ShieldCheck,
  Clock,
  PackageSearch,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  Badge,
  EmptyState,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
} from "@/components/ui";
import { OrderTimeline } from "@/components/shop/order-timeline";
import { useHydrated } from "@/components/shop/use-hydrated";
import { useStore } from "@/lib/store";
import { ORDER_STATUS, CHANNEL_LABELS } from "@/lib/constants";
import { formatTHB, formatDateTime } from "@/lib/utils";

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const hydrated = useHydrated();
  const orders = useStore((s) => s.orders);

  const order = orders.find((o) => o.id === id);

  if (!hydrated) {
    return (
      <Card strong className="mt-6">
        <CardContent className="py-10 text-center text-sm text-slate-400">
          กำลังโหลด...
        </CardContent>
      </Card>
    );
  }

  if (!order) {
    return (
      <Card className="mt-6">
        <EmptyState
          icon={PackageSearch}
          title="ไม่พบคำสั่งซื้อนี้"
          description="คำสั่งซื้ออาจถูกลบ หรือลิงก์ไม่ถูกต้อง"
          action={
            <Link href="/account">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4" />
                กลับไปบัญชีของฉัน
              </Button>
            </Link>
          }
        />
      </Card>
    );
  }

  const status = ORDER_STATUS[order.status];

  return (
    <div>
      <Link
        href="/account"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-primary dark:text-slate-400"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับไปบัญชีของฉัน
      </Link>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            <h1 className="font-mono text-xl font-semibold text-slate-900 dark:text-slate-50">
              {order.code}
            </h1>
          </div>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            สั่งซื้อเมื่อ {formatDateTime(order.createdAt)} · ช่องทาง{" "}
            {CHANNEL_LABELS[order.channel]}
          </p>
        </div>
        <Badge tone={status.tone} className="px-3 py-1 text-sm">
          {status.label}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <Card strong>
            <CardContent className="p-5 sm:p-6">
              <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-50">
                รายการสินค้า
              </h2>
              <Table>
                <THead>
                  <TR>
                    <TH>สินค้า</TH>
                    <TH className="text-right">ราคา/ชิ้น</TH>
                    <TH className="text-right">จำนวน</TH>
                    <TH className="text-right">รวม</TH>
                  </TR>
                </THead>
                <TBody>
                  {order.items.map((it) => (
                    <TR key={it.productId}>
                      <TD>
                        <p className="font-medium text-slate-900 dark:text-slate-50">
                          {it.name}
                        </p>
                        <p className="font-mono text-xs text-slate-400">
                          {it.sku}
                        </p>
                      </TD>
                      <TD className="text-right font-mono">
                        {formatTHB(it.unitPrice)}
                      </TD>
                      <TD className="text-right font-mono">{it.qty}</TD>
                      <TD className="text-right font-mono font-medium">
                        {formatTHB(it.unitPrice * it.qty)}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>

              <div className="mt-4 flex flex-col gap-2.5 border-t border-slate-200/60 pt-4 text-sm dark:border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">
                    ยอดรวมสินค้า
                  </span>
                  <span className="font-mono text-slate-900 dark:text-slate-50">
                    {formatTHB(order.subtotal)}
                  </span>
                </div>
                {order.discount > 0 && (
                  <div className="flex items-center justify-between text-emerald-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5" />
                      {order.discountLabel ?? "ส่วนลด"}
                    </span>
                    <span className="font-mono">-{formatTHB(order.discount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-slate-200/60 pt-2.5 dark:border-white/10">
                  <span className="font-medium text-slate-900 dark:text-slate-50">
                    ยอดชำระทั้งสิ้น
                  </span>
                  <span className="font-mono text-lg font-bold text-slate-900 dark:text-slate-50">
                    {formatTHB(order.total)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {order.paymentSlip && (
            <Card strong>
              <CardContent className="p-5 sm:p-6">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                    สลิปการชำระเงิน
                  </h2>
                  {order.slipVerified ? (
                    <Badge tone="success" className="gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      ตรวจสอบแล้ว
                    </Badge>
                  ) : (
                    <Badge tone="warning" className="gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      รอตรวจสอบ
                    </Badge>
                  )}
                </div>
                <div className="relative h-72 w-full overflow-hidden rounded-xl border border-slate-200/60 bg-slate-500/5 dark:border-white/10">
                  <Image
                    src={order.paymentSlip}
                    alt="สลิปการชำระเงิน"
                    fill
                    unoptimized
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-contain"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:sticky lg:top-24 lg:h-fit">
          <Card strong>
            <CardContent className="p-6">
              <h2 className="mb-5 text-base font-semibold text-slate-900 dark:text-slate-50">
                สถานะคำสั่งซื้อ
              </h2>
              <OrderTimeline order={order} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
