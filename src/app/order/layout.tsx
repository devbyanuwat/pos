"use client";

import { Coffee } from "lucide-react";
import { useStore } from "@/lib/store";

/**
 * Minimal PUBLIC layout for the customer-facing QR ordering flow. No auth guard
 * and no app shell — just a centered, mobile-first column with the coffee brand
 * header. It still renders under the root Providers hydration gate, so the store
 * (and shopName) is ready by the time children mount.
 */
export default function OrderLayout({ children }: { children: React.ReactNode }) {
  const settings = useStore((s) => s.settings);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-white/40 bg-white/55 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/45">
        <div className="mx-auto flex max-w-md items-center gap-3 px-5 py-3.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25">
            <Coffee className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold leading-tight text-slate-900 dark:text-slate-50">
              {settings.shopName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">สั่งที่โต๊ะ · บริการตนเอง</p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-4 pb-32 pt-5 sm:px-5">{children}</main>
    </div>
  );
}
