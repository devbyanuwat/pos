# In-shop print agent (cloud mode)

Lets the POS print to the shop's thermal printer even when the app is hosted
off-LAN (Vercel). The agent runs on a machine on the shop network, polls the
cloud queue over HTTPS, and streams each job's ESC/POS bytes to the printer.

```
iPad (Vercel page) --enqueue--> Neon queue <--poll-- agent (shop) --9100--> printer
```

The cloud never connects to the printer — the agent reaches out, so there is no
inbound firewall, private-IP, or mixed-content problem.

## Run

Requires Node 18+. No dependencies.

```bash
CLOUD_URL=https://<your-app>.vercel.app \
PRINT_AGENT_SECRET=<same secret as the server env> \
PRINTER_HOST=192.168.1.118 \
PRINTER_PORT=9100 \
node agent/print-agent.mjs
```

Local test (against `npm run dev` on port 3001):

```bash
CLOUD_URL=http://localhost:3001 \
PRINT_AGENT_SECRET=<value from .env.local> \
PRINTER_HOST=192.168.1.118 PRINTER_PORT=9100 \
node agent/print-agent.mjs
```

Then set printing mode to **cloud** in the POS settings and print as usual.

## Server env (set on Vercel and in `.env.local`)

- `DATABASE_URL` — Neon Postgres connection string (the queue lives here).
- `PRINT_AGENT_SECRET` — shared secret; must match what the agent sends.

## Keeping it alive

For production run it under a supervisor so it restarts on crash / reboot, e.g.
`pm2 start agent/print-agent.mjs` or a launchd / systemd service.

## Notes

- The enqueue endpoint is currently open. Add caller auth (login/session) before
  real use so strangers cannot spam the printer.
- Jobs are claimed by deletion: if the agent dies mid-print the job is lost
  (acceptable for a prototype; add an ack/retry step to harden).
