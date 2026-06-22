"use client";

import { Store, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SalesChannel } from "@/lib/types";

/**
 * Horizontal pill-row at the top of the counter POS that lets the cashier
 * choose between in-store ("เคาน์เตอร์") and any active delivery platform.
 * Switching channel resets the bill (handled by the parent page).
 */
export function ChannelSelector({
  activeChannels,
  channelId,
  onChange,
}: {
  activeChannels: SalesChannel[];
  channelId: string | null;
  onChange: (id: string | null) => void;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm text-slate-500 dark:text-slate-400">ช่องทางขาย:</span>

      <ChannelPill
        active={channelId === null}
        onClick={() => onChange(null)}
        icon={Store}
        label="เคาน์เตอร์"
        color="amber"
      />

      {activeChannels.map((ch) => (
        <ChannelPill
          key={ch.id}
          active={channelId === ch.id}
          onClick={() => onChange(ch.id)}
          icon={Truck}
          label={ch.name}
          color={ch.color ?? "emerald"}
        />
      ))}
    </div>
  );
}

function ChannelPill({
  active,
  onClick,
  icon: Icon,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-150 active:scale-[0.97]",
        active
          ? "border-primary bg-primary/10 text-primary shadow-sm shadow-primary/20"
          : "border-slate-300/60 bg-white/60 text-slate-600 hover:border-slate-400/60 hover:bg-white/80 dark:border-white/12 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10",
      )}
      data-color={color}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
