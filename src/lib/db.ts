// Neon Postgres access for the cloud print queue. Server-only.
//
// The queue is a single `print_jobs` table that both the POS (enqueue, runs on
// Vercel) and the in-shop agent (claim, polls from the LAN) reach over HTTPS, so
// the cloud never needs a route to the printer.

import { neon } from "@neondatabase/serverless";

function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}

/** Add a job (base64 ESC/POS bytes) to the queue. Returns its id. */
export async function enqueueJob(data: string): Promise<string> {
  const db = sql();
  const rows = await db`insert into print_jobs (data) values (${data}) returning id`;
  return rows[0].id as string;
}

/**
 * Atomically claim and remove the oldest pending job. `FOR UPDATE SKIP LOCKED`
 * keeps concurrent agents from grabbing the same row. Returns null when idle.
 */
export async function claimNextJob(): Promise<{ id: string; data: string } | null> {
  const db = sql();
  const rows = await db`
    delete from print_jobs
    where id = (
      select id from print_jobs
      where status = 'pending'
      order by created_at
      for update skip locked
      limit 1
    )
    returning id, data
  `;
  return rows.length ? { id: rows[0].id as string, data: rows[0].data as string } : null;
}
