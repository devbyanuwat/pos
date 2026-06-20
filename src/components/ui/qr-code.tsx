"use client";

import * as React from "react";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";

export interface QrCodeViewProps {
  value: string;
  size?: number;
  className?: string;
}

/**
 * Renders a QR code on a white, rounded, padded surface so it stays scannable
 * even in dark mode (the white container guarantees the required quiet zone /
 * contrast against a dark glass background).
 */
export function QrCodeView({ value, size = 160, className }: QrCodeViewProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200",
        className,
      )}
    >
      <QRCodeSVG value={value} size={size} level="M" marginSize={0} />
    </div>
  );
}
