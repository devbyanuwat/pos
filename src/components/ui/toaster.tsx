"use client";

import { create } from "zustand";
import { useEffect } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  tone: ToastTone;
}

interface ToastStore {
  toasts: ToastItem[];
  push: (t: Omit<ToastItem, "id">) => void;
  dismiss: (id: string) => void;
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (t) =>
    set((s) => ({
      toasts: [...s.toasts, { ...t, id: Math.random().toString(36).slice(2) }],
    })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

function emit(message: string, tone: ToastTone) {
  useToastStore.getState().push({ message, tone });
}

/** Fire-and-forget toast. Call from anywhere: toast.success("บันทึกแล้ว"). */
export const toast = Object.assign((m: string) => emit(m, "info"), {
  success: (m: string) => emit(m, "success"),
  error: (m: string) => emit(m, "error"),
  info: (m: string) => emit(m, "info"),
});

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((t) => (
        <ToastCard key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  useEffect(() => {
    const h = setTimeout(onDismiss, 3500);
    return () => clearTimeout(h);
  }, [onDismiss]);

  const Icon = item.tone === "success" ? CheckCircle2 : item.tone === "error" ? XCircle : Info;
  const color =
    item.tone === "success"
      ? "text-emerald-500"
      : item.tone === "error"
        ? "text-red-500"
        : "text-sky-500";

  return (
    <div
      role="status"
      aria-live="polite"
      className="glass-strong pointer-events-auto flex items-center gap-3 rounded-xl px-4 py-3"
    >
      <Icon className={cn("h-5 w-5 shrink-0", color)} />
      <span className="flex-1 text-sm text-slate-800 dark:text-slate-100">{item.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="ปิดการแจ้งเตือน"
        className="rounded-md p-1 text-slate-400 hover:bg-slate-500/10 hover:text-slate-600 dark:hover:text-slate-200"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
