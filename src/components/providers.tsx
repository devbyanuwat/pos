"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";

/**
 * Global hydration gate. The whole app is client-side + localStorage, so we
 * render a loader until the persisted store has rehydrated. This guarantees
 * server HTML and first client render match (no hydration mismatch) and that
 * auth guards read the real currentUser.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const hydrated = useStore((s) => s._hasHydrated);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || !hydrated) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center">
        <div className="glass flex items-center gap-3 rounded-2xl px-6 py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            กำลังโหลด Demo Store...
          </span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
