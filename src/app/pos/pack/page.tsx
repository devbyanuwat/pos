"use client";

import { useMemo } from "react";
import { CupSoda } from "lucide-react";
import { PageHeader, Card, CardContent, EmptyState, toast } from "@/components/ui";
import { useStore } from "@/lib/store";
import { QueueCard } from "@/components/pos/board/queue-card";
import type { Order, OrderStatus } from "@/lib/types";

const QUEUE_STATUSES: OrderStatus[] = ["paid", "packing"];

export default function PackPage() {
  const orders = useStore((s) => s.orders);
  const tables = useStore((s) => s.tables);
  const updateOrderStatus = useStore((s) => s.updateOrderStatus);

  const tableNames = useMemo(
    () => Object.fromEntries(tables.map((t) => [t.id, t.name])),
    [tables],
  );

  // Oldest first - the barista works front to back.
  const queue = useMemo(
    () =>
      orders
        .filter((o) => QUEUE_STATUSES.includes(o.status))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [orders],
  );

  function advance(order: Order) {
    if (order.status === "paid") {
      updateOrderStatus(order.id, "packing");
      toast.info(`เริ่มชง ${order.code}`);
    } else if (order.status === "packing") {
      updateOrderStatus(order.id, "completed");
      toast.success(`เสิร์ฟ ${order.code} แล้ว`);
    }
  }

  return (
    <div>
      <PageHeader
        title="คิวชง / เสิร์ฟ"
        description="ออเดอร์ที่ชำระแล้ว เรียงคิวเก่าสุดก่อน กดเริ่มชงและเสิร์ฟเมื่อพร้อม"
      />

      {queue.length === 0 ? (
        <Card strong>
          <CardContent className="pt-6">
            <EmptyState
              icon={CupSoda}
              title="ไม่มีออเดอร์ในคิว"
              description="ออเดอร์ที่ชำระเงินแล้วจะปรากฏที่นี่เพื่อรอการชงและเสิร์ฟ"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {queue.map((order) => (
            <QueueCard
              key={order.id}
              order={order}
              tableName={order.tableId ? tableNames[order.tableId] : undefined}
              onAdvance={() => advance(order)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
