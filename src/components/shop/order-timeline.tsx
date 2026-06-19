"use client";

import { Check, CreditCard, Package, PackageCheck, Receipt, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ORDER_STATUS } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/lib/types";

const FLOW: { status: OrderStatus; icon: LucideIcon; at: (o: Order) => string | undefined }[] = [
  { status: "pending_payment", icon: Receipt, at: (o) => o.createdAt },
  { status: "paid", icon: CreditCard, at: (o) => o.paidAt },
  { status: "packing", icon: Package, at: (o) => o.packedAt },
  { status: "completed", icon: PackageCheck, at: (o) => o.completedAt },
];

const ORDER_OF: Record<OrderStatus, number> = {
  pending_payment: 0,
  paid: 1,
  packing: 2,
  completed: 3,
  cancelled: -1,
};

/** Vertical fulfilment timeline driven by ORDER_STATUS. Handles the cancelled branch. */
export function OrderTimeline({ order }: { order: Order }) {
  if (order.status === "cancelled") {
    return (
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-500">
          <X className="h-4 w-4" />
        </span>
        <div>
          <p className="font-medium text-slate-900 dark:text-slate-50">
            {ORDER_STATUS.cancelled.label}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            คำสั่งซื้อนี้ถูกยกเลิกและคืนสต๊อกแล้ว
          </p>
        </div>
      </div>
    );
  }

  const current = ORDER_OF[order.status];

  return (
    <ol className="relative">
      {FLOW.map((step, i) => {
        const meta = ORDER_STATUS[step.status];
        const Icon = step.icon;
        const done = i < current;
        const active = i === current;
        const reached = i <= current;
        const when = step.at(order);
        const isLast = i === FLOW.length - 1;

        return (
          <li key={step.status} className="flex gap-3 pb-6 last:pb-0">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors",
                  active && "bg-primary text-white shadow-lg shadow-primary/30",
                  done && "bg-emerald-500/15 text-emerald-500",
                  !reached && "bg-slate-500/10 text-slate-400",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </span>
              {!isLast && (
                <span
                  className={cn(
                    "mt-1 w-px flex-1",
                    i < current ? "bg-emerald-500/40" : "bg-slate-300/60 dark:bg-white/10",
                  )}
                />
              )}
            </div>
            <div className="pt-1.5">
              <p
                className={cn(
                  "font-medium",
                  reached
                    ? "text-slate-900 dark:text-slate-50"
                    : "text-slate-400 dark:text-slate-500",
                )}
              >
                {meta.label}
              </p>
              {reached && when && (
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {formatDateTime(when)}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
