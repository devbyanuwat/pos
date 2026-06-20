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

/** Server-side: fill a partial printer config (from a request body) with defaults. */
export function resolvePrinter(p: Partial<PrinterConfig> = {}): PrinterConfig {
  return {
    host: (p.host ?? "").trim() || PRINTER_DEFAULTS.host,
    port: p.port || PRINTER_DEFAULTS.port,
    codepage: p.codepage ?? PRINTER_DEFAULTS.codepage,
    width: p.width || PRINTER_DEFAULTS.width,
  };
}

/** How a print job reaches the printer: directly over the LAN, or via the cloud queue. */
export type PrintMode = "local" | "cloud";

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
  /** "local" streams to the printer now; "cloud" enqueues for the shop agent. */
  mode?: PrintMode;
}

export interface PrintResult {
  ok: boolean;
  error?: string;
}

/**
 * Send a print job. In "local" mode it POSTs to the LAN bridge (`/api/print`)
 * which streams to the printer immediately. In "cloud" mode it enqueues the job
 * (`/api/print-queue/enqueue`) for the in-shop agent to pull and print — this is
 * the only mode that works when the app is hosted off-LAN (e.g. Vercel).
 * Never throws — returns `{ ok, error }`.
 */
export async function sendPrint(req: PrintRequest): Promise<PrintResult> {
  const endpoint = req.mode === "cloud" ? "/api/print-queue/enqueue" : "/api/print";
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ printer: req.printer, job: req.job }),
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
