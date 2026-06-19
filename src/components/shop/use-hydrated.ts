"use client";

import { useStore } from "@/lib/store";

/**
 * True once the persisted zustand store has rehydrated from localStorage.
 * Pages that read persisted slices (cart, orders) should gate on this so the
 * first client paint matches and we never flash stale/empty data.
 */
export function useHydrated(): boolean {
  return useStore((s) => s._hasHydrated);
}
