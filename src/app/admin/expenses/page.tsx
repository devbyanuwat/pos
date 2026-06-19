"use client";

import { useMemo, useState } from "react";
import {
  Lock,
  Plus,
  Trash2,
  Receipt,
  Users,
  HandCoins,
  Zap,
  Home,
} from "lucide-react";
import {
  PageHeader,
  Card,
  CardContent,
  StatCard,
  Tabs,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  Badge,
  Button,
  Dialog,
  Input,
  Label,
  Select,
  Textarea,
  EmptyState,
  toast,
} from "@/components/ui";
import { useStore } from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";
import { EXPENSE_TYPE_LABELS } from "@/lib/constants";
import type { ExpenseType } from "@/lib/types";
import { formatTHB, formatDate, formatNumber } from "@/lib/utils";

const EXPENSE_TYPES: ExpenseType[] = ["salary", "utility", "rent", "withdrawal", "other"];

const TYPE_TONE: Record<ExpenseType, "primary" | "info" | "warning" | "danger" | "neutral"> = {
  salary: "primary",
  utility: "info",
  rent: "warning",
  withdrawal: "danger",
  other: "neutral",
};

function todayInput(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export default function ExpensesPage() {
  const { role, user } = useAuth();

  const expenses = useStore((s) => s.expenses);
  const addExpense = useStore((s) => s.addExpense);
  const removeExpense = useStore((s) => s.removeExpense);

  const [filter, setFilter] = useState<"all" | ExpenseType>("all");
  const [open, setOpen] = useState(false);

  const [type, setType] = useState<ExpenseType>("salary");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayInput);
  const [note, setNote] = useState("");

  const sorted = useMemo(
    () => [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [expenses],
  );
  const rows = useMemo(
    () => (filter === "all" ? sorted : sorted.filter((e) => e.type === filter)),
    [sorted, filter],
  );

  const totals = useMemo(() => {
    const by = (t: ExpenseType) =>
      expenses.filter((e) => e.type === t).reduce((a, e) => a + e.amount, 0);
    const total = expenses.reduce((a, e) => a + e.amount, 0);
    return {
      total,
      salary: by("salary"),
      withdrawal: by("withdrawal"),
      utility: by("utility"),
      rent: by("rent"),
      count: expenses.length,
    };
  }, [expenses]);

  if (role !== "owner") {
    return (
      <EmptyState
        icon={Lock}
        title="เฉพาะเจ้าของร้าน"
        description="คุณไม่มีสิทธิ์เข้าถึงหน้านี้"
      />
    );
  }

  function resetForm() {
    setType("salary");
    setLabel("");
    setAmount("");
    setDate(todayInput());
    setNote("");
  }

  function handleSubmit() {
    const amt = Number(amount);
    if (!label.trim()) {
      toast.error("กรุณากรอกรายการ");
      return;
    }
    if (!amt || amt <= 0) {
      toast.error("กรุณากรอกจำนวนเงินให้ถูกต้อง");
      return;
    }
    addExpense({
      type,
      label: label.trim(),
      amount: amt,
      date: new Date(date).toISOString(),
      note: note.trim() || undefined,
      createdBy: user?.id,
    });
    toast.success("เพิ่มรายจ่ายแล้ว");
    setOpen(false);
    resetForm();
  }

  function handleRemove(id: string, name: string) {
    removeExpense(id);
    toast.success(`ลบ "${name}" แล้ว`);
  }

  const filterTabs = [
    { value: "all", label: "ทั้งหมด" },
    ...EXPENSE_TYPES.map((t) => ({ value: t, label: EXPENSE_TYPE_LABELS[t] })),
  ];

  return (
    <div>
      <PageHeader
        title="รายจ่าย"
        description="บันทึกและจัดการค่าใช้จ่ายทั้งหมดของร้าน"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            เพิ่มรายจ่าย
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="รวมรายจ่าย"
          value={formatTHB(totals.total)}
          icon={Receipt}
          tone="danger"
          hint={`${formatNumber(totals.count)} รายการ`}
        />
        <StatCard label="เงินเดือน" value={formatTHB(totals.salary)} icon={Users} tone="primary" />
        <StatCard
          label="ถอนเงิน"
          value={formatTHB(totals.withdrawal)}
          icon={HandCoins}
          tone="warning"
        />
        <StatCard
          label="ค่าน้ำ / ค่าไฟ"
          value={formatTHB(totals.utility)}
          icon={Zap}
          tone="info"
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          tabs={filterTabs}
          value={filter}
          onChange={(v) => setFilter(v as "all" | ExpenseType)}
        />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          แสดง <span className="font-mono">{formatNumber(rows.length)}</span> รายการ
        </p>
      </div>

      <Card strong className="mt-4">
        <CardContent className="pt-5 sm:pt-6">
          {rows.length === 0 ? (
            <EmptyState
              icon={Home}
              title="ยังไม่มีรายจ่าย"
              description="เพิ่มรายจ่ายแรกของคุณเพื่อเริ่มติดตามค่าใช้จ่าย"
              action={
                <Button onClick={() => setOpen(true)}>
                  <Plus className="h-4 w-4" />
                  เพิ่มรายจ่าย
                </Button>
              }
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>ประเภท</TH>
                  <TH>รายการ</TH>
                  <TH className="text-right">จำนวน</TH>
                  <TH>วันที่</TH>
                  <TH>หมายเหตุ</TH>
                  <TH className="text-right">จัดการ</TH>
                </TR>
              </THead>
              <TBody>
                {rows.map((e) => (
                  <TR key={e.id}>
                    <TD>
                      <Badge tone={TYPE_TONE[e.type]}>{EXPENSE_TYPE_LABELS[e.type]}</Badge>
                    </TD>
                    <TD className="font-medium text-slate-800 dark:text-slate-100">{e.label}</TD>
                    <TD className="text-right font-mono font-medium text-red-500">
                      {formatTHB(e.amount)}
                    </TD>
                    <TD className="whitespace-nowrap text-slate-500 dark:text-slate-400">
                      {formatDate(e.date)}
                    </TD>
                    <TD className="max-w-[16rem] truncate text-slate-500 dark:text-slate-400">
                      {e.note || "-"}
                    </TD>
                    <TD className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="ลบรายจ่าย"
                        className="text-slate-400 hover:text-red-500"
                        onClick={() => handleRemove(e.id, e.label)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="เพิ่มรายจ่าย"
        description="บันทึกค่าใช้จ่ายใหม่เข้าระบบ"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSubmit}>
              <Plus className="h-4 w-4" />
              บันทึก
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="exp-type">ประเภท</Label>
            <Select
              id="exp-type"
              value={type}
              onChange={(e) => setType(e.target.value as ExpenseType)}
            >
              {EXPENSE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {EXPENSE_TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="exp-label">รายการ</Label>
            <Input
              id="exp-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="เช่น เงินเดือนพนักงาน มิ.ย."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="exp-amount">จำนวนเงิน (บาท)</Label>
              <Input
                id="exp-amount"
                type="number"
                min={0}
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="font-mono"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="exp-date">วันที่</Label>
              <Input
                id="exp-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="exp-note">หมายเหตุ (ไม่บังคับ)</Label>
            <Textarea
              id="exp-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="รายละเอียดเพิ่มเติม"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
