// Cloud print queue — enqueue. Called by the POS UI (works from anywhere,
// including Vercel). Renders the job to ESC/POS, base64-encodes it, and stores
// it for the in-shop agent to pull and print. The cloud never touches the LAN.
//
// Note: open for the prototype. Add caller auth (session/login) before real use
// so strangers cannot spam the shop's printer.

import { buildJobBytes } from "@/lib/escpos-jobs";
import { resolvePrinter } from "@/lib/print";
import type { PrinterConfig, PrintJob } from "@/lib/print";
import { enqueueJob } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  let data: string;
  try {
    data = Buffer.from(buildJobBytes(body.job, printer)).toString("base64");
  } catch (e) {
    return Response.json({ ok: false, error: errMessage(e) }, { status: 400 });
  }

  try {
    const id = await enqueueJob(data);
    return Response.json({ ok: true, id });
  } catch (e) {
    return Response.json({ ok: false, error: errMessage(e) }, { status: 500 });
  }
}

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : "enqueue failed";
}
