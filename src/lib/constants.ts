import type { Role, OrderStatus, ExpenseType } from "./types";

export const ROLE_LABELS: Record<Role, string> = {
  customer: "ลูกค้า",
  staff: "พนักงานขาย",
  manager: "ผู้จัดการ",
  owner: "เจ้าของร้าน",
};

export type Tone = "neutral" | "primary" | "info" | "success" | "warning" | "danger";

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: Tone }> = {
  pending_payment: { label: "รอชำระเงิน", tone: "warning" },
  paid: { label: "ชำระแล้ว", tone: "info" },
  packing: { label: "กำลังแพ็ก", tone: "primary" },
  completed: { label: "เสร็จสมบูรณ์", tone: "success" },
  cancelled: { label: "ยกเลิก", tone: "danger" },
};

/** Forward status flow for the fulfilment pipeline. */
export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending_payment: "paid",
  paid: "packing",
  packing: "completed",
};

export const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = {
  salary: "เงินเดือน",
  utility: "ค่าน้ำ / ค่าไฟ",
  rent: "ค่าเช่า",
  withdrawal: "ถอนเงิน",
  other: "อื่น ๆ",
};

export const CHANNEL_LABELS = {
  online: "ออนไลน์",
  pos: "หน้าร้าน",
} as const;

export function homeForRole(role: Role): string {
  switch (role) {
    case "customer":
      return "/shop";
    case "staff":
      return "/pos";
    case "manager":
    case "owner":
      return "/admin";
  }
}
