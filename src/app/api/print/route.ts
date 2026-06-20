// Local print bridge. Receives a high-level job from the POS UI, renders it to
// ESC/POS, and streams the bytes to a RAW thermal printer over TCP port 9100.
//
// Runs in the Node.js runtime (needs `node:net`) and must execute on a machine
// that shares a LAN with the printer — Plan L: served via `npm run dev` on the
// shop's Mac, opened from the iPad at http://<mac-lan-ip>:3000.

import net from "node:net";
import { Escpos } from "@/lib/escpos";
import type { PrinterConfig, PrintJob, ReceiptItem } from "@/lib/print";
import { PRINTER_DEFAULTS } from "@/lib/print";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONNECT_TIMEOUT_MS = 5000;

interface Body {
  printer?: Partial<PrinterConfig>;
  job?: PrintJob;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ ok: false, error: "invalid JSON body" }, { status: 400 });
  }

  if (!body.job) {
    return Response.json({ ok: false, error: "missing job" }, { status: 400 });
  }

  const printer = resolvePrinter(body.printer);

  let bytes: number[];
  try {
    bytes = buildJob(body.job, printer);
  } catch (e) {
    return Response.json({ ok: false, error: errMessage(e) }, { status: 400 });
  }

  try {
    await sendToPrinter(printer.host, printer.port, Buffer.from(bytes));
  } catch (e) {
    return Response.json({ ok: false, error: errMessage(e) }, { status: 502 });
  }

  return Response.json({ ok: true });
}

function resolvePrinter(p: Partial<PrinterConfig> = {}): PrinterConfig {
  return {
    host: (p.host ?? "").trim() || PRINTER_DEFAULTS.host,
    port: p.port || PRINTER_DEFAULTS.port,
    codepage: p.codepage ?? PRINTER_DEFAULTS.codepage,
    width: p.width || PRINTER_DEFAULTS.width,
  };
}

function buildJob(job: PrintJob, printer: PrinterConfig): number[] {
  const e = new Escpos({ codepage: printer.codepage }).init();
  switch (job.type) {
    case "test":
      return buildTest(e, printer);
    case "tableQr":
      return buildTableQr(e, job.shopName, job.tableName, job.url);
    case "receipt":
      return buildReceipt(e, job, printer.width);
    default:
      throw new Error("unknown job type");
  }
}

function buildTest(e: Escpos, printer: PrinterConfig): number[] {
  e.align("center").bold(true).size(2, 2).line("TEST PRINT").size(1, 1).bold(false);
  e.line("ทดสอบภาษาไทย กขคงจ ฉชซ");
  e.feed(1).align("left");
  e.line(`Printer  : ${printer.host}:${printer.port}`);
  e.line(`Codepage : ${printer.codepage}`);
  e.line(`Width    : ${printer.width}`);
  e.feed(1).align("center");
  e.qr("https://example.com/printer-test", 6);
  e.feed(1).line("ถ้าอ่าน QR + ไทยได้ = พร้อมใช้งาน");
  return e.cut().bytes();
}

function buildTableQr(e: Escpos, shopName: string, tableName: string, url: string): number[] {
  e.align("center");
  e.bold(true).line(shopName).bold(false);
  e.feed(1).size(2, 2).line(tableName).size(1, 1);
  e.line("สแกนเพื่อสั่งอาหารที่โต๊ะ").feed(1);
  e.qr(url, 6).feed(1);
  e.line(url);
  return e.cut().bytes();
}

interface ReceiptJob {
  shopName: string;
  code: string;
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
}

function buildReceipt(e: Escpos, job: ReceiptJob, width: number): number[] {
  e.align("center").bold(true).line(job.shopName).bold(false);
  if (job.tableName) e.line(job.tableName);
  e.line(job.code).line(job.dateText);
  e.align("left").line("-".repeat(width));

  for (const it of job.items) {
    e.line(`${it.qty} x ${it.name}`);
    if (it.options?.length) e.line(`   (${it.options.join(", ")})`);
    e.line(row("", baht(it.lineTotal), width));
  }

  e.line("-".repeat(width));
  e.line(row("รวม", baht(job.subtotal), width));
  if (job.discount > 0) e.line(row("ส่วนลด", "-" + baht(job.discount), width));
  e.bold(true).line(row("สุทธิ", baht(job.total), width)).bold(false);
  if (job.paymentLabel) e.line(row("ชำระโดย", job.paymentLabel, width));
  if (job.cashReceived != null) e.line(row("รับเงิน", baht(job.cashReceived), width));
  if (job.change != null) e.line(row("เงินทอน", baht(job.change), width));

  e.align("center").feed(1);
  if (job.footer) e.line(job.footer);
  return e.cut().bytes();
}

/** Right-align `right` within `width` columns, truncating `left` if needed. */
function row(left: string, right: string, width: number): string {
  const rLen = visualLen(right);
  let l = left;
  while (visualLen(l) + rLen > width - 1 && l.length > 0) l = l.slice(0, -1);
  const pad = Math.max(1, width - visualLen(l) - rLen);
  return l + " ".repeat(pad) + right;
}

function baht(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

/** Thai combining marks (vowels/tone marks) stack on the base glyph: 0 columns. */
const THAI_COMBINING = new Set([
  0x0e31, 0x0e34, 0x0e35, 0x0e36, 0x0e37, 0x0e38, 0x0e39, 0x0e3a, 0x0e47, 0x0e48, 0x0e49,
  0x0e4a, 0x0e4b, 0x0e4c, 0x0e4d, 0x0e4e,
]);

function visualLen(s: string): number {
  let n = 0;
  for (const ch of s) {
    const cp = ch.codePointAt(0) ?? 0;
    if (!THAI_COMBINING.has(cp)) n++;
  }
  return n;
}

function sendToPrinter(host: string, port: number, data: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let settled = false;

    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      if (err) reject(err);
      else resolve();
    };

    socket.setTimeout(CONNECT_TIMEOUT_MS);
    socket.on("timeout", () =>
      finish(new Error(`เชื่อมต่อเครื่องพิมพ์ ${host}:${port} ไม่ได้ (timeout)`)),
    );
    socket.on("error", (e) => finish(new Error(`${host}:${port} - ${e.message}`)));
    socket.on("close", () => finish());

    socket.connect(port, host, () => {
      socket.write(data, (e) => {
        if (e) finish(e);
        else socket.end();
      });
    });
  });
}

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : "print failed";
}
