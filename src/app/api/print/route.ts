// Local print bridge. Renders a job to ESC/POS and streams the bytes to a RAW
// thermal printer over TCP port 9100.
//
// Runs in the Node.js runtime (needs `node:net`) and must execute on a machine
// that shares a LAN with the printer — Plan L: served via `npm run dev` on the
// shop's Mac, opened from the iPad at http://<mac-lan-ip>:3000. For off-LAN
// hosting (Vercel) use the cloud queue (`/api/print-queue/*`) instead.

import net from "node:net";
import { buildJobBytes } from "@/lib/escpos-jobs";
import { resolvePrinter } from "@/lib/print";
import type { PrinterConfig, PrintJob } from "@/lib/print";

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
    bytes = buildJobBytes(body.job, printer);
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
