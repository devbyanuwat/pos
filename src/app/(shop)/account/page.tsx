"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Mail,
  Phone,
  Crown,
  Receipt,
  ChevronRight,
  ShoppingBag,
  UserCircle,
  Info,
} from "lucide-react";
import {
  PageHeader,
  Card,
  CardContent,
  Badge,
  Avatar,
  Button,
  EmptyState,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
} from "@/components/ui";
import { useHydrated } from "@/components/shop/use-hydrated";
import { useStore } from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";
import { ORDER_STATUS, CHANNEL_LABELS } from "@/lib/constants";
import { formatTHB, formatDate } from "@/lib/utils";

export default function AccountPage() {
  const hydrated = useHydrated();
  const orders = useStore((s) => s.orders);
  const tiers = useStore((s) => s.tiers);
  const { user, customer } = useAuth();

  const tierName = customer
    ? tiers.find((t) => t.id === customer.tierId)?.name ?? "ลูกค้าทั่วไป"
    : null;

  const myOrders = useMemo(() => {
    if (!customer) return [];
    return orders
      .filter((o) => o.customerId === customer.id)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [orders, customer]);

  return (
    <div>
      <PageHeader
        title="บัญชีของฉัน"
        description="ข้อมูลส่วนตัวและประวัติการสั่งซื้อ"
      />

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="lg:sticky lg:top-24 lg:h-fit">
          <Card strong>
            <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
              <Avatar
                name={customer?.name ?? user?.name}
                src={customer?.avatar ?? user?.avatar}
                className="h-20 w-20 text-2xl"
              />
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  {customer?.name ?? user?.name ?? "ผู้ใช้งาน"}
                </h2>
                {tierName && (
                  <Badge tone="primary" className="mt-2 gap-1.5">
                    <Crown className="h-3.5 w-3.5" />
                    {tierName}
                  </Badge>
                )}
              </div>

              <div className="w-full border-t border-slate-200/60 pt-4 dark:border-white/10">
                <dl className="flex flex-col gap-3 text-left text-sm">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="truncate text-slate-700 dark:text-slate-200">
                      {customer?.email ?? user?.email ?? "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="text-slate-700 dark:text-slate-200">
                      {customer?.phone ?? "-"}
                    </span>
                  </div>
                </dl>
              </div>

              {!customer && (
                <p className="flex items-start gap-2 rounded-xl bg-sky-500/10 p-3 text-left text-xs leading-relaxed text-sky-700 dark:text-sky-300">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  คุณกำลังเข้าชมในนามทีมงาน บัญชีนี้ยังไม่ได้ผูกกับโปรไฟล์ลูกค้า
                  จึงยังไม่มีประวัติการสั่งซื้อ
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card strong>
          <CardContent className="p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                ประวัติการสั่งซื้อ
              </h2>
              {customer && myOrders.length > 0 && (
                <Badge tone="neutral" className="font-mono">
                  {myOrders.length}
                </Badge>
              )}
            </div>

            {!hydrated ? (
              <p className="py-10 text-center text-sm text-slate-400">
                กำลังโหลด...
              </p>
            ) : !customer ? (
              <EmptyState
                icon={UserCircle}
                title="ไม่มีโปรไฟล์ลูกค้า"
                description="เข้าสู่ระบบด้วยบัญชีลูกค้าเพื่อดูประวัติการสั่งซื้อ"
              />
            ) : myOrders.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title="ยังไม่มีคำสั่งซื้อ"
                description="เริ่มเลือกซื้อสินค้าชิ้นแรกของคุณได้เลย"
                action={
                  <Link href="/shop">
                    <Button variant="primary" size="sm">
                      เลือกซื้อสินค้า
                    </Button>
                  </Link>
                }
              />
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden sm:block">
                  <Table>
                    <THead>
                      <TR>
                        <TH>รหัสคำสั่งซื้อ</TH>
                        <TH>วันที่</TH>
                        <TH>ช่องทาง</TH>
                        <TH className="text-right">ยอดรวม</TH>
                        <TH>สถานะ</TH>
                        <TH className="text-right">รายละเอียด</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {myOrders.map((o) => {
                        const status = ORDER_STATUS[o.status];
                        return (
                          <TR
                            key={o.id}
                            className="transition-colors hover:bg-slate-500/5"
                          >
                            <TD>
                              <Link
                                href={`/account/orders/${o.id}`}
                                className="font-mono font-medium text-primary hover:underline"
                              >
                                {o.code}
                              </Link>
                            </TD>
                            <TD className="text-slate-500 dark:text-slate-400">
                              {formatDate(o.createdAt)}
                            </TD>
                            <TD className="text-slate-500 dark:text-slate-400">
                              {CHANNEL_LABELS[o.channel]}
                            </TD>
                            <TD className="text-right font-mono font-medium">
                              {formatTHB(o.total)}
                            </TD>
                            <TD>
                              <Badge tone={status.tone}>{status.label}</Badge>
                            </TD>
                            <TD className="text-right">
                              <Link
                                href={`/account/orders/${o.id}`}
                                className="inline-flex items-center text-slate-400 transition-colors hover:text-primary"
                                aria-label={`ดูคำสั่งซื้อ ${o.code}`}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Link>
                            </TD>
                          </TR>
                        );
                      })}
                    </TBody>
                  </Table>
                </div>

                {/* Mobile cards */}
                <div className="flex flex-col gap-3 sm:hidden">
                  {myOrders.map((o) => {
                    const status = ORDER_STATUS[o.status];
                    return (
                      <Link
                        key={o.id}
                        href={`/account/orders/${o.id}`}
                        className="glass flex items-center gap-3 rounded-xl p-4 transition-colors hover:bg-slate-500/5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-sm font-medium text-primary">
                            {o.code}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {formatDate(o.createdAt)} · {CHANNEL_LABELS[o.channel]}
                          </p>
                          <div className="mt-2">
                            <Badge tone={status.tone}>{status.label}</Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-semibold text-slate-900 dark:text-slate-50">
                            {formatTHB(o.total)}
                          </p>
                          <ChevronRight className="ml-auto mt-1 h-4 w-4 text-slate-400" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
