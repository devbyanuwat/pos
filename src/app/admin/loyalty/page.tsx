"use client";

import { useMemo, useState } from "react";
import { Award, Coins, Search, Sparkles, Users2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { PAID_STATUSES, pointsBahtValue } from "@/lib/selectors";
import type { Customer } from "@/lib/types";
import {
  PageHeader,
  Card,
  CardContent,
  StatCard,
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
import { formatNumber, formatTHB } from "@/lib/utils";
import { LoyaltySettingsCard, AdjustPointsDialog } from "@/components/admin/loyalty";

export default function LoyaltyPage() {
  const customers = useStore((s) => s.customers);
  const tiers = useStore((s) => s.tiers);
  const orders = useStore((s) => s.orders);
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const adjustCustomerPoints = useStore((s) => s.adjustCustomerPoints);

  const [query, setQuery] = useState("");
  const [adjustId, setAdjustId] = useState<string | null>(null);

  const tierName = (tierId: string) => tiers.find((t) => t.id === tierId)?.name ?? tierId;

  // Per-customer paid spend, computed once per orders change.
  const spendByCustomer = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of orders) {
      if (!o.customerId || !PAID_STATUSES.includes(o.status)) continue;
      map.set(o.customerId, (map.get(o.customerId) ?? 0) + o.total);
    }
    return map;
  }, [orders]);

  // Total points ever awarded across all settled orders.
  const totalAwarded = useMemo(
    () => orders.reduce((a, o) => a + (o.pointsEarned ?? 0), 0),
    [orders],
  );

  const totalBalance = useMemo(
    () => customers.reduce((a, c) => a + (c.points ?? 0), 0),
    [customers],
  );

  const ranked = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers
      .filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.phone ?? "").toLowerCase().includes(q),
      )
      .slice()
      .sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
  }, [customers, query]);

  const earnRate = settings.earnRate ?? 20;
  const activeCustomer = customers.find((c) => c.id === adjustId) ?? null;

  function handleAdjust(delta: number) {
    if (!adjustId) return;
    adjustCustomerPoints(adjustId, delta);
    setAdjustId(null);
    toast.success(delta >= 0 ? "เพิ่มคะแนนแล้ว" : "หักคะแนนแล้ว");
  }

  return (
    <div>
      <PageHeader
        title="สมาชิก & คะแนน"
        description="โปรแกรมสะสมคะแนนของ Brew & Bean Café"
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="สมาชิกทั้งหมด"
          value={formatNumber(customers.length)}
          icon={Users2}
          tone="primary"
          hint={`คงเหลือรวม ${formatNumber(totalBalance)} คะแนน`}
        />
        <StatCard
          label="คะแนนรวมที่แจก"
          value={formatNumber(totalAwarded)}
          icon={Sparkles}
          tone="success"
          hint="จากออเดอร์ที่ชำระแล้วทั้งหมด"
        />
        <StatCard
          label="อัตราสะสม"
          value={`1 / ${formatNumber(earnRate)}`}
          icon={Coins}
          tone="info"
          hint={`1 คะแนน ทุกการใช้จ่าย ${formatTHB(earnRate)}`}
        />
      </div>

      <div className="grid gap-4">
        <LoyaltySettingsCard
          settings={settings}
          onSave={(patch) => updateSettings(patch)}
        />

        <Card strong>
          <CardContent className="p-5 sm:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  อันดับสมาชิก
                </h2>
                <Badge tone="neutral" className="font-mono">
                  {formatNumber(ranked.length)}
                </Badge>
              </div>
              <div className="relative sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ค้นหาสมาชิก"
                  className="pl-9"
                />
              </div>
            </div>

            {ranked.length === 0 ? (
              <EmptyState
                icon={Users2}
                title={query ? "ไม่พบสมาชิกที่ค้นหา" : "ยังไม่มีสมาชิก"}
                description={query ? "ลองคำค้นอื่น" : "เพิ่มลูกค้าเพื่อเริ่มสะสมคะแนน"}
              />
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH className="w-12 text-right">#</TH>
                    <TH>สมาชิก</TH>
                    <TH>ระดับ</TH>
                    <TH className="text-right">ยอดซื้อรวม</TH>
                    <TH className="text-right">คะแนน</TH>
                    <TH className="text-right">มูลค่า</TH>
                    <TH className="text-right">จัดการ</TH>
                  </TR>
                </THead>
                <TBody>
                  {ranked.map((c, i) => {
                    const points = c.points ?? 0;
                    const spent = spendByCustomer.get(c.id) ?? 0;
                    return (
                      <TR key={c.id} className="transition-colors hover:bg-slate-500/5 dark:hover:bg-white/5">
                        <TD className="text-right font-mono text-slate-400">{i + 1}</TD>
                        <TD>
                          <div className="font-medium text-slate-900 dark:text-slate-50">
                            {c.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {c.email}
                          </div>
                        </TD>
                        <TD>
                          <Badge tone="neutral">{tierName(c.tierId)}</Badge>
                        </TD>
                        <TD className="text-right font-mono text-slate-700 dark:text-slate-200">
                          {formatTHB(spent)}
                        </TD>
                        <TD className="text-right">
                          <span className="inline-flex items-center gap-1 font-mono font-semibold text-slate-900 dark:text-slate-50">
                            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                            {formatNumber(points)}
                          </span>
                        </TD>
                        <TD className="text-right font-mono text-emerald-600 dark:text-emerald-400">
                          {formatTHB(pointsBahtValue(points, settings))}
                        </TD>
                        <TD className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAdjustId(c.id)}
                          >
                            ปรับคะแนน
                          </Button>
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <AdjustPointsDialog
        open={adjustId !== null}
        customer={activeCustomer}
        settings={settings}
        onClose={() => setAdjustId(null)}
        onApply={handleAdjust}
      />
    </div>
  );
}
