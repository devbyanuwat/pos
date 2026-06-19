import { PosShell } from "@/components/layout/pos-shell";

export default function PosLayout({ children }: { children: React.ReactNode }) {
  return <PosShell>{children}</PosShell>;
}
