"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { homeForRole } from "@/lib/constants";

export default function Home() {
  const router = useRouter();
  const { user, role } = useAuth();

  useEffect(() => {
    if (user && role) router.replace(homeForRole(role));
    else router.replace("/login");
  }, [user, role, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center text-sm text-slate-400">
      กำลังนำทาง...
    </div>
  );
}
