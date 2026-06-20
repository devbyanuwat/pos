// Cloud print queue — poll. Called by the in-shop agent over HTTPS to claim the
// next job. Guarded by a shared secret (`PRINT_AGENT_SECRET`) so only the agent
// can drain the queue. Returns `{ ok, job: { id, data } | null }`.

import { claimNextJob } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.PRINT_AGENT_SECRET;
  if (!secret) {
    return Response.json({ ok: false, error: "PRINT_AGENT_SECRET not set" }, { status: 500 });
  }
  if (request.headers.get("x-agent-secret") !== secret) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const job = await claimNextJob();
    return Response.json({ ok: true, job });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : "poll failed" },
      { status: 500 },
    );
  }
}
