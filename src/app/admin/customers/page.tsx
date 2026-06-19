"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { PAID_STATUSES } from "@/lib/selectors";
import type { NewCustomer } from "@/lib/store";
import {
  PageHeader,
  Card,
  CardContent,
  Button,
  Input,
  Badge,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  EmptyState,
  toast,
} from "@/components/ui";
import { formatTHB } from "@/lib/utils";
import { CustomerFormDialog } from "@/components/admin/people/customer-form-dialog";

export default function CustomersPage() {
  const router = useRouter();
  const customers = useStore((s) => s.customers);
  const tiers = useStore((s) => s.tiers);
  const orders = useStore((s) => s.orders);
  const addCustomer = useStore((s) => s.addCustomer);

  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const tierName = (tierId: string) => tiers.find((t) => t.id === tierId)?.name ?? tierId;

  // Order count + paid revenue per customer, computed once per orders change.
  const stats = useMemo(() => {
    const map = new Map<string, { count: number; spent: number }>();
    for (const o of orders) {
      if (!o.customerId) continue;
      const cur = map.get(o.customerId) ?? { count: 0, spent: 0 };
      cur.count += 1;
      if (PAID_STATUSES.includes(o.status)) cur.spent += o.total;
      map.set(o.customerId, cur);
    }
    return map;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q),
    );
  }, [customers, query]);

  function handleAdd(data: NewCustomer) {
    addCustomer(data);
    setDialogOpen(false);
    toast.success("เพิ่มลูกค้าแล้ว");
  }

  return (
    <div>
      <PageHeader
        title="ลูกค้า"
        description="จัดการข้อมูลลูกค้า ระดับราคา และราคาเฉพาะราย"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            เพิ่มลูกค้า
          </Button>
        }
      />

      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาชื่อ อีเมล หรือเบอร์โทร"
            className="pl-9"
          />
        </div>
      </div>

      <Card strong>
        <CardContent className="p-0 sm:p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Users}
              title={query ? "ไม่พบลูกค้าที่ค้นหา" : "ยังไม่มีลูกค้า"}
              description={query ? "ลองคำค้นอื่น" : "เริ่มต้นด้วยการเพิ่มลูกค้ารายแรก"}
              action={
                !query ? (
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="h-4 w-4" />
                    เพิ่มลูกค้า
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>ชื่อ</TH>
                  <TH>อีเมล</TH>
                  <TH>โทร</TH>
                  <TH>ระดับราคา</TH>
                  <TH className="text-right">จำนวนออเดอร์</TH>
                  <TH className="text-right">ยอดซื้อ</TH>
                </TR>
              </THead>
              <TBody>
                {filtered.map((c) => {
                  const s = stats.get(c.id) ?? { count: 0, spent: 0 };
                  return (
                    <TR
                      key={c.id}
                      onClick={() => router.push(`/admin/customers/${c.id}`)}
                      className="cursor-pointer transition-colors hover:bg-slate-500/5 dark:hover:bg-white/5"
                    >
                      <TD>
                        <span className="font-medium text-slate-900 hover:text-primary dark:text-slate-50">
                          {c.name}
                        </span>
                      </TD>
                      <TD className="text-slate-500 dark:text-slate-400">{c.email}</TD>
                      <TD className="font-mono text-slate-500 dark:text-slate-400">
                        {c.phone ?? "-"}
                      </TD>
                      <TD>
                        <Badge tone="neutral">{tierName(c.tierId)}</Badge>
                      </TD>
                      <TD className="text-right font-mono">{s.count}</TD>
                      <TD className="text-right font-mono font-medium text-slate-900 dark:text-slate-50">
                        {formatTHB(s.spent)}
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CustomerFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleAdd}
        tiers={tiers}
      />
    </div>
  );
}
