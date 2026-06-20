#!/usr/bin/env node
// In-shop cloud-print agent.
//
// Polls the cloud print queue over HTTPS and streams each claimed job's ESC/POS
// bytes to the local thermal printer on the shop LAN. Because the agent reaches
// OUT to the cloud, the cloud never needs a route back to the printer — this is
// what makes printing work while the POS itself is hosted on Vercel.
//
// Runs on any machine on the shop LAN (the Mac, a mini-PC, a Raspberry Pi).
// No dependencies — just Node 18+.
//
// Usage:
//   CLOUD_URL=https://your-app.vercel.app \
//   PRINT_AGENT_SECRET=xxxxx \
//   PRINTER_HOST=192.168.1.118 PRINTER_PORT=9100 \
//   node agent/print-agent.mjs

import net from "node:net";

const CLOUD_URL = (process.env.CLOUD_URL || "http://localhost:3001").replace(/\/+$/, "");
const SECRET = process.env.PRINT_AGENT_SECRET || "";
const PRINTER_HOST = process.env.PRINTER_HOST || "192.168.1.118";
const PRINTER_PORT = Number(process.env.PRINTER_PORT || 9100);
const IDLE_MS = Number(process.env.POLL_INTERVAL_MS || 2000);
const SEND_TIMEOUT_MS = 5000;

if (!SECRET) {
  console.error("[agent] PRINT_AGENT_SECRET is required");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function sendToPrinter(bytes) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let settled = false;
    const finish = (err) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      err ? reject(err) : resolve();
    };
    socket.setTimeout(SEND_TIMEOUT_MS);
    socket.on("timeout", () =>
      finish(new Error(`printer ${PRINTER_HOST}:${PRINTER_PORT} timeout`)),
    );
    socket.on("error", finish);
    socket.on("close", () => finish());
    socket.connect(PRINTER_PORT, PRINTER_HOST, () => {
      socket.write(bytes, (e) => (e ? finish(e) : socket.end()));
    });
  });
}

async function poll() {
  const res = await fetch(`${CLOUD_URL}/api/print-queue/poll`, {
    headers: { "x-agent-secret": SECRET },
  });
  if (!res.ok) throw new Error(`poll HTTP ${res.status}`);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "poll failed");
  return data.job; // { id, data } | null
}

console.log(`[agent] cloud=${CLOUD_URL} printer=${PRINTER_HOST}:${PRINTER_PORT}`);

for (;;) {
  let wait = IDLE_MS;
  try {
    const job = await poll();
    if (job) {
      const bytes = Buffer.from(job.data, "base64");
      await sendToPrinter(bytes);
      console.log(`[agent] printed job ${job.id} (${bytes.length} bytes)`);
      wait = 0; // a job arrived — keep draining without delay
    }
  } catch (e) {
    console.error(`[agent] ${e.message}`);
    wait = 5000; // back off on errors
  }
  if (wait > 0) await sleep(wait);
}
