"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { homeForRole } from "@/lib/constants";
import type { Role } from "@/lib/types";

/** Current session: resolved user, linked customer profile, and role. */
export function useAuth() {
  const currentUserId = useStore((s) => s.currentUserId);
  const users = useStore((s) => s.users);
  const customers = useStore((s) => s.customers);

  const user = users.find((u) => u.id === currentUserId) ?? null;
  const customer = user?.customerId
    ? customers.find((c) => c.id === user.customerId) ?? null
    : null;

  return { user, customer, role: user?.role ?? null, isLoggedIn: !!user };
}

/**
 * Client-side route guard. Redirects to /login when logged out, or to the
 * role home when the role is not allowed for this section.
 * Pass a STABLE array (module-level const) for `allowed`.
 */
export function useRequireAuth(allowed?: Role[]) {
  const router = useRouter();
  const auth = useAuth();
  const { user, role } = auth;
  const allowedKey = allowed?.join(",");

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    if (allowed && role && !allowed.includes(role)) {
      router.replace(homeForRole(role));
    }
  }, [user, role, allowed, allowedKey, router]);

  return auth;
}
