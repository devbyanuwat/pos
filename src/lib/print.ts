// Client-side helper for talking to the local print bridge (`/api/print`).
//
// The browser cannot open a raw TCP socket to the thermal printer, so the page
// POSTs a high-level job here and a Node route handler renders ESC/POS and sends
// it to the printer at `host:9100` on the shop LAN. Plan L: the app is served
// from a machine on the same network as the printer (e.g. `npm run dev`).

import type { Settings } from "./types";

/** Falls back to these when the shop has not configured a printer yet. */
export const PRINTER_DEFAULTS = {
  host: "192.168.1.118",
  port: 9100,
  /** `ESC t` Thai code page — tune via the test print if Thai is garbled. */
  codepage: 21,
  /** Receipt character width: 58mm paper = 32, 80mm = 48. */
  width: 32,
} as const;

export interface PrinterConfig {
  host: string;
  port: number;
  codepage: number;
  width: number;
}

/** Resolve an effective printer config from saved settings + defaults. */
export function printerConfig(settings: Settings): PrinterConfig {
  return {
    host: settings.printerHost?.trim() || PRINTER_DEFAULTS.host,
    port: settings.printerPort || PRINTER_DEFAULTS.port,
    codepage: settings.printerCodepage ?? PRINTER_DEFAULTS.codepage,
    width: settings.printerWidth || PRINTER_DEFAULTS.width,
  };
}

export interface ReceiptItem {
  name: string;
  qty: number;
  /** Line total in baht (unit price * qty, already resolved). */
  lineTotal: number;
  options?: string[];
}

/** A printable job. The route handler turns each variant into ESC/POS bytes. */
export type PrintJob =
  | { type: "test" }
  | { type: "tableQr"; shopName: string; tableName: string; url: string }
  | {
      type: "receipt";
      shopName: string;
      code: string;
      /** Pre-formatted on the client so the receipt shows local date/time. */
      dateText: string;
      tableName?: string;
      items: ReceiptItem[];
      subtotal: number;
      discount: number;
      total: number;
      paymentLabel?: string;
      cashReceived?: number | null;
      change?: number | null;
      footer?: string;
    };

export interface PrintRequest {
  printer: PrinterConfig;
  job: PrintJob;
}

export interface PrintResult {
  ok: boolean;
  error?: string;
}

/** POST a job to the local print bridge. Never throws — returns `{ ok, error }`. */
export async function sendPrint(req: PrintRequest): Promise<PrintResult> {
  try {
    const res = await fetch("/api/print", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    const data: PrintResult = await res.json().catch(() => ({ ok: false }));
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error ?? `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network error" };
  }
}
