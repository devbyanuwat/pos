"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  Lock,
  Wallet,
  Boxes,
  TrendingUp,
  Receipt,
  PiggyBank,
  Banknote,
  HandCoins,
  PackagePlus,
  PieChart as PieIcon,
} from "lucide-react";
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  StatCard,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  EmptyState,
} from "@/components/ui";
import { useStore } from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";
import {
  financeSummary,
  salesByDay,
  expenseBreakdown,
  rangeForPreset,
  type RangePreset,
} from "@/lib/selectors";
import { EXPENSE_TYPE_LABELS } from "@/lib/constants";
import { formatTHB, formatPercent } from "@/lib/utils";
import {
  RangeTabs,
  rangeLabel,
  ChartCard,
  CHART_COLORS,
  PIE_COLORS,
  CurrencyTooltip,
  compactNumber,
} from "@/components/admin/finance";

export default function FinancePage() {
  const { role } = useAuth();

  const orders = useStore((s) => s.orders);
  const expenses = useStore((s) => s.expenses);
  const purchases = useStore((s) => s.purchases);
  const settings = useStore((s) => s.settings);

  const [preset, setPreset] = useState<RangePreset>("30d");
  const range = useMemo(() => rangeForPreset(preset), [preset]);

  const summary = useMemo(
    () => financeSummary(orders, expenses, purchases, settings, range),
    [orders, expenses, purchases, settings, range],
  );
  const series = useMemo(() => salesByDay(orders, range), [orders, range]);
  const breakdown = useMemo(() => expenseBreakdown(expenses, range), [expenses, range]);

  const pieData = useMemo(
    () =>
      breakdown
        .map((b) => ({ name: EXPENSE_TYPE_LABELS[b.type], value: b.amount, type: b.type }))
        .sort((a, b) => b.value - a.value),
    [breakdown],
  );
  const totalExpenses = useMemo(() => pieData.reduce((a, b) => a + b.value, 0), [pieData]);

  if (role !== "owner") {
    return (
      <EmptyState
        icon={Lock}
        title="เฉพาะเจ้าของร้าน"
        description="คุณไม่มีสิทธิ์เข้าถึงหน้านี้"
      />
    );
  }

  const grossMargin = summary.revenue
    ? (summary.grossProfit / summary.revenue) * 100
    : 0;
  const netMargin = summary.revenue ? (summary.netProfit / summary.revenue) * 100 : 0;

  // P&L waterfall rows for the summary table.
  const pnl: { label: string; value: number; tone?: "muted" | "positive" | "negative"; strong?: boolean }[] = [
    { label: "รายได้จากการขาย", value: summary.revenue, strong: true },
    { label: "หัก ต้นทุนขาย (COGS)", value: -summary.cogs, tone: "negative" },
    { label: "กำไรขั้นต้น", value: summary.grossProfit, tone: "positive", strong: true },
    { label: "หัก ค่าใช้จ่ายดำเนินงาน", value: -summary.opex, tone: "negative" },
    {
      label: "กำไรสุทธิ",
      value: summary.netProfit,
      tone: summary.netProfit >= 0 ? "positive" : "negative",
      strong: true,
    },
  ];

  return (
    <div>
      <PageHeader
        title="การเงิน"
        description={`งบกำไรขาดทุนและกระแสเงินสด ${rangeLabel(preset)}`}
        actions={<RangeTabs value={preset} onChange={setPreset} />}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="รายได้"
          value={formatTHB(summary.revenue)}
          icon={Wallet}
          tone="success"
          hint={`${summary.orderCount} ออเดอร์`}
        />
        <StatCard
          label="ต้นทุนขาย"
          value={formatTHB(summary.cogs)}
          icon={Boxes}
          tone="danger"
        />
        <StatCard
          label="กำไรขั้นต้น"
          value={formatTHB(summary.grossProfit)}
          icon={TrendingUp}
          tone="success"
          hint={`มาร์จิน ${formatPercent(Math.round(grossMargin))}`}
        />
        <StatCard
          label="ค่าใช้จ่าย"
          value={formatTHB(summary.opex)}
          icon={Receipt}
          tone="danger"
        />
        <StatCard
          label="กำไรสุทธิ"
          value={formatTHB(summary.netProfit)}
          icon={PiggyBank}
          tone={summary.netProfit >= 0 ? "success" : "danger"}
          hint={`มาร์จิน ${formatPercent(Math.round(netMargin))}`}
        />
        <StatCard
          label="ถอนเงิน"
          value={formatTHB(summary.withdrawals)}
          icon={HandCoins}
          tone="warning"
        />
        <StatCard
          label="ซื้อสินค้าเข้า"
          value={formatTHB(summary.inventoryIn)}
          icon={PackagePlus}
          tone="info"
        />
        <StatCard
          label="เงินสดคงเหลือ"
          value={formatTHB(summary.cashBalance)}
          icon={Banknote}
          tone={summary.cashBalance >= 0 ? "primary" : "danger"}
          hint="ยอดสะสมทั้งหมด"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <ChartCard
          title="รายได้ เทียบกับ กำไร"
          description={`แนวโน้มรายวัน · ${rangeLabel(preset)}`}
          className="xl:col-span-2"
        >
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="finRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.revenue} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={CHART_COLORS.revenue} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="finProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.profit} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={CHART_COLORS.profit} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.18} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tickFormatter={compactNumber}
                />
                <Tooltip content={<CurrencyTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="รายได้"
                  stroke={CHART_COLORS.revenue}
                  strokeWidth={2}
                  fill="url(#finRevenue)"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  name="กำไร"
                  stroke={CHART_COLORS.profit}
                  strokeWidth={2}
                  fill="url(#finProfit)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="สัดส่วนค่าใช้จ่าย"
          description={`รวม ${formatTHB(totalExpenses)}`}
        >
          <div className="h-80 w-full">
            {pieData.length === 0 ? (
              <EmptyState
                icon={PieIcon}
                title="ไม่มีค่าใช้จ่าย"
                description={`ยังไม่มีรายจ่ายใน ${rangeLabel(preset)}`}
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={64}
                    outerRadius={104}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={entry.type} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CurrencyTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card strong>
          <CardHeader>
            <CardTitle>งบกำไรขาดทุน</CardTitle>
            <CardDescription>สรุป P&amp;L · {rangeLabel(preset)}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TBody>
                {pnl.map((row) => (
                  <TR key={row.label}>
                    <TD
                      className={
                        row.strong
                          ? "font-semibold text-slate-900 dark:text-slate-50"
                          : "text-slate-600 dark:text-slate-300"
                      }
                    >
                      {row.label}
                    </TD>
                    <TD
                      className={
                        "text-right font-mono " +
                        (row.tone === "positive"
                          ? "text-emerald-500"
                          : row.tone === "negative"
                            ? "text-red-500"
                            : "text-slate-900 dark:text-slate-50") +
                        (row.strong ? " font-semibold" : "")
                      }
                    >
                      {formatTHB(row.value)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        <Card strong>
          <CardHeader>
            <CardTitle>รายละเอียดค่าใช้จ่าย</CardTitle>
            <CardDescription>แยกตามประเภท · {rangeLabel(preset)}</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <EmptyState icon={Receipt} title="ไม่มีค่าใช้จ่าย" />
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>ประเภท</TH>
                    <TH className="text-right">จำนวน</TH>
                    <TH className="text-right">สัดส่วน</TH>
                  </TR>
                </THead>
                <TBody>
                  {pieData.map((row, i) => (
                    <TR key={row.type}>
                      <TD>
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                          />
                          {row.name}
                        </span>
                      </TD>
                      <TD className="text-right font-mono">{formatTHB(row.value)}</TD>
                      <TD className="text-right font-mono text-slate-500 dark:text-slate-400">
                        {formatPercent(
                          totalExpenses ? Math.round((row.value / totalExpenses) * 100) : 0,
                        )}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
