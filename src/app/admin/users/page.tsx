"use client";

import { useState } from "react";
import { Lock, Plus, ShieldCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";
import type { NewUser } from "@/lib/store";
import type { Role } from "@/lib/types";
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Avatar,
  Badge,
  Switch,
  Select,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  EmptyState,
  toast,
} from "@/components/ui";
import { ROLE_LABELS } from "@/lib/constants";
import { UserFormDialog } from "@/components/admin/people/user-form-dialog";

const ASSIGNABLE_ROLES: Role[] = ["customer", "staff", "manager", "owner"];

// Static access matrix shown below the table.
const ACCESS_MATRIX: { role: Role; access: string }[] = [
  {
    role: "owner",
    access: "เข้าถึงทุกหน้า รวมการเงิน รายจ่าย ผู้ใช้ และตั้งค่าระบบ",
  },
  {
    role: "manager",
    access: "สินค้า สต๊อก ซื้อเข้า รายงาน ลูกค้า ส่วนลด และหน้าขาย (POS)",
  },
  {
    role: "staff",
    access: "หน้าขาย (POS) และแพ็กสินค้า",
  },
  {
    role: "customer",
    access: "หน้าร้านค้าและบัญชีของตนเอง",
  },
];

export default function UsersPage() {
  const { role } = useAuth();

  const users = useStore((s) => s.users);
  const addUser = useStore((s) => s.addUser);
  const updateUser = useStore((s) => s.updateUser);
  const toggleUserActive = useStore((s) => s.toggleUserActive);

  const [dialogOpen, setDialogOpen] = useState(false);

  if (role !== "owner") {
    return (
      <EmptyState
        icon={Lock}
        title="เฉพาะเจ้าของร้าน"
        description="คุณไม่มีสิทธิ์เข้าถึงหน้านี้"
      />
    );
  }

  function handleAdd(data: NewUser) {
    addUser(data);
    setDialogOpen(false);
    toast.success("เพิ่มผู้ใช้แล้ว");
  }

  function changeRole(id: string, newRole: Role) {
    updateUser(id, { role: newRole });
    toast.success("เปลี่ยนบทบาทแล้ว");
  }

  return (
    <div>
      <PageHeader
        title="ผู้ใช้และสิทธิ์"
        description="จัดการบัญชีผู้ใช้ บทบาท และการเข้าถึงระบบ"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            เพิ่มผู้ใช้
          </Button>
        }
      />

      <div className="grid gap-4">
        <Card strong>
          <CardContent className="p-0 sm:p-0">
            {users.length === 0 ? (
              <EmptyState icon={ShieldCheck} title="ยังไม่มีผู้ใช้" />
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>ชื่อ</TH>
                    <TH>อีเมล</TH>
                    <TH>บทบาท</TH>
                    <TH className="text-center">สถานะ</TH>
                    <TH className="text-right">แก้ไขบทบาท</TH>
                  </TR>
                </THead>
                <TBody>
                  {users.map((u) => (
                    <TR key={u.id}>
                      <TD>
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} src={u.avatar} />
                          <span className="font-medium text-slate-900 dark:text-slate-50">
                            {u.name}
                          </span>
                        </div>
                      </TD>
                      <TD className="text-slate-500 dark:text-slate-400">{u.email}</TD>
                      <TD>
                        <Badge tone="primary">{ROLE_LABELS[u.role]}</Badge>
                      </TD>
                      <TD>
                        <div className="flex items-center justify-center gap-2">
                          <Switch checked={u.active} onChange={() => toggleUserActive(u.id)} />
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {u.active ? "ใช้งาน" : "ระงับ"}
                          </span>
                        </div>
                      </TD>
                      <TD>
                        <div className="flex justify-end">
                          <Select
                            value={u.role}
                            onChange={(e) => changeRole(u.id, e.target.value as Role)}
                            className="h-9 w-40"
                            aria-label={`บทบาทของ ${u.name}`}
                          >
                            {ASSIGNABLE_ROLES.map((r) => (
                              <option key={r} value={r}>
                                {ROLE_LABELS[r]}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card strong>
          <CardHeader>
            <CardTitle>ลำดับชั้นสิทธิ์</CardTitle>
            <CardDescription>สรุปการเข้าถึงของแต่ละบทบาท เรียงจากสิทธิ์สูงไปต่ำ</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3">
              {ACCESS_MATRIX.map((row) => (
                <li
                  key={row.role}
                  className="flex flex-col gap-2 rounded-xl border border-slate-200/60 p-4 dark:border-white/10 sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="sm:w-40 sm:shrink-0">
                    <Badge tone="primary">
                      <ShieldCheck className="h-3 w-3" />
                      {ROLE_LABELS[row.role]}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{row.access}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <UserFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleAdd}
      />
    </div>
  );
}
